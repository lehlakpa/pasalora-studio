import React, { useEffect, useState } from 'react';
import { productsApi, storeApi } from '../api/index.js';
import { storefrontDocument } from '../utils/storefront.js';
import { Photo } from '../Media.jsx';
import ProductOrder from '../ProductOrder.jsx';

export function ProductDetailsContent({ product, settings, onOrder }) {
  const money = amount => `${settings.currency || 'Rs'} ${Number(amount).toLocaleString()}`;
  return <main className="product-details-page"><nav className="detail-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>{product.name}</span></nav><div className="product-details-layout"><div className="product-details-image"><Photo src={product.image} settings={product.imageSettings} alt={product.name}/></div><section className="product-details-copy"><span className="section-caption">{product.category}</span><h1>{product.name}</h1><div className="product-details-price"><strong>{money(product.price)}</strong>{product.compareAt > product.price && <del>{money(product.compareAt)}</del>}</div><p className={'detail-stock ' + (product.stock > 0 ? 'available' : '')}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p><div className="product-details-description"><h2>Product details</h2><p>{product.description || 'No additional details available for this product.'}</p></div><button className="btn primary" disabled={product.stock <= 0} onClick={onOrder}>{product.stock > 0 ? 'Order now' : 'Out of stock'}</button><p className="help">Choose your payment method at checkout.</p><a className="back-link" href="/">← Continue shopping</a></section></div></main>;
}
export default function ProductDetails({ productId }) {
  const [state, setState] = useState({ loading: true }), [attempt, setAttempt] = useState(0), [ordering, setOrdering] = useState(false);
  useEffect(() => {
    let active = true; setState({ loading: true }); setOrdering(false);
    Promise.all([productsApi.get(productId), storeApi.get()]).then(([data, store]) => {
      if (active) setState({ product: data.product, settings: storefrontDocument(store).settings });
    }).catch(error => { if (active) setState({ error: error.message, notFound: error.status === 404 }); });
    return () => { active = false; };
  }, [productId, attempt]);
  if (state.loading) return <main className="route-status" role="status"><span className="loading-ring"/><h1>Opening product details</h1></main>;
  if (state.error) return <main className="route-status"><h1>{state.notFound ? 'Product not found' : 'Could not load this product'}</h1><p role="alert">{state.notFound ? 'This product may have been removed from the collection.' : state.error}</p>{!state.notFound && <button className="btn" onClick={() => setAttempt(n => n + 1)}>Try again</button>}<a className="btn primary" href="/">Back to store</a></main>;
  return <div className="product-details-shell"><header className="product-details-header"><a href="/">{state.settings.storeName}</a><a className="btn" href="/">Shop all products</a></header><ProductDetailsContent product={state.product} settings={state.settings} onOrder={() => setOrdering(true)}/>{ordering && <ProductOrder product={state.product} settings={state.settings} initialStage="checkout" onClose={() => setOrdering(false)}/>}</div>;
}
