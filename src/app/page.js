'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listCharters, saveCharter, deleteCharter } from '../lib/store';
import { emptyCharter } from '../lib/constants';
import { isCloudBacked } from '../lib/supabase';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.ceil((d - new Date()) / 86400000);
}

export default function Home() {
  const router = useRouter();
  const [charters, setCharters] = useState(null);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listCharters().then(setCharters).catch(() => setCharters([]));
  }, []);

  async function createCharter(e) {
    e.preventDefault();
    if (!goal.trim() && !title.trim()) return;
    setBusy(true);
    const c = emptyCharter({
      title: title.trim() || goal.trim().slice(0, 60),
      goal: goal.trim(),
      targetDate,
    });
    await saveCharter(c);
    router.push(`/charter/${c.id}`);
  }

  async function remove(id) {
    if (!confirm('Delete this charter?')) return;
    await deleteCharter(id);
    setCharters((cs) => cs.filter((c) => c.id !== id));
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="logo">◆</span> Project Charter Builder
        </div>
        <span className="muted-note">
          {isCloudBacked() ? 'Cloud (Supabase)' : 'Saved in this browser'}
        </span>
      </header>

      <main className="container">
        <section className="panel" style={{ marginBottom: 24 }}>
          <div className="pad">
            <h2 className="section-title">Start a new charter</h2>
            <p className="hint" style={{ marginTop: -6, marginBottom: 14 }}>
              Give it a goal and a target date. On the next screen you can auto-generate the
              whole task list, owners, and RACI with AI.
            </p>
            <form onSubmit={createCharter}>
              <div className="grid2">
                <div>
                  <label className="field">Goal (what are we building?)</label>
                  <input
                    autoFocus
                    placeholder="e.g. Ship the customer self-serve portal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field">Target date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label className="field">Title (optional)</label>
                <input
                  placeholder="Defaults to the goal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div style={{ marginTop: 14 }}>
                <button className="btn primary" disabled={busy}>
                  {busy ? 'Creating…' : 'Create charter →'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <h2 className="section-title">Your charters</h2>
        {charters === null ? (
          <p className="hint">Loading…</p>
        ) : charters.length === 0 ? (
          <div className="empty">No charters yet. Create your first one above.</div>
        ) : (
          <div className="card-grid">
            {charters.map((c) => {
              const d = daysUntil(c.targetDate);
              return (
                <div key={c.id} className="charter-card" style={{ position: 'relative' }}>
                  <a href={`/charter/${c.id}`} style={{ color: 'inherit' }}>
                    <h3>{c.title || 'Untitled'}</h3>
                    <div className="goal">{c.goal || 'No goal set'}</div>
                    <div className="meta-row">
                      <span>{(c.tasks || []).length} tasks</span>
                      {c.targetDate && (
                        <span className="pill days">
                          {d != null && d >= 0 ? `${d} days left` : c.targetDate}
                        </span>
                      )}
                    </div>
                  </a>
                  <button
                    className="btn ghost sm"
                    style={{ position: 'absolute', top: 10, right: 10 }}
                    onClick={() => remove(c.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
