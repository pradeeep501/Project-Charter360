'use client';

import { useState } from 'react';

// A small "✨ AI" button that runs an async generator and reports errors.
export default function AiButton({ onGenerate, title = 'Generate with AI', label = 'AI' }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="ai-btn"
      title={title}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onGenerate();
        } catch (e) {
          alert('AI generation failed: ' + e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? '…' : `✨ ${label}`}
    </button>
  );
}
