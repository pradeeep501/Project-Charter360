'use client';

// Client helpers that call the server-side /api/generate route.

async function call(payload) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Generation failed');
  }
  return res.json();
}

// Generate the objective/scope/success criteria and the full task list.
export function generateCharter({ goal, targetDate, people }) {
  return call({ mode: 'full', goal, targetDate, people });
}

// Generate a single field's value given context.
export async function generateField(field, context) {
  const { value } = await call({ mode: 'field', field, context });
  return value;
}
