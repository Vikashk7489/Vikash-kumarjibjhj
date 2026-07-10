/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  Trophy, 
  Ticket, 
  Key, 
  BookOpen, 
  Bell, 
  Home, 
  Phone, 
  Search, 
  Bookmark, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  Share2, 
  Printer, 
  Copy, 
  ChevronRight, 
  ArrowLeft,
  ChevronUp,
  Eye,
  MessageCircle,
  Send,
  Lock,
  PhoneCall,
  Info,
  Sparkles,
  Bot,
  LayoutDashboard,
  Plus
} from 'lucide-react';
import { allData, tickerItems, quickLinks, categoryMap, JobItem } from './data';
import AdminPanel from './components/AdminPanel';
import { rtdb, auth } from './firebase';
import { 
  ref,
  onValue,
  off,
  increment,
  set,
  push,
  update
} from 'firebase/database';
import ReactMarkdown from 'react-markdown';

type Page = 'home' | 'jobs' | 'results' | 'admitcard' | 'answerkey' | 'syllabus' | 'notifications' | 'contact' | 'bookmarks' | 'about' | 'privacy' | 'terms' | 'disclaimer' | 'detail' | 'admin';


export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentDetailId, setCurrentDetailId] = useState<number | string | null>(null);
  const [history, setHistory] = useState<Page[]>([]);
  const [livePosts, setLivePosts] = useState<JobItem[]>([]);
  const [liveTicker, setLiveTicker] = useState<string[]>([]);
  const [liveLinks, setLiveLinks] = useState<{name: string, url: string}[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') {
      setCurrentPage('admin');
    }
  }, []);
  
  // Fetch data from Realtime Database
  useEffect(() => {
    const postsRef = ref(rtdb, 'posts');
    const tickerRef = ref(rtdb, 'ticker');
    const linksRef = ref(rtdb, 'quickLinks');
    
    setPostsLoading(true);
    
    // Posts listener
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsList: JobItem[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        postsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLivePosts(postsList);
      } else {
        setLivePosts([]);
      }
      setPostsLoading(false);
    });

    // Ticker listener
    onValue(tickerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLiveTicker(Array.isArray(data) ? data : Object.values(data));
      } else {
        setLiveTicker([]);
      }
    });

    // Links listener
    onValue(linksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLiveLinks(Array.isArray(data) ? data : Object.values(data));
      } else {
        setLiveLinks([]);
      }
    });

    return () => {
      off(postsRef);
      off(tickerRef);
      off(linksRef);
    };
  }, []);

  // Use livePosts globally
  const currentAllData = useMemo(() => livePosts, [livePosts]);
  const [bookmarks, setBookmarks] = useState<(number | string)[]>(() => {
    const saved = localStorage.getItem('cs_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('cs_theme') === 'dark';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('cs_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cs_theme', theme);
  }, [isDarkMode]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show Toast
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Navigation functions
  const navigateTo = (page: Page) => {
    if (page !== currentPage) {
      setHistory((prev) => [...prev, currentPage]);
    }
    setCurrentPage(page);
    setCurrentDetailId(null);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToDetail = async (id: number | string) => {
    setHistory((prev) => [...prev, currentPage]);
    setCurrentDetailId(id);
    setCurrentPage('detail');
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Increment views in RTDB
    if (id) {
       const postRef = ref(rtdb, `posts/${id}/views`);
       set(postRef, increment(1)).catch(err => console.error("Increment views failed:", err));
    }
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((prevH) => prevH.slice(0, -1));
      setCurrentPage(prev);
      setCurrentDetailId(null);
    } else {
      navigateTo('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleBookmark = (id: number | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarks((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        triggerToast('बुकमार्क हटाया गया');
        return prev.filter(b => b !== id);
      } else {
        triggerToast('बुकमार्क जोड़ा गया ✓');
        return [...prev, id];
      }
    });
  };

  const shareWhatsApp = (title: string) => {
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`, '_blank');
  };

  const shareTelegram = (title: string) => {
    const url = window.location.href;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => triggerToast('लिंक कॉपी हो गया ✓'));
  };

  // Search Logic
  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const query = searchQuery.toLowerCase();
    return currentAllData.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query)) ||
      item.category.toLowerCase().includes(query)
    );
  }, [searchQuery, currentAllData]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {currentPage === 'admin' ? (
        <div className="flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen">
          <AdminPanel onBack={() => navigateTo('home')} />
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="bg-red-primary text-white py-3 px-4 sticky top-0 z-[1000] shadow-md w-full">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button className="md:hidden p-1" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="text-center flex-1 md:text-left">
            <h1 className="text-xl md:text-2xl font-extrabold m-0 leading-tight tracking-tight">CareerSetu</h1>
            <p className="text-[9px] md:text-[10px] font-semibold opacity-90 tracking-wider">EDUCATIONAL JOB PORTAL 2025-26</p>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:opacity-80 transition-opacity" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-1.5 hover:opacity-80 transition-opacity" onClick={() => setIsSearchOpen(true)}>
              <Search size={20} />
            </button>
            <button className="p-1.5 hover:opacity-80 transition-opacity relative" onClick={() => navigateTo('bookmarks')}>
              <Bookmark size={20} />
              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {bookmarks.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-dark-blue text-white overflow-x-auto whitespace-nowrap scrollbar-none sticky top-[52px] md:top-[60px] z-[999] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex">
          {[
            { id: 'home', icon: <Home size={14} />, label: 'Home' },
            { id: 'jobs', icon: <Briefcase size={14} />, label: 'Latest Jobs' },
            { id: 'results', icon: <Trophy size={14} />, label: 'Results' },
            { id: 'admitcard', icon: <Ticket size={14} />, label: 'Admit Card' },
            { id: 'answerkey', icon: <Key size={14} />, label: 'Answer Key' },
            { id: 'syllabus', icon: <BookOpen size={14} />, label: 'Syllabus' },
            { id: 'notifications', icon: <Bell size={14} />, label: 'Notifications' },
            { id: 'contact', icon: <Phone size={14} />, label: 'Contact' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id as Page)}
              className={`py-3 px-4 text-[11px] md:text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border-r border-white/10 last:border-none ${currentPage === item.id ? 'bg-red-primary/30' : 'hover:bg-red-primary/20'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Breaking News Ticker */}
      <div className="bg-ticker-bg border-b border-border-color h-8 overflow-hidden flex items-center relative">
        <div className="bg-red-primary text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest z-10 animate-blink h-full flex items-center shrink-0">
          ⚡ BREAKING
        </div>
        <div className="flex-1 relative overflow-hidden h-full flex items-center">
          <div className="flex animate-ticker whitespace-nowrap">
            {(liveTicker.length > 0 ? liveTicker : tickerItems).concat(liveTicker.length > 0 ? liveTicker : tickerItems).map((item, idx) => (
              <span key={idx} className="text-xs text-[var(--text-primary)] px-8 font-medium hover:text-red-primary cursor-pointer transition-colors flex items-center">
                <span className="bg-red-primary text-white text-[8px] px-1 rounded mr-1.5 font-bold">NEW</span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className={`flex-1 max-w-7xl mx-auto w-full px-4 py-4 md:py-6 grid grid-cols-1 ${currentPage === 'detail' ? '' : 'lg:grid-cols-[1fr_320px]'} gap-6`}>
        
        <div className="content-area">
          {postsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
               <div className="w-12 h-12 border-4 border-red-primary border-t-transparent rounded-full animate-spin"></div>
               <p className="text-sm font-black uppercase text-text-secondary animate-pulse">Syncing with Realtime Database...</p>
            </div>
          ) : (
            <>
              {currentPage === 'home' && (
                <>
                  {/* Hero Grid */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                {[
                  { id: 'jobs', icon: <Briefcase />, label: 'Jobs', color: 'from-red-600 to-red-800' },
                  { id: 'admitcard', icon: <Ticket />, label: 'Admit Card', color: 'from-orange-500 to-orange-700' },
                  { id: 'answerkey', icon: <Key />, label: 'Ans Key', color: 'from-pink-500 to-pink-700' },
                  { id: 'results', icon: <Trophy />, label: 'Results', color: 'from-lime-600 to-lime-800' },
                  { id: 'syllabus', icon: <BookOpen />, label: 'Syllabus', color: 'from-blue-500 to-blue-700' },
                  { id: 'notifications', icon: <Bell />, label: 'Notif', color: 'from-red-900 to-red-950' },
                ].map(btn => (
                  <button 
                    key={btn.id}
                    onClick={() => navigateTo(btn.id as Page)}
                    className={`bg-gradient-to-br ${btn.color} text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all hover:-translate-y-1`}
                  >
                    <span className="text-xl md:text-2xl">{btn.icon}</span>
                    <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-tight">{btn.label}</span>
                  </button>
                ))}
              </div>

              {/* Join Buttons (Large) */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <a 
                  href="https://whatsapp.com/channel/0029Vb86tg3D38CMUPve8U0a" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white p-3 rounded flex items-center justify-center gap-2 shadow-sm hover:brightness-105 transition-all font-black text-xs uppercase"
                >
                  <MessageCircle size={18} /> WhatsApp
                </a>
                <a 
                  href="https://t.me/CareerSetu76" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#0088CC] text-white p-3 rounded flex items-center justify-center gap-2 shadow-sm hover:brightness-105 transition-all font-black text-xs uppercase"
                >
                  <Send size={18} /> Telegram
                </a>
              </div>

              {/* Multi-Column Grid of Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {(Object.keys(categoryMap) as Array<keyof typeof categoryMap>).map((catKey) => (
                  <SectionCard 
                    key={catKey}
                    categoryKey={catKey}
                    allData={currentAllData}
                    onNavigateTo={() => navigateTo(catKey as Page)}
                    onDetailNavigate={navigateToDetail}
                  />
                ))}
              </div>
            </>
          )}

          {currentPage === 'detail' && currentDetailId && (
            <ArticleDetail 
              id={currentDetailId} 
              allData={currentAllData}
              onBack={goBack}
              onNavigateDetail={navigateToDetail}
              toggleBookmark={toggleBookmark}
              isBookmarked={bookmarks.includes(currentDetailId)}
              shareWhatsApp={shareWhatsApp}
              shareTelegram={shareTelegram}
              copyLink={copyLink}
            />
          )}

          {(categoryMap[currentPage as keyof typeof categoryMap]) && (
            <CategoryPage 
              categoryKey={currentPage as keyof typeof categoryMap}
              allData={currentAllData}
              onNavigateDetail={navigateToDetail}
              onBack={() => navigateTo('home')}
              onToggleBookmark={toggleBookmark}
              isBookmarked={bookmarks.includes.bind(bookmarks)}
            />
          )}

          {currentPage === 'contact' && <ContactPage onBack={() => navigateTo('home')} />}
          {currentPage === 'bookmarks' && (
            <BookmarksPage 
              bookmarks={bookmarks}
              allData={currentAllData}
              onNavigateDetail={navigateToDetail}
              onBack={() => navigateTo('home')}
              onToggleBookmark={toggleBookmark}
            />
          )}

          {['about','privacy','terms','disclaimer'].includes(currentPage) && (
             <InfoPage type={currentPage} onBack={() => navigateTo('home')} />
          )}
          </>
        )}
        </div>

        {/* Sidebar */}
        {currentPage !== 'detail' && (
          <aside className="space-y-6">
            {/* Sticky Sidebar Ad unit */}
            <div className="sticky top-20 space-y-4">
               <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg">
                 <h4 className="text-xs font-bold uppercase mb-2">🚀 Free Job Alert</h4>
                 <p className="text-[10px] opacity-90 leading-relaxed mb-3">Get Latest Jobs, Results & Admit Card updates instantly on your mobile.</p>
                 <button onClick={() => window.open('https://t.me/CareerSetu76', '_blank')} className="w-full bg-white text-blue-600 py-2 rounded-lg text-[10px] font-black uppercase shadow-inner">Subscribe Telegram</button>
               </div>
            </div>
          </aside>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-dark-gray text-white pt-6 pb-4 mt-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 mb-6">
            {['f', '𝕏', '📷', '▶', '✈'].map((icon, idx) => (
              <button key={idx} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-primary transition-colors">
                {icon}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] mb-4 font-medium opacity-80 uppercase tracking-tighter">
            <button onClick={() => navigateTo('home')} className="hover:opacity-100">Home</button>
            <button onClick={() => navigateTo('contact')} className="hover:opacity-100">Contact</button>
            <button onClick={() => navigateTo('about')} className="hover:opacity-100">About</button>
            <button onClick={() => navigateTo('privacy')} className="hover:opacity-100">Privacy</button>
            <button onClick={() => navigateTo('terms')} className="hover:opacity-100">Terms</button>
            <button onClick={() => navigateTo('disclaimer')} className="hover:opacity-100">Disclaimer</button>
          </div>

          <div 
            className="pt-6 border-t border-white/10 text-[10px] opacity-60 cursor-default select-none"
            onClick={(e) => {
              // Secret way to access admin: Click copyright 5 times
              const clicks = parseInt(e.currentTarget.getAttribute('data-clicks') || '0') + 1;
              e.currentTarget.setAttribute('data-clicks', clicks.toString());
              if (clicks >= 5) {
                navigateTo('admin');
                e.currentTarget.setAttribute('data-clicks', '0');
              }
            }}
          >
            © 2025 CareerSetu. All Rights Reserved. | सरकारी नौकरी, रिजल्ट और एडमिट कार्ड की जानकारी
          </div>
        </div>
      </footer>

      {/* Overlays & Modals */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[1500] bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="h-full w-[75%] max-w-sm bg-dark-blue flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-red-primary/10">
              <div>
                <h2 className="text-white text-lg font-bold">CareerSetu</h2>
                <p className="text-white/60 text-[10px]">EDUCATIONAL JOB PORTAL</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {[
                { id: 'home', icon: <Home size={18} />, label: 'Home' },
                { id: 'jobs', icon: <Briefcase size={18} />, label: 'Latest Jobs' },
                { id: 'results', icon: <Trophy size={18} />, label: 'Results' },
                { id: 'admitcard', icon: <Ticket size={18} />, label: 'Admit Card' },
                { id: 'answerkey', icon: <Key size={18} />, label: 'Answer Key' },
                { id: 'syllabus', icon: <BookOpen size={18} />, label: 'Syllabus' },
                { id: 'notifications', icon: <Bell size={18} />, label: 'Notifications' },
                { id: 'bookmarks', icon: <Bookmark size={18} />, label: 'Bookmarks' },
                { id: 'contact', icon: <Phone size={18} />, label: 'Contact Us' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id as Page)}
                  className="w-full text-left p-4 text-white font-semibold flex items-center gap-3 hover:bg-red-primary/20 border-b border-white/5"
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/60 flex justify-center items-start pt-20 px-4" onClick={() => setIsSearchOpen(false)}>
          <div className="bg-[var(--card-bg)] w-full max-w-xl rounded-lg overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border-color flex items-center gap-3">
              <Search className="text-text-secondary" size={20} />
              <input 
                autoFocus
                type="text" 
                placeholder="नौकरी, रिजल्ट, एडमिट कार्ड खोजें..." 
                className="flex-1 bg-transparent border-none outline-none text-base text-[var(--text-primary)]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="text-text-secondary" onClick={() => setIsSearchOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
              {searchQuery.length < 2 ? (
                <div className="p-10 text-center text-text-secondary text-sm">
                  کم से कम 2 अक्षर टाइप करें...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-10 text-center text-text-secondary text-sm">
                  🔍 "{searchQuery}" के लिए कोई परिणाम नहीं मिला
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => navigateToDetail(item.id)}
                      className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                      <div className="text-blue-link font-medium text-sm line-clamp-1">{item.title}</div>
                      <div className="text-[10px] text-text-secondary mt-1">
                        {item.date} | {categoryMap[item.category].hindi}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {showScrollTop && (
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-10 h-10 rounded-full bg-red-primary text-white shadow-xl flex items-center justify-center hover:-translate-y-1 transition-all"
          >
            <ChevronUp size={24} />
          </button>
        )}
        <a 
          href="https://whatsapp.com/channel/0029Vb86tg3D38CMUPve8U0a" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
          title="Join WhatsApp"
        >
          <MessageCircle size={20} />
        </a>
        <a 
          href="https://t.me/CareerSetu76" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-10 h-10 bg-[#0088CC] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
          title="Join Telegram"
        >
          <Send size={20} />
        </a>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-2xl z-[3000] animate-in slide-in-from-bottom-5 fade-in duration-300">
          {toast}
        </div>
      )}
        </>
      )}
    </div>
  );
}

// Helper Components
function SectionCard({ categoryKey, allData, onNavigateTo, onDetailNavigate }: any) {
  const cat = categoryMap[categoryKey as keyof typeof categoryMap];
  const items = allData.filter((d: any) => d.category === categoryKey).slice(0, 15);
  
  return (
    <div className="bg-white border border-gray-400 overflow-hidden shadow-sm flex flex-col">
      <div className="bg-[#7b001c] text-white px-4 py-2 text-center border-b border-gray-400">
         <h2 className="font-black uppercase text-sm md:text-base tracking-tight">{cat.label}</h2>
      </div>
      <ul className="flex-1 py-1">
         {items.map(item => (
           <ItemRow 
            key={item.id} 
            item={item} 
            onClick={() => onDetailNavigate(item.id)} 
           />
         ))}
      </ul>
      <div className="p-3 text-center bg-gray-50 border-t border-gray-200">
         <button 
           onClick={onNavigateTo} 
           className="bg-blue-600 text-white px-8 py-1.5 rounded-full font-black uppercase text-[11px] shadow-sm hover:brightness-105 transition-all"
         >
           View More
         </button>
      </div>
    </div>
  );
}

function ItemRow({ item, onClick }: any) {
  return (
    <li 
      onClick={onClick}
      className="py-1 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors list-inside list-disc text-blue-700 marker:text-black font-medium leading-tight"
    >
      <span className="text-[12px] md:text-[13px] font-bold hover:underline">
        {item.title} {item.totalPosts && <span className="text-black">({item.totalPosts} Posts)</span>} {item.isNew && <span className="text-red-primary font-black animate-pulse italic text-[9px] ml-1 shrink-0 whitespace-nowrap">NEW</span>}
      </span>
    </li>
  );
}

function SidebarWidget({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-400 overflow-hidden shadow-sm">
      <div className="bg-[#000080] text-white px-4 py-2 font-black text-[11px] uppercase tracking-wider text-center border-b border-gray-400">
        {title}
      </div>
      <div className="p-1">
        {children}
      </div>
    </div>
  );
}

function AIChat({ context }: { context: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `User question: ${userMessage}\n\nContext of the job post:\n${context}`,
          systemPrompt: "You are 'CareerSetu AI', a helpful assistant for job seekers in India. Answer questions strictly based on the provided job context. Be concise and professional."
        })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.text || 'Sorry, I could not process that.' }]);
    } catch (err) {
      console.error('AI error:', err);
      setMessages(prev => [...prev, { role: 'ai', text: 'Error: Could not connect to AI service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2 font-black text-xs uppercase z-50 border-2 border-white"
      >
        <Sparkles size={20} className="animate-pulse" />
        Ask AI Assistant
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white border-2 border-blue-900 shadow-2xl rounded-lg overflow-hidden z-50 flex flex-col max-h-[500px]">
      <div className="bg-blue-900 text-white p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={18} />
          <span className="font-black text-xs uppercase tracking-tight">CareerSetu AI Assistant</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-[300px]">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <Sparkles size={32} className="mx-auto text-blue-200" />
            <p className="text-[10px] font-bold text-gray-500 uppercase">Ask me anything about this job post!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 text-xs font-medium leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-900 text-white rounded-l-lg rounded-tr-lg' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-r-lg rounded-tl-lg shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-r-lg rounded-tl-lg shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-900 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-blue-900 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-blue-900 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 border border-gray-300 px-3 py-2 text-xs font-bold focus:border-blue-900 outline-none"
        />
        <button 
          type="submit"
          disabled={isLoading}
          className="bg-blue-900 text-white p-2 hover:brightness-110 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function ArticleDetail({ id, allData, onBack, onNavigateDetail, toggleBookmark, isBookmarked, shareWhatsApp, shareTelegram, copyLink }: any) {
  const item = allData.find((d: any) => d.id === id);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState({ name: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const commentsRef = ref(rtdb, `comments/${id}`);
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, val]: any) => ({
          id: key,
          ...val
        }));
        list.sort((a, b) => b.timestamp - a.timestamp);
        setComments(list);
      } else {
        setComments([]);
      }
    });
    return () => off(commentsRef);
  }, [id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.name.trim() || !newComment.message.trim()) return;
    
    setIsSubmitting(true);
    try {
      const commentsRef = ref(rtdb, `comments/${id}`);
      await push(commentsRef, {
        name: newComment.name,
        message: newComment.message,
        timestamp: Date.now()
      });
      setNewComment({ name: '', message: '' });
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return <div>Post not found</div>;
  
  const cat = categoryMap[item.category as keyof typeof categoryMap];
  const related = allData.filter((d: any) => d.category === item.category && d.id !== id).slice(0, 5);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex justify-between items-center bg-white border border-gray-300 p-2 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-red-primary transition-colors">
          <ArrowLeft size={14} /> वापस जाएं (BACK)
        </button>
        <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary" title="Print Article">
              <Printer size={16} />
            </button>
            <button 
                onClick={() => toggleBookmark(item.id)}
                className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${isBookmarked ? 'text-red-primary' : 'text-text-secondary'}`}
                title="Save Article"
            >
                <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
        </div>
      </div>

      <article className="bg-white overflow-hidden border border-gray-400">
        {/* Sarkari Style Header Banner */}
        <div className="bg-[#000080] text-white p-4 text-center border-b-2 border-orange-500">
           <h1 className="text-lg md:text-2xl font-black uppercase tracking-tight leading-tight mb-1">
             {item.title}
           </h1>
             <div className="flex justify-center flex-wrap gap-2 text-[9px] font-bold opacity-90">
               <span className="bg-yellow-400 text-red-900 px-2 py-0.5 rounded shadow-sm">Updated : {new Date(item.date).toLocaleDateString()}</span>
               <span className="bg-white/20 px-2 py-0.5 rounded uppercase">{cat.label}</span>
               <span className="bg-white/20 px-2 py-0.5 rounded uppercase">👁️ {item.views.toLocaleString()} Views</span>
               <button 
                 onClick={() => {
                   if (navigator.share) {
                     navigator.share({
                       title: item.title,
                       text: `Check out ${item.title} on CareerSetu`,
                       url: window.location.href,
                     }).catch(console.error);
                   } else {
                     navigator.clipboard.writeText(window.location.href);
                     alert('Link copied to clipboard!');
                   }
                 }}
                 className="bg-white/20 px-2 py-0.5 rounded uppercase flex items-center gap-1 hover:bg-white/30 transition-colors"
               >
                 <Share2 size={10} /> Share
               </button>
             </div>
        </div>

        <div className="p-0 space-y-0">
            {/* Date Header Only */}
            <div className="p-4 border-b border-gray-400 bg-white">
              <div className="flex items-center gap-2">
                 <span className="text-[11px] font-black text-red-primary uppercase">Post Date / Update:</span>
                 <span className="text-[11px] font-bold text-gray-600">{item.date}</span>
                 <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase flex items-center">
                   <Info size={10} className="mr-1" /> CareerSetu Update
                 </span>
              </div>
              <h1 className="mt-2 text-xl md:text-2xl font-black text-blue-900 leading-tight">
                {item.title}
              </h1>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-0">
                {/* Short Description */}
                <div className="text-center p-4 bg-white text-black">
                   <p className="text-[13px] leading-relaxed font-bold">
                     <span className="text-blue-700 font-black tracking-tight underline">{item.title}</span> Has Released A <span className="text-red-primary font-black uppercase">Notification</span> On Its <span className="font-black text-black">Official Website</span> For The {item.title}. This Recruitment Is For <span className="font-black text-black">{item.totalPosts || '1189'} Posts</span>. The <span className="font-black text-black">CareerSetu Application Form</span> Has Started On <span className="font-black text-black">01 June 2026</span>, And Candidates Can Apply Until <span className="font-black text-black">21 June 2026</span>. Candidates Must Check The Complete Details For <span className="font-black text-black">{item.title}</span> Given Below.
                   </p>
                </div>

                {/* Social Join Links */}
                <div className="bg-[#fffcfc] border-b border-gray-400 p-2 py-4 text-center">
                    <p className="text-red-primary font-black text-xs uppercase tracking-tighter mb-4">Download CareerSetu App Now</p>
                    <div className="flex justify-center gap-2">
                       <a href="https://whatsapp.com/channel/0029Vb86tg3D38CMUPve8U0a" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white px-4 py-1.5 rounded font-black text-[13px] uppercase">WhatsApp</a>
                       <a href="https://t.me/CareerSetu76" target="_blank" rel="noopener noreferrer" className="bg-[#0088CC] text-white px-4 py-1.5 rounded font-black text-[13px] uppercase">Telegram</a>
                    </div>
                </div>

                {/* Important Dates & Application Fee Table */}
                <div className="overflow-hidden border-b border-gray-400">
                  <div className="bg-[#fffcfc] border-b border-gray-400 p-2 text-center">
                    <p className="text-red-primary font-black text-sm uppercase leading-tight">{item.title}</p>
                    <p className="text-[#006400] font-black text-[12px] uppercase leading-tight mt-0.5">{item.title} : Short Details</p>
                    <p className="text-blue-900 font-extrabold text-[10px] uppercase">CareerSetu.Com</p>
                  </div>
                  <div className="bg-[#000080] grid grid-cols-2 divide-x divide-white text-white text-center py-2 font-black uppercase text-[13px] border-b border-gray-400">
                    <div>Important Dates</div>
                    <div>Application Fee</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-400 bg-white text-black">
                    <div className="p-0">
                      <table className="w-full text-[12px]">
                        <tbody className="divide-y divide-gray-200">
                          {(item.importantDates || [
                            { label: 'Online Apply Start', value: '07 May 2026' },
                            { label: 'Online Apply Last', value: '31 May 2026' },
                            { label: 'Last Date For Fee', value: '31 May 2026' },
                            { label: 'Exam Date', value: 'Notify Later' }
                          ]).map((row: any, i: number) => (
                            <tr key={i}>
                              <td className="py-2 px-3 font-bold border-r border-gray-300 w-[60%]">• {row.label}</td>
                              <td className="py-2 px-3 font-black text-red-primary">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-0">
                      <table className="w-full text-[12px]">
                        <tbody className="divide-y divide-gray-200">
                          {(item.applicationFee || [
                            { label: 'General / OBC', value: '₹ 100/-' },
                            { label: 'SC / ST / PH', value: '₹ 100/-' },
                            { label: 'All Female', value: '₹ 100/-' },
                            { label: 'Payment Mode', value: 'Online/Offline' }
                          ]).map((row: any, i: number) => (
                            <tr key={i}>
                              <td className="py-2 px-3 font-bold border-r border-gray-300 w-[50%]">• {row.label}</td>
                              <td className="py-2 px-3 font-black text-black">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Age Limit & Total Post Section */}
                <div className="overflow-hidden border-b border-gray-400 text-black">
                  <div className="grid grid-cols-[1fr_auto]">
                    <div className="bg-[#006400] text-white px-4 py-2 font-black uppercase text-sm flex items-center border-r border-gray-400">
                      {item.title} : Age Limits As On 01/08/2025
                    </div>
                    <div className="bg-[#ff4500] text-white px-8 py-2 font-black uppercase text-sm flex items-center justify-center min-w-[150px]">
                      Total Post
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] divide-y md:divide-y-0 md:divide-x divide-gray-400">
                    <div className="p-4 text-[12px] bg-white">
                        <ul className="space-y-1.5 font-bold list-none">
                          <li className="flex items-start gap-2">
                             <span className="mt-1 min-w-[6px] h-[6px] bg-black rounded-full" />
                             <span>Minimum Age : <span className="font-black">20-22 Years (Post Wise)</span></span>
                          </li>
                          <li className="flex items-start gap-2">
                             <span className="mt-1 min-w-[6px] h-[6px] bg-black rounded-full" />
                             <span>Maximum Age : <span className="font-black">37 Years (UR Male)</span></span>
                          </li>
                          <li className="flex items-start gap-2">
                             <span className="mt-1 min-w-[6px] h-[6px] bg-black rounded-full" />
                             <span>Maximum Age : <span className="font-black">40 Year (Female UR / BC)</span></span>
                          </li>
                          <li className="flex items-start gap-2">
                             <span className="mt-1 min-w-[6px] h-[6px] bg-black rounded-full" />
                             <span className="text-red-primary italic">CareerSetu provides age relaxation as per rules.</span>
                          </li>
                        </ul>
                    </div>
                    <div className="bg-white min-w-[150px] flex flex-col items-center justify-center p-6">
                        <span className="text-3xl font-black text-black tracking-tighter">
                          {item.totalPosts || '1189'}
                        </span>
                        <span className="text-lg font-black uppercase mt-1">Posts</span>
                    </div>
                  </div>
                </div>

                {/* Vacancy Details Section */}
                <div className="overflow-hidden border-b border-gray-400 text-black">
                   <div className="bg-[#000080] text-white text-center py-2 font-black uppercase text-sm">
                      {item.title} : Vacancy Details
                   </div>
                   <table className="w-full text-[13px] border-collapse bg-white">
                      <thead>
                        <tr className="font-black uppercase border-b border-gray-400">
                           <th className="py-2 px-4 border-r border-gray-400 text-center">Post Name</th>
                           <th className="py-2 px-4 text-center">No. Of Post</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold text-center">
                         {(item.vacancyDetails || [
                           { category: 'BPSC 72nd Combined Mains', posts: '1033' },
                           { category: 'Child Development Project Officer', posts: '20' },
                           { category: 'Sub-Divisional Protection Officer', posts: '101' }
                         ]).map((v: any, i: number) => (
                           <tr key={i} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                              <td className="py-3 px-4 border-r border-gray-400 text-left pl-6">{v.category}</td>
                              <td className="py-3 px-4">{v.posts}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                <div className="bg-[#fffcfc] border-b border-gray-400 p-2 py-4 text-center">
                    <p className="text-red-primary font-black text-xs uppercase tracking-tighter mb-4">Download CareerSetu App Now</p>
                    <div className="flex justify-center gap-2">
                       <a href="https://whatsapp.com/channel/0029Vb86tg3D38CMUPve8U0a" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white px-4 py-1.5 rounded font-black text-[13px] uppercase">WhatsApp</a>
                       <a href="https://t.me/CareerSetu76" target="_blank" rel="noopener noreferrer" className="bg-[#0088CC] text-white px-4 py-1.5 rounded font-black text-[13px] uppercase">Telegram</a>
                    </div>
                </div>

                {/* Content rendering - How To Fill Style */}
                {(item.longArticle || item.content) && (
                  <div className="overflow-hidden border-b border-gray-400">
                    <div className="bg-[#000080] text-white text-center py-2 font-black uppercase text-sm border-b border-gray-400">
                      How To Fill {item.title} Online Form 2026
                    </div>
                    <div className="p-4 bg-white text-black text-sm font-medium leading-relaxed">
                      {item.longArticle ? (
                        <div className="markdown-body">
                           <ReactMarkdown>{item.longArticle}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{item.content}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mode of Selection Section */}
                <div className="overflow-hidden border-b border-gray-400 text-black">
                   <div className="bg-[#000080] text-white text-center py-1.5 font-black uppercase text-xs">
                      {item.title} : Mode Of Selection
                   </div>
                   <div className="p-4 bg-white">
                      <ul className="space-y-1 font-bold text-[13px]">
                        <li>• Written Exam (Pre & Mains)</li>
                        <li>• Interview (If Required)</li>
                        <li>• Document Verification</li>
                      </ul>
                   </div>
                </div>

                {/* Social Join Links Table Style */}
                <table className="w-full border-b border-gray-400 bg-white text-[13px]">
                   <tbody className="divide-y divide-gray-300">
                      <tr>
                         <td className="py-2 px-4 border-r border-gray-300 text-red-primary font-black text-center w-1/2">Join Our WhatsApp Channel</td>
                         <td className="py-2 px-4 text-blue-800 font-black text-center"><a href="https://whatsapp.com/channel/0029Vb86tg3D38CMUPve8U0a" target="_blank" rel="noopener noreferrer" className="hover:underline">Follow Now</a></td>
                      </tr>
                      <tr>
                         <td className="py-2 px-4 border-r border-gray-300 text-red-primary font-black text-center w-1/2">Join Our Telegram Channel</td>
                         <td className="py-2 px-4 text-blue-800 font-black text-center"><a href="https://t.me/CareerSetu76" target="_blank" rel="noopener noreferrer" className="hover:underline">Follow Now</a></td>
                      </tr>
                   </tbody>
                </table>

                {/* Important Links Section */}
                <div id="useful-links" className="overflow-hidden border-b border-gray-400 text-black">
                  <div className="bg-white text-[#ff0000] text-center py-2.5 font-black uppercase text-base border-b border-gray-400">
                    SOME USEFUL IMPORTANT LINKS
                  </div>
                  <table className="w-full text-sm border-collapse bg-[#feffcd]">
                    <tbody className="font-extrabold uppercase">
                        {(item.importantLinks && item.importantLinks.length > 0 ? item.importantLinks : [
                          { label: 'Apply Online Link', url: '#' },
                          { label: 'Download Official Notification', url: '#' },
                          { label: 'Official Website', url: '#' }
                        ]).map((link: any, i: number) => (
                          <tr key={i} className="border-b border-gray-400 last:border-0 hover:bg-black/5 transition-colors">
                            <td className="py-3 px-6 text-left border-r border-gray-400 w-1/2 font-bold text-black leading-tight bg-[#ffff00]/30">
                              {link.label}
                            </td>
                            <td className="py-3 px-6 text-center">
                              {link.url.includes(',') ? (
                                <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
                                  {link.url.split(',').map((part: string, idx: number) => {
                                    const [label, url] = part.includes('|') ? part.split('|') : [`Link-${idx+1}`, part];
                                    return (
                                      <React.Fragment key={idx}>
                                         <a href={url.trim()} target="_blank" rel="noopener noreferrer" className="text-[#0000ff] hover:underline font-black">{label.trim()}</a>
                                         {idx < link.url.split(',').length - 1 && <span className="text-black font-black">|</span>}
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              ) : (
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[#0000ff] hover:underline font-black">Click Here</a>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* FAQ Selection Section */}
                {(item.faq && item.faq.length > 0) && (
                  <div className="overflow-hidden border-b border-gray-400 text-black">
                    <div className="bg-[#000080] text-white text-center py-2 font-black uppercase text-sm border-b border-gray-400">
                      {item.title} : Frequently Asked Questions
                    </div>
                    <div className="divide-y divide-gray-200 bg-white">
                      {item.faq.map((f: any, idx: number) => (
                        <div key={idx} className="p-4 space-y-1">
                          <p className="text-[13px] font-black flex gap-2">
                             <span className="text-blue-700 shrink-0">Question :</span> <span>{f.question}</span>
                          </p>
                          <p className="text-[13px] font-black flex gap-2">
                             <span className="text-red-primary shrink-0">Answer :</span> <span className="font-medium text-gray-700">{f.answer}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Featured Image at Bottom (Like Screenshot) */}
                {item.imageUrl && (
                  <div className="border-b border-gray-400 p-4 bg-white">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-auto object-contain border border-gray-200"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Bottom Apps Disclaimer */}
                <div className="bg-[#fffcfc] border-b border-gray-400 p-2 py-4 text-center">
                    <p className="text-red-primary font-black text-xs uppercase tracking-tighter mb-4">Download CareerSetu App Now</p>
                    <div className="flex justify-center gap-2">
                       <a href="https://whatsapp.com/channel/0029Vb86tg3D38CMUPve8U0a" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white px-4 py-1.5 rounded font-black text-[13px] uppercase">WhatsApp</a>
                       <a href="https://t.me/CareerSetu76" target="_blank" rel="noopener noreferrer" className="bg-[#0088CC] text-white px-4 py-1.5 rounded font-black text-[13px] uppercase">Telegram</a>
                    </div>
                </div>

                {/* Disclaimer Text */}
                <div className="p-4 bg-white border-b border-gray-400 text-[10px] text-justify leading-relaxed font-bold text-gray-600">
                  <span className="text-black font-black uppercase">Disclaimer:</span> Information Regarding Any Exam Form, Result/Marks, Answer Key Are Published Just For The Immediate Information Of The Examinees And Should Not Be Considered As A Legal Document. While Every Effort Has Been Made To Ensure The Accuracy Of The Information Provided Which Includes Official Links, We Are Not Responsible For Any Inadvertent Errors That May Appear In The Information Results/Marks, Answer Key Or Time Table/Admission Dates. Additionally, We Disclaim Any Liability For Any Loss Or Damage Caused By Any Shortcomings, Defects, Or Inaccuracies In The Information Available On This Website. In Case Of Any Correction Is Needed Feel Free To Contact Us Through Contact Us Page.
                </div>
            </div>

            {/* Discussion / Comment Section */}
            <div className="overflow-hidden border-t border-gray-400 bg-white">
              <div className="bg-[#000080] text-white text-center py-2 font-black uppercase text-sm border-b border-gray-400">
                Public Discussion Portal (सवाल-जवाब)
              </div>
              
              <div className="p-4 space-y-6">
                  {/* Comment Form */}
                  <form onSubmit={handlePostComment} className="space-y-4 bg-gray-50 p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-500">Your Name (नाम)</label>
                          <input 
                            type="text" 
                            required
                            value={newComment.name}
                            onChange={e => setNewComment({...newComment, name: e.target.value})}
                            className="w-full border border-gray-300 px-3 py-2 text-xs font-bold focus:border-red-primary outline-none transition-all"
                            placeholder="Enter name..."
                          />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500">Message (संदेश/सवाल)</label>
                        <textarea 
                          required
                          rows={3}
                          value={newComment.message}
                          onChange={e => setNewComment({...newComment, message: e.target.value})}
                          className="w-full border border-gray-300 px-3 py-2 text-xs font-bold focus:border-red-primary outline-none transition-all"
                          placeholder="Type your question or feedback here..."
                        />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-red-primary text-white px-6 py-2 text-xs font-black uppercase shadow-md flex items-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      {isSubmitting ? 'Posting...' : <><Send size={14} /> Post Comment</>}
                    </button>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase text-blue-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                        <MessageCircle size={14} /> Recent Discussion ({comments.length})
                    </h4>
                    
                    {comments.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-4">No discussions yet. Be the first to ask a question!</p>
                    ) : (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                          {comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="w-8 h-8 rounded-full bg-red-primary/10 text-red-primary flex items-center justify-center shrink-0 font-black text-xs uppercase border border-red-primary/20">
                                    {comment.name.charAt(0)}
                                </div>
                                <div className="flex-1 bg-white border border-gray-200 p-3 shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-[11px] font-black text-blue-900 uppercase">{comment.name}</span>
                                      <span className="text-[9px] font-bold text-gray-400">{new Date(comment.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-700 leading-relaxed">{comment.message}</p>
                                </div>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>
              </div>
            </div>

            {/* Social Share Bottom */}
            <div className="pt-8 border-t border-border-color flex flex-wrap justify-center gap-4">
               <button onClick={copyLink} className="flex items-center gap-2 text-[11px] font-bold text-text-secondary hover:text-red-primary border border-border-color px-4 py-2 rounded-full transition-all">
                 <Copy size={14} /> Copy Post Link
               </button>
               <button onClick={() => shareWhatsApp(item.title)} className="flex items-center gap-2 text-[11px] font-bold text-[#25D366] border border-[#25D366]/30 px-4 py-2 rounded-full hover:bg-[#25D366]/5 transition-all">
                 <Share2 size={14} /> WhatsApp Share
               </button>
            </div>
        </div>
      </article>

      {/* Related Posts */}
      <div className="space-y-4 pt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            🔗 RELATED POSTS / संबंधित पोस्ट
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {related.map((post: any) => (
              <div 
                key={post.id} 
                onClick={() => onNavigateDetail(post.id)}
                className="bg-[var(--card-bg)] border border-border-color rounded-lg p-3 hover:shadow-md cursor-pointer transition-all flex items-start gap-3 group"
              >
                <div className="w-1.5 h-full bg-red-primary rounded-full shrink-0 group-hover:scale-y-125 transition-transform" />
                <div>
                  <h4 className="text-[12px] font-bold text-blue-link group-hover:text-red-primary line-clamp-2 leading-tight transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-[10px] text-text-secondary mt-1 font-medium">{post.date}</p>
                </div>
              </div>
            ))}
          </div>
      </div>

      <AIChat context={JSON.stringify({ title: item.title, description: item.content, dates: item.importantDates, fee: item.applicationFee })} />
    </div>
  );
}

function CategoryPage({ categoryKey, allData, onNavigateDetail, onBack }: any) {
  const cat = categoryMap[categoryKey];
  const items = allData.filter((d: any) => d.category === categoryKey);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#7b001c] text-white p-4 border border-gray-400 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-3">
             {cat.icon} {cat.label} - <span className="opacity-90">{cat.hindi}</span>
          </h2>
          <p className="text-xs opacity-80 mt-1 uppercase tracking-widest font-semibold text-yellow-400">Total Posts: {items.length} | Latest Updates 2025-26</p>
        </div>
        <button onClick={onBack} className="bg-white text-red-900 px-4 py-1.5 rounded font-black text-xs uppercase shadow-sm hover:brightness-105 transition-all flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Home
        </button>
      </div>

      <div className="bg-white border border-gray-400 overflow-hidden shadow-md">
        <ul className="py-2">
          {items.map(item => (
            <ItemRow 
              key={item.id} 
              item={item} 
              onClick={() => onNavigateDetail(item.id)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function BookmarksPage({ bookmarks, allData, onNavigateDetail, onBack }: any) {
  const items = allData.filter((d: any) => bookmarks.includes(d.id));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="bg-[#7b001c] text-white p-4 border border-gray-400 flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-3 text-yellow-400">
            🔖 मेरे बुकमार्क्स (Saved Items)
          </h2>
          <p className="text-xs opacity-80 mt-1 uppercase tracking-widest font-semibold">Count: {items.length}</p>
        </div>
        <button onClick={onBack} className="bg-white text-red-900 px-4 py-1.5 rounded font-black text-xs uppercase shadow-sm">
          Home
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-gray-400 py-16 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400">
            <Bookmark size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold">अभी कोई बुकमार्क नहीं है</h3>
            <p className="text-sm text-gray-500">किसी भी पोस्ट पर 📌 क्लिक करके यहाँ सेव करें।</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-400 overflow-hidden shadow-md">
          <ul className="py-2">
            {items.map(item => (
              <ItemRow 
                key={item.id} 
                item={item} 
                onClick={() => onNavigateDetail(item.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ContactPage({ onBack }: any) {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
       <div className="bg-[#7b001c] text-white p-4 border border-gray-400 flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-3">
          📞 Contact Us - संपर्क करें
        </h2>
        <button onClick={onBack} className="bg-white text-red-900 px-4 py-1.5 rounded font-black text-xs uppercase shadow-sm">Back</button>
      </div>
      
      <div className="bg-[var(--card-bg)] border border-border-color rounded-lg p-6 md:p-8 shadow-md">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-2">हमसे संपर्क करें</h3>
            <p className="text-sm text-text-secondary">कोई सवाल या सुझाव है? नीचे फॉर्म भरें, हम जल्द ही जवाब देंगे।</p>
          </div>

          <form className="space-y-4" onSubmit={e => { e.preventDefault(); alert('संदेश भेजा गया!'); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-text-secondary tracking-widest">नाम (Name) *</label>
                <input required type="text" className="w-full bg-gray-50 dark:bg-gray-800 border border-border-color rounded px-3 py-2 text-sm focus:ring-2 ring-red-primary/20 outline-none transition-all" placeholder="अपना नाम दर्ज करें" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-text-secondary tracking-widest">ईमेल (Email) *</label>
                <input required type="email" className="w-full bg-gray-50 dark:bg-gray-800 border border-border-color rounded px-3 py-2 text-sm focus:ring-2 ring-red-primary/20 outline-none transition-all" placeholder="ईमेल पता" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-text-secondary tracking-widest">विषय (Subject) *</label>
              <input required type="text" className="w-full bg-gray-50 dark:bg-gray-800 border border-border-color rounded px-3 py-2 text-sm focus:ring-2 ring-red-primary/20 outline-none transition-all" placeholder="किस विषय में संपर्क करना चाहते हैं?" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-text-secondary tracking-widest">संदेश (Message) *</label>
              <textarea required rows={5} className="w-full bg-gray-50 dark:bg-gray-800 border border-border-color rounded px-3 py-2 text-sm focus:ring-2 ring-red-primary/20 outline-none transition-all resize-none" placeholder="अपना संदेश यहाँ लिखें..."></textarea>
            </div>
            <button type="submit" className="bg-red-primary text-white font-bold py-3 px-8 rounded shadow-lg hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-widest">
              📨 संदेश भेजें (Send Message)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function InfoPage({ type, onBack }: { type: string, onBack: () => void }) {
  const pages: any = {
    about: { 
      title: "About Us - हमारे बारे में", 
      icon: "ℹ️", 
      color: "from-blue-800 to-blue-600",
      body: (
        <div className="space-y-4">
          <p>CareerSetu भारत का एक प्रमुख शैक्षिक और करियर पोर्टल है जो सरकारी नौकरी, परीक्षा परिणाम, एडमिट कार्ड, आंसर की, सिलेबस और नोटिफिकेशन की जानकारी प्रदान करता है।</p>
          <p>हमारा लक्ष्य हर विद्यार्थी और जॉब सीकर को सही समय पर सही जानकारी देना है ताकि वे कोई भी अवसर न चूकें।</p>
          <h3 className="text-lg font-bold border-l-4 border-red-primary pl-3">हमारी विशेषताएं</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>ताज़ा सरकारी नौकरी अपडेट</li>
            <li>परीक्षा परिणाम जानकारी</li>
            <li>एडमिट कार्ड डाउनलोड लिंक</li>
            <li>आंसर की और सिलेबस</li>
            <li>नोटिफिकेशन अलर्ट</li>
          </ul>
        </div>
      )
    },
    privacy: { 
      title: "Privacy Policy - गोपनीयता नीति", 
      icon: "🔒", 
      color: "from-indigo-800 to-indigo-600",
      body: (
        <div className="space-y-4">
          <p>आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। CareerSetu आपकी व्यक्तिगत जानकारी को सुरक्षित रखता है।</p>
          <h3 className="text-lg font-bold border-l-4 border-red-primary pl-3">हम क्या जानकारी एकत्र करते हैं</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>ब्राउज़र कुकीज़</li>
            <li>पेज विज़िट डेटा</li>
            <li>न्यूज़लेटर सब्सक्रिप्शन ईमेल</li>
          </ul>
          <h3 className="text-lg font-bold border-l-4 border-red-primary pl-3">जानकारी का उपयोग</h3>
          <p>हम आपकी जानकारी का उपयोग केवल सेवा सुधार और अपडेट भेजने के लिए करते हैं।</p>
        </div>
      )
    },
    terms: { 
      title: "Terms & Conditions - नियम व शर्तें", 
      icon: "📋", 
      color: "from-slate-800 to-slate-600",
      body: (
        <div className="space-y-4">
          <p>CareerSetu का उपयोग करके आप हमारी नियम व शर्तों से सहमत होते हैं।</p>
          <h3 className="text-lg font-bold border-l-4 border-red-primary pl-3">उपयोग की शर्तें</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>सभी जानकारी केवल सूचनात्मक उद्देश्य के लिए है</li>
            <li>हम जानकारी की सटीकता की गारंटी नहीं देते</li>
            <li>कृपया आधिकारिक वेबसाइट से सत्यापित करें</li>
            <li>अनुचित उपयोग प्रतिबंधित है</li>
          </ul>
        </div>
      )
    },
    disclaimer: { 
      title: "Disclaimer - अस्वीकरण", 
      icon: "⚠️", 
      color: "from-amber-800 to-amber-600",
      body: (
        <div className="space-y-4">
          <p>CareerSetu किसी भी सरकारी संस्था की आधिकारिक वेबसाइट नहीं है।</p>
          <h3 className="text-lg font-bold border-l-4 border-red-primary pl-3">महत्वपूर्ण नोट</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>यह जानकारी केवल संदर्भ के लिए है</li>
            <li>सभी परीक्षा और भर्ती संबंधी जानकारी के लिए आधिकारिक वेबसाइट देखें</li>
            <li>हम किसी भी त्रुटि के लिए जिम्मेदार नहीं हैं</li>
          </ul>
        </div>
      )
    }
  };

  const pg = pages[type];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-[#7b001c] text-white p-4 border border-gray-400 flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-3">
          {pg.icon} {pg.title}
        </h2>
        <button onClick={onBack} className="bg-white text-red-900 px-4 py-1.5 rounded font-black text-xs uppercase shadow-sm">Back</button>
      </div>
      <div className="bg-[var(--card-bg)] border border-border-color rounded-lg p-6 md:p-10 shadow-md">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {pg.body}
        </div>
      </div>
    </div>
  );
}
