const API=import.meta.env.VITE_API_URL||'/api';
export async function api(path,options={}){const token=localStorage.getItem('roomlink_token');const response=await fetch(API+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...options.headers}});if(response.status===204)return null;const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Something went wrong');return data;}
export const money=(value)=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(value||0);
export const date=(value)=>value?new Intl.DateTimeFormat('en-ZA',{dateStyle:'medium'}).format(new Date(value)):'';
