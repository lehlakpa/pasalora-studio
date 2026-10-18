import React, { useEffect, useState } from 'react';
import App from './App.jsx';
import { requestJson } from './api.js';
import { makeDoc } from './data.js';

export default function Routes() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const admin = path === '/admin';
  const known = admin || path === '/';
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!known) return;
    let cancelled = false;
    setState({ loading: true });
    requestJson('/api/store').then(data => {
      if (!cancelled) setState({ document: data.document ? { ...data.document, template: 'fashion' } : null });
    }).catch(error => { if (!cancelled) setState({ error: error.message }); });
    return () => { cancelled = true; };
  }, [attempt, known]);
  if (!known) return <main className="route-status"><h1>Page not found</h1><a className="btn" href="/">Back to store</a></main>;
  if (state.loading) return <main className="route-status" role="status"><span className="loading-ring"/><h1>{admin ? 'Opening your studio' : 'Opening the store'}</h1><p>Loading the saved collection…</p></main>;
  if (state.error) return <main className="route-status"><h1>{admin ? 'Studio is offline' : 'The store is temporarily unavailable'}</h1><p>{admin ? state.error : 'Please try again in a moment.'}</p><button className="btn primary" onClick={() => setAttempt(n => n + 1)}>Try again</button>{admin && <button className="btn" onClick={() => setState({ offline: true, document: null })}>Edit local draft</button>}</main>;
  if (!admin && !state.document) return <main className="route-status"><h1>Something good is on the way.</h1><p>Our collection will be available soon.</p><a className="btn" href="/admin">Open studio</a></main>;
  return <App initialDoc={state.document || (state.offline ? undefined : makeDoc('fashion'))} storefront={!admin} initiallySaved={Boolean(state.document)} offline={state.offline}/>;
}
