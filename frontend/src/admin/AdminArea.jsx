import React, { useEffect, useState } from 'react';
import { storeApi, authApi } from '../api/index.js';
import { makeDoc } from '../data.js';
import App from '../App.jsx';
import AuthPage from '../auth/AuthPage.jsx';
import Products from './Products.jsx';
import ProductForm from './ProductForm.jsx';
import Orders from './Orders.jsx';

function Design() {
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { let alive = true; storeApi.get().then(data => { if (alive) setState({ document: data.document || { ...makeDoc('fashion'), products: [] } }); }).catch(e => { if (alive) setState({ error: e.message }); }); return () => { alive = false; }; }, [attempt]);
  if (state.loading) return <p className="admin-loading">Opening your design…</p>;
  if (state.error) return <div className="admin-loading"><p role="alert">{state.error}</p><button className="btn" onClick={() => setAttempt(n => n + 1)}>Retry</button></div>;
  return <App initialDoc={state.document} initiallySaved/>;
}
export default function AdminArea() {
  const [state, setState] = useState({ loading: true }), [attempt, setAttempt] = useState(0);
  const path = window.location.pathname.replace(/\/+$/, '');
  const editMatch = path.match(/^\/admin\/products\/([^/]+)\/edit$/);
  useEffect(() => {
    let alive = true;
    Promise.all([authApi.status(), authApi.me().catch(() => ({ user: null }))]).then(([status, session]) => { if (alive) setState({ ...status, user: session.user }); }).catch(e => { if (alive) setState({ error: e.message }); });
    const expired = () => setState(s => ({ ...s, user: null }));
    window.addEventListener('studio:unauthorized', expired);
    return () => { alive = false; window.removeEventListener('studio:unauthorized', expired); };
  }, [attempt]);
  if (state.loading) return <main className="route-status"><h1>Opening your workspace</h1></main>;
  if (state.error) return <main className="route-status"><h1>Unable to connect</h1><p role="alert">{state.error}</p><button className="btn" onClick={() => setAttempt(n => n + 1)}>Retry</button></main>;
  if (!state.user) return <AuthPage registrationOpen={state.registrationOpen} onSignedIn={user => { if (['/admin/login', '/admin/register'].includes(path)) window.location.replace('/admin/products'); else setState({ user, registrationOpen: false }); }}/>;
  return <div className="admin-shell"><header className="admin-navigation"><a className="admin-wordmark" href="/admin">pasalora<span> / admin</span></a><nav aria-label="Admin navigation">{[['/admin', 'Store design'], ['/admin/products', 'Products'], ['/admin/orders', 'Orders']].map(([url, label]) => <a key={url} href={url} className={(path === url || (url !== '/admin' && path.startsWith(url + '/'))) ? 'active' : ''}>{label}</a>)}</nav><div className="admin-account"><span>{state.user.name}</span><a href="/" target="_blank" rel="noreferrer">View store</a><button className="btn" onClick={async () => { try { await authApi.logout(); setState({ user: null, registrationOpen: false }); } catch(e) { alert(e.message); } }}>Sign out</button></div></header>{path === '/admin/products/new' ? <ProductForm/> : editMatch ? <ProductForm productId={editMatch[1]}/> : path === '/admin/products' ? <Products/> : path === '/admin/orders' ? <Orders/> : ['/admin', '/admin/login', '/admin/register'].includes(path) ? <Design/> : <main className="route-status"><h1>Page not found</h1><a href="/admin">Open admin</a></main>}</div>;
}
