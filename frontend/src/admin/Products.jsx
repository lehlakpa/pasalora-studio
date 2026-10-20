import React, { useEffect, useState } from 'react';
import { productsApi } from '../api/index.js';
import { Photo } from '../Media.jsx';

export default function Products() {
  const [products, setProducts] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [query, setQuery] = useState(''), [deleting, setDeleting] = useState(''), [notice, setNotice] = useState(() => new URLSearchParams(window.location.search).get('saved') === '1' ? 'Product saved successfully.' : '');
  async function load() { setLoading(true); setError(''); try { const data = await productsApi.list(); setProducts(data.products); } catch(e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function remove(product) {
    if (deleting || !confirm(`Delete “${product.name}”? This removes it from your storefront. Existing orders will keep their details.`)) return;
    setDeleting(product.id); setError('');
    try { await productsApi.remove(product.id); setProducts(items => items.filter(p => p.id !== product.id)); setNotice('Product deleted.'); }
    catch(e) { setError(e.message); } finally { setDeleting(''); }
  }
  const filtered = products.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="admin-content"><div className="admin-page-heading"><div><span className="section-caption">CATALOG / OVERVIEW</span><h1>Your collection<span className="heading-dot">.</span></h1><p>A little care for every product. A better experience for every customer.</p></div><a className="btn primary" href="/admin/products/new">+ Add product</a></div>
    <div className="catalog-stats"><div><span>Total products</span><strong>{loading ? '—' : products.length}</strong></div><div><span>Categories</span><strong>{loading ? '—' : new Set(products.map(p => p.category)).size}</strong></div><div><span>Out of stock</span><strong>{loading ? '—' : products.filter(p => p.stock === 0).length}</strong></div></div>
    {notice && <p className="form-success" role="status">{notice}</p>}{error && <p className="form-error" role="alert">{error} <button type="button" className="text-button" onClick={load}>Try again</button></p>}
    <div className="catalog-toolbar"><h2>All products <span>{filtered.length}</span></h2><input className="field catalog-search" type="search" aria-label="Search products" placeholder="Search name or category…" value={query} onChange={e => setQuery(e.target.value)}/></div>
    {loading ? <p role="status" className="admin-empty">Loading your collection…</p> : filtered.length ? <div className="admin-product-grid">{filtered.map(p => <article className="admin-product-card" key={p.id}><a className="admin-product-photo" href={`/admin/products/${encodeURIComponent(p.id)}/edit`} aria-label={`Edit ${p.name}`}><Photo settings={p.imageSettings} src={p.image} alt={p.name}/><span className={'stock-tag ' + (p.stock ? '' : 'empty-stock')}>{p.stock ? 'In stock' : 'Out of stock'}</span></a><div className="product-card-body"><span className="section-caption">{p.category}</span><h2>{p.name}</h2><div className="admin-product-meta"><strong>{p.price.toLocaleString()}{p.compareAt > p.price && <del>{p.compareAt.toLocaleString()}</del>}</strong><span>{p.stock} units</span></div><div className="admin-product-actions"><a className="btn" href={`/admin/products/${encodeURIComponent(p.id)}/edit`}>Edit product ↗</a><button type="button" className="delete-button" disabled={Boolean(deleting)} onClick={() => remove(p)}>{deleting === p.id ? 'Deleting…' : 'Delete'}</button></div></div></article>)}</div> : <div className="admin-empty"><h2>{query ? 'No products found' : 'Make room for something good.'}</h2><p>{query ? 'Try another product name or category.' : 'Add your first product and start building your collection.'}</p>{!query && <a href="/admin/products/new" className="btn primary">+ Add your first product</a>}</div>}
  </main>;
}
