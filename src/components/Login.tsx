import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { Shield, Key, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginUser, registerUser } = useAppState();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setEmail('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Common validation
    if (!email.trim() || !password.trim()) {
      setErrorMsg('请填写必填字段！');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setErrorMsg('请填写成员姓名！');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('两次输入的密码不一致！');
        return;
      }
      if (password.length < 3) {
        setErrorMsg('密码长度不能少于3个字符！');
        return;
      }

      // Action
      const res = registerUser(email, name, password);
      if (res.success) {
        setSuccessMsg('注册并登录成功！正在进入工作台...');
      } else {
        setErrorMsg(res.message);
      }
    } else {
      // Action
      const res = loginUser(email, password);
      if (res.success) {
        setSuccessMsg('登录成功！正在进入工作台...');
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Modern Logo */}
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-600 text-white shadow-md mb-4 ring-4 ring-blue-50">
          <Shield size={28} className="animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          工作台
        </h2>
        <p className="mt-2 text-xs text-slate-500 font-mono">
          V2.0 多人协作采购与商务管理系统
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200/80 rounded-xl sm:px-10">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800">
              {isRegister ? '注册账号' : '账号登录'}
            </h3>
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isRegister ? '已经有账号？去登录' : '没有账号？去注册'}
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs text-rose-700 flex items-start space-x-2 animate-shake">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-700 flex items-start space-x-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Account field */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                登录账号 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={14} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="如: admin 或 zhangsan"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Nickname field for Registration */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  成员姓名 (真实姓名/昵称) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="如: 淤哉"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {/* Password field */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                登录密码 <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key size={14} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="请输入您的登录密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium font-mono"
                />
              </div>
            </div>

            {/* Confirm Password field for Registration */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  确认登录密码 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key size={14} />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="请再次输入您的密码以做确认"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium font-mono"
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                <span>{isRegister ? '注册并登录进入' : '立即登录系统'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* Prompt accounts info */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-[10px] text-slate-400 leading-relaxed text-center">
              💡 系统预装了演示账户，支持极速直接登录，密码均为：<b>123</b> <br />
              可使用任意演示成员账号：<b>yuzai952193701@gmail.com</b> 或 <b>liming@procurement.com</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
