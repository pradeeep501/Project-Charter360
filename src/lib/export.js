'use client';

// Helpers to get a charter out of the app and into Outlook / Excel.

import { statusLabel, priorityLabel } from './constants';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const COLS = [
  ['deliverable', 'Deliverable'],
  ['description', 'Description'],
  ['responsible', 'Responsible (R)'],
  ['accountable', 'Accountable (A)'],
  ['consulted', 'Consulted (C)'],
  ['informed', 'Informed (I)'],
  ['dueDate', 'Due'],
  ['status', 'Status'],
  ['priority', 'Priority'],
];

function cell(task, key) {
  if (key === 'status') return statusLabel(task.status);
  if (key === 'priority') return priorityLabel(task.priority);
  return task[key] || '';
}

// Rich HTML table (with inline styles so it survives a paste into Outlook/Word).
export function charterToHtml(charter) {
  const header = COLS.map(
    ([, label]) =>
      `<th style="border:1px solid #d0d5dd;padding:6px 10px;background:#f2f4f7;text-align:left;font:600 13px Segoe UI,Arial,sans-serif;">${esc(
        label,
      )}</th>`,
  ).join('');

  const rows = (charter.tasks || [])
    .map((t) => {
      const tds = COLS.map(
        ([key]) =>
          `<td style="border:1px solid #d0d5dd;padding:6px 10px;font:13px Segoe UI,Arial,sans-serif;vertical-align:top;">${esc(
            cell(t, key),
          )}</td>`,
      ).join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');

  const meta = [
    charter.goal && `<p style="margin:0 0 4px;"><b>Goal:</b> ${esc(charter.goal)}</p>`,
    charter.targetDate &&
      `<p style="margin:0 0 4px;"><b>Target date:</b> ${esc(charter.targetDate)}</p>`,
    charter.objective &&
      `<p style="margin:0 0 4px;"><b>Objective:</b> ${esc(charter.objective)}</p>`,
    charter.scope && `<p style="margin:0 0 4px;"><b>Scope:</b> ${esc(charter.scope)}</p>`,
    charter.successCriteria &&
      `<p style="margin:0 0 12px;"><b>Success criteria:</b> ${esc(
        charter.successCriteria,
      )}</p>`,
  ]
    .filter(Boolean)
    .join('');

  return `<div style="font:14px Segoe UI,Arial,sans-serif;color:#101828;">
  <h2 style="margin:0 0 8px;">${esc(charter.title || 'Project Charter')}</h2>
  ${meta}
  <table style="border-collapse:collapse;border:1px solid #d0d5dd;">
    <thead><tr>${header}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

function charterToPlainText(charter) {
  const lines = [];
  lines.push(charter.title || 'Project Charter');
  if (charter.goal) lines.push(`Goal: ${charter.goal}`);
  if (charter.targetDate) lines.push(`Target date: ${charter.targetDate}`);
  if (charter.objective) lines.push(`Objective: ${charter.objective}`);
  if (charter.scope) lines.push(`Scope: ${charter.scope}`);
  if (charter.successCriteria) lines.push(`Success criteria: ${charter.successCriteria}`);
  lines.push('');
  (charter.tasks || []).forEach((t, i) => {
    lines.push(`${i + 1}. ${t.deliverable || '(untitled)'}`);
    if (t.description) lines.push(`   ${t.description}`);
    lines.push(
      `   R: ${t.responsible || '-'} | A: ${t.accountable || '-'} | C: ${
        t.consulted || '-'
      } | I: ${t.informed || '-'}`,
    );
    lines.push(
      `   Due: ${t.dueDate || '-'} | Status: ${statusLabel(t.status)} | Priority: ${priorityLabel(
        t.priority,
      )}`,
    );
  });
  return lines.join('\n');
}

// Copies a rich table to the clipboard (HTML + plain-text fallback).
export async function copyRichTable(charter) {
  const html = charterToHtml(charter);
  const text = charterToPlainText(charter);
  if (navigator.clipboard && window.ClipboardItem) {
    await navigator.clipboard.write([
      new window.ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
    return;
  }
  // Fallback: copy plain text.
  await navigator.clipboard.writeText(text);
}

// Opens a pre-filled email. mailto bodies are plain text; the charter table
// goes in as a readable text outline (Outlook renders the rich table best when
// you use "Copy rich table" and paste, so we surface both).
export function openOutlookEmail(charter) {
  const subject = `Project Charter — ${charter.title || 'Untitled'}`;
  const body = charterToPlainText(charter);
  const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body,
  )}`;
  window.location.href = href;
}

// Download a .csv the recipient can open in Excel and attach.
export function downloadCsv(charter) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = COLS.map(([, label]) => q(label)).join(',');
  const rows = (charter.tasks || []).map((t) =>
    COLS.map(([key]) => q(cell(t, key))).join(','),
  );
  const csv = [header, ...rows].join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(charter.title || 'charter').replace(/[^a-z0-9]+/gi, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
