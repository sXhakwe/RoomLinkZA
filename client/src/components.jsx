import {NavLink} from 'react-router-dom';
import {Home,Search,Users,MessageCircle,Heart,Bell,Shield,LogOut,Menu,X,CalendarDays,ClipboardCheck} from 'lucide-react';
import {Component,useEffect,useState} from 'react';
import {api} from './api.js';

export function Logo(){return <NavLink to="/" className="logo"><span className="logo-mark">R</span><span>RoomLink <b>ZA</b></span></NavLink>}
export function Avatar({user,size='md'}){const name=`${user?.first_name||''} ${user?.last_name||''}`.trim();return user?.avatar_url?<img className={`avatar ${size}`} src={user.avatar_url} alt={name}/>:<span className={`avatar fallback ${size}`}>{name?name.split(' ').map(x=>x[0]).join('').slice(0,2):'RL'}</span>}
export class PageBoundary extends Component{constructor(p){super(p);this.state={error:null}}static getDerivedStateFromError(error){return{error}}componentDidCatch(error,info){console.error('Page render failed',error,info)}render(){return this.state.error?<div className="page"><div className="error-box">This page could not render. Restart the development server, refresh the browser, and try again.</div><button className="secondary" onClick={()=>this.setState({error:null})}>Try again</button></div>:this.props.children}}

export function Shell({user,onLogout,children}){
 const [open,setOpen]=useState(false),[unread,setUnread]=useState(0);
 const refreshUnread=()=>api('/messages/unread-count').then(x=>setUnread(x.count)).catch(()=>{});
 useEffect(()=>{refreshUnread();const timer=setInterval(()=>document.visibilityState==='visible'&&refreshUnread(),5000);const onVisible=()=>document.visibilityState==='visible'&&refreshUnread();window.addEventListener('roomlink:messages-read',refreshUnread);document.addEventListener('visibilitychange',onVisible);return()=>{clearInterval(timer);window.removeEventListener('roomlink:messages-read',refreshUnread);document.removeEventListener('visibilitychange',onVisible);};},[]);
 const links=[['/',Home,'Home'],['/listings',Search,'Find a room'],['/matches',Users,'Roommates'],['/connections',Heart,'My matches'],['/feed',MessageCircle,'Community'],['/messages',MessageCircle,'Messages'],['/events',CalendarDays,'Events'],['/living',ClipboardCheck,'Household'],['/saved',Heart,'Saved'],['/notifications',Bell,'Notifications']];if(user?.role==='admin')links.push(['/admin',Shield,'Admin']);
 return <div className="app-shell"><header><Logo/><button className="menu-btn" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><nav className={open?'open':''}>{links.map(([to,Icon,label])=><NavLink key={to} to={to} onClick={()=>setOpen(false)}><Icon size={18}/>{label}{to==='/messages'&&unread>0&&<span className="nav-message-badge" aria-label={`${unread} unread messages`}>{unread>99?'99+':unread}</span>}</NavLink>)}<NavLink to="/profile" className="profile-link"><Avatar user={user} size="sm"/>Profile</NavLink><button className="nav-logout" onClick={onLogout}><LogOut size={18}/>Log out</button></nav></header><main>{children}</main><footer><Logo/><p>Safer spaces. Better matches. Real community.</p><small>© 2026 RoomLink ZA</small></footer></div>;
}
export function Empty({title,body,action}){return <div className="empty"><span>⌂</span><h3>{title}</h3><p>{body}</p>{action}</div>}
export function Loader(){return <div className="loader" aria-label="Loading"/>}
export function ErrorBox({message}){return message?<div className="error-box">{message}</div>:null}
export function PageError({message,onRetry}){return <div className="empty"><span>!</span><h3>We couldn't load this page</h3><p>{message||'Please check the server connection and try again.'}</p>{onRetry&&<button className="secondary" onClick={onRetry}>Try again</button>}</div>}
export function Modal({title,onClose,children}){return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={onClose}><X/></button><h2>{title}</h2>{children}</section></div>}
