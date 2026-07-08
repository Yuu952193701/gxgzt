import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { ItemDetailsModal } from './ItemDetailsModal';
import { AlertCircle, ArrowUpRight, CheckSquare, Layers, Clock, AlertOctagon, HelpCircle, FileText, Landmark, ShieldAlert, BadgeCheck } from 'lucide-react';
import { MEMBERS } from '../types';

export const Dashboard: React.FC = () => {
  const { 
    projects, 
    contracts, 
    bids, 
    preWorkflow, 
    postWorkflow, 
    postServiceWorkflow,
    bidWorkflow, 
    workflowTemplates,
    workspaceMode,
    currentUser,
    users,
    getProjectStatusName,
    getContractStatusName,
    getSettlementStatusName,
    getBidStatusName
  } = useAppState();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'project' | 'contract' | 'bid' | null>(null);

  // V2: Filter datasets based on active workspace mode
  const filteredProjects = projects.filter(p => {
    if (workspaceMode === 'personal') {
      return p.owners?.includes(currentUser);
    }
    return true;
  });

  const filteredContracts = contracts.filter(c => {
    if (workspaceMode === 'personal') {
      return c.owners?.includes(currentUser);
    }
    return true;
  });

  const filteredBids = bids.filter(b => {
    if (workspaceMode === 'personal') {
      return b.owners?.includes(currentUser);
    }
    return true;
  });

  // Track yellow (Requires immediate personal actions)
  interface ActionableItem {
    id: string;
    parentContractId?: string; // only for settlement batches
    type: 'project' | 'contract' | 'settlement' | 'bid';
    code?: string;
    name: string;
    status: string;
    ship: string;
    remark?: string;
    isUrgent: boolean;
    dueDate?: string;
    owners?: string[];
    templateId?: string;
    isService?: boolean;
  }
  const actionableItems: ActionableItem[] = [];

  // Helper to resolve color of a project status
  const getProjectStatusColor = (statusName: string, templateId?: string) => {
    const tpl = (templateId ? workflowTemplates.find(t => t.id === templateId) : null) || 
                workflowTemplates.find(t => t.module === 'pre' && t.isDefault) ||
                workflowTemplates.find(t => t.module === 'pre');
    const steps = tpl?.steps || preWorkflow;
    const step = steps.find(s => s.id === statusName || s.name === statusName);
    return step ? step.color : 'green';
  };

  // Helper to resolve color of a contract status
  const getContractStatusColor = (statusName: string, templateId?: string, isService?: boolean) => {
    const moduleType = isService ? 'service' : 'purchase';
    const tpl = (templateId ? workflowTemplates.find(t => t.id === templateId) : null) || 
                workflowTemplates.find(t => t.module === moduleType && t.isDefault) ||
                workflowTemplates.find(t => t.module === moduleType);
    const steps = tpl?.steps || (isService ? postServiceWorkflow : postWorkflow);
    const step = steps.find(s => s.id === statusName || s.name === statusName);
    return step ? step.color : 'green';
  };

  // Helper to resolve color of a bid status
  const getBidStatusColor = (statusName: string, templateId?: string) => {
    const tpl = (templateId ? workflowTemplates.find(t => t.id === templateId) : null) || 
                workflowTemplates.find(t => t.module === 'bid' && t.isDefault) ||
                workflowTemplates.find(t => t.module === 'bid');
    const steps = tpl?.steps || bidWorkflow;
    const step = steps.find(s => s.id === statusName || s.name === statusName);
    return step ? step.color : 'green';
  };

  // Derive counts - all items in the filtered lists under current workspace view
  const totalProjects = filteredProjects.length;
  const totalContracts = filteredContracts.length;

  // Let's count statuses by color across all activities
  let yellowCount = 0;
  let greenCount = 0;
  let blueCount = 0;
  let redCount = 0;

  // 1. Scan Projects
  filteredProjects.forEach(p => {
    const col = getProjectStatusColor(p.status, p.templateId);
    if (col === 'yellow') {
      yellowCount++;
      actionableItems.push({
        id: p.id,
        type: 'project',
        code: p.code,
        name: p.name,
        status: p.status,
        ship: p.ship,
        remark: p.remark,
        isUrgent: p.isUrgent,
        dueDate: p.dueDate,
        owners: p.owners,
        templateId: p.templateId
      });
    } else if (col === 'green') {
      greenCount++;
    } else if (col === 'blue') {
      blueCount++;
    } else if (col === 'red') {
      redCount++;
    }
  });

  // 2. Scan Contracts and Settlement Batches
  filteredContracts.forEach(c => {
    if (c.isMultiSettlement && c.settlements && c.settlements.length > 0) {
      // For multi-settlement contract, we evaluate each active settlement batch status
      c.settlements.forEach(s => {
        const col = getContractStatusColor(s.status, c.templateId, c.contractType === 'service');
        if (col === 'yellow') {
          yellowCount++;
          actionableItems.push({
            id: s.id,
            parentContractId: c.id,
            type: 'settlement',
            code: c.code,
            name: `${c.name} (${s.name})`,
            status: s.status,
            ship: s.ship || c.ship,
            remark: s.remark || c.remark,
            isUrgent: c.isUrgent,
            dueDate: s.dueDate || c.dueDate,
            owners: c.owners,
            templateId: c.templateId,
            isService: c.contractType === 'service'
          });
        } else if (col === 'green') {
          greenCount++;
        } else if (col === 'blue') {
          blueCount++;
        } else if (col === 'red') {
          redCount++;
        }
      });
    } else {
      // Normal contract
      const col = getContractStatusColor(c.status, c.templateId, c.contractType === 'service');
      if (col === 'yellow') {
        yellowCount++;
        actionableItems.push({
          id: c.id,
          type: 'contract',
          code: c.code,
          name: c.name,
          status: c.status,
          ship: c.ship,
          remark: c.remark,
          isUrgent: c.isUrgent,
          dueDate: c.dueDate,
          owners: c.owners,
          templateId: c.templateId,
          isService: c.contractType === 'service'
        });
      } else if (col === 'green') {
        greenCount++; // Count green as greenCount
      } else if (col === 'blue') {
        blueCount++;
      } else if (col === 'red') {
        redCount++;
      }
    }
  });

  // 3. Scan Bids (Bidding Projects)
  filteredBids.forEach(b => {
    const col = getBidStatusColor(b.status, b.templateId);
    if (col === 'yellow') {
      yellowCount++;
      actionableItems.push({
        id: b.id,
        type: 'bid',
        code: '标书',
        name: b.name,
        status: b.status,
        ship: b.ship,
        remark: b.remark,
        isUrgent: b.isUrgent,
        dueDate: b.dueDate,
        owners: b.owners,
        templateId: b.templateId
      });
    } else if (col === 'green') {
      greenCount++;
    } else if (col === 'blue') {
      blueCount++;
    } else if (col === 'red') {
      redCount++;
    }
  });

  // Sort actionable items: 1. Urgent items first; 2. Earliest due date first; 3. Creation/name sorting
  actionableItems.sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleOpenItem = (id: string, type: 'project' | 'contract' | 'settlement' | 'bid') => {
    if (type === 'settlement') {
      // Find the item to get its parentContractId
      const item = actionableItems.find(x => x.id === id);
      if (item && item.parentContractId) {
        setSelectedItemId(item.parentContractId);
        setSelectedItemType('contract');
      }
    } else {
      setSelectedItemId(id);
      setSelectedItemType(type);
    }
  };

  const activeUserObj = users.find(u => u.email.toLowerCase() === currentUser.toLowerCase()) || MEMBERS[0];

  const getItemStatusName = (item: ActionableItem) => {
    if (item.type === 'project') return getProjectStatusName({ status: item.status, templateId: item.templateId } as any);
    if (item.type === 'contract') return getContractStatusName({ status: item.status, templateId: item.templateId, contractType: item.isService ? 'service' : 'purchase' } as any);
    if (item.type === 'settlement') return getSettlementStatusName(item.status, item.templateId, item.isService);
    if (item.type === 'bid') return getBidStatusName({ status: item.status, templateId: item.templateId } as any);
    return item.status;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      
      {/* Upper header (1st child) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <span>
              {workspaceMode === 'personal' ? `👤 个人 (${activeUserObj.name})` : '👥 共享'}
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
              {workspaceMode === 'personal' ? '私有视图' : '共享协同视图'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {workspaceMode === 'personal'
              ? `当前正以成员【${activeUserObj.name}】的身份进行操作。仅展示归属于您的采购合同、前置需求和招标标书。`
              : '展示采购中心全部团队成员与共享关联的合同与进度，任何成员均可在任意卡片详情里进行认领或分工关联。'}
          </p>
        </div>
      </div>

      {/* Dashboard Stats (High Density 5-column layout) (2nd child) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        
        {/* Box 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs hover:shadow-xs transition-shadow">
          <div className="text-xs font-semibold text-slate-500 mb-1">需求项目 (前置)</div>
          <div className="text-2xl font-bold text-slate-800 font-mono">{String(totalProjects).padStart(2, '0')}</div>
        </div>

        {/* Box 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs hover:shadow-xs transition-shadow">
          <div className="text-xs font-semibold text-slate-500 mb-1">合同数量 (后置)</div>
          <div className="text-2xl font-bold text-slate-800 font-mono">{String(totalContracts).padStart(2, '0')}</div>
        </div>

        {/* Box 3 (Yellow Actionable Items Card - focused by user) */}
        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 shadow-sm hover:shadow transition-all relative overflow-hidden group">
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1 flex items-center justify-between">
            <span>需要处理</span>
          </div>
          <div className="text-3xl font-extrabold text-amber-700 font-mono tracking-tight flex items-baseline">
            {String(yellowCount).padStart(2, '0')}
            <span className="text-xs text-amber-500 font-sans ml-1 font-normal">个待办项</span>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
            <Clock size={72} className="text-amber-900" />
          </div>
        </div>

        {/* Box 4 */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-3xs hover:shadow-xs transition-shadow">
          <div className="text-xs font-semibold text-emerald-600 mb-1">等待审核</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">{String(greenCount).padStart(2, '0')}</div>
        </div>

        {/* Box 5 */}
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 shadow-3xs hover:shadow-xs transition-shadow">
          <div className="text-xs font-semibold text-rose-600 mb-1">异常状态</div>
          <div className="text-2xl font-bold text-rose-600 font-mono">{String(redCount).padStart(2, '0')}</div>
        </div>
      </div>

      {/* Main View: Need My Action (3rd child - focused by user) */}
      <div className="flex flex-col space-y-3 pt-2">
        {/* Title row */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold flex items-center text-slate-800">
            <span className="w-2.5 h-4 bg-amber-400 rounded-sm mr-2 flex-shrink-0 animate-pulse"></span>
            需要我处理的待办事项
          </h2>
          <span className="text-xs text-slate-500 bg-amber-100/60 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
            共 {actionableItems.length} 个黄色待办项 (实时联动)
          </span>
        </div>

        {/* Dynamic, responsive list container */}
        <div className="bg-white border border-slate-200 shadow-3xs rounded-xl p-4 min-h-[380px] flex flex-col justify-between transition-all">
          {actionableItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 mb-3 animate-bounce">
                <BadgeCheck size={28} />
              </div>
              <h3 className="text-sm font-bold text-slate-700 mb-1">🎉 干净整洁，暂无待办事项！</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                所有前置需求、购置合同和招标文件的黄色流程状态均已处理流转完毕。
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {actionableItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenItem(item.id, item.type)}
                    className="group bg-white p-3.5 rounded-lg border-l-4 border-l-amber-400 border border-slate-200 shadow-3xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-2.5 relative"
                  >
                    {/* Owners Badge in Top-Right Corner */}
                    <div className="absolute top-2.5 right-2.5 flex items-center space-x-1 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-slate-500 shadow-4xs z-10">
                      <span className="text-slate-400 font-medium">归属:</span>
                      {item.owners && item.owners.length > 0 ? (
                        <div className="flex -space-x-1 overflow-hidden">
                          {item.owners.map(email => {
                            const member = users.find(u => u.email.toLowerCase() === email.toLowerCase());
                            const name = member ? member.name : email.split('@')[0];
                            return (
                              <span
                                key={email}
                                className="inline-flex items-center justify-center h-4 px-1 rounded-full text-[8px] font-bold text-white bg-blue-600 ring-1 ring-white"
                                title={`${name} (${email})`}
                              >
                                {name}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold">待指派</span>
                      )}
                    </div>

                    <div className="pr-14">
                      {/* Title & Origin Tag */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                          item.type === 'project' 
                            ? 'bg-blue-50 text-blue-600 border border-blue-100/60'
                            : item.type === 'bid'
                            ? 'bg-purple-50 text-purple-600 border border-purple-100/60'
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100/60'
                        }`}>
                          {item.type === 'project' ? '前置需求' : item.type === 'bid' ? '招标标书' : '购置合同'}
                        </span>
                        
                        {item.code && item.code !== '标书' ? (
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1 py-0.2 rounded">
                            {item.code}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold text-slate-400">
                            ID: {item.id.substring(0, 6)}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors flex-1">
                        {item.name}
                      </h3>
                    </div>

                    {/* Footer tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100/70">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                        {item.ship}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded border border-amber-100/80 flex items-center gap-0.5">
                        🟡 {getItemStatusName(item)}
                      </span>
                      {item.isUrgent && (
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded border border-rose-100/80 flex items-center gap-0.5">
                          🚨 紧急
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips footer */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>💡 提示：点击任意待办卡片，可直接在弹窗中修改其信息及进度状态。</span>
            <span className="font-mono text-slate-300">系统数据自更新机制已就绪</span>
          </div>
        </div>
      </div>

      {/* Item details modal */}
      {selectedItemId && selectedItemType && (
        <ItemDetailsModal
          itemId={selectedItemId}
          type={selectedItemType}
          onClose={() => {
            setSelectedItemId(null);
            setSelectedItemType(null);
          }}
        />
      )}

    </div>
  );
};

