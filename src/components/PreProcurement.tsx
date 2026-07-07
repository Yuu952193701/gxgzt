import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppContext';
import { DemandProject, SHIPS, MEMBERS } from '../types';
import { ItemDetailsModal } from './ItemDetailsModal';
import { isOverdue, formatChineseDate } from '../data';
import { Search, Plus, ArrowLeft, ArrowRight, Trash2, Edit2, FolderOpen, Tag, Calendar, AlertTriangle, CheckSquare, Layers, HelpCircle, X, Check } from 'lucide-react';
import { MemberSelect } from './MemberSelect';

export const PreProcurement: React.FC = () => {
  const {
    projects,
    contracts,
    preWorkflow,
    addProject,
    updateProject,
    deleteProject,
    moveProjectStep,
    suppliers,
    workflowTemplates,
    workspaceMode,
    currentUser,
    users
  } = useAppState();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShip, setSelectedShip] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [filterUrgent, setFilterUrgent] = useState<boolean | 'all'>('all');

  // Detail Modal States
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Multi-select for batch actions
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Creation Tab State
  const [creationTab, setCreationTab] = useState<'single' | 'batch'>('single');

  // Batch demand creation states
  const [batchRows, setBatchRows] = useState<Array<{ code: string; name: string }>>([
    { code: '', name: '' }
  ]);
  const [batchInquirySuppliers, setBatchInquirySuppliers] = useState<string[]>([]);
  const [batchTags, setBatchTags] = useState<string[]>([]);
  const [batchTagInput, setBatchTagInput] = useState('');
  const [batchOwners, setBatchOwners] = useState<string[]>([]);

  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectCode, setNewProjectCode] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectShip, setNewProjectShip] = useState('鸿鹄01');
  const [newProjectStatus, setNewProjectStatus] = useState('');
  const [newProjectTemplateId, setNewProjectTemplateId] = useState('');

  // Auto select default template of this module on create modal open
  useEffect(() => {
    if (showCreateModal) {
      const preTemplates = workflowTemplates.filter(t => t.module === 'pre');
      const defaultTpl = preTemplates.find(t => t.isDefault) || preTemplates[0];
      if (defaultTpl) {
        setNewProjectTemplateId(defaultTpl.id);
        setNewProjectStatus(defaultTpl.steps[0]?.name || '');
      }
      // Initialize batch states
      setBatchOwners([currentUser]);
      setCreationTab('single');
      setBatchRows([{ code: '', name: '' }]);
      setBatchInquirySuppliers([]);
      setBatchTags([]);
    }
  }, [showCreateModal, workflowTemplates, currentUser]);

  // Lock page scrolling when creation modal is open
  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCreateModal]);

  // Get all unique workflow steps across all templates of 'pre' module
  const preTemplates = workflowTemplates.filter(t => t.module === 'pre');
  const allWorkflowSteps = preTemplates.length > 0
    ? Array.from(new Map(preTemplates.flatMap(t => t.steps).map(s => [s.name, s])).values())
    : preWorkflow;

  // Helper to resolve color of a project status
  const getProjectStatusColor = (projectOrStatus: DemandProject | string) => {
    let statusName: string;
    let templateId: string | undefined;

    if (typeof projectOrStatus === 'string') {
      statusName = projectOrStatus;
    } else {
      statusName = projectOrStatus.status;
      templateId = projectOrStatus.templateId;
    }

    const tpl = (templateId ? workflowTemplates.find(t => t.id === templateId) : null) || 
                workflowTemplates.find(t => t.module === 'pre' && t.isDefault) ||
                workflowTemplates.find(t => t.module === 'pre');
    const steps = tpl?.steps || preWorkflow;
    const step = steps.find(s => s.name === statusName);
    return step ? step.color : 'green';
  };

  // Helper to check next and prev step existence
  const canMove = (project: DemandProject) => {
    const tpl = workflowTemplates.find(t => t.id === project.templateId) || 
                workflowTemplates.find(t => t.module === 'pre' && t.isDefault) ||
                workflowTemplates.find(t => t.module === 'pre');
    const steps = tpl?.steps || preWorkflow;
    const currentIndex = steps.findIndex(s => s.name === project.status);
    return {
      hasPrev: currentIndex > 0,
      hasNext: currentIndex < steps.length - 1,
    };
  };

  // Handle core project creation
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectCode.trim() || !newProjectName.trim()) {
      alert('请填写项目编号和项目名称');
      return;
    }

    const preTemplates = workflowTemplates.filter(t => t.module === 'pre');
    const selectedTpl = workflowTemplates.find(t => t.id === newProjectTemplateId) || preTemplates.find(t => t.isDefault) || preTemplates[0];

    addProject({
      code: newProjectCode.trim(),
      name: newProjectName.trim(),
      ship: newProjectShip,
      status: newProjectStatus || selectedTpl?.steps[0]?.name || '需求单',
      templateId: selectedTpl?.id,
      templateName: selectedTpl?.name,
    });

    // Reset Form
    setNewProjectCode('');
    setNewProjectName('');
    setNewProjectShip('鸿鹄01');
    setNewProjectStatus('');
    setNewProjectTemplateId('');
    setShowCreateModal(false);
  };

  // Filter logic
  const filteredProjects = projects.filter(project => {
    // V2: Filter by workspace and logged in identity
    if (workspaceMode === 'personal') {
      const owners = project.owners || [];
      if (!owners.includes(currentUser)) return false;
    }

    // 1. Search term match
    const searchLower = searchTerm.toLowerCase().trim();
    const associatedContract = project.contractId ? contracts.find(c => c.id === project.contractId) : null;
    const contractLabel = associatedContract ? associatedContract.name.toLowerCase() : '';
    const contractAmount = associatedContract?.amount ? associatedContract.amount.toLowerCase() : '';
    
    const contractSupplier = associatedContract?.supplierId ? suppliers.find(s => s.id === associatedContract.supplierId) : null;
    const contractSupplierName = contractSupplier ? contractSupplier.name.toLowerCase() : '';

    const inquirySupplierNames = (project.inquiries || []).map(inq => {
      const sup = suppliers.find(s => s.id === inq.supplierId);
      return sup ? sup.name.toLowerCase() : '';
    }).join(' ');

    const inquiryQuoteAmounts = (project.inquiries || []).map(inq => inq.quoteAmount || '').join(' ').toLowerCase();
    
    const matchesSearch = !searchLower || 
      project.code.toLowerCase().includes(searchLower) ||
      project.name.toLowerCase().includes(searchLower) ||
      project.remark.toLowerCase().includes(searchLower) ||
      contractLabel.includes(searchLower) ||
      contractAmount.includes(searchLower) ||
      contractSupplierName.includes(searchLower) ||
      inquirySupplierNames.includes(searchLower) ||
      inquiryQuoteAmounts.includes(searchLower) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchLower));

    // 2. Ship match
    const matchesShip = selectedShip === 'all' || project.ship === selectedShip;

    // 3. Status match
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;

    // 4. Color status match
    const color = getProjectStatusColor(project);
    const matchesColor = selectedColor === 'all' || color === selectedColor;

    // 5. Urgency match
    const matchesUrgent = filterUrgent === 'all' || project.isUrgent === filterUrgent;

    return matchesSearch && matchesShip && matchesStatus && matchesColor && matchesUrgent;
  });

  // Sort by latest updated/created time first
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`确认删除需求项目【${name}】吗？\n\n此操作仅在系统内删除该项目进度流转记录，不会删除您的任何实际数据。`)) {
      deleteProject(id);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <span>前置工作</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            管理、流转并归口所有的采购物料需求。支持按所属船舶、各流转流程进行精细过滤。
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-3xs cursor-pointer self-start md:self-center"
        >
          <Plus size={14} />
          <span>新建前置需求</span>
        </button>
      </div>

      {/* Advanced Filter Control Box */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
        
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none placeholder-slate-400 text-slate-800"
              placeholder="搜索项目编号, 项目名称, 金额, 公司/供应商, 关联合同, 备注, 标签内容或物料属性..."
            />
          </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1.5">
          
          {/* Ship filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">所属船舶</label>
            <select
              value={selectedShip}
              onChange={(e) => setSelectedShip(e.target.value)}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium"
            >
              <option value="all">🚢 所有船舶</option>
              {SHIPS.map(ship => (
                <option key={ship} value={ship}>{ship}</option>
              ))}
            </select>
          </div>

          {/* Workflow Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">业务进度环节</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium"
            >
              <option value="all">📁 所有节点</option>
              {allWorkflowSteps.map(step => {
                const colorEmoji = step.color === 'yellow' ? '🟡' : step.color === 'green' ? '🟢' : step.color === 'blue' ? '🔵' : step.color === 'red' ? '🔴' : '⚪';
                const hasEmoji = /^[^\w\s\u4e00-\u9fa5]{1,2}\s/.test(step.name);
                const displayName = hasEmoji ? step.name : `${colorEmoji} ${step.name}`;
                return (
                  <option key={step.id} value={step.name}>{displayName}</option>
                );
              })}
            </select>
          </div>

          {/* Color status filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">行动紧急色组（状态色）</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full rounded-md border border-slate-200 p-1.5 text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-600 font-medium"
            >
              <option value="all">🎨 所有色组状态</option>
              <option value="yellow">🟡 黄色 - 需要我操作</option>
              <option value="green">🟢 绿色 - 等待他人处理</option>
              <option value="blue">🔵 蓝色 - 流程已完成</option>
              <option value="red">🔴 红色 - 异常/作废/退回</option>
            </select>
          </div>

          {/* Urgent state filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">红牌标记 (紧急程度)</label>
            <div className="flex items-center space-x-2 h-[30px] px-2.5 border border-slate-200 rounded-md bg-slate-50/50">
              <input
                type="checkbox"
                id="urgent-filter"
                checked={filterUrgent === true}
                onChange={(e) => setFilterUrgent(e.target.checked ? true : 'all')}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
              />
              <label htmlFor="urgent-filter" className="text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                仅查看 🔴 紧急需求
              </label>
            </div>
          </div>

        </div>

      </div>

      {/* Main projects lists */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={sortedProjects.length > 0 && sortedProjects.every(p => selectedProjectIds.includes(p.id))}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedProjectIds(sortedProjects.map(p => p.id));
                } else {
                  setSelectedProjectIds([]);
                }
              }}
              className="h-3.5 w-3.5 text-blue-600 border-slate-300 rounded cursor-pointer"
            />
            <span>全选 / 取消全选 ({selectedProjectIds.length} 项已选中)</span>
          </div>
          <span>符合过滤条件的需求数: <span className="font-bold text-slate-700 font-mono">{sortedProjects.length}</span> 项</span>
        </div>

        {sortedProjects.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-xl p-12 text-center text-slate-400 text-sm">
            没有找到能对应过滤规则的需求项目。可以尝试更换关键词或在右上角点击“新建需求”。
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {sortedProjects.map(project => {
              const statusColor = getProjectStatusColor(project);
              const overdue = project.dueDate && isOverdue(project.dueDate);
              const { hasPrev, hasNext } = canMove(project);
              
              // Find linked contract
              const assocContract = project.contractId ? contracts.find(c => c.id === project.contractId) : null;
              const contractSupplier = assocContract?.supplierId ? suppliers.find(s => s.id === assocContract.supplierId) : null;

              return (
                <div
                  key={project.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-5 py-4 shadow-3xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative"
                >
                  {/* Owners Badge in Top-Right Corner */}
                  <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-550 shadow-4xs z-10">
                    <span className="text-slate-400 font-medium">归属:</span>
                    {project.owners && project.owners.length > 0 ? (
                      <div className="flex -space-x-1 overflow-hidden">
                        {project.owners.map(email => {
                          const member = users.find(u => u.email.toLowerCase() === email.toLowerCase());
                          const name = member ? member.name : email.split('@')[0];
                          return (
                            <span
                              key={email}
                              className="inline-flex items-center justify-center h-4.5 px-1.5 rounded-full text-[9px] font-bold text-white bg-blue-600 ring-1 ring-white"
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

                  {/* Select Checkbox for batch edits */}
                  <div className="flex items-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => {
                        setSelectedProjectIds(prev =>
                          prev.includes(project.id)
                            ? prev.filter(id => id !== project.id)
                            : [...prev, project.id]
                        );
                      }}
                      className="h-4 w-4 text-blue-600 border-slate-350 rounded cursor-pointer focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Left Column: Interactive Metadata and Tags Line */}
                  <div 
                    onClick={() => setSelectedItemId(project.id)}
                    className="flex-1 space-y-3 cursor-pointer group"
                  >
                    {/* Identification labels */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md">
                        {project.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </h3>
                      {assocContract && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-100 font-mono">
                          🔗 关联【{assocContract.name}】
                        </span>
                      )}
                    </div>

                    {/* PRD Prescribed Horizontal tags display layout:
                        [鸿鹄01] [🟡制作比价表] [🔴紧急] [上海XX公司] [￥38600] [⏰6/25]
                     */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      
                      {/* 1. Ship tag */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                        🚢 {project.ship}
                      </span>

                      {/* 2. Status with localized color bulb */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold leading-normal border ${
                        statusColor === 'yellow' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        statusColor === 'green' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        statusColor === 'blue' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        <span className="mr-1">
                          {statusColor === 'yellow' ? '🟡' :
                           statusColor === 'green' ? '🟢' :
                           statusColor === 'blue' ? '🔵' : '🔴'}
                        </span>
                        {project.status}
                      </span>

                      {/* 3. Urgency alert tag */}
                      {project.isUrgent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          🔴 紧急
                        </span>
                      )}

                      {/* 4. Due Date Alert tag /⏰ tag */}
                      {overdue ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          ⚠ 已超期 ({project.dueDate})
                        </span>
                      ) : project.dueDate ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                          {formatChineseDate(project.dueDate)}
                        </span>
                      ) : null}

                      {/* 5. Connected Company & Amount (from associated contract) */}
                      {contractSupplier && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-3xs">
                          🏢 {contractSupplier.name}
                        </span>
                      )}
                      {assocContract?.amount && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-3xs">
                          {assocContract.amount}
                        </span>
                      )}

                      {/* 6. Inquiries / Quoted Companies (if no contract company is connected yet) */}
                      {(!contractSupplier && project.inquiries && project.inquiries.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                          {project.inquiries.map(inq => {
                            const sup = suppliers.find(s => s.id === inq.supplierId);
                            if (!sup) return null;
                            return (
                              <span key={inq.supplierId} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                inq.hasQuoted 
                                  ? 'bg-emerald-50/40 text-emerald-750 border-emerald-100' 
                                  : 'bg-slate-50 text-slate-500 border-slate-100'
                              }`}>
                                🏢 {sup.name} {inq.hasQuoted ? ' (已报价)' : ' (未报价)'}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* 7. Custom tags */}
                      {Array.from(new Set(project.tags)).map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50/50 text-blue-600 border border-blue-100">
                          {tag}
                        </span>
                      ))}

                    </div>

                    {/* Brief Note preview if any */}
                    {project.remark && (
                      <p className="text-xs text-slate-400 line-clamp-1 italic max-w-2xl pl-1">
                        备注: {project.remark}
                      </p>
                    )}

                  </div>

                  {/* Right Column: Directional Progression controls and Discard */}
                  <div className="flex flex-row items-center space-x-3 self-end md:self-auto flex-shrink-0">
                    
                    {/* Previous step arrow */}
                    <button
                      type="button"
                      disabled={!hasPrev}
                      onClick={() => moveProjectStep(project.id, 'prev')}
                      title="流转到上一步"
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                        hasPrev
                          ? 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:shadow-2xs active:bg-slate-100'
                          : 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                      }`}
                    >
                      <ArrowLeft size={13} />
                      <span className="hidden sm:inline">上一步</span>
                    </button>

                    {/* Next step arrow */}
                    <button
                      type="button"
                      disabled={!hasNext}
                      onClick={() => moveProjectStep(project.id, 'next')}
                      title="递进到下一步"
                      className={`p-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                        hasNext
                          ? 'border-blue-200 text-blue-750 bg-blue-50/70 hover:bg-blue-50 hover:shadow-2xs active:bg-blue-100'
                          : 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                      }`}
                    >
                      <span className="hidden sm:inline">下一步</span>
                      <ArrowRight size={13} />
                    </button>

                    <span className="h-6 w-[1px] bg-slate-200 hidden sm:inline" />

                    {/* Edit pen */}
                    <button
                      type="button"
                      onClick={() => setSelectedItemId(project.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="项目详情与编辑"
                    >
                      <Edit2 size={13} />
                    </button>

                    {/* Trashcan */}
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id, project.name)}
                      className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                      title="删除需求"
                    >
                      <Trash2 size={13} />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Batch Action Bar */}
        {workspaceMode === 'shared' && selectedProjectIds.length > 0 && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in shadow-3xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                  已选择 {selectedProjectIds.length} 项
                </span>
                <span>需求批量协作控制台</span>
              </div>
              <button
                onClick={() => setSelectedProjectIds([])}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                取消选择
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs border-t border-slate-250/50">
              {/* Owners Batch Setting */}
              <div className="space-y-1.5">
                <span className="block font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                  👥 统一指派归属负责人
                </span>
                <div className="bg-white border border-slate-200 rounded-lg p-2 max-h-28 overflow-y-auto space-y-1">
                  {users.map(member => {
                    const allSelectedHaveThisOwner = selectedProjectIds.every(id => {
                      const p = projects.find(item => item.id === id);
                      return p && p.owners && p.owners.includes(member.email);
                    });
                    return (
                      <label key={member.email} className="flex items-center space-x-2 p-1 hover:bg-slate-50 rounded text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allSelectedHaveThisOwner}
                          onChange={(e) => {
                            const add = e.target.checked;
                            selectedProjectIds.forEach(id => {
                              const p = projects.find(item => item.id === id);
                              if (p) {
                                const currentOwners = p.owners || [];
                                const nextOwners = add
                                  ? [...currentOwners.filter(o => o !== member.email), member.email]
                                  : currentOwners.filter(o => o !== member.email);
                                updateProject(id, { owners: nextOwners });
                              }
                            });
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="font-medium text-slate-700">{member.name}</span>
                        <span className="text-[10px] text-slate-400">({member.email})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Other Batch Actions */}
              <div className="space-y-2">
                <span className="block font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                  🛠️ 批量操作指令
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`确认将选中的 ${selectedProjectIds.length} 个需求退回上一步？`)) {
                        selectedProjectIds.forEach(id => {
                          moveProjectStep(id, 'prev');
                        });
                      }
                    }}
                    className="py-1.5 px-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs transition-all shadow-3xs cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <ArrowLeft size={11} />
                    <span>退回上一步</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`确认将选中的 ${selectedProjectIds.length} 个需求推进到下一步？`)) {
                        selectedProjectIds.forEach(id => {
                          moveProjectStep(id, 'next');
                        });
                      }
                    }}
                    className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-all shadow-3xs cursor-pointer flex items-center justify-center space-x-1 border border-blue-100"
                  >
                    <span>推进到下一步</span>
                    <ArrowRight size={11} />
                  </button>
                </div>

                <div className="pt-1.5 border-t border-dashed border-slate-200 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tag = window.prompt("请输入要统一追加的标签：");
                      if (tag && tag.trim()) {
                        const trimmed = tag.trim();
                        selectedProjectIds.forEach(id => {
                          const p = projects.find(item => item.id === id);
                          if (p) {
                            const currentTags = p.tags || [];
                            if (!currentTags.includes(trimmed)) {
                              updateProject(id, { tags: [...currentTags, trimmed] });
                            }
                          }
                        });
                      }
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[10px] transition-colors cursor-pointer"
                  >
                    🏷️ 追加标签
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("确认要清空选中需求的所有标签吗？")) {
                        selectedProjectIds.forEach(id => {
                          updateProject(id, { tags: [] });
                        });
                      }
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[10px] transition-colors cursor-pointer"
                  >
                    🏷️ 清空标签
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`⚠️ 确认将选中的 ${selectedProjectIds.length} 个前置需求批量删除吗？\n\n此操作仅从系统中删除记录。此操作不可撤销！`)) {
                        selectedProjectIds.forEach(id => {
                          deleteProject(id);
                        });
                        setSelectedProjectIds([]);
                      }
                    }}
                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded text-[10px] transition-colors cursor-pointer border border-rose-100/50"
                  >
                    🗑️ 批量删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:p-10 bg-black/40 backdrop-blur-xs">
          <div className={`bg-white rounded-xl shadow-2xl p-5 md:p-6 w-full ${creationTab === 'batch' ? 'max-w-4xl' : 'max-w-lg'} border border-slate-100 animate-slide-in text-slate-800`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <span>➕ 新建前置需求项目</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs for Single vs Batch Creation */}
            <div className="flex border-b border-slate-100 mb-4 text-xs">
              <button
                type="button"
                onClick={() => setCreationTab('single')}
                className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  creationTab === 'single'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                📝 单个需求录入
              </button>
              <button
                type="button"
                onClick={() => setCreationTab('batch')}
                className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  creationTab === 'batch'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                ⚡ 批量需求导入 (公共信息一致，连续录入)
              </button>
            </div>

            {creationTab === 'single' ? (
              <form onSubmit={handleCreateProject} className="space-y-4 pr-1 pb-2">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    项目编号 (必填)
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectCode}
                    onChange={(e) => setNewProjectCode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                    placeholder="项目编号 (例如: A004)"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    项目名称 (必填)
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                    placeholder="项目名称 (例如: 备用发电机耗材采购)"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    所属船舶 (仅限单选)
                  </label>
                  <select
                    value={newProjectShip}
                    onChange={(e) => setNewProjectShip(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white font-medium text-slate-700"
                  >
                    {SHIPS.map(ship => (
                      <option key={ship} value={ship}>{ship}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    业务流程模板 (选择对应流转模式)
                  </label>
                  <select
                    value={newProjectTemplateId}
                    onChange={(e) => {
                      setNewProjectTemplateId(e.target.value);
                      const tpl = workflowTemplates.find(t => t.id === e.target.value);
                      if (tpl && tpl.steps.length > 0) {
                        setNewProjectStatus(tpl.steps[0].name);
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white font-medium text-slate-700"
                  >
                    {workflowTemplates.filter(t => t.module === 'pre').map(tpl => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} {tpl.isDefault ? '(默认)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    当前业务状态 (流转节点)
                  </label>
                  <select
                    value={newProjectStatus || (workflowTemplates.find(t => t.id === newProjectTemplateId)?.steps[0]?.name || '')}
                    onChange={(e) => setNewProjectStatus(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white font-medium text-slate-700"
                  >
                    {(workflowTemplates.find(t => t.id === newProjectTemplateId)?.steps || preWorkflow).map(step => (
                      <option key={step.name} value={step.name}>
                        {step.color === 'yellow' ? '🟡' : step.color === 'green' ? '🟢' : step.color === 'blue' ? '🔵' : '⚪'} {step.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-md text-[11px] text-slate-400 leading-relaxed font-sans mt-2 flex-shrink-0">
                  <strong>💡 智能配置提示：</strong>
                  <p className="mt-1">
                    该前置项目创建后，将直接处于您选择的<b>【{newProjectStatus || preWorkflow[0]?.name || '需求单'}】</b>阶段。您后续可进入项目详情添加标签、绑定合同或编辑备注信息。
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-3xs transition-all"
                  >
                    立即加入工作台
                  </button>
                </div>

              </form>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1 flex-1 pb-2 custom-scrollbar">
                {/* Left Column: Common/Public configuration */}
                <div className="lg:col-span-5 space-y-4 border-r border-slate-100 lg:pr-6">
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5 border-b border-slate-200/80 pb-2">
                      <span>📋 共享公共信息配置</span>
                    </h4>

                    {/* Ship (Common) */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        所属船舶
                      </label>
                      <select
                        value={newProjectShip}
                        onChange={(e) => setNewProjectShip(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white font-medium text-slate-750"
                      >
                        {SHIPS.map(ship => (
                          <option key={ship} value={ship}>{ship}</option>
                        ))}
                      </select>
                    </div>

                    {/* Template (Common) */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        业务流程模板
                      </label>
                      <select
                        value={newProjectTemplateId}
                        onChange={(e) => {
                          setNewProjectTemplateId(e.target.value);
                          const tpl = workflowTemplates.find(t => t.id === e.target.value);
                          if (tpl && tpl.steps.length > 0) {
                            setNewProjectStatus(tpl.steps[0].name);
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white font-medium text-slate-750"
                      >
                        {workflowTemplates.filter(t => t.module === 'pre').map(tpl => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name} {tpl.isDefault ? '(默认)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Current status (Common) */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        当前业务状态
                      </label>
                      <select
                        value={newProjectStatus || (workflowTemplates.find(t => t.id === newProjectTemplateId)?.steps[0]?.name || '')}
                        onChange={(e) => setNewProjectStatus(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white font-medium text-slate-750"
                      >
                        {(workflowTemplates.find(t => t.id === newProjectTemplateId)?.steps || preWorkflow).map(step => (
                          <option key={step.name} value={step.name}>
                            {step.color === 'yellow' ? '🟡' : step.color === 'green' ? '🟢' : step.color === 'blue' ? '🔵' : '⚪'} {step.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Shared workspace: Owners (Common) */}
                    {workspaceMode === 'shared' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          指派归属负责人 (多选，默认当前登录成员)
                        </label>
                        <MemberSelect
                          selectedEmails={batchOwners}
                          onChange={setBatchOwners}
                        />
                      </div>
                    )}

                    {/* Inquiry Suppliers (Common) */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        推荐询价供应商 (可选，多选)
                      </label>
                      <div className="bg-white border border-slate-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                        {suppliers.map(sup => {
                          const selected = batchInquirySuppliers.includes(sup.id);
                          return (
                            <button
                              type="button"
                              key={sup.id}
                              onClick={() => {
                                setBatchInquirySuppliers(prev =>
                                  prev.includes(sup.id)
                                    ? prev.filter(id => id !== sup.id)
                                    : [...prev, sup.id]
                                );
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-all ${
                                selected
                                  ? 'bg-blue-50 text-blue-700 font-bold'
                                  : 'hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                              <span className="truncate">🏢 {sup.name}</span>
                              {selected && <Check size={12} className="text-blue-600 flex-shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                        {suppliers.length === 0 && (
                          <span className="text-[10px] text-slate-400 block p-1 text-center">暂无备选供应商，可前往供应商面板添加</span>
                        )}
                      </div>
                    </div>

                    {/* Batch Tags (Common) */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        预置标签 (输入后按回车/逗号添加)
                      </label>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {batchTags.map(t => (
                          <span key={t} className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold">
                            <span>{t}</span>
                            <button
                              type="button"
                              onClick={() => setBatchTags(prev => prev.filter(x => x !== t))}
                              className="ml-1 text-blue-400 hover:text-blue-600 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={batchTagInput}
                        onChange={(e) => setBatchTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const trimmed = batchTagInput.trim().replace(',', '');
                            if (trimmed && !batchTags.includes(trimmed)) {
                              setBatchTags(prev => [...prev, trimmed]);
                            }
                            setBatchTagInput('');
                          }
                        }}
                        placeholder="自定义标签名称..."
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Unique Row Entries */}
                <div className="lg:col-span-7 flex flex-col space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-shrink-0">
                    <h4 className="text-xs font-bold text-slate-700">
                      ⚙️ 需求单连续录入明细明细表
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (batchRows.length === 0) return;
                          const firstCode = batchRows[0].code.trim();
                          if (!firstCode) {
                            alert("请先填写第一行的【项目编号】，例如 A001");
                            return;
                          }
                          const match = firstCode.match(/^([A-Za-z_-]*)(\d+)$/);
                          if (!match) {
                            alert("编号结尾必须是数字才能进行智能递增，如 A001");
                            return;
                          }
                          const prefix = match[1];
                          const numStr = match[2];
                          const startNum = parseInt(numStr, 10);
                          const padLength = numStr.length;

                          setBatchRows(prev =>
                            prev.map((row, idx) => {
                              if (idx === 0) return row;
                              const nextNum = startNum + idx;
                              const paddedNum = String(nextNum).padStart(padLength, '0');
                              return {
                                ...row,
                                code: row.code.trim() ? row.code : `${prefix}${paddedNum}`
                              };
                            })
                          );
                        }}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold rounded flex items-center space-x-1 cursor-pointer transition-colors"
                        title="根据首行编号的数字顺序，自动填充下方空白的编号"
                      >
                        <span>⚡ 智能自动递增编号</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setBatchRows(prev => [...prev, { code: '', name: '' }]);
                        }}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded flex items-center space-x-1 cursor-pointer transition-colors shadow-3xs"
                      >
                        <Plus size={11} />
                        <span>添加明细行</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {batchRows.map((row, idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-slate-50/50 p-2.5 border border-slate-200 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-400 font-mono w-4 text-center">
                          {idx + 1}
                        </span>

                        <div className="grid grid-cols-2 gap-2 flex-1">
                          <div>
                            <input
                              type="text"
                              required
                              value={row.code}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBatchRows(prev =>
                                  prev.map((r, i) => (i === idx ? { ...r, code: val } : r))
                                );
                              }}
                              placeholder="项目编号 (如: A001)"
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:outline-none font-mono font-bold text-slate-700"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              required
                              value={row.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBatchRows(prev =>
                                  prev.map((r, i) => (i === idx ? { ...r, name: val } : r))
                                );
                              }}
                              placeholder="项目需求名称 (如: 主机气缸油采购)"
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-100 focus:outline-none text-slate-755"
                            />
                          </div>
                        </div>

                        {batchRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setBatchRows(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            title="删除此行"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50/40 border border-blue-100 p-2.5 rounded-lg text-[10px] text-slate-400 leading-normal">
                    <strong>💡 提示：</strong> 您可以连续录入多条明细。支持自动编号递增（以第 1 行为模板）。创建成功后，每条明细将自动拥有左侧配置的所有公共流转参数、推荐供应商与指派负责人。
                  </div>

                  {/* Footer controls for batch mode */}
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0 mt-auto">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const validRows = batchRows.filter(r => r.code.trim() && r.name.trim());
                        if (validRows.length === 0) {
                          alert("请至少完整填写一行编号与项目名称！");
                          return;
                        }

                        const preTemplates = workflowTemplates.filter(t => t.module === 'pre');
                        const selectedTpl = workflowTemplates.find(t => t.id === newProjectTemplateId) || preTemplates.find(t => t.isDefault) || preTemplates[0];

                        validRows.forEach(row => {
                          addProject({
                            code: row.code.trim(),
                            name: row.name.trim(),
                            ship: newProjectShip,
                            status: newProjectStatus || selectedTpl?.steps[0]?.name || '需求单',
                            templateId: selectedTpl?.id,
                            templateName: selectedTpl?.name,
                            tags: batchTags,
                            owners: workspaceMode === 'personal' ? [currentUser] : batchOwners,
                            inquiries: batchInquirySuppliers.map(sId => ({ supplierId: sId, hasQuoted: false }))
                          });
                        });

                        setShowCreateModal(false);
                      }}
                      className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-3xs transition-all cursor-pointer"
                    >
                      🚀 确认批量生成并加入工作台 ({batchRows.filter(r => r.code.trim() && r.name.trim()).length} 项)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Details slide-over dialog callback */}
      {selectedItemId && (
        <ItemDetailsModal
          itemId={selectedItemId}
          type="project"
          onClose={() => setSelectedItemId(null)}
        />
      )}

    </div>
  );
};
