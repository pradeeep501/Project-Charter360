'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCharter } from '../../../lib/store';
import CharterEditor from '../../../components/CharterEditor';

export default function CharterPage() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, charter: null });

  useEffect(() => {
    getCharter(id)
      .then((c) => setState({ loading: false, charter: c }))
      .catch(() => setState({ loading: false, charter: null }));
  }, [id]);

  if (state.loading) {
    return (
      <main className="container">
        <p className="hint">Loading charter…</p>
      </main>
    );
  }

  if (!state.charter) {
    return (
      <main className="container">
        <div className="empty">
          Charter not found. <a href="/">Back to all charters</a>
        </div>
      </main>
    );
  }

  return <CharterEditor initial={state.charter} />;
}
