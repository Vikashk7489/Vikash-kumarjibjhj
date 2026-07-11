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
  Pie,
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
       <aside className="w-full md:w-80 bg-[#0a0f1d] border-r border-white/5 flex flex-col p-8 space-y-1 overflow-y-auto scrollbar-thin relative z-30">
          <div className="flex items-center gap-4 mb-12 px-2">
             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <img src="/logo.png" alt="CareerSetu" className="w-8 h-8 object-contain" onError={(e) => e.currentTarget.src = 'https://api.dicebear.com/7.x/shapes/svg?seed=career'} />
             </div>
             <div>
                <div className="font-black italic text-2xl tracking-tighter leading-none text-white">CareerSetu</div>
             </div>
          </div>
          
          <div className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
              { id: 'ai', label: 'AI Article Generator', icon: <Bot size={20} />, hot: true },
              { id: 'posts', label: 'Posts Management', icon: <FilePlus size={20} /> },
              { id: 'categories', label: 'Categories', icon: <Layers size={20} />, sub: true },
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsAdding(false); }} className={`w-full flex items-center justify-between px-6 py-4 rounded-xl text-sm font-medium transition-all ${activeTab === item.id && !isAdding ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                 <div className="flex items-center gap-4">{item.icon} {item.label}</div>
                 {item.sub && <ChevronRight size={14} className="text-gray-600" />}
                 {item.hot && <span className="px-2 py-0.5 bg-red-600 text-[8px] font-black uppercase rounded-md text-white">New</span>}
              </button>
            ))}

            <div className="mt-8 mb-4 px-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Management</div>
            {[
              { id: 'home-manager', label: 'Homepage Manager', icon: <Globe size={20} />, sub: true },
              { id: 'banner-manager', label: 'Banner Manager', icon: <ImageIcon size={20} />, sub: true },
              { id: 'ads', label: 'Ad Manager', icon: <Share2 size={20} />, hot: true },
              { id: 'media', label: 'Media Manager', icon: <Layers size={20} />, sub: true },
              { id: 'pages', label: 'Pages', icon: <FilePlus size={20} />, sub: true },
              { id: 'breaking', label: 'Breaking News', icon: <Zap size={20} />, sub: true },
              { id: 'faq', label: 'FAQ Manager', icon: <List size={20} />, sub: true },
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsAdding(false); }} className={`w-full flex items-center justify-between px-6 py-4 rounded-xl text-sm font-medium transition-all ${activeTab === item.id && !isAdding ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                 <div className="flex items-center gap-4">{item.icon} {item.label}</div>
                 {item.sub && <ChevronRight size={14} className="text-gray-600" />}
                 {item.hot && <span className="px-2 py-0.5 bg-red-600 text-[8px] font-black uppercase rounded-md text-white">New</span>}
              </button>
            ))}

            <div className="mt-8 mb-4 px-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest">System</div>
            {[
              { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, sub: true },
              { id: 'seo', label: 'SEO Center', icon: <Search size={20} />, sub: true },
              { id: 'theme-manager', label: 'Theme Manager', icon: <PieChartIcon size={20} />, sub: true },
              { id: 'settings', label: 'Settings', icon: <Settings size={20} />, sub: true },
              { id: 'backups', label: 'Backup Manager', icon: <Database size={20} />, sub: true },
              { id: 'security', label: 'Security', icon: <ShieldCheck size={20} />, sub: true },
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsAdding(false); }} className={`w-full flex items-center justify-between px-6 py-4 rounded-xl text-sm font-medium transition-all ${activeTab === item.id && !isAdding ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                 <div className="flex items-center gap-4">{item.icon} {item.label}</div>
                 {item.sub && <ChevronRight size={14} className="text-gray-600" />}
              </button>
            ))}
          </div>

          <div className="pt-12 mt-auto">
             <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-red-600/10 transition-all">
                <LogOut size={20}/> Logout
             </button>
          </div>
       </aside>

       {/* Main */}
       <main className="flex-1 bg-[#0F172A] p-8 md:p-12 overflow-y-auto relative scrollbar-thin">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
             <div>
                <h2 className="text-3xl font-bold text-white mb-1">{isAdding ? 'Create Post' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Home</span> <ChevronRight size={12} /> <span className="text-gray-400 capitalize">{activeTab}</span>
                </div>
             </div>
             <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl">
                <div className="flex items-center gap-2 px-4 border-r border-white/10">
                   <Clock size={16} className="text-gray-500" />
                   <span className="text-sm font-medium text-white">15 May 2025 - 21 May 2025</span>
                   <ChevronRight size={16} className="text-gray-500 rotate-90" />
                </div>
                <div className="flex items-center gap-3 pl-4">
                   <div className="relative">
                      <BellRing size={20} className="text-gray-400" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-[10px] font-bold rounded-full flex items-center justify-center text-white">8</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-600/30">
                         <img src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"} alt="Admin" className="w-full h-full object-cover" />
                      </div>
                      <div className="hidden lg:block">
                         <div className="text-sm font-bold text-white leading-none">Admin</div>
                         <div className="text-[10px] text-gray-500 mt-1">Super Admin</div>
                      </div>
                   </div>
                </div>
             </div>
          </header>

          {toast && <div className="fixed bottom-10 right-10 z-50 bg-[#1e293b] border border-red-600/50 px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500"><CheckCircle2 className="text-green-500" /> <span className="text-sm font-medium text-white">{toast.message}</span></div>}

          {activeTab === 'dashboard' && (
             <div className="space-y-10 animate-in fade-in duration-1000">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                   {[
                     { label: 'Total Articles', value: '1,248', icon: <FilePlus className="text-blue-500" />, trend: '+12.5% from last month', trendUp: true, color: 'blue' },
                     { label: 'Published Articles', value: '1,085', icon: <CheckCircle2 className="text-green-500" />, trend: '+10.3% from last month', trendUp: true, color: 'green' },
                     { label: 'Draft Articles', value: '163', icon: <FilePlus className="text-yellow-500" />, trend: '-5.2% from last month', trendUp: false, color: 'yellow' },
                     { label: 'Total Categories', value: '46', icon: <Layers className="text-purple-500" />, trend: '+3.7% from last month', trendUp: true, color: 'purple' },
                     { label: 'Total Visitors', value: '256.8K', icon: <TrendingUp className="text-red-500" />, trend: '+15.6% from last month', trendUp: true, color: 'red' },
                   ].map((item, i) => (
                      <div key={i} className="bg-[#1e293b]/50 backdrop-blur-md p-6 rounded-[1.5rem] border border-white/5 space-y-4 transition-all hover:bg-[#1e293b]/70">
                         <div className="flex justify-between items-start">
                            <div>
                               <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                               <p className="text-2xl font-bold text-white mt-1">{item.value}</p>
                            </div>
                            <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center`}>{item.icon}</div>
                         </div>
                         <div className={`flex items-center gap-2 text-[10px] font-medium ${item.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                            <TrendingUp size={14} className={item.trendUp ? '' : 'rotate-180'} /> {item.trend}
                         </div>
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 space-y-8">
                      <div className="flex justify-between items-center">
                         <div>
                            <h3 className="text-lg font-bold text-white">Visitors Overview</h3>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 rounded-sm bg-red-600"></div> Page Views</div>
                            <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 rounded-sm bg-blue-600"></div> Visitors</div>
                            <select className="bg-[#0f172a] text-white text-[10px] font-bold px-4 py-2 rounded-lg border border-white/10 outline-none">
                               <option>Last 7 Days</option>
                               <option>Last 30 Days</option>
                            </select>
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
                                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                               <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                               <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} tickFormatter={(value) => `${value}K`} />
                               <Tooltip 
                                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff10', borderRadius: '16px', color: '#fff' }}
                                  itemStyle={{ fontSize: '12px' }}
                               />
                               <Area type="monotone" dataKey="views" stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" dot={{ r: 4, fill: '#DC2626', strokeWidth: 2, stroke: '#fff' }} />
                               <Area type="monotone" dataKey="posts" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 space-y-8 flex flex-col">
                      <div className="flex justify-between items-center">
                         <h3 className="text-lg font-bold text-white">Top Performing Articles</h3>
                         <button className="text-xs text-gray-500 hover:text-white border border-white/10 px-4 py-2 rounded-lg">View All</button>
                      </div>
                      <div className="space-y-6 flex-1">
                         {[
                            { id: 1, title: 'UP Police Constable Recruitment 2025', views: '125.4K', trend: '+18.2%', img: 'https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?w=100&h=100&fit=crop' },
                            { id: 2, title: 'RRB NTPC Graduate Level Recruitment 2025', views: '98.7K', trend: '+15.7%', img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop' },
                            { id: 3, title: 'SSC CGL Notification 2025 Out', views: '75.2K', trend: '+11.3%', img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=100&h=100&fit=crop' },
                            { id: 4, title: 'Bihar Deled Result 2025 Declared', views: '63.5K', trend: '+9.8%', img: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=100&h=100&fit=crop' },
                            { id: 5, title: 'IBPS PO Recruitment 2025', views: '58.9K', trend: '+7.6%', img: 'https://images.unsplash.com/photo-1603201667141-5a2d4c673378?w=100&h=100&fit=crop' },
                         ].map((item, i) => (
                            <div key={item.id} className="flex gap-4 items-center">
                               <div className="text-xs font-bold text-gray-500 w-4">{item.id}</div>
                               <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                                  <img src={item.img} alt="" className="w-full h-full object-cover" />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                     <div className="flex items-center gap-1 text-[10px] text-gray-500"><Eye size={12}/> {item.views} Views</div>
                                     <div className="text-[10px] text-green-500 flex items-center gap-1"><TrendingUp size={10}/> {item.trend}</div>
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                   <div className="lg:col-span-1 bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 space-y-8">
                      <h3 className="text-lg font-bold text-white">Visitors By Device</h3>
                      <div className="h-[250px] relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={[
                                 { name: 'Mobile', value: 65.2 },
                                 { name: 'Desktop', value: 28.7 },
                                 { name: 'Tablet', value: 6.1 },
                               ]} innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value">
                                  <Cell fill="#DC2626" />
                                  <Cell fill="#2563EB" />
                                  <Cell fill="#F59E0B" />
                               </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-2xl font-bold text-white">256.8K</p>
                            <p className="text-[10px] text-gray-500 uppercase">Visitors</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                         {[
                            { name: 'Mobile', value: '65.2%', color: 'bg-red-600' },
                            { name: 'Desktop', value: '28.7%', color: 'bg-blue-600' },
                            { name: 'Tablet', value: '6.1%', color: 'bg-yellow-500' },
                         ].map(item => (
                            <div key={item.name} className="flex justify-between items-center">
                               <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                  <span className="text-sm text-gray-400">{item.name}</span>
                               </div>
                               <span className="text-sm font-bold text-white">{item.value}</span>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="lg:col-span-1 bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 space-y-8">
                      <h3 className="text-lg font-bold text-white">Traffic Sources</h3>
                      <div className="h-[250px] relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={[
                                 { name: 'Direct', value: 40.5 },
                                 { name: 'Organic Search', value: 34.6 },
                                 { name: 'Social Media', value: 16.8 },
                                 { name: 'Referral', value: 8.1 },
                               ]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                  <Cell fill="#DC2626" />
                                  <Cell fill="#2563EB" />
                                  <Cell fill="#10B981" />
                                  <Cell fill="#8B5CF6" />
                               </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-2xl font-bold text-white">256.8K</p>
                            <p className="text-[10px] text-gray-500 uppercase">Visitors</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                         {[
                            { name: 'Direct', value: '40.5%', color: 'bg-red-600' },
                            { name: 'Organic Search', value: '34.6%', color: 'bg-blue-600' },
                            { name: 'Social Media', value: '16.8%', color: 'bg-green-500' },
                            { name: 'Referral', value: '8.1%', color: 'bg-purple-500' },
                         ].map(item => (
                            <div key={item.name} className="flex justify-between items-center">
                               <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                  <span className="text-sm text-gray-400">{item.name}</span>
                               </div>
                               <span className="text-sm font-bold text-white">{item.value}</span>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="lg:col-span-1 bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 space-y-8">
                      <div className="flex justify-between items-center">
                         <h3 className="text-lg font-bold text-white">Latest Activities</h3>
                         <button className="text-xs text-gray-500 hover:text-white">View All</button>
                      </div>
                      <div className="space-y-6">
                         {[
                            { id: 1, type: 'post', title: 'New article published', sub: 'UPSC IAS Notification 2025', time: '2 mins ago', icon: <FilePlus size={16} />, color: 'bg-blue-600' },
                            { id: 2, type: 'category', title: 'New category added', sub: 'Defence Jobs', time: '15 mins ago', icon: <Layers size={16} />, color: 'bg-yellow-600' },
                            { id: 3, type: 'banner', title: 'Banner updated', sub: 'Homepage Banner', time: '30 mins ago', icon: <ImageIcon size={16} />, color: 'bg-orange-600' },
                            { id: 4, type: 'ad', title: 'Ad banner added', sub: 'Sidebar Advertisement', time: '45 mins ago', icon: <Share2 size={16} />, color: 'bg-blue-500' },
                            { id: 5, type: 'update', title: 'Article updated', sub: 'SSC GD Constable Update', time: '1 hour ago', icon: <RefreshCw size={16} />, color: 'bg-red-600' },
                         ].map((item) => (
                            <div key={item.id} className="flex gap-4 group">
                               <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/20`}>{item.icon}</div>
                               <div>
                                  <p className="text-sm font-bold text-white leading-tight">{item.title}</p>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{item.sub}</p>
                                  <p className="text-[10px] text-gray-600 mt-1">{item.time}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="lg:col-span-1 bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 space-y-8">
                      <h3 className="text-lg font-bold text-white">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-4">
                         {[
                            { id: 'ai', label: 'AI Article', icon: <Sparkles size={20} />, color: 'text-purple-500' },
                            { id: 'posts', label: 'Add Post', icon: <Plus size={20} />, color: 'text-blue-500' },
                            { id: 'categories', label: 'Add Category', icon: <Layers size={20} />, color: 'text-yellow-500' },
                            { id: 'banner', label: 'Add Banner', icon: <ImageIcon size={20} />, color: 'text-green-500' },
                            { id: 'ads', label: 'Ad Manager', icon: <Share2 size={20} />, color: 'text-indigo-500' },
                            { id: 'media', label: 'Media Manager', icon: <Layers size={20} />, color: 'text-red-500' },
                            { id: 'seo', label: 'SEO Center', icon: <Search size={20} />, color: 'text-blue-400' },
                            { id: 'settings', label: 'Settings', icon: <Settings size={20} />, color: 'text-blue-600' },
                         ].map(item => (
                            <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsAdding(false); }} className="flex flex-col items-center justify-center p-4 bg-[#0f172a] rounded-2xl border border-white/5 hover:border-red-600/50 hover:bg-[#1e293b] transition-all group">
                               <div className={`mb-3 ${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
                               <span className="text-[10px] font-bold text-gray-400 group-hover:text-white">{item.label}</span>
                            </button>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'ai' && (
              <div className="max-w-4xl mx-auto animate-in zoom-in duration-700">
                  <div className="bg-[#1e293b]/80 backdrop-blur-xl p-12 rounded-[2.5rem] border border-white/10 space-y-12 relative overflow-hidden">
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
                      
                      <div className="flex items-center gap-6 mb-12">
                          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/20 text-white"><Sparkles size={32} /></div>
                          <div>
                              <h3 className="text-2xl font-bold text-white">AI Article Generator</h3>
                              <p className="text-xs text-gray-500 mt-1">Generate high-quality job notification articles instantly with AI.</p>
                          </div>
                      </div>

                      <div className="space-y-8">
                          <div className="space-y-3">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Article Title / Focus</label>
                              <div className="relative group">
                                  <input type="text" value={aiInput.title} onChange={e => setAiInput({...aiInput, title: e.target.value})} className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-6 py-5 text-white text-lg font-bold outline-none focus:border-blue-600 transition-all pr-12" placeholder="e.g. UPSC Civil Services Exam 2025 Notification..." />
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500"><Bot size={20}/></div>
                              </div>
                          </div>
                          
                          <div className="space-y-3">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Source URL (Optional)</label>
                              <input type="text" value={aiInput.sourceUrl} onChange={e => setAiInput({...aiInput, sourceUrl: e.target.value})} className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-6 py-4 text-white text-sm font-medium outline-none focus:border-blue-600 transition-all" placeholder="https://ssc.gov.in/notices/..." />
                          </div>

                          <button onClick={handleGenerateAI} disabled={isGenerating || !aiInput.title} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed">
                              {isGenerating ? <><RefreshCw size={20} className="animate-spin" /> Analyzing & Generating Content...</> : <><Bot size={20}/> Generate Full Article</>}
                          </button>
                      </div>

                      <div className="pt-8 border-t border-white/5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {[
                                  { label: 'SEO Optimized', desc: 'Auto-meta tags', icon: <Search className="text-green-500" /> },
                                  { label: 'Fact Checked', desc: 'Latest 2025 data', icon: <CheckCircle2 className="text-blue-500" /> },
                                  { label: 'Ready to Publish', desc: 'Professional tone', icon: <Save className="text-purple-500" /> },
                              ].map((item, i) => (
                                  <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                      <div className="flex items-center gap-3 mb-2">
                                          {item.icon}
                                          <span className="text-xs font-bold text-white">{item.label}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-500">{item.desc}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'posts' && !isAdding && (
             <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input type="text" placeholder="Search articles..." className="w-full bg-[#1e293b]/50 border border-white/10 rounded-2xl pl-16 pr-8 py-4 text-sm font-medium text-white outline-none focus:border-red-600 transition-all" />
                    </div>
                    <div className="flex gap-4">
                        <select className="bg-[#1e293b]/50 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-red-600 appearance-none min-w-[180px]">
                            <option>All Categories</option>
                            <option>Latest Jobs</option>
                            <option>Results</option>
                        </select>
                        <button onClick={() => { setIsAdding(true); setEditingPost(null); }} className="px-8 py-4 bg-red-600 text-white rounded-2xl text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-900/20"><Plus size={18}/> New Article</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {posts.map(p => (
                      <div key={p.id} className="bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 group hover:bg-[#1e293b]/70 transition-all flex flex-col h-full">
                         <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-white/5 text-gray-400 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider">{p.category}</span>
                                {p.isHot && <span className="px-3 py-1 bg-orange-600/10 text-orange-500 border border-orange-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Zap size={10} /> Hot</span>}
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => startEdit(p)} className="w-8 h-8 rounded-lg bg-white/5 text-blue-500 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={14}/></button>
                               <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg bg-white/5 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14}/></button>
                            </div>
                         </div>
                         <h4 className="text-lg font-bold text-white leading-snug mb-6 group-hover:text-red-500 transition-colors flex-1">{p.title}</h4>
                         <div className="flex justify-between items-center pt-6 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500"><Eye size={14}/> {p.views?.toLocaleString() || 0}</div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500"><Clock size={14}/> {p.date}</div>
                            </div>
                            <button onClick={() => startEdit(p)} className="text-xs font-bold text-red-500 hover:text-white flex items-center gap-1 group/btn">Edit <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" /></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {isAdding && (
             <div className="bg-[#1e293b]/90 backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 animate-in slide-in-from-bottom-8 max-w-5xl mx-auto shadow-2xl relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-8 border-b border-white/5 gap-6">
                   <div>
                      <h3 className="text-2xl font-bold text-white">{editingPost ? 'Edit Article' : 'Create New Article'}</h3>
                      <p className="text-xs text-gray-500 mt-1">Fill in the details to publish a new job notification.</p>
                   </div>
                   <div className="flex gap-4">
                       <button onClick={resetForm} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all">Cancel</button>
                       <button onClick={handleSubmit} className="px-10 py-3 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-900/20">Publish Article</button>
                   </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="md:col-span-2 space-y-3">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Article Title</label>
                          <input type="text" value={formData.title} onChange={e => setFormData({...formData, title:e.target.value})} className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-6 py-4 text-white text-lg font-bold outline-none focus:border-red-600 transition-all" placeholder="Enter recruitment title..." required />
                       </div>
                       
                       <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Category</label>
                          <select value={formData.category} onChange={e => setFormData({...formData, category:e.target.value})} className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-red-600 transition-all appearance-none">
                             <option value="jobs">Latest Jobs</option>
                             <option value="admit-card">Admit Card</option>
                             <option value="result">Results</option>
                             <option value="syllabus">Syllabus</option>
                             <option value="answer-key">Answer Key</option>
                          </select>
                       </div>
                       
                       <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Date</label>
                          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date:e.target.value})} className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-red-600 transition-all" />
                       </div>

                       <div className="md:col-span-2 space-y-3">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Article Content (Markdown)</label>
                          <textarea rows={12} value={formData.longArticle} onChange={e => setFormData({...formData, longArticle:e.target.value})} className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-6 py-6 text-white text-sm font-medium outline-none focus:border-red-600 transition-all leading-relaxed" placeholder="Enter full article content in Markdown format..." />
                       </div>
                       
                       <div className="md:col-span-2 bg-[#0f172a] p-8 rounded-2xl border border-white/5 space-y-6">
                           <h4 className="text-sm font-bold text-blue-500 flex items-center gap-3"><Search size={16}/> SEO & Metadata</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                   <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">SEO Meta Title</label>
                                   <input type="text" value={formData.seo?.title || ''} onChange={e => setFormData({...formData, seo: {...formData.seo, title: e.target.value}})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-600" />
                               </div>
                               <div className="space-y-2">
                                   <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Keywords (Comma Separated)</label>
                                   <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags:e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-600" placeholder="job, recruitment, 2025..." />
                               </div>
                           </div>
                       </div>
                   </div>
                   
                   <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setFormData({...formData, isHot: !formData.isHot})} className={`flex-1 py-4 rounded-xl text-xs font-bold transition-all border ${formData.isHot ? 'bg-orange-600 text-white border-orange-500' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                            {formData.isHot ? 'Hot Item: Enabled' : 'Mark as Hot'}
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, isNew: !formData.isNew})} className={`flex-1 py-4 rounded-xl text-xs font-bold transition-all border ${formData.isNew ? 'bg-green-600 text-white border-green-500' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                            {formData.isNew ? 'New Badge: Enabled' : 'Mark as New'}
                        </button>
                   </div>
                   
                   <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-900/20 flex items-center justify-center gap-4">
                      <Save size={20}/> {editingPost ? 'Update Database' : 'Publish to Portal'}
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
