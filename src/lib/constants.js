// Shared constants for the charter model.

export const STATUSES = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label || 'Not started';
}

export function priorityLabel(value) {
  return PRIORITIES.find((p) => p.value === value)?.label || 'Medium';
}

// RACI: Responsible, Accountable, Consulted, Informed.
export const RACI = [
  { key: 'responsible', letter: 'R', label: 'Responsible', hint: 'Does the work' },
  { key: 'accountable', letter: 'A', label: 'Accountable', hint: 'Owns the outcome (one person)' },
  { key: 'consulted', letter: 'C', label: 'Consulted', hint: 'Gives input' },
  { key: 'informed', letter: 'I', label: 'Informed', hint: 'Kept in the loop' },
];

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function emptyTask() {
  return {
    id: uid(),
    deliverable: '',
    description: '',
    responsible: '',
    accountable: '',
    consulted: '',
    informed: '',
    dueDate: '',
    status: 'not_started',
    priority: 'medium',
  };
}

export function emptyCharter({ title, goal, targetDate } = {}) {
  return {
    id: uid(),
    title: title || 'Untitled charter',
    goal: goal || '',
    targetDate: targetDate || '',
    objective: '',
    scope: '',
    successCriteria: '',
    people: [],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
