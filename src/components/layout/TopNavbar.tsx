import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Menu, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudyTime } from '../../context/StudyTimeContext';
import { 
  getStoredNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getStoredQueries 
} from '../../lib/storage';
import type { NotificationItem, QueryRecord } from '../../types';

interface TopNavbarProps {
  onToggleMobileSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleMobileSidebar }) => {
  const { user, educationProfile, logout } = useAuth();
  const { isIdle, currentSessionSeconds } = useStudyTime();
  const navigate = useNavigate();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ queries: QueryRecord[]; topics: string[] }>({ queries: [], topics: [] });
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(getStoredNotifications());
  }, [notificationsOpen]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search filtering
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults({ queries: [], topics: [] });
      return;
    }

    const queries = getStoredQueries();
    const matchedQueries = queries.filter(q => 
      q.questionText.toLowerCase().includes(val.toLowerCase()) ||
      q.subject.toLowerCase().includes(val.toLowerCase()) ||
      (q.topic && q.topic.toLowerCase().includes(val.toLowerCase()))
    ).slice(0, 4);

    const allTopics = [
      "Newton's Second Law & Momentum",
      'VSEPR Theory & Molecular Geometry',
      'Limits & Derivatives',
      'Carnot Heat Engine & Efficiency',
      'Parabola & Ellipse Standard Equations',
      'Coulomb’s Law & Gauss’s Theorem'
    ];
    const matchedTopics = allTopics.filter(t => t.toLowerCase().includes(val.toLowerCase())).slice(0, 3);

    setSearchResults({ queries: matchedQueries, topics: matchedTopics });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const formatStudyTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-7 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-700 bg-clip-text text-transparent">
                  ConceptTrace<span className="text-indigo-600"> AI</span>
                </span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block tracking-wide">
                Learn • Improve • Succeed
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search questions, topics, formulas..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Search Dropdown Results */}
          {isSearchFocused && (searchQuery.trim().length > 0) && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              {searchResults.queries.length === 0 && searchResults.topics.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  No matching doubts or syllabus topics found for "{searchQuery}".
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.topics.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                        Syllabus Topics
                      </div>
                      {searchResults.topics.map((t, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setIsSearchFocused(false);
                            navigate(`/practice?topic=${encodeURIComponent(t)}`);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between transition"
                        >
                          <span>{t}</span>
                          <span className="text-[10px] text-indigo-500 font-normal">Practice &rarr;</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.queries.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                        Solved Questions & History
                      </div>
                      {searchResults.queries.map((q) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            setIsSearchFocused(false);
                            navigate('/history');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-50 flex items-start gap-2 transition"
                        >
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">
                            {q.subject}
                          </span>
                          <span className="truncate flex-1">{q.questionText}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side controls: Live study timer badge, Notifications, Avatar & Dropdown */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Active study tracker chip */}
          <div 
            title={isIdle ? 'Study timer paused due to inactivity' : 'Active study time tracking in progress'}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
              isIdle 
                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isIdle ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{isIdle ? 'Idle' : formatStudyTimer(currentSessionSeconds)}</span>
          </div>


          {/* Notifications Popover */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(prev => !prev)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 transition"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        markAllNotificationsAsRead();
                        setNotifications(getStoredNotifications());
                      }}
                      className="text-xs text-indigo-600 hover:underline font-semibold"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          setNotifications(getStoredNotifications());
                          if (n.linkUrl) {
                            navigate(n.linkUrl);
                            setNotificationsOpen(false);
                          }
                        }}
                        className={`py-2.5 px-2 rounded-xl cursor-pointer transition ${
                          n.read ? 'hover:bg-slate-50 opacity-75' : 'bg-indigo-50/50 hover:bg-indigo-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800">{n.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-2xl hover:bg-slate-100/80 transition border border-transparent hover:border-slate-200"
              aria-label="User profile options"
            >
              <div className="relative">
                <img
                  src={user?.avatarUrl && !user.avatarUrl.includes('student_avatar') ? user.avatarUrl : '/assets/robot_avatar.jpg'}
                  alt={user?.fullName || 'Student'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
                  onError={(e) => {
                    // Fallback to SVG placeholder if image missing
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.fullName || 'Student'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Class {educationProfile?.classLevel || '11'} • {educationProfile?.board || 'CBSE'}
                </p>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-purple-50 text-purple-700">
                      {educationProfile?.board || 'CBSE'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-indigo-50 text-indigo-700">
                      Class {educationProfile?.classLevel || '11'}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
