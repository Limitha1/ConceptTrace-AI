import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  User, 
  HelpCircle, 
  History, 
  AlertTriangle, 
  BookOpen, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronDown, 
  ChevronRight, 
  TrendingUp, 
  PieChart, 
  Clock, 
  Zap, 
  Target, 
  GraduationCap,
  Library
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isProgressActive = location.pathname.startsWith('/progress');
  const [progressExpanded, setProgressExpanded] = useState<boolean>(true);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Concept Library', path: '/concept-library', icon: Library },
    { name: 'Syllabus', path: '/syllabus', icon: GraduationCap },
    { name: 'Ask a Doubt', path: '/doubt', icon: HelpCircle },
    { name: 'Learning History', path: '/history', icon: History },
    { name: 'Weak Topics', path: '/weak-topics', icon: AlertTriangle },
    { name: 'Practice Questions', path: '/practice', icon: BookOpen },
  ];

  const progressSubmenu = [
    { name: 'Overview', tab: 'overview', icon: BarChart3 },
    { name: 'Learning Graphs', tab: 'graphs', icon: TrendingUp },
    { name: 'Subject Accuracy', tab: 'accuracy', icon: PieChart },
    { name: 'Weak Topics Report', tab: 'weak-topics', icon: Target },
    { name: 'Study Activity', tab: 'activity', icon: Clock },
  ];

  const handleSubmenuClick = (tab: string) => {
    navigate(`/progress?tab=${tab}`);
    onCloseMobile();
  };

  const handleLogout = async () => {
    onCloseMobile();
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 h-screen lg:h-[calc(100vh-61px)] w-64 bg-white border-r border-slate-200/80 z-50 lg:z-30 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {/* Mobile brand header (shown only when drawer is open on mobile) */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 lg:hidden">
            <span className="font-extrabold text-sm text-slate-800 tracking-tight">Navigation</span>
            <button
              type="button"
              onClick={onCloseMobile}
              className="text-slate-400 hover:text-slate-600 p-1 text-xs"
            >
              Close ✕
            </button>
          </div>

          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Learning Hub
          </div>

          {/* Primary Nav Links */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {/* Progress Report with Expandable Submenu */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setProgressExpanded(prev => !prev);
                if (!isProgressActive) navigate('/progress');
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isProgressActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className={`w-4 h-4 ${isProgressActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>Progress Report</span>
              </div>
              {progressExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Submenu Items */}
            {progressExpanded && (
              <div className="ml-5 pl-3 mt-1 space-y-1 border-l-2 border-indigo-100">
                {progressSubmenu.map((sub) => {
                  const SubIcon = sub.icon;
                  const currentParams = new URLSearchParams(location.search);
                  const isCurrentTab = isProgressActive && (currentParams.get('tab') === sub.tab || (!currentParams.get('tab') && sub.tab === 'overview'));

                  return (
                    <button
                      key={sub.tab}
                      type="button"
                      onClick={() => handleSubmenuClick(sub.tab)}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-left transition ${
                        isCurrentTab
                          ? 'bg-purple-100/70 text-purple-800 font-bold'
                          : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50'
                      }`}
                    >
                      <SubIcon className={`w-3.5 h-3.5 ${isCurrentTab ? 'text-purple-700' : 'text-slate-400'}`} />
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Account
            </div>
            <NavLink
              to="/settings"
              onClick={onCloseMobile}
              className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left mt-0.5"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Motivational Learning Streak Card */}
        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-sky-50 border border-indigo-100/80">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs mb-1">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Target Mastery</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
            Understand every mistake with verified step-by-step reasoning.
          </p>
          <button
            type="button"
            onClick={() => {
              navigate('/doubt');
              onCloseMobile();
            }}
            className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-sm transition"
          >
            Ask a Doubt Now
          </button>
        </div>
      </aside>
    </>
  );
};
