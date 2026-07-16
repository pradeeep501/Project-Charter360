import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

// ---- JSON schemas for structured output ---------------------------------

const TASK_PROPS = {
  deliverable: { type: 'string', description: 'Short name of the task/deliverable' },
  description: { type: 'string', description: 'One or two sentences on what this involves' },
  responsible: { type: 'string', description: 'Role or name responsible for doing the work (R)' },
  accountable: { type: 'string', description: 'Single role or name accountable for the outcome (A)' },
  consulted: { type: 'string', description: 'Roles/names consulted (C), comma-separated' },
  informed: { type: 'string', description: 'Roles/names kept informed (I), comma-separated' },
  dueDate: { type: 'string', description: 'Due date as YYYY-MM-DD, on or before the target date' },
  status: { type: 'string', enum: ['not_started', 'in_progress', 'blocked', 'done'] },
  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
};

const FULL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    objective: { type: 'string', description: 'A crisp objective statement for the project' },
    scope: { type: 'string', description: 'What is in scope (and optionally out of scope)' },
    successCriteria: { type: 'string', description: 'How success will be measured' },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: TASK_PROPS,
        required: Object.keys(TASK_PROPS),
      },
    },
  },
  required: ['objective', 'scope', 'successCriteria', 'tasks'],
};

const FIELD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { value: { type: 'string' } },
  required: ['value'],
};

// ---- Prompt building -----------------------------------------------------

function fullPrompt(body) {
  const people = (body.people || []).map((p) => p.name).filter(Boolean);
  return `You are a project management expert. Build a RACI-style project charter.

Goal: ${body.goal || '(not provided)'}
Target date: ${body.targetDate || '(not provided)'}
Team members available: ${people.length ? people.join(', ') : '(none listed — use role titles instead)'}

Produce:
- objective, scope, successCriteria
- a realistic, ordered list of 6-10 tasks that get from today to the target date
- for each task assign RACI. Accountable must be exactly one person/role. Prefer the listed team members; if none listed, use role titles.
- stagger dueDate values sensibly leading up to the target date (YYYY-MM-DD). Never set a date after the target date.
- set status to "not_started" and choose a sensible priority.`;
}

function fieldPrompt(body) {
  const c = body.context || {};
  return `You are a project management expert helping fill one field of a project charter.

Field to generate: "${body.field}"
Project goal: ${c.goal || '(none)'}
Target date: ${c.targetDate || '(none)'}
Task deliverable (if relevant): ${c.deliverable || '(none)'}
Task description (if relevant): ${c.description || '(none)'}
Team members: ${(c.people || []).map((p) => p.name).filter(Boolean).join(', ') || '(none)'}

Return a single concise value for that field only. For RACI fields return names/roles (comma-separated for C/I; a single one for A). For dates return YYYY-MM-DD. No preamble, no quotes.`;
}

// ---- Mock fallback (used when ANTHROPIC_API_KEY is not set) ---------------

function daysBetween(target) {
  const t = target ? new Date(target) : null;
  const now = new Date();
  if (!t || isNaN(t)) return null;
  return Math.max(1, Math.round((t - now) / 86400000));
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

function mockFull(body) {
  const total = daysBetween(body.targetDate) || 14;
  const now = new Date();
  const owners = (body.people || []).map((p) => p.name).filter(Boolean);
  const pick = (i) => (owners.length ? owners[i % owners.length] : 'Project Lead');
  const steps = [
    ['Kickoff & alignment', 'Align on goals, scope, and success criteria with stakeholders.'],
    ['Requirements & scope', 'Gather requirements and lock the scope for this iteration.'],
    ['Design / plan', 'Produce the design or plan and review it with the team.'],
    ['Build phase 1', 'Implement the core of the deliverable.'],
    ['Build phase 2', 'Complete remaining work and integrate.'],
    ['Review & QA', 'Test, review, and fix issues.'],
    ['Sign-off & launch', 'Final sign-off, launch, and communicate to stakeholders.'],
  ];
  const tasks = steps.map(([deliverable, description], i) => {
    const offset = Math.round(((i + 1) / steps.length) * total);
    const due = new Date(now.getTime() + offset * 86400000);
    return {
      deliverable,
      description,
      responsible: pick(i),
      accountable: pick(0),
      consulted: owners[1] ? owners[1] : 'Stakeholders',
      informed: 'Wider team',
      dueDate: fmt(due),
      status: 'not_started',
      priority: i <= 1 ? 'high' : 'medium',
    };
  });
  return {
    objective: body.goal
      ? `Deliver "${body.goal}" by ${body.targetDate || 'the target date'}.`
      : 'Deliver the project on time and to a high standard.',
    scope: 'Covers planning, build, review, and launch of the deliverable described in the goal.',
    successCriteria:
      'Delivered by the target date, meeting the agreed requirements, with stakeholder sign-off.',
    tasks,
  };
}

function mockField(body) {
  const c = body.context || {};
  const f = body.field;
  if (f === 'objective') return { value: `Deliver "${c.goal || 'the project'}" on time and to spec.` };
  if (f === 'scope') return { value: 'Planning, build, review, and launch of the deliverable.' };
  if (f === 'successCriteria')
    return { value: 'On-time delivery, requirements met, stakeholder sign-off.' };
  if (f === 'description')
    return { value: `Work required to complete: ${c.deliverable || 'this task'}.` };
  if (['responsible', 'accountable'].includes(f)) {
    const owners = (c.people || []).map((p) => p.name).filter(Boolean);
    return { value: owners[0] || 'Project Lead' };
  }
  if (f === 'consulted') return { value: 'Stakeholders' };
  if (f === 'informed') return { value: 'Wider team' };
  if (f === 'dueDate') return { value: fmt(new Date(Date.now() + 7 * 86400000)) };
  return { value: '' };
}

// ---- Handler -------------------------------------------------------------

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const mode = body.mode === 'field' ? 'field' : 'full';
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No key configured → mock generator so the app still works for demos.
  if (!apiKey) {
    const data = mode === 'field' ? mockField(body) : mockFull(body);
    return Response.json({ ...data, _mock: true });
  }

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system:
        'You produce clear, realistic project charter content. Return only the requested JSON.',
      messages: [
        { role: 'user', content: mode === 'field' ? fieldPrompt(body) : fullPrompt(body) },
      ],
      output_config: {
        format: {
          type: 'json_schema',
          schema: mode === 'field' ? FIELD_SCHEMA : FULL_SCHEMA,
        },
      },
    });
    const text = resp.content.find((b) => b.type === 'text')?.text || '{}';
    return Response.json(JSON.parse(text));
  } catch (err) {
    return Response.json(
      { error: 'Generation failed', detail: String(err?.message || err) },
      { status: 502 },
    );
  }
}
