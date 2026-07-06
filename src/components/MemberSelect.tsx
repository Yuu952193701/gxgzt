import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { Check, Search, User, X } from 'lucide-react';

interface MemberSelectProps {
  selectedEmails: string[];
  onChange: (emails: string[]) => void;
  disabled?: boolean;
}

export const MemberSelect: React.FC<MemberSelectProps> = ({
  selectedEmails,
  onChange,
  disabled = false
}) => {
  const { users } = useAppState();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleUser = (email: string) => {
    if (disabled) return;
    const lowerEmail = email.toLowerCase();
    const isSelected = selectedEmails.some(e => e.toLowerCase() === lowerEmail);
    if (isSelected) {
      onChange(selectedEmails.filter(e => e.toLowerCase() !== lowerEmail));
    } else {
      onChange([...selectedEmails, email]);
    }
  };

  const handleRemoveUser = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedEmails.filter(e => e.toLowerCase() !== email.toLowerCase()));
  };

  return (
    <div className="relative w-full">
      {/* Label and selected badges */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`min-h-[38px] w-full bg-slate-50 border ${
          disabled ? 'bg-slate-100 cursor-not-allowed border-slate-200' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 cursor-pointer'
        } rounded-lg p-1.5 flex flex-wrap gap-1.5 items-center justify-between transition-colors`}
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1">
          {selectedEmails.length === 0 ? (
            <span className="text-xs text-slate-400 pl-1">未指派归属负责人</span>
          ) : (
            selectedEmails.map(email => {
              const u = users.find(user => user.email.toLowerCase() === email.toLowerCase()) || {
                name: email,
                email,
                avatarColor: 'bg-slate-400'
              };
              return (
                <span 
                  key={email}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold animate-fade-in"
                >
                  <span className={`w-2 h-2 rounded-full ${u.avatarColor}`} />
                  <span>{u.name}</span>
                  {!disabled && (
                    <button 
                      type="button" 
                      onClick={(e) => handleRemoveUser(email, e)}
                      className="hover:bg-blue-100 text-blue-500 rounded p-0.5 shrink-0"
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              );
            })
          )}
        </div>
        {!disabled && (
          <span className="text-[10px] text-slate-400 pr-1.5">▼</span>
        )}
      </div>

      {/* Popover list */}
      {isOpen && !disabled && (
        <>
          {/* Transparent click-away mask */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute left-0 mt-1 w-full max-h-60 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 flex flex-col animate-fade-in">
            {/* Search header */}
            <div className="p-2 border-b border-slate-100 flex items-center space-x-1 bg-slate-50">
              <Search size={12} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="搜索成员姓名或账号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 py-0.5"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button 
                  type="button" 
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600 rounded p-0.5"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Members List */}
            <div className="overflow-y-auto flex-1 py-1 max-h-44">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  没有找到匹配的成员
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedEmails.some(e => e.toLowerCase() === user.email.toLowerCase());
                  return (
                    <div
                      key={user.email}
                      onClick={() => handleToggleUser(user.email)}
                      className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase ${user.avatarColor} shrink-0`}>
                          {user.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={14} className="text-blue-600 shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick selectors footer */}
            <div className="p-1.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
              <span>已选中 {selectedEmails.length} 人</span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  清空
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allEmails = users.map(u => u.email);
                    onChange(allEmails);
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  全选
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
