import { makeDoc, defaults } from '../data.js';
export function storefrontDocument(data) {
  const document = data.document || makeDoc('fashion');
  const sections = document.sections.some(s => s.type === 'products') ? document.sections : [...document.sections, { ...defaults.products, id: 'database-catalog', type: 'products', title: 'Our collection' }];
  return { ...document, template: 'fashion', sections, products: data.products || data.document?.products || [] };
}
