import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppContext';
import { MEMBERS } from '../types';
import { 
  User, 
  Users as UsersIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Key, 
  History, 
  Activity, 
  ShieldCheck, 
  Lock, 
  Code, 
  Users2, 
  FileText,
  UserCheck
} from 'lucide-react';

export const Users: React.FC = () => {
  const {
    currentUser,
    users,
    updateUserProfile,
    addUser,
    deleteUser,
    updateUser
  } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'team'>('profile');

  // Profile setup states
  const currentMember = users.find(u => u.email.toLowerCase() === currentUser.toLowerCase()) || { name: '', email: currentUser, avatarColor: 'bg-blue-600' };
  const [profileName, setProfileName] = useState(currentMember.name);
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Team management states
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [teamMessage, setTeamMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [deleteConfirmationEmail, setDeleteConfirmationEmail] = useState<string | null>(null);

  // Sync state if currentUser/users changes
  useEffect(() => {
    if (currentMember) {
      setProfileName(currentMember.name);
    }
  }, [currentUser, users]);

  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!profileName.trim()) {
      setProfileMessage({ type: 'error', text: '显示名称/姓名不能为空！' });
      return;
    }

    if (profilePassword) {
      if (profilePassword !== profileConfirmPassword) {
        setProfileMessage({ type: 'error', text: '两次输入的新密码不一致！' });
        return;
      }
      if (profilePassword.length < 3) {
        setProfileMessage({ type: 'error', text: '新密码长度至少需要3位字符！' });
        return;
      }
    }

    const res = updateUserProfile(profileName, profilePassword || undefined);
    if (res.success) {
      setProfileMessage({ type: 'success', text: '您的个人账号设置已成功更新！' });
      setProfilePassword('');
      setProfileConfirmPassword('');
    } else {
      setProfileMessage({ type: 'error', text: res.message });
    }
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamMessage(null);

    if (!newMemberEmail.trim() || !newMemberName.trim()) {
      setTeamMessage({ type: 'error', text: '登录账号与姓名不能为空！' });
      return;
    }

    const res = addUser(newMemberEmail, newMemberName, newMemberPassword || undefined);
    if (res.success) {
      setTeamMessage({ type: 'success', text: '团队成员添加成功！' });
      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberPassword('');
    } else {
      setTeamMessage({ type: 'error', text: res.message });
    }
  };

  const handleDeleteMember = (email: string) => {
    setTeamMessage(null);
    setDeleteConfirmationEmail(email);
  };

  const confirmDeleteMember = () => {
    if (!deleteConfirmationEmail) return;
    const res = deleteUser(deleteConfirmationEmail);
    if (res.success) {
      setTeamMessage({ type: 'success', text: `团队成员【${deleteConfirmationEmail}】已成功删除！` });
    } else {
      setTeamMessage({ type: 'error', text: res.message });
    }
    setDeleteConfirmationEmail(null);
  };

  const handleUpdateMemberName = (email: string) => {
    setTeamMessage(null);
    if (!editingUserName.trim()) {
      setTeamMessage({ type: 'error', text: '姓名不能为空！' });
      return;
    }
    const res = updateUser(email, editingUserName);
    if (res.success) {
      setTeamMessage({ type: 'success', text: '团队成员信息更新成功！' });
      setEditingUserId(null);
      setEditingUserName('');
    } else {
      setTeamMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
          <span>👥 成员与团队中心</span>
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          管理您在协同工作台中的账号安全，查看并维护团队成员协作名录。
        </p>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Side Navigation List */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-3xs p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 border-b border-slate-50">
              常规功能
            </p>
            
            <button
              onClick={() => setActiveSubTab('profile')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                activeSubTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User size={14} />
              <span>我的账号</span>
            </button>

            <button
              onClick={() => setActiveSubTab('team')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                activeSubTab === 'team'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UsersIcon size={14} />
              <span>成员与团队</span>
            </button>


          </div>
        </div>

        {/* Right Side Content Pane */}
        <div className="md:col-span-3">
          {activeSubTab === 'profile' ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden animate-fade-in space-y-6 p-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <User size={16} className="text-blue-500" />
                  <span>👤 我的个人账号基本信息及安全设置</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  查看或修改您在工作台中的昵称、密码和头像配置。
                </p>
              </div>

              {profileMessage && (
                <div className={`rounded-lg p-3 text-xs flex items-center space-x-2 ${
                  profileMessage.type === 'success' 
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                    : 'bg-rose-50 border border-rose-100 text-rose-700'
                }`}>
                  <span>{profileMessage.type === 'success' ? '✅' : '⚠️'}</span>
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfileSubmit} className="space-y-5">
                {/* Avatar Display Card */}
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white uppercase ${currentMember.avatarColor || 'bg-blue-600'}`}>
                    {currentMember.name.charAt(0) || currentUser.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">头像管理 (系统自动生成)</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">V3 版本将支持自定义本地头像上传。当前头像提取自您的姓名首字母缩写。</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      登录账号 (只读)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentMember.email}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      显示名称 / 姓名 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="请输入显示昵称"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs font-bold text-slate-800 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      新密码 (留空表示不修改)
                    </label>
                    <input
                      type="password"
                      placeholder="修改密码请输入新密码"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs font-mono text-slate-800 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      确认新密码
                    </label>
                    <input
                      type="password"
                      placeholder="再次确认新密码"
                      value={profileConfirmPassword}
                      onChange={(e) => setProfileConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs font-mono text-slate-800 transition-colors"
                    />
                  </div>
                </div>

                {/* Login Status card */}
                <div className="bg-slate-50/50 rounded-lg border border-slate-150 p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <UserCheck size={14} className="text-emerald-500" />
                    <span className="font-bold text-slate-700">登录状态</span>
                  </div>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    ● 已安全授权登入
                  </span>
                </div>

                <div className="pt-2 flex justify-start">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-colors"
                  >
                    保存个人账号设置
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden animate-fade-in p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <UsersIcon size={16} className="text-blue-500" />
                  <span>👥 成员与团队协作管理</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  列出系统所有的协同成员。支持创建、移出成员或快捷更新成员的姓名。
                </p>
              </div>

              {teamMessage && (
                <div className={`rounded-lg p-3 text-xs flex items-center space-x-2 ${
                  teamMessage.type === 'success' 
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                    : 'bg-rose-50 border border-rose-100 text-rose-700'
                }`}>
                  <span>{teamMessage.type === 'success' ? '✅' : '⚠️'}</span>
                  <span>{teamMessage.text}</span>
                </div>
              )}

              {/* Form to Add New Team Member */}
              <form onSubmit={handleAddMemberSubmit} className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <Plus size={14} className="text-blue-500" />
                  <span>快速邀请/新增团队成员</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      成员登录账号 (必填)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="如: admin 或 zhangsan"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      成员姓名 / 昵称 (必填)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="如：李四"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      初始登录密码 (默认 123)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="默认 123"
                        value={newMemberPassword}
                        onChange={(e) => setNewMemberPassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs text-slate-800 font-mono"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-colors shrink-0 font-sans"
                      >
                        新增成员
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Members List Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 font-sans flex items-center space-x-1.5">
                  <span>成员名录 (当前: {users.length} 人)</span>
                </h4>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="min-w-full divide-y divide-slate-100 text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">成员</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">登录账号</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">管理操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => {
                        const isSelf = user.email.toLowerCase() === currentUser.toLowerCase();
                        const isEditing = editingUserId === user.email;

                        return (
                          <tr key={user.email} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase ${user.avatarColor} shrink-0`}>
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  {isEditing ? (
                                    <div className="flex items-center space-x-1.5">
                                      <input
                                        type="text"
                                        value={editingUserName}
                                        onChange={(e) => setEditingUserName(e.target.value)}
                                        className="px-2 py-1 border border-slate-300 rounded text-xs font-bold focus:outline-none focus:border-blue-500"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateMemberName(user.email)}
                                        className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700"
                                      >
                                        保存
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingUserId(null);
                                          setEditingUserName('');
                                        }}
                                        className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-300"
                                      >
                                        取消
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-xs font-bold text-slate-800">{user.name}</span>
                                      {isSelf && (
                                        <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1 py-0.2 rounded font-semibold">
                                          当前登录
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-slate-500">{user.email}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {!isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUserId(user.email);
                                      setEditingUserName(user.name);
                                    }}
                                    className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-bold transition-all"
                                  >
                                    修改名称
                                  </button>
                                )}
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMember(user.email)}
                                    className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded text-xs font-bold transition-all flex items-center space-x-0.5"
                                  >
                                    <Trash2 size={11} />
                                    <span>一键删除</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {deleteConfirmationEmail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start space-x-3 text-left">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0 mt-0.5">
                <Trash2 size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">确认彻底删除该成员？</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  您确定要彻底注销成员账号 <span className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-rose-600 text-[11px]">{deleteConfirmationEmail}</span> 吗？
                  删除后，此账号的数据将与其解绑。此操作不可撤销。
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmationEmail(null)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteMember}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
