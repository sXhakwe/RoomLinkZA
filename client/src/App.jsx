import {useEffect,useState} from 'react';
import {Routes,Route,Navigate,useNavigate} from 'react-router-dom';
import {api} from './api.js';
import {Shell,Loader,PageBoundary} from './components.jsx';
import AuthPage from './pages/AuthPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ListingsPage,{ListingDetail,ListingEditor,SavedPage} from './pages/ListingsPage.jsx';
import SocialPage from './pages/SocialPage.jsx';
import PeoplePage,{ProfilePage} from './pages/PeoplePage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import AdminPage,{NotificationsPage} from './pages/AdminPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import LivingPage from './pages/LivingPage.jsx';
import ConnectionsPage from './pages/ConnectionsPage.jsx';

export default function App(){
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true),navigate=useNavigate();
 useEffect(()=>{if(!localStorage.getItem('roomlink_token')){setLoading(false);return;}api('/auth/me').then(x=>setUser(x.user)).catch(()=>localStorage.removeItem('roomlink_token')).finally(()=>setLoading(false));},[]);
 const authenticated=data=>{localStorage.setItem('roomlink_token',data.token);setUser(data.user);navigate('/');};
 const logout=()=>{localStorage.removeItem('roomlink_token');setUser(null);navigate('/login');};
 if(loading)return <Loader/>;
 if(!user)return <Routes><Route path="*" element={<AuthPage onAuthenticated={authenticated}/>}/></Routes>;
 return <Shell user={user} onLogout={logout}><PageBoundary><Routes>
  <Route path="/" element={<HomePage user={user}/>}/>
  <Route path="/listings" element={<ListingsPage/>}/><Route path="/listings/new" element={<ListingEditor/>}/><Route path="/listings/:id" element={<ListingDetail user={user}/>}/><Route path="/listings/:id/edit" element={<ListingEditor/>}/><Route path="/saved" element={<SavedPage/>}/>
  <Route path="/feed" element={<SocialPage user={user}/>}/><Route path="/matches" element={<PeoplePage/>}/><Route path="/profile" element={<ProfilePage user={user} onUpdate={setUser}/>}/>
  <Route path="/messages" element={<MessagesPage user={user}/>}/><Route path="/messages/:id" element={<MessagesPage user={user}/>}/>
  <Route path="/events" element={<EventsPage/>}/><Route path="/living" element={<LivingPage user={user}/>}/><Route path="/connections" element={<ConnectionsPage/>}/>
  <Route path="/notifications" element={<NotificationsPage/>}/><Route path="/admin" element={user.role==='admin'?<AdminPage/>:<Navigate to="/"/>}/><Route path="*" element={<Navigate to="/"/>}/>
 </Routes></PageBoundary></Shell>;
}
