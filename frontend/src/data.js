import {templatePhoto} from './photography.js';
export const presets={
 fashion:{name:'E-commerce',description:'Your complete online store',store:'VANTA STREET',bg:'#f4ebdf',accent:'#c97855',hero:'Wear it your way.',subtitle:'Everyday essentials with an unapologetic edge. Shop the latest drops.',button:'Shop new arrivals',kicker:'NEW SEASON / 2026',products:[['Airwave Sneakers',4800,6200,'👟','Shoes'],['Everyday Hoodie',3200,3900,'🧥','Clothing'],['Core Tee',1450,1900,'👕','Clothing'],['Canvas Cap',990,1290,'🧢','Accessories'],['Classic Tote',1200,1800,'👜','Accessories'],['Sport Runner',5400,6700,'🥾','Shoes']]},
};
export const labels={announcement:'Announcement bar',navbar:'Store navigation',hero:'Hero banner',categories:'Categories',products:'Product grid',sale:'Sale banner',reviews:'Reviews',newsletter:'Newsletter',footer:'Footer'};
export const defaults={
 announcement:{title:'Free shipping on orders over Rs 5,000',bg:'#1e3440',color:'#ffffff',height:33,width:100},
 navbar:{title:'MY STORE',bg:'#ffffff',color:'#1c3042',height:75,width:100},
 hero:{title:'Your next favorite find.',subtitle:'Explore our latest arrivals, picked just for you.',button:'Shop now',image:'',bg:'#e8efe4',color:'#1b3c2b',height:350,width:100},
 categories:{title:'Shop by category',bg:'#ffffff',color:'#1e303d',height:193,width:100},
 products:{title:'Trending right now',bg:'#ffffff',color:'#243442',height:660,width:100,cols:3,photoHeight:151},
 sale:{title:'Big savings. Better days.',subtitle:'Limited-time deals on selected products.',button:'Shop the sale',bg:'#dfe4fb',color:'#262b62',height:185,width:100},
 reviews:{title:'Loved by our customers',subtitle:'“Beautiful quality and super fast delivery. Would absolutely order again.”',bg:'#f5f5fa',color:'#27334b',height:175,width:100},
 newsletter:{title:'Good things in your inbox.',subtitle:'Be first to hear about new drops and special offers.',bg:'#f0edfd',color:'#272545',height:140,width:100},
 footer:{title:'MY STORE',bg:'#1b3040',color:'#ffffff',height:92,width:100}
};
export const uid=()=>Math.random().toString(36).slice(2,10);
export const makeDoc=(type)=>{type='fashion';const tpl=presets.fashion;const products=tpl.products.map((p,i)=>({id:uid(),name:p[0],price:p[1],compareAt:p[2],category:p[4],stock:20,image:templatePhoto(type,i)}));const makeSection=(k,extra={})=>({...defaults[k],...extra,type:k,id:uid()});return{schemaVersion:3,template:type,settings:{storeName:tpl.store,tagline:tpl.subtitle,currency:'Rs',shipping:5000,deliveryFee:150,payments:['COD','eSewa','Khalti'],apiUrl:''},products,sections:[makeSection('announcement'),makeSection('navbar',{title:tpl.store}),makeSection('hero',{title:tpl.hero,subtitle:tpl.subtitle,button:tpl.button,image:templatePhoto(type),bg:tpl.bg}),makeSection('categories'),makeSection('products'),makeSection('sale',{title:'Up to 30% off your favorites',subtitle:'Discover the best deals this week.',bg:tpl.bg}),makeSection('reviews'),makeSection('newsletter'),makeSection('footer',{title:tpl.store})]};};
