import React, { useEffect, useState } from 'react';
import App from './App.jsx';
import { storeApi } from './api/index.js';
import { storefrontDocument } from './utils/storefront.js';
import AdminArea from './admin/AdminArea.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
export default function Routes() {
  if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) return <AdminArea/>;
  const productMatch = window.location.pathname.replace(/\/+$/, '').match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    try { return <ProductDetails productId={decodeURIComponent(productMatch[1])}/>; }
    catch { return <main className="route-status"><h1>Invalid product link</h1><a href="/">Back to store</a></main>; }
  }
  return <PublicRoute/>;
}
function PublicRoute() {
  const known = (window.location.pathname.replace(/\/+$/, '') || '/') === '/';
  const [state, setState] = useState({ loading: true }), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!known) return;
    let cancelled = false; setState({ loading: true });
    storeApi.get().then(data => { if (!cancelled) setState({ document: storefrontDocument(data) }); }).catch(error => { if (!cancelled) setState({ error: error.message }); });
    return () => { cancelled = true; };
  }, [attempt, known]);
  if (!known) return <main className="route-status"><h1>Page not found</h1><a className="btn" href="/">Back to store</a></main>;
  if (state.loading) return <main className="route-status" role="status"><span className="loading-ring"/><h1>Opening the store</h1><p>Loading the latest collection…</p></main>;
  if (state.error) return <main className="route-status"><h1>The store is temporarily unavailable</h1><p>Please try again in a moment.</p><button className="btn primary" onClick={() => setAttempt(n => n + 1)}>Try again</button></main>;
  const paymentResult = new URLSearchParams(window.location.search).get('payment');
  const messages = { verified: 'Your eSewa payment was verified. Thank you for your order.', cancelled: 'eSewa checkout was cancelled. No payment has been confirmed.', unverified: 'We could not verify your payment. If you were charged, contact the store before paying again.' };
  return <>{messages[paymentResult] && <p className={paymentResult === 'verified' ? 'form-success' : 'form-error'} role="status">{messages[paymentResult]}</p>}<App initialDoc={state.document} storefront initiallySaved/></>;

}
