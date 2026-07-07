import React from 'react';
import { LayoutDashboard, Compass, Layers, Sliders, Anchor, BookOpen, ClipboardList, Building2, User, Users, ChevronDown, Database } from 'lucide-react';
import { useAppState } from '../context/AppContext';
import { MEMBERS } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { 
    workspaceMode, 
    setWorkspaceMode, 
    currentUser, 
    setCurrentUser 
  } = useAppState();

  const menuItems = [
    { id: 'dashboard', label: '首页', icon: LayoutDashboard },
    { id: 'checklist', label: '清单', icon: ClipboardList },
    { id: 'pre', label: '前置工作 (需求)', icon: Compass },
    { id: 'post', label: '后置工作 (采购合同)', icon: Layers },
    { id: 'post-service', label: '后置工作 (服务合同)', icon: Layers },
    { id: 'bid', label: '标书', icon: Anchor },
    { id: 'suppliers', label: '供应商', icon: Building2 },
    { id: 'knowledge', label: '资料库', icon: BookOpen },
    { id: 'settings', label: '设置', icon: Sliders },
    { id: 'user', label: '成员管理', icon: Users },
    { id: 'datacenter', label: '数据中心', icon: Database },
  ];

  const currentMember = MEMBERS.find(m => m.email === currentUser) || MEMBERS[0];

  return (
    <aside className="w-full md:w-56 bg-[#0F172A] text-slate-300 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 flex-shrink-0 animate-fade-in">
      
      {/* Brand logo card */}
      <div className="p-4 flex-shrink-0 border-b border-slate-800/50 flex items-center justify-between">
        <h1 className="text-white font-bold tracking-tight text-base flex items-center space-x-2">
          <span>工作台</span>
          <span className="text-blue-400 font-bold text-[10px] bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-900">V2.0</span>
        </h1>
      </div>

      {/* V2 Workspace Mode Selector Panel */}
      <div className="p-3 border-b border-slate-800/40">
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-850">
          <button
            onClick={() => setWorkspaceMode('personal')}
            className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              workspaceMode === 'personal'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <User size={12} />
            <span>个人</span>
          </button>
          <button
            onClick={() => setWorkspaceMode('shared')}
            className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
              workspaceMode === 'shared'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users size={12} />
            <span>共享</span>
          </button>
        </div>
      </div>

      {/* Navigation options list */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer text-left ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <IconComponent size={14} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer metadata details */}
      <div className="p-4 border-t border-slate-800 bg-[#0B0F19] text-[10px] text-slate-500 font-mono flex flex-col space-y-1">
        <p className="flex items-center space-x-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-400">多成员协同系统 (Multi-Member)</span>
        </p>
        <p>数据自动持久化至 LocalStorage</p>
        <p>© 2026 采购中心协同版</p>
      </div>

    </aside>
  );
};
