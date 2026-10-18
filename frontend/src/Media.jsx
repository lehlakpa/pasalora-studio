import React, { useRef, useState } from 'react';
import { requestJson } from './api.js';

export function Icon({name='image', size=18}) {
 const paths={image:'M4 3h16v18H4z M4 16l5-5 4 4 3-3 4 4 M8 7h.01',upload:'M12 16V3 M7 8l5-5 5 5 M4 15v6h16v-6',cart:'M3 3h2l3 12h11l2-9H6 M9 20h.01 M18 20h.01',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',check:'M5 12l4 4L19 6',layers:'M12 3L2 8l10 5 10-5z M2 12l10 5 10-5 M2 16l10 5 10-5'};
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]||paths.layers}/></svg>;
}
export function Photo({src,alt='',className=''}) {
 const [failed,setFailed]=useState('');
 return src && failed!==src ? <img className={className} src={src} alt={alt} loading="lazy" onError={()=>setFailed(src)}/> : <span className="photo-placeholder"><Icon size={28}/><span>Add image</span></span>;
}
export function ImageUpload({value,onChange}) {
 const input=useRef(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[drag,setDrag]=useState(false);
 async function upload(file){
  if(!file||busy)return;
  setError('');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('Choose a JPG, PNG or WebP image.');return;}
  if(file.size>8*1024*1024){setError('Maximum image size is 8 MB.');return;}
  setBusy(true);
  try{const body=new FormData();body.append('image',file);const result=await requestJson('/api/uploads',{method:'POST',body});await onChange(result.url);}
  catch(e){setError(e.message==='Failed to fetch'?'Cannot reach the upload server. Start the backend and retry.':e.message);}
  finally{setBusy(false);if(input.current)input.current.value='';}
 }
 return <div className="media-field"><span className="field-label">Image</span><button type="button" className={'upload-zone '+(drag?'dragging':'')} disabled={busy} onClick={()=>input.current.click()} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);upload(e.dataTransfer.files[0])}}>{value&&<Photo src={value} alt="Current image"/>}<span className="upload-caption"><Icon name="upload"/>{busy?'Uploading and saving…':value?'Replace image':'Upload an image'}<small>Drag & drop or browse · up to 8 MB</small></span></button><input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e=>upload(e.target.files[0])}/>{error&&<p className="upload-error" role="alert">{error}</p>}{value&&<button className="text-button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await onChange('')}catch(e){setError(e.message)}finally{setBusy(false)}}}>Remove image</button>}</div>;
}
