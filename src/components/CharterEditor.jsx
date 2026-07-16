'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { saveCharter } from '../lib/store';
import { generateCharter, generateField } from '../lib/ai';
import { emptyTask, uid } from '../lib/constants';
import { copyRichTable, openOutlookEmail, downloadCsv } from '../lib/export';
import TaskList from './TaskList';
import AiButton from './AiButton';

function AiTextField({ label, hint, value, rows = 2, onChange, onAi }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <label className="field" style={{ margin: 0 }}>
          {label}
        </label>
        <AiButton onGenerate={onAi} />
      </div>
      <textarea rows={rows} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      {hint && <div className="hint" style={{ marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export default function CharterEditor({ initial }) {
  const [charter, setCharter] = useState(initial);
  const [toast, setToast] = useState('');
  const [genBusy, setGenBusy] = useState(false);
  const [newPerson, setNewPerson] = useState('');
  const saveTimer = useRef(null);
  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  // Debounced autosave.
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveCharter(charter).catch(() => {});
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [charter]);

  const patch = useCallback((p) => setCharter((c) => ({ ...c, ...p })), []);

  const patchTask = useCallback((taskId, p) => {
    setCharter((c) => ({
      ...c,
      tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, ...p } : t)),
    }));
  }, []);

  function addTask() {
    setCharter((c) => ({ ...c, tasks: [...c.tasks, emptyTask()] }));
  }

  function deleteTask(taskId) {
    setCharter((c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }));
  }

  function reorderTasks(next) {
    setCharter((c) => ({ ...c, tasks: next }));
  }

  function addPerson(e) {
    e?.preventDefault();
    const name = newPerson.trim();
    if (!name) return;
    setCharter((c) => ({ ...c, people: [...(c.people || []), { id: uid(), name }] }));
    setNewPerson('');
  }

  function removePerson(id) {
    setCharter((c) => ({ ...c, people: c.people.filter((p) => p.id !== id) }));
  }

  // ---- AI actions ----
  async function generateAll() {
    if (!charter.goal.trim()) {
      alert('Add a goal first so the AI knows what to plan.');
      return;
    }
    setGenBusy(true);
    try {
      const out = await generateCharter({
        goal: charter.goal,
        targetDate: charter.targetDate,
        people: charter.people,
      });
      setCharter((c) => ({
        ...c,
        objective: out.objective || c.objective,
        scope: out.scope || c.scope,
        successCriteria: out.successCriteria || c.successCriteria,
        tasks: (out.tasks || []).map((t) => ({ ...emptyTask(), ...t, id: uid() })),
      }));
      flash(out._mock ? 'Generated (demo mode — add an API key for real AI)' : 'Charter generated');
    } catch (e) {
      alert('Generation failed: ' + e.message);
    } finally {
      setGenBusy(false);
    }
  }

  async function aiHeaderField(field) {
    const value = await generateField(field, {
      goal: charter.goal,
      targetDate: charter.targetDate,
      people: charter.people,
    });
    patch({ [field]: value });
  }

  async function aiTaskField(taskId, field) {
    const task = charter.tasks.find((t) => t.id === taskId);
    const value = await generateField(field, {
      goal: charter.goal,
      targetDate: charter.targetDate,
      people: charter.people,
      deliverable: task?.deliverable,
      description: task?.description,
    });
    patchTask(taskId, { [field]: value });
  }

  // ---- Export ----
  async function doCopy() {
    try {
      await copyRichTable(charter);
      flash('Copied — paste into an Outlook email or Word');
    } catch {
      flash('Copy failed — try the download instead');
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <a href="/" className="btn ghost sm" style={{ marginRight: 4 }}>
            ← All
          </a>
          <span className="logo">◆</span>
          <input
            value={charter.title}
            onChange={(e) => patch({ title: e.target.value })}
            style={{ width: 320, fontWeight: 700, border: '1px solid transparent', background: 'transparent' }}
          />
        </div>
        <div className="toolbar">
          <button className="btn" onClick={doCopy} title="Copy a formatted table for Outlook/Word">
            📋 Copy for Outlook
          </button>
          <button className="btn" onClick={() => openOutlookEmail(charter)}>
            ✉️ Email draft
          </button>
          <button className="btn" onClick={() => downloadCsv(charter)}>
            ⬇️ Excel (.csv)
          </button>
        </div>
      </header>

      <main className="container wide">
        {/* Overview */}
        <section className="panel" style={{ marginBottom: 20 }}>
          <div className="pad">
            <div className="grid2">
              <div>
                <label className="field">Goal — what are we building?</label>
                <textarea
                  rows={2}
                  value={charter.goal}
                  placeholder="e.g. Ship the customer self-serve portal"
                  onChange={(e) => patch({ goal: e.target.value })}
                />
              </div>
              <div>
                <label className="field">Target date</label>
                <input
                  type="date"
                  value={charter.targetDate || ''}
                  onChange={(e) => patch({ targetDate: e.target.value })}
                />
                <div style={{ marginTop: 14 }}>
                  <button
                    className="btn ai"
                    onClick={generateAll}
                    disabled={genBusy}
                    title="Generate objective, scope, tasks, owners and RACI from the goal + date"
                  >
                    {genBusy ? 'Generating…' : '✨ Generate charter from goal'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid2" style={{ marginTop: 16 }}>
              <AiTextField
                label="Objective"
                value={charter.objective}
                onChange={(v) => patch({ objective: v })}
                onAi={() => aiHeaderField('objective')}
              />
              <AiTextField
                label="Scope"
                value={charter.scope}
                onChange={(v) => patch({ scope: v })}
                onAi={() => aiHeaderField('scope')}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <AiTextField
                label="Success criteria"
                value={charter.successCriteria}
                onChange={(v) => patch({ successCriteria: v })}
                onAi={() => aiHeaderField('successCriteria')}
              />
            </div>
          </div>
        </section>

        {/* People */}
        <section className="panel" style={{ marginBottom: 20 }}>
          <div className="pad">
            <h2 className="section-title">Team (for RACI assignment)</h2>
            <p className="hint" style={{ marginTop: -6, marginBottom: 12 }}>
              Add people here and they’ll autocomplete in the R / A / C / I columns below.
            </p>
            <div className="chips">
              {(charter.people || []).map((p) => (
                <span className="chip" key={p.id}>
                  {p.name}
                  <button onClick={() => removePerson(p.id)} title="Remove">
                    ✕
                  </button>
                </span>
              ))}
              <form onSubmit={addPerson} style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  placeholder="Add a name…"
                  style={{ width: 180 }}
                />
                <button className="btn sm">Add</button>
              </form>
            </div>
          </div>
        </section>

        {/* Tasks */}
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            Tasks &amp; RACI
          </h2>
          <span className="spacer" />
          <button className="btn" onClick={addTask}>
            + Add task
          </button>
          <button className="btn ai" onClick={generateAll} disabled={genBusy}>
            {genBusy ? 'Generating…' : '✨ Generate tasks'}
          </button>
        </div>
        <p className="hint" style={{ margin: '0 0 12px' }}>
          Drag the <b>⠿</b> handle to reorder. Every field has a ✨ button to draft it with AI.
        </p>

        <TaskList
          tasks={charter.tasks || []}
          people={charter.people || []}
          onChange={patchTask}
          onDelete={deleteTask}
          onReorder={reorderTasks}
          onAi={aiTaskField}
        />

        <p className="muted-note" style={{ marginTop: 16 }}>
          Changes save automatically.
        </p>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
