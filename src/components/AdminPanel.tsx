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
  RefreshCw,
  Sparkles,
  BarChart3,
  Image as ImageIcon,
  Search,
  ChevronRight,
  TrendingUp,
  Clock,
  Eye,
  PieChart as PieChartIcon,
  Tag,
  List,
  Mail,
  Smartphone,
  Layers,
  History,
  Copy,
  Save,
  Send,
  ExternalLink,
  Bot
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart,
  Cell
} from 'recharts';

type Tab = 'dashboard' | 'posts' | 'categories' | 'seo' | 'ai' | 'settings' | 'media' | 'notifications' | 'security' | 'backups' | 'ads' | 'breaking' | 'faq' | 'home-manager' | 'analytics';

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // AI Generator States
  const [aiInput, setAiInput] = useState({ title: '', sourceUrl: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  
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
    date: new Date().toISOString().split('T')[0],
    seo: { title: '', description: '', keywords: [] as string[] }
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

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
    } catch (err: any) {
      setLoginError("Access Denied: Neural mismatch.");
    }
  };

  const handleLogout = async () => { await signOut(auth); };

  const handleGenerateAI = async () => {
    if (!aiInput.title) return showToast("Title required", "error");
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiInput)
      });
      const data = await response.json();
      setFormData({
        ...formData,
        title: data.title,
        shortDescription: data.shortDescription,
        longArticle: data.content,
        tags: data.tags.join(', '),
        seo: data.seo,
        faq: data.faq,
        importantDates: data.importantDates,
        applicationFee: data.applicationFee
      });
      setIsAdding(true);
      setActiveTab('posts');
      showToast("Article generated!");
    } catch (err) {
      showToast("Generation failed", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    const payload = { 
        ...formData, 
        tags: typeof formData.tags === 'string' ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : formData.tags, 
        updated_at: new Date().toISOString() 
    };
    try {
      if (editingPost) await update(ref(rtdb, `posts/${editingPost.id}`), payload);
      else await set(push(ref(rtdb, 'posts')), payload);
      showToast("Nexus updated.");
      resetForm();
      setActiveTab('posts');
    } catch (err) { showToast("Sync Error", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Purge asset?")) return;
    try {
      await remove(ref(rtdb, `posts/${id}`));
      showToast("Asset purged.");
    } catch (err) { showToast("Error", "error"); }
  };

  const resetForm = () => {
    setEditingPost(null);
    setIsAdding(false);
    setFormData({ 
        title: '', category: 'jobs', content: '', shortDescription: '', importantDates: [], 
        applicationFee: [], vacancyDetails: [], totalPosts: '', longArticle: '', imageUrl: '', 
        importantLinks: [], faq: [], isNew: true, isHot: false, tags: '', 
        date: new Date().toISOString().split('T')[0],
        seo: { title: '', description: '', keywords: [] }
    });
  };

  const startEdit = (post: any) => {
    setEditingPost(post);
    setFormData({ 
        ...post, 
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''), 
        date: post.date?.split('T')[0] || new Date().toISOString().split('T')[0] 
    });
    setIsAdding(true);
    setActiveTab('posts');
  };

  const stats = useMemo(() => {
    const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
    const chartData = [
      { name: 'Mon', views: 400, posts: 2 },
      { name: 'Tue', views: 300, posts: 1 },
      { name: 'Wed', views: 600, posts: 4 },
      { name: 'Thu', views: 800, posts: 3 },
      { name: 'Fri', views: 500, posts: 2 },
      { name: 'Sat', views: 900, posts: 5 },
      { name: 'Sun', views: 1100, posts: 6 },
    ];
    return { 
        totalPosts: posts.length, 
        totalViews, 
        topPost: [...posts].sort((a,b) => (b.views||0) - (a.views||0))[0],
        chartData
    };
  }, [posts]);

  if (isInitialLoad) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] text-white font-black uppercase tracking-widest animate-pulse">Initializing Nexus...</div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full"></div>
        
        <div className="max-w-md w-full bg-[#161b2c]/80 backdrop-blur-xl p-12 rounded-[3rem] border border-white/10 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
           <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-600/20">
                <ShieldCheck size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Super Admin Panel</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">CareerSetu Enterprise Terminal v3.0</p>
           </div>
           
           {loginError && <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-widest text-center border border-red-500/20 animate-bounce">{loginError}</div>}
           
           <form onSubmit={handleLocalLogin} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Identity Node</label>
                 <input 
                    type="email" 
                    placeholder="admin@careersetu.com" 
                    className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 transition-all placeholder:text-gray-700" 
                    value={loginData.email} 
                    onChange={e => setLoginData({...loginData, email: e.target.value})} 
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Access Cipher</label>
                 <input 
                    type="password" 
                    placeholder="••••••••••••" 
                    className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 transition-all placeholder:text-gray-700" 
                    value={loginData.password} 
                    onChange={e => setLoginData({...loginData, password: e.target.value})} 
                 />
              </div>
              <button type="submit" className="w-full bg-red-600 py-5 rounded-2xl font-black uppercase tracking-[0.4em] shadow-2xl shadow-red-900/40 hover:translate-y-[-2px] transition-all hover:bg-red-500 active:scale-95">Authorize Access</button>
           </form>
           
           <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <button onClick={onBack} className="text-gray-500 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"><Globe size={14}/> Return to Public Node</button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col md:flex-row text-white font-sans overflow-hidden">
       {/* Sidebar */}
       <aside className="w-full md:w-72 bg-[#161b2c] border-r border-white/5 flex flex-col p-6 space-y-1 overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-4 mb-10 px-3 py-2 bg-white/5 rounded-2xl border border-white/5">
             <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20"><Cpu size={24} /></div>
             <div>
                <div className="font-black italic text-lg tracking-tighter leading-none">CAREERSETU</div>
                <div className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-1">Super_Admin_v3</div>
             </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 px-4 mt-6">Core Operations</p>
            {[
              { id: 'dashboard', label: 'DASHBOARD', icon: <LayoutDashboard size={18} /> },
              { id: 'ai', label: 'AI GENERATOR', icon: <Bot size={18} />, hot: true },
              { id: 'posts', label: 'POSTS', icon: <FilePlus size={18} /> },
              { id: 'categories', label: 'CATEGORIES', icon: <Layers size={18} /> },
              { id: 'breaking', label: 'BREAKING NEWS', icon: <Zap size={18} /> },
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsAdding(false); }} className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id && !isAdding ? 'bg-red-600 text-white shadow-xl shadow-red-900/40 translate-x-2' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                 <div className="flex items-center gap-4">{item.icon} {item.label}</div>
                 {item.hot && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
              </button>
            ))}

            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 px-4 mt-6">Management</p>
            {[
              { id: 'home-manager', label: 'HOMEPAGE', icon: <Globe size={18} /> },
              { id: 'ads', label: 'ADVERTISEMENTS', icon: <Share2 size={18} /> },
              { id: 'media', label: 'MEDIA LIBRARY', icon: <ImageIcon size={18} /> },
              { id: 'faq', label: 'FAQ CENTER', icon: <List size={18} /> },
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsAdding(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id && !isAdding ? 'bg-red-600 text-white shadow-xl shadow-red-900/40 translate-x-2' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                 {item.icon} {item.label}
              </button>
            ))}

            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 px-4 mt-6">System</p>
            {[
              { id: 'analytics', label: 'ANALYTICS', icon: <BarChart3 size={18} /> },
              { id: 'seo', label: 'SEO CENTER', icon: <Search size={18} /> },
              { id: 'security', label: 'SECURITY', icon: <ShieldCheck size={18} /> },
              { id: 'settings', label: 'SETTINGS', icon: <Settings size={18} /> },
              { id: 'backups', label: 'BACKUPS', icon: <Database size={18} /> },
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsAdding(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id && !isAdding ? 'bg-red-600 text-white shadow-xl shadow-red-900/40 translate-x-2' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                 {item.icon} {item.label}
              </button>
            ))}
          </div>

          <div className="pt-12 mt-auto">
             <button onClick={handleLogout} className="w-full bg-gray-900 text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"><LogOut size={16}/> EXIT_NODE</button>
          </div>
       </aside>

       {/* Main */}
       <main className="flex-1 p-8 md:p-12 overflow-y-auto relative scrollbar-thin">
          <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-red-600/10 via-blue-600/5 to-transparent pointer-events-none"></div>
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
             <div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">{isAdding ? 'Asset_Calibration' : activeTab}</h2>
                <div className="flex items-center gap-3 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                    <Clock size={12}/> {new Date().toLocaleTimeString()} <span className="text-gray-800">|</span> <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> SYSTEM_ONLINE</div>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <button onClick={() => { setIsAdding(true); setEditingPost(null); }} className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 hover:translate-y-[-2px] active:scale-95"><Plus size={16}/> New Article</button>
                <button onClick={onBack} className="w-14 h-14 rounded-2xl bg-[#161b2c] flex items-center justify-center border border-white/10 hover:bg-red-600 transition-all shadow-xl group"><Globe size={22} className="group-hover:rotate-45 transition-all" /></button>
             </div>
          </header>

          {toast && <div className="fixed bottom-10 right-10 z-50 bg-[#161b2c] border border-red-600/50 px-8 py-5 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.3)] flex items-center gap-4 animate-in slide-in-from-right duration-500"><CheckCircle2 className="text-red-500" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">{toast.message}</span></div>}

          {activeTab === 'dashboard' && (
             <div className="space-y-10 animate-in fade-in duration-1000">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {[
                     { label: 'Total Articles', value: posts.length, icon: <FilePlus className="text-red-500" />, trend: '+12% this week' },
                     { label: 'Cloud Reach', value: stats.totalViews.toLocaleString(), icon: <Eye className="text-blue-500" />, trend: '+8.4K today' },
                     { label: 'Active Sessions', value: '42', icon: <TrendingUp className="text-emerald-500" />, trend: 'Live' },
                     { label: 'Bounce Matrix', value: '24%', icon: <PieChartIcon className="text-orange-500" />, trend: '-2% improved' },
                   ].map((item, i) => (
                      <div key={i} className="bg-[#161b2c]/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:translate-y-[-4px] transition-all group">
                         <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">{item.icon}</div>
                            <span className="text-[8px] font-black text-emerald-500 uppercase italic tracking-widest">{item.trend}</span>
                         </div>
                         <div>
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{item.label}</p>
                            <p className="text-3xl font-black italic tracking-tighter mt-1">{item.value}</p>
                         </div>
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 bg-[#161b2c]/60 backdrop-blur-md p-10 rounded-[3rem] border border-white/5 space-y-8">
                      <div className="flex justify-between items-center">
                         <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Traffic Overview (Weekly)</h3>
                         <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-[8px] font-black text-gray-500 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-red-600"></div> Views</div>
                            <div className="flex items-center gap-2 text-[8px] font-black text-gray-500 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Posts</div>
                         </div>
                      </div>
                      <div className="h-[350px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData}>
                               <defs>
                                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                               <XAxis dataKey="name" stroke="#666" fontSize={10} fontStyle="italic" />
                               <YAxis stroke="#666" fontSize={10} fontStyle="italic" />
                               <Tooltip 
                                  contentStyle={{ backgroundColor: '#161b2c', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                  itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                               />
                               <Area type="monotone" dataKey="views" stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                               <Area type="monotone" dataKey="posts" stroke="#2563EB" strokeWidth={2} fillOpacity={0} />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="bg-[#161b2c]/60 backdrop-blur-md p-10 rounded-[3rem] border border-white/5 space-y-8">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] italic">Latest Activities</h3>
                      <div className="space-y-6">
                         {[1,2,3,4,5].map(i => (
                            <div key={i} className="flex gap-4 items-center group cursor-pointer">
                               <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-600 transition-colors"><Zap size={16}/></div>
                               <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-black uppercase italic tracking-tight truncate">New Post Calibration_{i}</p>
                                  <p className="text-[8px] text-gray-500 font-bold uppercase mt-0.5">2 minutes ago</p>
                               </div>
                               <ChevronRight size={14} className="text-gray-700" />
                            </div>
                         ))}
                      </div>
                      <button className="w-full py-4 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all">Full Log History</button>
                   </div>
                </div>

                {stats.topPost && (
                   <div className="bg-gradient-to-r from-red-600/20 to-blue-600/10 p-12 rounded-[3.5rem] border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity rotate-12"><Zap size={180} /></div>
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                         <div className="max-w-3xl">
                            <p className="text-red-500 text-[10px] font-black tracking-[0.4em] uppercase italic mb-6">Master Asset Peak Performance</p>
                            <h3 className="text-4xl font-black italic uppercase leading-[1.1] mb-8 group-hover:translate-x-2 transition-transform">{stats.topPost.title}</h3>
                            <div className="flex flex-wrap gap-6">
                               <div className="bg-black/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center">
                                  <p className="text-[8px] text-gray-500 uppercase font-black italic mb-1">Engagements</p>
                                  <p className="text-2xl font-black italic">{(stats.topPost.views * 0.4).toFixed(0)}</p>
                               </div>
                               <div className="bg-black/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center">
                                  <p className="text-[8px] text-gray-500 uppercase font-black italic mb-1">Global Index</p>
                                  <p className="text-2xl font-black italic">#1</p>
                               </div>
                            </div>
                         </div>
                         <button onClick={() => startEdit(stats.topPost)} className="px-10 py-5 bg-white text-black rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-red-600 hover:text-white transition-all transform group-hover:scale-105 active:scale-95">Calibrate Asset</button>
                      </div>
                   </div>
                )}
             </div>
          )}

          {activeTab === 'ai' && (
              <div className="max-w-4xl mx-auto animate-in zoom-in duration-700">
                  <div className="bg-[#161b2c]/80 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/10 space-y-12 relative overflow-hidden">
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full"></div>
                      
                      <div className="flex items-center gap-6 mb-12">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-900/40"><Bot size={32} /></div>
                          <div>
                              <h3 className="text-2xl font-black uppercase italic tracking-tighter">AI Neural Generator</h3>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">OpenCode AI Article Synth Engine v1.0</p>
                          </div>
                      </div>

                      <div className="space-y-8">
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">Article Identifier / Title</label>
                              <input 
                                type="text" 
                                value={aiInput.title}
                                onChange={e => setAiInput({...aiInput, title: e.target.value})}
                                placeholder="E.g. SSC GD Constable Recruitment 2025" 
                                className="w-full bg-[#0a0f1d] border border-white/10 rounded-[1.5rem] px-8 py-5 text-white text-sm font-bold outline-none focus:border-blue-600 transition-all placeholder:text-gray-700" 
                              />
                          </div>
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">Source Knowledge URI (Optional)</label>
                              <input 
                                type="text" 
                                value={aiInput.sourceUrl}
                                onChange={e => setAiInput({...aiInput, sourceUrl: e.target.value})}
                                placeholder="https://ssc.gov.in/notices/..." 
                                className="w-full bg-[#0a0f1d] border border-white/10 rounded-[1.5rem] px-8 py-5 text-white text-sm font-bold outline-none focus:border-blue-600 transition-all placeholder:text-gray-700" 
                              />
                          </div>
                          
                          <button 
                            onClick={handleGenerateAI}
                            disabled={isGenerating}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 py-6 rounded-[1.5rem] font-black uppercase tracking-[0.4em] shadow-2xl shadow-blue-900/40 hover:translate-y-[-2px] transition-all disabled:opacity-50 flex items-center justify-center gap-4 group overflow-hidden relative"
                          >
                            {isGenerating ? (
                                <div className="flex items-center gap-3">
                                    <RefreshCw size={20} className="animate-spin" />
                                    <span>Synthesizing...</span>
                                </div>
                            ) : (
                                <>
                                    <Sparkles size={20} className="group-hover:scale-125 transition-transform" />
                                    <span>Generate Complete Article</span>
                                </>
                            )}
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
                          {[
                              { label: 'Auto SEO', icon: <Search size={16}/> },
                              { label: 'Auto FAQ', icon: <List size={16}/> },
                              { label: 'Formatting', icon: <LayoutDashboard size={16}/> },
                          ].map((item, i) => (
                              <div key={i} className="flex items-center gap-3 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                  <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center">{item.icon}</div>
                                  {item.label}
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'posts' && !isAdding && (
             <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                        <input type="text" placeholder="Search Master Index..." className="w-full bg-[#161b2c] border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold outline-none focus:border-red-600 transition-all" />
                    </div>
                    <div className="flex gap-4">
                        <select className="bg-[#161b2c] border border-white/10 rounded-2xl px-8 py-5 text-[10px] font-black uppercase outline-none focus:border-red-600 appearance-none min-w-[200px] text-center tracking-widest">
                            <option>ALL_NODES</option>
                            <option>JOBS_ENGINE</option>
                            <option>RESULTS_MATRIX</option>
                        </select>
                        <button className="w-14 h-14 bg-[#161b2c] border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all"><Settings size={18}/></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {posts.map(p => (
                      <div key={p.id} className="bg-[#161b2c]/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 group hover:border-red-600/30 transition-all flex flex-col h-full">
                         <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-red-600/10 text-red-500 border border-red-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">{p.category}</span>
                                {p.isHot && <span className="px-3 py-1 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Zap size={8} /> HOT</span>}
                            </div>
                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => startEdit(p)} className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={12}/></button>
                               <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Trash2 size={12}/></button>
                            </div>
                         </div>
                         <h4 className="text-sm font-black uppercase italic leading-snug mb-6 group-hover:text-red-500 transition-colors flex-1">{p.title}</h4>
                         <div className="flex justify-between items-center pt-6 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest"><Eye size={12}/> {p.views?.toLocaleString() || 0}</div>
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest"><Clock size={12}/> {p.date}</div>
                            </div>
                            <button onClick={() => startEdit(p)} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all"><ChevronRight size={14}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {isAdding && (
             <div className="bg-[#161b2c]/90 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/10 animate-in slide-in-from-bottom-12 max-w-5xl mx-auto shadow-[0_0_80px_rgba(0,0,0,0.5)] relative">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-2xl z-20"><Zap size={40} className="animate-pulse" /></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 pb-8 border-b border-white/10 gap-6">
                   <div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter italic">Node Calibration_{editingPost ? 'Edit' : 'New'}</h3>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Manual Asset Protocol Override</p>
                   </div>
                   <div className="flex gap-4">
                       <button onClick={resetForm} className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                       <button onClick={handleSubmit} className="px-10 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl">Deploy Assets</button>
                   </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="md:col-span-2 space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Post Primary Identifier (Hindi/English)</label>
                          <input type="text" value={formData.title} onChange={e => setFormData({...formData, title:e.target.value})} className="w-full bg-[#0a0f1d] border border-white/10 rounded-[1.5rem] px-8 py-6 text-white text-lg font-black outline-none focus:border-red-600 transition-all italic" placeholder="Enter recruitment title..." required />
                       </div>
                       
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Node Classification</label>
                          <select value={formData.category} onChange={e => setFormData({...formData, category:e.target.value})} className="w-full bg-[#0a0f1d] border border-white/10 rounded-[1.5rem] px-8 py-5 text-white text-xs font-black outline-none focus:border-red-600 transition-all uppercase tracking-widest">
                             <option value="jobs">JOBS_ENGINE</option>
                             <option value="admit-card">ADMIT_CARD_SIGNAL</option>
                             <option value="result">RESULT_MATRIX</option>
                             <option value="syllabus">SYLLABUS_INDEX</option>
                             <option value="answer-key">ANSWER_KEY_DATA</option>
                          </select>
                       </div>
                       
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Sync Timestamp</label>
                          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date:e.target.value})} className="w-full bg-[#0a0f1d] border border-white/10 rounded-[1.5rem] px-8 py-5 text-white text-xs font-black outline-none focus:border-red-600 transition-all uppercase" />
                       </div>

                       <div className="md:col-span-2 space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Neural Payload (Full Content)</label>
                          <textarea rows={12} value={formData.longArticle} onChange={e => setFormData({...formData, longArticle:e.target.value})} className="w-full bg-[#0a0f1d] border border-white/10 rounded-[2rem] px-8 py-8 text-white text-sm font-medium outline-none focus:border-red-600 transition-all leading-relaxed font-mono" placeholder="Enter full article content in Markdown format..." />
                       </div>
                       
                       <div className="md:col-span-2 bg-[#0a0f1d] p-10 rounded-[2.5rem] border border-white/5 space-y-8">
                           <h4 className="text-[11px] font-black uppercase tracking-[0.3em] italic text-blue-500 flex items-center gap-3"><Search size={16}/> SEO & Analytics Meta</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-3">
                                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Meta SEO Title</label>
                                   <input type="text" value={formData.seo?.title || ''} onChange={e => setFormData({...formData, seo: {...formData.seo, title: e.target.value}})} className="w-full bg-white/5 border border-white/5 rounded-xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-600" />
                               </div>
                               <div className="space-y-3">
                                   <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Global Asset Tags</label>
                                   <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags:e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-600" placeholder="tag1, tag2..." />
                               </div>
                           </div>
                       </div>
                   </div>
                   
                   <div className="flex gap-6 pt-10 border-t border-white/5">
                        <button type="button" onClick={() => setFormData({...formData, isHot: !formData.isHot})} className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.isHot ? 'bg-orange-600 text-white border-orange-500' : 'bg-white/5 text-gray-500 border-white/5'}`}>
                            {formData.isHot ? 'SIGNAL_HOT: ACTIVE' : 'MARK_AS_HOT'}
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, isNew: !formData.isNew})} className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.isNew ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/5 text-gray-500 border-white/5'}`}>
                            {formData.isNew ? 'STATUS_NEW: ACTIVE' : 'MARK_AS_NEW'}
                        </button>
                   </div>
                   
                   <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.5em] shadow-[0_0_50px_rgba(220,38,38,0.4)] hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-4">
                      <Database size={20}/> Synchronize Nexus Database
                   </button>
                </form>
             </div>
          )}

          {activeTab === 'notifications' && (
             <div className="max-w-2xl mx-auto bg-[#161b2c] p-12 rounded-[3.5rem] border border-white/10 space-y-12 animate-in slide-in-from-bottom-10 shadow-2xl">
                <div className="flex items-center gap-6 text-emerald-500 italic">
                   <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-emerald-500/10 border border-emerald-500/20"><Megaphone size={32}/></div>
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">Signal Broadcast</h3>
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1">Deploy Global Neural Push Notification</p>
                   </div>
                </div>
                <div className="space-y-8">
                   <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">Broadcast Header</label>
                       <input type="text" placeholder="URGENT: New Matrix Signal..." className="w-full bg-[#0a0f1d] border border-white/10 rounded-[1.5rem] px-8 py-5 text-white text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                   </div>
                   <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">Payload Content</label>
                       <textarea placeholder="Neural Data Packet..." rows={4} className="w-full bg-[#0a0f1d] border border-white/10 rounded-[1.5rem] px-8 py-5 text-white text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                   </div>
                   <button onClick={() => showToast("Broadcasting Global...")} className="w-full bg-gradient-to-r from-emerald-600 to-teal-800 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-900/40 hover:translate-y-[-4px] transition-all active:scale-95">Disperse Broadcast</button>
                </div>
             </div>
          )}

          {activeTab === 'security' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in">
                <div className="bg-[#161b2c]/80 backdrop-blur-md p-12 rounded-[3.5rem] border border-white/10 space-y-10">
                   <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-red-500 italic flex items-center gap-4"><ShieldCheck size={24}/> Firewall Audit</h3>
                      <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Secure</span>
                   </div>
                   <div className="space-y-4">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                           <div>
                              <p className="text-[11px] font-black uppercase italic tracking-widest text-gray-200">Terminal_Session_{i * 420}</p>
                              <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1.5 flex items-center gap-2"><Smartphone size={10}/> IP: 192.168.1.{i * 10} <span className="text-gray-800">|</span> Mumbai_Node</p>
                           </div>
                           <button className="w-10 h-10 rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"><LogOut size={16}/></button>
                        </div>
                      ))}
                   </div>
                   <button className="w-full py-5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white hover:bg-red-600 transition-all">Emergency Lockout</button>
                </div>
                
                <div className="space-y-10">
                   <div className="bg-[#161b2c]/80 backdrop-blur-md p-12 rounded-[3.5rem] border border-white/10 space-y-10 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-5 rotate-45"><RefreshCw size={120}/></div>
                      <div className="w-24 h-24 bg-blue-600/10 text-blue-500 rounded-[2rem] flex items-center justify-center mx-auto border border-blue-500/20 shadow-2xl relative z-10"><RefreshCw size={44} className="animate-spin-slow"/></div>
                      <div className="relative z-10">
                         <h4 className="text-2xl font-black uppercase tracking-tight italic">Nexus Synchronization</h4>
                         <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mt-3 italic leading-relaxed px-10">Re-calibrate and synchronize authority frames across all distributed neural vault clusters.</p>
                      </div>
                      <button onClick={() => showToast("Syncing Database...")} className="w-full bg-blue-600 py-6 rounded-2xl font-black uppercase tracking-[0.4em] shadow-2xl shadow-blue-900/40 hover:translate-y-[-4px] transition-all active:scale-95 relative z-10">Initiate Full Sync</button>
                   </div>
                   
                   <div className="bg-[#161b2c]/80 backdrop-blur-md p-10 rounded-[3rem] border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-red-600/10 transition-all">
                       <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 group-hover:bg-red-600 group-hover:text-white transition-all"><Database size={24}/></div>
                           <div>
                               <p className="text-sm font-black uppercase italic tracking-tighter">Vault Backups</p>
                               <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">Last successful: 4h 12m ago</p>
                           </div>
                       </div>
                       <ChevronRight className="text-gray-700 group-hover:text-white transition-colors" />
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'ads' && (
             <div className="bg-[#161b2c]/80 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/10 animate-in zoom-in duration-1000 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 pointer-events-none"><Zap size={200} /></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4"><Share2 size={32} className="text-orange-500" /> Revenue Stream Matrix</h3>
                        <p className="text-[11px] text-gray-500 uppercase tracking-[0.3em] font-black italic mt-2 ml-1">Configure monetization scripts and neural ad-unit clusters.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl">
                        <TrendingUp className="text-emerald-500" size={18}/>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+42.5% Month-on-Month</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                   {[
                       { label: 'Neural Capture Today', value: '$142.84', color: 'text-emerald-500', icon: <Zap size={14}/> },
                       { label: 'Active Ad Units', value: '18 Clusters', color: 'text-blue-500', icon: <Layers size={14}/> },
                       { label: 'Impression Flow', value: '42.6K', color: 'text-orange-500', icon: <Eye size={14}/> },
                   ].map((item, i) => (
                      <div key={i} className="p-10 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-3 relative overflow-hidden group hover:border-white/20 transition-all">
                         <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">{item.icon}</div>
                         <p className="text-[9px] text-gray-600 uppercase font-black italic tracking-widest leading-none">{item.label}</p>
                         <p className={`text-4xl font-black italic ${item.color} tracking-tighter leading-none`}>{item.value}</p>
                      </div>
                   ))}
                </div>

                <div className="space-y-10">
                   <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 space-y-6">
                      <div className="flex justify-between items-center">
                          <p className="text-[11px] font-black uppercase text-gray-500 tracking-[0.3em] italic flex items-center gap-3"><Bot size={18}/> Global AdSense Neural Anchor</p>
                          <span className="px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Operational</span>
                      </div>
                      <textarea rows={6} className="w-full bg-black/60 border border-white/10 rounded-[1.5rem] px-8 py-6 text-xs font-mono text-gray-500 outline-none focus:border-orange-500 transition-all font-bold leading-relaxed" defaultValue={`<!-- Global site tag (gtag.js) - Google AdSense -->\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>\n<script>\n  (adsbygoogle = window.adsbygoogle || []).push({});\n</script>`} />
                      <div className="flex gap-4">
                          <button onClick={() => showToast("Anchor Dispatched")} className="flex-1 bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.4em] shadow-2xl shadow-orange-900/40 hover:translate-y-[-4px] transition-all flex items-center justify-center gap-3"><Zap size={18}/> Deploy Anchor</button>
                          <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Reset</button>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-10">
                <div className="bg-[#161b2c]/80 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/10 space-y-12 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5"><Settings size={120} /></div>
                   <div className="flex justify-between items-center border-b border-white/10 pb-10">
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-4"><Settings size={28} className="text-red-500 animate-spin-slow" /> Configuration Hub</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">CareerSetu System Parameters</p>
                      </div>
                      <button onClick={() => showToast("Hub Synchronized")} className="bg-gradient-to-r from-red-600 to-red-800 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-red-900/40 hover:translate-y-[-2px] transition-all active:scale-95">Synchronize Hub</button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] ml-2">Nexus Identity Name</label>
                         <input type="text" defaultValue="CareerSetu Neural Hub" className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-8 py-5 text-white text-sm font-bold outline-none focus:border-red-600 transition-all italic" />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] ml-2">Primary Authority Contact</label>
                         <input type="email" defaultValue="nexus@careersetu.io" className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-8 py-5 text-white text-sm font-bold outline-none focus:border-red-600 transition-all italic" />
                      </div>
                      <div className="md:col-span-2 space-y-4">
                         <label className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] ml-2">Universal Copyright Signature</label>
                         <input type="text" defaultValue="© 2025 CAREERSETU // NEURAL_HIERARCHY_V3.0_ENTERPRISE" className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-8 py-5 text-white text-sm font-bold outline-none focus:border-red-600 transition-all italic" />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] ml-2">Neural Refresh Rate</label>
                         <select className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-8 py-5 text-white text-xs font-black outline-none focus:border-red-600 transition-all uppercase tracking-widest">
                             <option>REALTIME_STREAM</option>
                             <option>5_MINUTE_INTERVAL</option>
                             <option>MANUAL_SYNC_ONLY</option>
                         </select>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] ml-2">Visual Core Theme</label>
                         <div className="flex gap-4">
                             <div className="flex-1 h-14 bg-red-600 rounded-2xl border-4 border-white/20"></div>
                             <div className="flex-1 h-14 bg-blue-900 rounded-2xl border border-white/10"></div>
                             <div className="flex-1 h-14 bg-gray-900 rounded-2xl border border-white/10"></div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-[#161b2c]/80 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-red-600/10 transition-all shadow-xl">
                   <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-white/5 text-blue-500 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg"><Globe size={28}/></div>
                       <div>
                           <p className="text-lg font-black uppercase italic tracking-tighter">Domain Calibration</p>
                           <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">Configure primary URI and SSL certificates</p>
                       </div>
                   </div>
                   <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Calibrate</button>
                </div>
             </div>
          )}

          {activeTab === 'seo' && (
              <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in">
                  <div className="bg-[#161b2c]/80 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/10 space-y-12 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-5"><Search size={120} /></div>
                      <div className="flex justify-between items-center border-b border-white/10 pb-10">
                          <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-4"><Search size={28} className="text-blue-500" /> SEO Optimization Center</h3>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Global Neural Search Index Calibration</p>
                          </div>
                          <button onClick={() => showToast("SEO Indexed")} className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/40 hover:translate-y-[-2px] transition-all">Optimize Global</button>
                      </div>
                      
                      <div className="space-y-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] ml-2">Global Meta Title Template</label>
                                  <input type="text" defaultValue="CareerSetu | {title} | Latest Jobs" className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-8 py-5 text-white text-sm font-bold outline-none focus:border-blue-600 transition-all italic" />
                              </div>
                              <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] ml-2">Search Trawl Frequency</label>
                                  <select className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-8 py-5 text-white text-xs font-black outline-none focus:border-blue-600 transition-all uppercase tracking-widest">
                                      <option>HIGH_PRIORITY_DAILY</option>
                                      <option>STANDARD_WEEKLY</option>
                                      <option>REALTIME_PING</option>
                                  </select>
                              </div>
                              <div className="md:col-span-2 space-y-4">
                                  <label className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] ml-2">Global Meta Description Base</label>
                                  <textarea rows={3} className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-8 py-5 text-white text-sm font-medium outline-none focus:border-blue-600 transition-all leading-relaxed" defaultValue="CareerSetu provides the latest information on government jobs, admit cards, results, and syllabus in Hindi and English. Stay updated with our real-time job alerts." />
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {[
                                  { label: 'Sitemap.xml', icon: <Globe size={14}/>, status: 'Active' },
                                  { label: 'Robots.txt', icon: <Bot size={14}/>, status: 'Calibrated' },
                                  { label: 'Schema.org', icon: <Layers size={14}/>, status: 'Rich' },
                              ].map((item, i) => (
                                  <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center text-center space-y-3 group hover:border-blue-600/30 transition-all">
                                      <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">{item.icon}</div>
                                      <p className="text-[10px] font-black uppercase tracking-widest">{item.label}</p>
                                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em]">{item.status}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}
       </main>
    </div>
  );
}
