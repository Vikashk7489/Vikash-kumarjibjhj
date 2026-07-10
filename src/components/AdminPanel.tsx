import React, { useState, useEffect, useMemo } from 'react';
import { auth, rtdb } from '../firebase';
import { 
  ref,
  onValue,
  off,
  set,
  push,
  update,
  remove
} from 'firebase/database';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { allData, tickerItems, quickLinks } from '../data';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Lock, 
  LogOut, 
  LayoutDashboard,
  FilePlus,
  BellRing,
  Settings,
  Database,
  Shield,
  CheckCircle2,
  Zap,
  Share2,
  Globe,
  Cpu,
  ShieldCheck,
  Megaphone,
  RefreshCw
} from 'lucide-react';

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'posts' | 'categories' | 'seo' | 'ai' | 'settings' | 'media' | 'notifications' | 'security' | 'backups' | 'ads'>('dashboard');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const isLoggedIn = !!user;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsInitialLoad(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'jobs',
    content: '',
    shortDescription: '',
    importantDates: [] as { label: string, value: string }[],
    applicationFee: [] as { label: string, value: string }[],
    vacancyDetails: [] as { category: string, posts: string }[],
    totalPosts: '',
    importantLinks: [] as { label: string, url: string }[],
    faq: [] as { question: string, answer: string }[],
    longArticle: '',
    imageUrl: '',
    isNew: true,
    isHot: false,
    tags: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    const postsRef = ref(rtdb, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const livePosts = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        livePosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPosts(livePosts);
      } else setPosts([]);
      setLoading(false);
    });
    return () => off(postsRef);
  }, [isLoggedIn]);

  const handleSeedData = async () => {
    if (!window.confirm("Seed database with full demo data?")) return;
    try {
      setLoading(true);
      await set(ref(rtdb, 'posts'), {});
      for (const item of allData) {
        const newRef = push(ref(rtdb, 'posts'));
        await set(newRef, { ...item, id: null });
      }
      await set(ref(rtdb, 'ticker'), tickerItems);
      await set(ref(rtdb, 'quickLinks'), quickLinks);
      showToast("Sync successful!");
    } catch (err) {
      showToast("Sync failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
    } catch (err: any) {
      setLoginError("Invalid credentials.");
    }
  };

  const handleLogout = async () => { await signOut(auth); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    const payload = { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(t => t), updated_at: new Date().toISOString() };
    try {
      if (editingPost) await update(ref(rtdb, `posts/${editingPost.id}`), payload);
      else await set(push(ref(rtdb, 'posts')), payload);
      showToast("Post saved!");
      resetForm();
      setActiveTab('posts');
    } catch (err) { showToast("Error", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete?")) return;
    try {
      await remove(ref(rtdb, `posts/${id}`));
      showToast("Deleted");
    } catch (err) { showToast("Error", "error"); }
  };

  const resetForm = () => {
    setEditingPost(null);
    setIsAdding(false);
    setFormData({ title: '', category: 'jobs', content: '', shortDescription: '', importantDates: [], applicationFee: [], vacancyDetails: [], totalPosts: '', longArticle: '', imageUrl: '', importantLinks: [], faq: [], isNew: true, isHot: false, tags: '', date: new Date().toISOString().split('T')[0] });
  };

  const startEdit = (post: any) => {
    setEditingPost(post);
    setFormData({ ...post, tags: Array.isArray(post.tags) ? post.tags.join(', ') : '', date: post.date?.split('T')[0] || new Date().toISOString().split('T')[0] });
    setIsAdding(true);
    setActiveTab('posts');
  };

  const stats = useMemo(() => {
    const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
    return { totalPosts: posts.length, totalViews, topPost: [...posts].sort((a,b) => (b.views||0) - (a.views||0))[0] };
  }, [posts]);

  if (isInitialLoad) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] text-white">Loading...</div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 blur-[100px]"></div>
        <div className="max-w-md w-full bg-[#161b2c] p-10 rounded-[2.5rem] border border-white/5 relative z-10 shadow-2xl">
           <div className="text-center mb-10">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"><Lock size={32} className="text-white" /></div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Admin Terminal</h2>
           </div>
           {loginError && <div className="p-4 bg-red-500/10 text-red-500 rounded-xl mb-6 text-xs font-bold text-center border border-red-500/20">{loginError}</div>}
           <form onSubmit={handleLocalLogin} className="space-y-6">
              <input type="email" placeholder="Operator Identity" className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 transition-all" value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})} />
              <input type="password" placeholder="Access Cipher" className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 transition-all" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
              <button type="submit" className="w-full bg-red-600 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-900/40 hover:translate-y-[-2px] transition-all">Authenticate</button>
           </form>
           <button onClick={onBack} className="w-full text-gray-600 text-[10px] font-black uppercase mt-8 tracking-widest hover:text-white transition-colors">Exit Link</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col md:flex-row text-white font-sans">
       {/* Sidebar */}
       <aside className="w-full md:w-64 bg-[#161b2c] border-r border-white/5 flex flex-col p-6 space-y-2">
          <div className="flex items-center gap-3 mb-10 px-2">
             <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center"><Cpu size={20} /></div>
             <div className="font-black italic text-lg tracking-tighter">CS_NEXUS</div>
          </div>
          {[
            { id: 'dashboard', label: 'ANALYTICS', icon: <LayoutDashboard size={18} /> },
            { id: 'posts', label: 'CONTENT', icon: <FilePlus size={18} /> },
            { id: 'notifications', label: 'SIGNALS', icon: <BellRing size={18} /> },
            { id: 'settings', label: 'CORE', icon: <Settings size={18} /> },
            { id: 'ads', label: 'REVENUE', icon: <Share2 size={18} /> },
            { id: 'security', label: 'SAFEGUARD', icon: <ShieldCheck size={18} /> }
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsAdding(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id && !isAdding ? 'bg-red-600 text-white shadow-xl shadow-red-900/40' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
               {item.icon} {item.label}
            </button>
          ))}
          <div className="pt-8 mt-auto">
             <button onClick={() => { setIsAdding(true); setEditingPost(null); }} className="w-full bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 mb-4 hover:translate-y-[-2px] transition-all"><Plus size={16}/> NEW_ENTRY</button>
             <button onClick={handleLogout} className="w-full bg-gray-900 text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"><LogOut size={16}/> TERMINATE</button>
          </div>
       </aside>

       {/* Main */}
       <main className="flex-1 p-8 md:p-12 overflow-y-auto relative">
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none"></div>
          
          <header className="flex justify-between items-center mb-16 relative z-10">
             <h2 className="text-4xl font-black italic uppercase tracking-tighter">{isAdding ? 'New Data' : activeTab}</h2>
             <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-[#161b2c] flex items-center justify-center border border-white/10 hover:bg-red-600 transition-all"><Globe size={20} /></button>
          </header>

          {toast && <div className="fixed bottom-10 right-10 z-50 bg-[#161b2c] border border-white/10 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4"><CheckCircle2 className="text-red-500" /> <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span></div>}

          {activeTab === 'dashboard' && (
             <div className="space-y-10 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center uppercase tracking-widest font-black">
                   <div className="bg-[#161b2c] p-10 rounded-[2.5rem] border border-white/5 space-y-2">
                       <p className="text-[10px] text-gray-500 italic">Total Index</p>
                       <p className="text-4xl italic">{stats.totalPosts}</p>
                   </div>
                   <div className="bg-[#161b2c] p-10 rounded-[2.5rem] border border-white/5 space-y-2">
                       <p className="text-[10px] text-gray-500 italic">Cloud Reach</p>
                       <p className="text-4xl italic text-red-500">{stats.totalViews}</p>
                   </div>
                   <div className="bg-[#161b2c] p-10 rounded-[2.5rem] border border-white/5 space-y-2">
                       <p className="text-[10px] text-gray-500 italic">Stream Pulse</p>
                       <p className="text-4xl italic text-blue-500">98%</p>
                   </div>
                </div>
                {stats.topPost && (
                   <div className="bg-[#161b2c] p-12 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={100} /></div>
                      <p className="text-red-500 text-[10px] font-black tracking-widest uppercase italic mb-4">Peak Asset Data</p>
                      <h3 className="text-2xl font-black italic uppercase italic max-w-2xl leading-tight mb-8">{stats.topPost.title}</h3>
                      <div className="flex items-center gap-8">
                         <div>
                            <p className="text-[9px] text-gray-500 uppercase italic">Visibility Metrics</p>
                            <p className="text-3xl font-black italic">{stats.topPost.views?.toLocaleString() || 0}</p>
                         </div>
                         <button onClick={() => startEdit(stats.topPost)} className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase italic hover:bg-red-600 hover:text-white transition-all">Calibrate Node</button>
                      </div>
                   </div>
                )}
             </div>
          )}

          {activeTab === 'posts' && !isAdding && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                {posts.map(p => (
                   <div key={p.id} className="bg-[#161b2c] p-8 rounded-3xl border border-white/5 group hover:border-red-600/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                         <span className="text-[9px] font-black text-gray-500 uppercase italic tracking-widest">{p.category}</span>
                         <div className="flex gap-2">
                            <button onClick={() => startEdit(p)} className="p-2 text-gray-500 hover:text-blue-500"><Edit2 size={14}/></button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-500 hover:text-red-500"><Trash2 size={14}/></button>
                         </div>
                      </div>
                      <h4 className="text-xs font-black uppercase italic leading-relaxed mb-4 group-hover:text-red-500 transition-colors">{p.title}</h4>
                      <p className="text-[10px] text-gray-500 italic uppercase tracking-widest">{p.date}</p>
                   </div>
                ))}
             </div>
          )}

          {isAdding && (
             <div className="bg-[#161b2c] p-12 rounded-[3rem] border border-white/5 animate-in slide-in-from-bottom-10 max-w-4xl mx-auto shadow-2xl relative">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
                   <h3 className="text-xl font-black uppercase tracking-tight italic">Calibration Entry</h3>
                   <button onClick={resetForm} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-600 transition-all"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Asset Identity</label>
                      <input type="text" value={formData.title} onChange={e => setFormData({...formData, title:e.target.value})} className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-red-600 transition-all" placeholder="Recruitment Title..." required />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Category Node</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category:e.target.value})} className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-red-600 transition-all uppercase">
                         <option value="jobs">Jobs Engine</option>
                         <option value="admit-card">Signal Card</option>
                         <option value="result">Final Matrix</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Sync Date</label>
                      <input type="date" value={formData.date} onChange={e => setFormData({...formData, date:e.target.value})} className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-red-600 transition-all" />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Core Telemetry (Hindi/English Mix)</label>
                      <textarea rows={6} value={formData.longArticle} onChange={e => setFormData({...formData, longArticle:e.target.value})} className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-red-600 transition-all leading-relaxed" placeholder="Complete article data..." />
                   </div>
                   <button type="submit" className="md:col-span-2 bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95">Synchronize Entry</button>
                </form>
             </div>
          )}

          {activeTab === 'notifications' && (
             <div className="max-w-2xl mx-auto bg-[#161b2c] p-12 rounded-[3rem] border border-white/5 space-y-10 animate-in fade-in">
                <div className="flex items-center gap-4 text-emerald-500 italic">
                   <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center"><Megaphone size={24}/></div>
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Signal Broadcast</h3>
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Deploy Push Signal across terminal nodes</p>
                   </div>
                </div>
                <div className="space-y-6">
                   <input type="text" placeholder="Signal Header" className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                   <textarea placeholder="Neural Payload..." rows={4} className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                   <button onClick={() => showToast("Signal Dispatched")} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-900/40 translate-y-[-2px] transition-all active:scale-95">Flash Broadcast</button>
                </div>
             </div>
          )}

          {activeTab === 'security' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in">
                <div className="bg-[#161b2c] p-12 rounded-[3rem] border border-white/5 space-y-8">
                   <h3 className="text-sm font-black uppercase tracking-[0.3em] text-red-500 italic"><ShieldCheck size={20} className="inline mr-3"/> Firewall Audit</h3>
                   <div className="space-y-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group">
                           <div>
                              <p className="text-[10px] font-black uppercase italic tracking-widest text-gray-300">Identity_Auth_Node_{i}</p>
                              <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1">Status: Operational</p>
                           </div>
                           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-[#161b2c] p-12 rounded-[3rem] border border-white/5 space-y-10 text-center">
                   <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/20 shadow-2xl"><RefreshCw size={36}/></div>
                   <div>
                      <h4 className="text-lg font-black uppercase tracking-tight italic">Core Sync</h4>
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mt-2 italic px-8">Synchronize authority frames with primary neural vault.</p>
                   </div>
                   <button onClick={handleSeedData} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/40 hover:translate-y-[-2px] transition-all">Sync Vault</button>
                </div>
             </div>
          )}

          {activeTab === 'ads' && (
             <div className="bg-[#161b2c] p-12 rounded-[3rem] border border-white/5 animate-in zoom-in duration-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><Zap size={100} /></div>
                <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-4 mb-4"><Share2 size={24} className="text-orange-500" /> Matrix Revenue Flow</h3>
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-black italic mb-10">Configure monetization nodes and neural script injections.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                   <div className="p-8 bg-black/30 rounded-3xl border border-white/5 text-center">
                      <p className="text-[9px] text-gray-600 uppercase font-bold italic mb-2">Today Capture</p>
                      <p className="text-4xl font-black italic text-emerald-500">$45.12</p>
                   </div>
                   <div className="p-8 bg-black/30 rounded-3xl border border-white/5 text-center">
                      <p className="text-[9px] text-gray-600 uppercase font-bold italic mb-2">Active Units</p>
                      <p className="text-4xl font-black italic text-blue-500">12 Nodes</p>
                   </div>
                   <div className="p-8 bg-black/30 rounded-3xl border border-white/5 text-center">
                      <p className="text-[9px] text-gray-600 uppercase font-bold italic mb-2">Impression Stacks</p>
                      <p className="text-4xl font-black italic text-violet-500">8.4K</p>
                   </div>
                </div>
                <div className="space-y-6">
                   <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                      <p className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-[0.2em] italic">Neural Script Anchor</p>
                      <textarea rows={4} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-xs font-mono text-gray-400 outline-none focus:border-orange-500 transition-all font-bold" defaultValue={`<script async src="https://engine.io/ad.js"></script>\n<script>\n  (matrixSync = window.matrixSync || []).push({});\n</script>`} />
                   </div>
                   <button onClick={() => showToast("Monetization Matched")} className="w-full bg-orange-600 py-5 rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-orange-900/40 hover:translate-y-[-2px] transition-all">Calibrate Monetization</button>
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in">
                <div className="bg-[#161b2c] p-12 rounded-[3rem] border border-white/5 space-y-12">
                   <div className="flex justify-between items-center border-b border-white/5 pb-6">
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] italic flex items-center gap-3"><Settings size={20} className="text-red-500" /> Configuration Hub</h3>
                      <button onClick={() => showToast("Settings Applied")} className="bg-red-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Apply</button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Identity Node Name</label>
                         <input type="text" defaultValue="CareerSetu Neural Nexus" className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 transition-all" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Authority URI</label>
                         <input type="text" defaultValue="admin@careersetu.io" className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 transition-all" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Copyright Signature Matrix</label>
                         <input type="text" defaultValue="© 2025 CAREERSETU // NEURAL_HIERARCHY_V2.0" className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 transition-all" />
                      </div>
                   </div>
                </div>
             </div>
          )}
       </main>
    </div>
  );
}
