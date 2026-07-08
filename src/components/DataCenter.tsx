import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, Database, Plus, Trash2, Edit2, Columns, Filter, ArrowUpDown, 
  ChevronDown, ChevronRight, Save, Copy, Check, X, Search, FileSpreadsheet,
  AlertCircle, Info, MoveUp, MoveDown, Eye, EyeOff, Maximize2, Minimize2,
  Lock, RefreshCw, SlidersHorizontal, Settings2, RotateCcw
} from 'lucide-react';
import { useAppState } from '../context/AppContext';
import { 
  DataCenterConfig, DataSourceType, ViewColumnConfig, ViewFilterConfig, 
  ViewSortConfig, CustomFieldConfig, SHIPS, MEMBERS, StepAttribute
} from '../types';

export const DataCenter: React.FC = () => {
  const {
    projects,
    contracts,
    bids,
    suppliers,
    users,
    updateProject,
    updateContract,
    updateBid,
    preWorkflow,
    postWorkflow,
    postServiceWorkflow,
    bidWorkflow,
    workflowTemplates,
    addSystemLog
  } = useAppState();

  // Selected config/ledger ID
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(() => {
    const saved = localStorage.getItem('p_workbench_datacenter_configs_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DataCenterConfig[];
        if (parsed.length > 0) return parsed[0].id;
      } catch (e) {}
    }
    return 'ledger-1';
  });

  // Loaded configuration states (Ledgers)
  const [configs, setConfigs] = useState<DataCenterConfig[]>(() => {
    const saved = localStorage.getItem('p_workbench_datacenter_configs_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DataCenterConfig[];
        // Sanitizing stored configs to remove any duplicate column fields
        return parsed.map(c => {
          if (c.columns) {
            const seen = new Set<string>();
            const uniqueCols = c.columns.filter(col => {
              if (seen.has(col.field)) return false;
              seen.add(col.field);
              return true;
            });
            return { ...c, columns: uniqueCols };
          }
          return c;
        });
      } catch (e) {
        console.error('Error parsing data center configs', e);
      }
    }

    // High quality Seed ledgers reflecting actual procurement workflows
    const seeds: DataCenterConfig[] = [
      {
        id: 'ledger-1',
        name: '🚢 综合成本台账',
        type: 'view',
        isStarred: true,
        dataSource: 'purchase',
        dataSources: ['purchase', 'service'],
        filters: [],
        columns: [
          { field: 'code', label: '合同编号', visible: true, order: 1, width: 140, category: 'business' },
          { field: 'name', label: '合同名称', visible: true, order: 2, width: 220, category: 'business' },
          { field: 'ship', label: '所属船舶', visible: true, order: 3, width: 110, category: 'business' },
          { field: 'amount', label: '合同金额 (元)', visible: true, order: 4, width: 130, category: 'business' },
          { field: 'supplierId', label: '供应商', visible: true, order: 5, width: 180, category: 'business' },
          { field: 'status', label: '当前流程节点', visible: true, order: 6, width: 130, category: 'status' },
          { field: 'status_attribute', label: '阶段业务意义', visible: true, order: 7, width: 120, category: 'status' },
          { field: 'calc_process_time', label: '累计办理耗时', visible: true, order: 8, width: 120, category: 'calc', calcType: 'process_time' },
          { field: 'manual_remark', label: '领导备注情况', visible: true, order: 9, width: 160, category: 'manual' }
        ],
        sorts: [],
        customFields: [],
        manualValues: {
          'c-001': { 'manual_remark': '已与轮机长核对，合同付款条件无误' },
          'c-002': { 'manual_remark': '财务正安排第二批结算付款审批' }
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'ledger-2',
        name: '⛓️ 前置采购需求追踪表',
        type: 'view',
        isStarred: true,
        dataSource: 'pre',
        dataSources: ['pre'],
        filters: [],
        columns: [
          { field: 'code', label: '项目编号', visible: true, order: 1, width: 120, category: 'business' },
          { field: 'name', label: '项目名称', visible: true, order: 2, width: 200, category: 'business' },
          { field: 'ship', label: '所属船舶', visible: true, order: 3, width: 110, category: 'business' },
          { field: 'status', label: '流程当前步骤', visible: true, order: 4, width: 130, category: 'status' },
          { field: 'calc_stay_days', label: '节点停留天数', visible: true, order: 5, width: 120, category: 'calc', calcType: 'stay_days' },
          { field: 'calc_is_overdue', label: '是否超期异常', visible: true, order: 6, width: 120, category: 'calc', calcType: 'is_overdue' },
          { field: 'manual_phone_check', label: '轮机确认电话', visible: true, order: 7, width: 150, category: 'manual' }
        ],
        sorts: [],
        customFields: [],
        manualValues: {
          'd-001': { 'manual_phone_check': '已电话确认上海壳牌下午送样' },
          'd-002': { 'manual_phone_check': '电缆数量已跟轮机长核实一致' }
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'ledger-3',
        name: '📊 投标与协作台账',
        type: 'view',
        isStarred: false,
        dataSource: 'bid',
        dataSources: ['bid'],
        filters: [],
        columns: [
          { field: 'name', label: '标书/项目名称', visible: true, order: 1, width: 220, category: 'business' },
          { field: 'ship', label: '所属船舶', visible: true, order: 2, width: 110, category: 'business' },
          { field: 'tenderUnit', label: '招标单位', visible: true, order: 3, width: 180, category: 'business' },
          { field: 'status', label: '当前节点', visible: true, order: 4, width: 130, category: 'status' },
          { field: 'supplierId', label: '协作供货商', visible: true, order: 5, width: 180, category: 'business' },
          { field: 'calc_process_time', label: '办理耗时', visible: true, order: 6, width: 120, category: 'calc', calcType: 'process_time' },
          { field: 'manual_bid_status', label: '报送人反馈', visible: true, order: 7, width: 150, category: 'manual' }
        ],
        sorts: [],
        customFields: [],
        manualValues: {
          'b-001': { 'manual_bid_status': '标书已密封，下午寄送' }
        },
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('p_workbench_datacenter_configs_v2', JSON.stringify(seeds));
    return seeds;
  });

  // Keep localStorage in sync with config state changes
  useEffect(() => {
    localStorage.setItem('p_workbench_datacenter_configs_v2', JSON.stringify(configs));
  }, [configs]);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [tempEditValue, setTempEditValue] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  // Creation Flow States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [newLedgerSources, setNewLedgerSources] = useState<DataSourceType[]>(['purchase']);
  const [sourceFieldSelection, setSourceFieldSelection] = useState<Record<DataSourceType, string[]>>({
    pre: ['code', 'name', 'ship', 'status', 'dueDate', 'owners'],
    purchase: ['code', 'name', 'ship', 'amount', 'supplierId', 'status', 'dueDate', 'owners'],
    service: ['code', 'name', 'ship', 'amount', 'supplierId', 'status', 'dueDate', 'owners'],
    bid: ['name', 'ship', 'tenderUnit', 'status', 'supplierId', 'owners']
  });

  // Excel-style funnel filters state: { [field]: [checked unique values] }
  const [excelFilters, setExcelFilters] = useState<Record<string, string[]>>({});
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);
  const [filterSearchQuery, setFilterSearchQuery] = useState('');

  // Add Column Modal States
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColCategory, setNewColCategory] = useState<'business' | 'status' | 'history' | 'calc' | 'manual'>('business');
  const [newColBusinessField, setNewColBusinessField] = useState('code');
  const [newColStatusField, setNewColStatusField] = useState('status');
  const [newColHistoryAttr, setNewColHistoryAttr] = useState<StepAttribute>('结算');
  const [newColCalcType, setNewColCalcType] = useState<'process_time' | 'approval_time' | 'stay_days' | 'is_overdue' | 'exec_days'>('process_time');
  const [newColManualLabel, setNewColManualLabel] = useState('');

  const activeConfig = configs.find(c => c.id === selectedConfigId) || configs[0];

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveFilterDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync title input
  useEffect(() => {
    if (activeConfig) {
      setTempTitle(activeConfig.name);
    }
  }, [activeConfig]);

  // --------------------------------------------------------
  // Helper field metadata and translation catalogs
  // --------------------------------------------------------
  const FIELD_TRANSLATIONS: Record<string, string> = {
    code: '编号',
    name: '名称',
    ship: '所属船舶',
    status: '当前节点',
    amount: '金额 (元)',
    supplierId: '关联商户/供应商',
    isUrgent: '是否紧急',
    dueDate: '截止日期',
    owners: '责任归属',
    tags: '标签',
    remark: '备注说明',
    createdAt: '创建时间',
    tenderUnit: '招标单位'
  };

  const BUSINESS_FIELDS_OPTIONS = [
    { value: 'code', label: '项目/合同编号 (code)' },
    { value: 'name', label: '项目/合同名称 (name)' },
    { value: 'ship', label: '所属船舶 (ship)' },
    { value: 'amount', label: '金额 (amount)' },
    { value: 'supplierId', label: '关联供应商/协作商 (supplierId)' },
    { value: 'owners', label: '归属责任成员 (owners)' },
    { value: 'dueDate', label: '截止日期 (dueDate)' },
    { value: 'tags', label: '标签 (tags)' },
    { value: 'remark', label: '备注说明 (remark)' },
    { value: 'createdAt', label: '创建/签署时间 (createdAt)' },
    { value: 'tenderUnit', label: '招标单位 (tenderUnit)' }
  ];

  const STATUS_FIELDS_OPTIONS = [
    { value: 'status', label: '当前流程步骤 (节点名称)' },
    { value: 'status_attribute', label: '流程节点业务属性' },
    { value: 'status_color', label: '当前流程标记颜色' },
    { value: 'status_template', label: '当前工作流模板' },
    { value: 'status_is_completed', label: '是否已归档完成' },
    { value: 'status_is_exception', label: '是否处于异常节点' }
  ];

  const CALC_FIELDS_OPTIONS = [
    { value: 'process_time', label: '办理耗时 (自创建至今或至归档完成的总耗时)' },
    { value: 'approval_time', label: '审批耗时 (处于[审批]属性节点的持续时间)' },
    { value: 'stay_days', label: '节点停留天数 (处于当前流程节点的总停留时间)' },
    { value: 'is_overdue', label: '是否超期异常 (当前日期是否越过截至日期)' },
    { value: 'exec_days', label: '台账执行天数 (合同执行天数)' }
  ];

  // Global map of available database fields per module
  const DB_FIELDS_BY_SOURCE: Record<DataSourceType, { value: string; label: string }[]> = {
    pre: [
      { value: 'code', label: '项目编号' },
      { value: 'name', label: '项目名称' },
      { value: 'ship', label: '所属船舶' },
      { value: 'status', label: '当前状态' },
      { value: 'dueDate', label: '截至日期' },
      { value: 'owners', label: '责任归属' },
      { value: 'tags', label: '标签' },
      { value: 'remark', label: '备注' },
      { value: 'createdAt', label: '创建时间' }
    ],
    purchase: [
      { value: 'code', label: '合同编号' },
      { value: 'name', label: '合同名称' },
      { value: 'ship', label: '所属船舶' },
      { value: 'amount', label: '合同金额' },
      { value: 'supplierId', label: '合作供应商' },
      { value: 'status', label: '付款节点' },
      { value: 'dueDate', label: '收付截止日' },
      { value: 'owners', label: '责任归属' },
      { value: 'tags', label: '标签' },
      { value: 'remark', label: '备注' },
      { value: 'createdAt', label: '签署时间' }
    ],
    service: [
      { value: 'code', label: '合同编号' },
      { value: 'name', label: '合同名称' },
      { value: 'ship', label: '所属船舶' },
      { value: 'amount', label: '合同金额' },
      { value: 'supplierId', label: '合作服务商' },
      { value: 'status', label: '服务节点' },
      { value: 'dueDate', label: '结算截止日' },
      { value: 'owners', label: '责任归属' },
      { value: 'tags', label: '标签' },
      { value: 'remark', label: '备注' },
      { value: 'createdAt', label: '签署时间' }
    ],
    bid: [
      { value: 'name', label: '标书名称' },
      { value: 'ship', label: '所属船舶' },
      { value: 'tenderUnit', label: '招标单位' },
      { value: 'status', label: '流程步骤' },
      { value: 'supplierId', label: '协作供货商' },
      { value: 'dueDate', label: '截标日期' },
      { value: 'owners', label: '责任归属' },
      { value: 'tags', label: '标签' },
      { value: 'remark', label: '备注' },
      { value: 'createdAt', label: '建档时间' }
    ]
  };

  // --------------------------------------------------------
  // Workflow step attribute resolver
  // --------------------------------------------------------
  const getStepAttributeByName = (stepName: string, moduleType?: DataSourceType) => {
    // 1. Check custom templates
    for (const t of workflowTemplates) {
      if (!moduleType || t.module === moduleType) {
        const step = t.steps.find(s => s.name === stepName);
        if (step && step.attribute) return step.attribute;
      }
    }
    // 2. Check defaults
    const defaults = [
      ...preWorkflow,
      ...postWorkflow,
      ...postServiceWorkflow,
      ...bidWorkflow
    ];
    const defaultStep = defaults.find(s => s.name === stepName);
    if (defaultStep && defaultStep.attribute) return defaultStep.attribute;
    
    return '无';
  };

  const getStepColorByName = (stepName: string) => {
    // Find color
    for (const t of workflowTemplates) {
      const step = t.steps.find(s => s.name === stepName);
      if (step) return step.color;
    }
    const defaults = [
      ...preWorkflow,
      ...postWorkflow,
      ...postServiceWorkflow,
      ...bidWorkflow
    ];
    const defaultStep = defaults.find(s => s.name === stepName);
    if (defaultStep) return defaultStep.color;
    return 'green';
  };

  // --------------------------------------------------------
  // Calculation engines for different column categories
  // --------------------------------------------------------
  const getHistoryTimeForAttribute = (row: any, attr: StepAttribute) => {
    if (!row.history || row.history.length === 0) return '';
    
    const moduleType = row.__sourceType;
    let steps: any[] = [];
    
    if (row.templateId) {
      const tpl = workflowTemplates.find(t => t.id === row.templateId);
      if (tpl) steps = tpl.steps;
    }
    
    if (steps.length === 0) {
      if (moduleType === 'pre') steps = preWorkflow;
      else if (moduleType === 'purchase') steps = postWorkflow;
      else if (moduleType === 'service') steps = postServiceWorkflow;
      else if (moduleType === 'bid') steps = bidWorkflow;
    }

    // Identify target step names that have this attribute
    const targetNames = steps.filter(s => s.attribute === attr).map(s => s.name);
    if (targetNames.length === 0) return '';

    // Find in history transition leaving that step (fromStep matches)
    // Sort history by time descending to find latest
    const sortedHistory = [...row.history].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const match = sortedHistory.find(h => h.fromStep && targetNames.includes(h.fromStep));
    if (match) return match.time;

    return '';
  };

  const formatDurationDays = (ms: number) => {
    if (ms <= 0) return '0天';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}天`;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) return `${hours}小时`;
    const mins = Math.floor(ms / (1000 * 60));
    return `${mins || 1}分钟`;
  };

  const calculateField = (row: any, calcType: string) => {
    const createdTime = new Date(row.createdAt).getTime();
    const nowTime = new Date().getTime();

    // Find completed state
    const currentAttr = getStepAttributeByName(row.status, row.__sourceType);
    const isCompleted = currentAttr === '完成';

    // Time completed (entered '完成' node)
    let completedTime = nowTime;
    if (isCompleted && row.history) {
      const compHistory = row.history.find((h: any) => h.toStep && getStepAttributeByName(h.toStep, row.__sourceType) === '完成');
      if (compHistory) {
        completedTime = new Date(compHistory.time).getTime();
      }
    }

    switch (calcType) {
      case 'process_time': {
        // Total duration
        const duration = isCompleted ? (completedTime - createdTime) : (nowTime - createdTime);
        return formatDurationDays(duration);
      }
      case 'approval_time': {
        // Find history inside '审批' step attributes
        if (!row.history || row.history.length === 0) return '0天';
        let approvalMs = 0;
        // Simple heuristic: find duration between entering '审批' and leaving '审批'
        let enterTime: number | null = null;
        row.history.forEach((h: any) => {
          const toAttr = getStepAttributeByName(h.toStep, row.__sourceType);
          const fromAttr = h.fromStep ? getStepAttributeByName(h.fromStep, row.__sourceType) : '无';
          
          if (toAttr === '审批' && !enterTime) {
            enterTime = new Date(h.time).getTime();
          }
          if (fromAttr === '审批' && enterTime) {
            approvalMs += (new Date(h.time).getTime() - enterTime);
            enterTime = null;
          }
        });
        // If currently in approval
        if (currentAttr === '审批' && enterTime) {
          approvalMs += (nowTime - enterTime);
        }
        return formatDurationDays(approvalMs);
      }
      case 'stay_days': {
        // Find when we entered current step
        let enterCurrentStepTime = createdTime;
        if (row.history && row.history.length > 0) {
          const latestEnter = [...row.history]
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .find(h => h.toStep === row.status);
          if (latestEnter) {
            enterCurrentStepTime = new Date(latestEnter.time).getTime();
          }
        }
        return formatDurationDays(nowTime - enterCurrentStepTime);
      }
      case 'is_overdue': {
        if (!row.dueDate) return '正常';
        const dueTimestamp = new Date(row.dueDate).getTime();
        const pastDue = !isCompleted && nowTime > dueTimestamp;
        return pastDue ? '⚠️ 已超期' : '正常';
      }
      case 'exec_days': {
        const duration = isCompleted ? (completedTime - createdTime) : (nowTime - createdTime);
        return formatDurationDays(duration);
      }
      default:
        return '';
    }
  };

  // --------------------------------------------------------
  // Cell reading & parsing engine
  // --------------------------------------------------------
  const getCellValue = (row: any, col: ViewColumnConfig, ledger: DataCenterConfig): string => {
    const cat = col.category || 'business';

    if (cat === 'business') {
      const val = row[col.field];
      if (val === undefined || val === null) return '';

      if (col.field === 'supplierId') {
        const sup = suppliers.find(s => s.id === val);
        return sup ? sup.name : '未关联';
      }
      if (col.field === 'owners' && Array.isArray(val)) {
        return val.map(email => {
          const u = users.find(usr => usr.email === email);
          return u ? u.name : email;
        }).join(', ') || '未指派';
      }
      if (col.field === 'tags' && Array.isArray(val)) {
        return val.join(', ') || '-';
      }
      if (col.field === 'isUrgent') {
        return val ? '⚠️ 紧急' : '普通';
      }
      if (col.field === 'amount') {
        return val ? `${Number(val).toLocaleString()} 元` : '0.00';
      }
      if (col.field === 'dueDate' || col.field === 'createdAt') {
        return val ? val.split('T')[0] : '';
      }
      return String(val);
    }

    if (cat === 'status') {
      if (col.field === 'status') return row.status;
      if (col.field === 'status_attribute') return getStepAttributeByName(row.status, row.__sourceType);
      if (col.field === 'status_color') {
        const color = getStepColorByName(row.status);
        const map: Record<string, string> = { yellow: '🟡 普通交互', green: '🟢 流转等待', blue: '🔵 归档结算', red: '🔴 异常挂起' };
        return map[color] || '🟢 流程推进';
      }
      if (col.field === 'status_template') return row.templateName || '系统默认流转模板';
      if (col.field === 'status_is_completed') {
        return getStepAttributeByName(row.status, row.__sourceType) === '完成' ? '✅ 已归档' : '⏳ 流转中';
      }
      if (col.field === 'status_is_exception') {
        const color = getStepColorByName(row.status);
        return color === 'red' ? '⚠️ 状态异常' : '正常';
      }
      return '';
    }

    if (cat === 'history') {
      return getHistoryTimeForAttribute(row, col.attrLink || '结算').split(' ')[0] || '-';
    }

    if (cat === 'calc') {
      return calculateField(row, col.calcType || 'process_time');
    }

    if (cat === 'manual') {
      return ledger.manualValues?.[row.id]?.[col.field] || '';
    }

    return '';
  };

  const getLedgerRows = (config: DataCenterConfig) => {
    const sources = config.dataSources && config.dataSources.length > 0 
      ? config.dataSources 
      : [config.dataSource];

    let allRows: any[] = [];
    
    sources.forEach(src => {
      let rawItems: any[] = [];
      if (src === 'pre') {
        rawItems = projects;
      } else if (src === 'purchase') {
        rawItems = contracts.filter(c => c.contractType === 'purchase');
      } else if (src === 'service') {
        rawItems = contracts.filter(c => c.contractType === 'service');
      } else if (src === 'bid') {
        rawItems = bids;
      }

      rawItems.forEach(item => {
        allRows.push({
          ...item,
          __sourceType: src,
          __originalItem: item
        });
      });
    });

    return allRows;
  };

  // --------------------------------------------------------
  // Data ingestion & filtering
  // --------------------------------------------------------
  const getProcessedRows = () => {
    if (!activeConfig) return [];

    // Ingest combined rows
    const sources = activeConfig.dataSources && activeConfig.dataSources.length > 0
      ? activeConfig.dataSources
      : [activeConfig.dataSource];

    let combined: any[] = [];
    sources.forEach(src => {
      let raw: any[] = [];
      let label = '';
      if (src === 'pre') { raw = projects; label = '前置需求'; }
      else if (src === 'purchase') { raw = contracts.filter(c => c.contractType === 'purchase'); label = '采购合同'; }
      else if (src === 'service') { raw = contracts.filter(c => c.contractType === 'service'); label = '服务合同'; }
      else if (src === 'bid') { raw = bids; label = '投标标书'; }

      raw.forEach(item => {
        combined.push({
          ...item,
          __sourceType: src,
          __sourceLabel: label,
          __originalItem: item
        });
      });
    });

    // 1. Text Query Search Box
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(row => {
        return activeConfig.columns.filter(c => c.visible).some(col => {
          const val = getCellValue(row, col, activeConfig).toLowerCase();
          return val.includes(q);
        });
      });
    }

    // 2. Excel Funnel Filters
    Object.keys(excelFilters).forEach(field => {
      const allowed = excelFilters[field];
      if (allowed && allowed.length > 0) {
        const col = activeConfig.columns.find(c => c.field === field);
        if (col) {
          combined = combined.filter(row => {
            const cellVal = getCellValue(row, col, activeConfig) || '(空白)';
            return allowed.includes(cellVal);
          });
        }
      }
    });

    // 3. Sorting Config
    if (activeConfig.sorts && activeConfig.sorts.length > 0) {
      combined = [...combined].sort((a, b) => {
        for (const s of activeConfig.sorts) {
          const col = activeConfig.columns.find(c => c.field === s.field);
          if (!col) continue;
          const valA = getCellValue(a, col, activeConfig);
          const valB = getCellValue(b, col, activeConfig);

          // Numeric comparison if digits
          const numA = Number(valA.replace(/[^0-9.-]/g, ''));
          const numB = Number(valB.replace(/[^0-9.-]/g, ''));
          if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
            if (numA !== numB) {
              return s.direction === 'asc' ? numA - numB : numB - numA;
            }
          } else {
            if (valA !== valB) {
              return s.direction === 'asc' 
                ? valA.localeCompare(valB, 'zh-CN') 
                : valB.localeCompare(valA, 'zh-CN');
            }
          }
        }
        return 0;
      });
    }

    return combined;
  };

  const processedRows = getProcessedRows();

  // --------------------------------------------------------
  // Cell Inline editing write back to databases
  // --------------------------------------------------------
  const handleSaveCell = (row: any, field: string, val: string) => {
    const col = activeConfig.columns.find(c => c.field === field);
    if (!col) return;

    if (col.category === 'manual') {
      // Save to manual values
      setConfigs(prev => prev.map(c => {
        if (c.id === activeConfig.id) {
          const mValues = c.manualValues || {};
          const rowValues = mValues[row.id] || {};
          return {
            ...c,
            manualValues: {
              ...mValues,
              [row.id]: {
                ...rowValues,
                [field]: val
              }
            }
          };
        }
        return c;
      }));
      addSystemLog(`[在线台账] 更新了自定义单元格 [${col.label}]: ${val}`);
    } else if (col.category === 'business') {
      // Write back to database!
      let parsedValue: any = val;
      if (field === 'amount') {
        parsedValue = val.replace(/[^0-9.]/g, '');
      }

      if (row.__sourceType === 'pre') {
        updateProject(row.id, { [field]: parsedValue });
      } else if (row.__sourceType === 'purchase' || row.__sourceType === 'service') {
        updateContract(row.id, { [field]: parsedValue });
      } else if (row.__sourceType === 'bid') {
        updateBid(row.id, { [field]: parsedValue });
      }
      addSystemLog(`[数据库回写] 单元格直接改动并同步底层表字段 [${FIELD_TRANSLATIONS[field] || field}]: ${val}`);
    }
    setEditingCell(null);
  };

  // --------------------------------------------------------
  // Creation Flow Action handlers
  // --------------------------------------------------------
  const handleStartCreation = () => {
    setNewLedgerName(`在线台账 #${configs.length + 1}`);
    setNewLedgerSources(['purchase']);
    setCreateStep(1);
    setIsCreateModalOpen(true);
  };

  const toggleSourceCheckbox = (src: DataSourceType) => {
    if (newLedgerSources.includes(src)) {
      if (newLedgerSources.length > 1) {
        setNewLedgerSources(prev => prev.filter(s => s !== src));
      }
    } else {
      setNewLedgerSources(prev => [...prev, src]);
    }
  };

  const handleFinishCreation = () => {
    if (!newLedgerName.trim()) {
      alert('请输入台账名称！');
      return;
    }

    // Assemble column configurations
    const assembledColumns: ViewColumnConfig[] = [];
    let orderIndex = 1;

    // Collect checked fields across all selected sources
    const uniqueFields = new Set<string>();
    newLedgerSources.forEach(src => {
      const selectedFields = sourceFieldSelection[src];
      selectedFields.forEach(f => uniqueFields.add(f));
    });

    // Add source badge indicator as first column
    assembledColumns.push({
      field: '__sourceLabel',
      label: '数据源分类',
      visible: true,
      order: orderIndex++,
      width: 100,
      category: 'status'
    });

    // Add business fields
    uniqueFields.forEach(f => {
      if (f === 'status') return; // Skip status since it is added below as standard column
      assembledColumns.push({
        field: f,
        label: FIELD_TRANSLATIONS[f] || f,
        visible: true,
        order: orderIndex++,
        width: f === 'name' ? 200 : 130,
        category: 'business'
      });
    });

    // Add current workflow status as standard column
    assembledColumns.push({
      field: 'status',
      label: '工作流节点',
      visible: true,
      order: orderIndex++,
      width: 120,
      category: 'status'
    });

    const newConfig: DataCenterConfig = {
      id: `ledger-${Date.now()}`,
      name: `📋 ${newLedgerName.trim()}`,
      type: 'view',
      isStarred: false,
      dataSource: newLedgerSources[0], // fallback
      dataSources: newLedgerSources,
      filters: [],
      columns: assembledColumns,
      sorts: [],
      customFields: [],
      manualValues: {},
      createdAt: new Date().toISOString()
    };

    setConfigs(prev => [...prev, newConfig]);
    setSelectedConfigId(newConfig.id);
    setIsCreateModalOpen(false);
    addSystemLog(`[在线台账] 成功创建了多源在线台账: ${newConfig.name} (聚合了 ${newLedgerSources.map(s => FIELD_TRANSLATIONS[s] || s).join(', ')} 数据源)`);
  };

  // --------------------------------------------------------
  // Columns manipulation and settings
  // --------------------------------------------------------
  const handleShiftColumn = (field: string, direction: 'left' | 'right') => {
    const cols = [...activeConfig.columns].sort((a, b) => a.order - b.order);
    const idx = cols.findIndex(c => c.field === field);
    if (idx === -1) return;

    if (direction === 'left' && idx > 0) {
      const temp = cols[idx].order;
      cols[idx].order = cols[idx - 1].order;
      cols[idx - 1].order = temp;
    } else if (direction === 'right' && idx < cols.length - 1) {
      const temp = cols[idx].order;
      cols[idx].order = cols[idx + 1].order;
      cols[idx + 1].order = temp;
    }

    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? { ...c, columns: cols } : c));
  };

  const handleToggleColumnVis = (field: string) => {
    setConfigs(prev => prev.map(c => {
      if (c.id === activeConfig.id) {
        return {
          ...c,
          columns: c.columns.map(col => col.field === field ? { ...col, visible: !col.visible } : col)
        };
      }
      return c;
    }));
  };

  // Header click triggers instant Excel-style sorting
  const handleToggleColumnSort = (field: string) => {
    const existing = activeConfig.sorts?.find(s => s.field === field);
    let updatedSorts: ViewSortConfig[] = [];
    
    if (!existing) {
      updatedSorts = [{ field, direction: 'asc' }];
    } else if (existing.direction === 'asc') {
      updatedSorts = [{ field, direction: 'desc' }];
    } else {
      updatedSorts = [];
    }

    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? { ...c, sorts: updatedSorts } : c));
  };

  // Resize column header via mouse drag
  const handleResizeHeader = (e: React.MouseEvent, field: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const currentCol = activeConfig.columns.find(c => c.field === field);
    const startWidth = currentCol?.width || 120;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const finalWidth = Math.max(60, startWidth + delta);
      setConfigs(prev => prev.map(c => {
        if (c.id === activeConfig.id) {
          return {
            ...c,
            columns: c.columns.map(col => col.field === field ? { ...col, width: finalWidth } : col)
          };
        }
        return c;
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // --------------------------------------------------------
  // Add Column wizard handlers
  // --------------------------------------------------------
  const handleOpenAddCol = () => {
    setNewColCategory('business');
    setNewColBusinessField('code');
    setNewColStatusField('status');
    setNewColHistoryAttr('结算');
    setNewColCalcType('process_time');
    setNewColManualLabel('');
    setIsAddColModalOpen(true);
  };

  const handleConfirmAddCol = () => {
    let finalField = '';
    let finalLabel = '';
    
    if (newColCategory === 'business') {
      finalField = newColBusinessField;
      finalLabel = FIELD_TRANSLATIONS[newColBusinessField] || newColBusinessField;
    } else if (newColCategory === 'status') {
      finalField = newColStatusField;
      const match = STATUS_FIELDS_OPTIONS.find(o => o.value === newColStatusField);
      finalLabel = match ? match.label.split(' (')[0] : newColStatusField;
    } else if (newColCategory === 'history') {
      finalField = `history_${newColHistoryAttr}`;
      finalLabel = `${newColHistoryAttr}时间`;
    } else if (newColCategory === 'calc') {
      finalField = `calc_${newColCalcType}`;
      const match = CALC_FIELDS_OPTIONS.find(o => o.value === newColCalcType);
      finalLabel = match ? match.label.split(' (')[0] : newColCalcType;
    } else if (newColCategory === 'manual') {
      if (!newColManualLabel.trim()) {
        alert('请输入自定义列的名称！');
        return;
      }
      finalField = `manual_${Date.now()}`;
      finalLabel = newColManualLabel.trim();
    }

    // Check if column already exists
    if (activeConfig.columns.some(c => c.field === finalField)) {
      alert('该显示列已经在在线台账中，无需重复添加！');
      return;
    }

    const newColumn: ViewColumnConfig = {
      field: finalField,
      label: finalLabel,
      visible: true,
      order: activeConfig.columns.length + 1,
      width: 140,
      category: newColCategory,
      attrLink: newColCategory === 'history' ? newColHistoryAttr : undefined,
      calcType: newColCategory === 'calc' ? newColCalcType : undefined
    };

    setConfigs(prev => prev.map(c => {
      if (c.id === activeConfig.id) {
        return {
          ...c,
          columns: [...c.columns, newColumn]
        };
      }
      return c;
    }));

    setIsAddColModalOpen(false);
    addSystemLog(`[在线台账] 新增显示列: 【${finalLabel}】 (分类: ${newColCategory})`);
  };

  const handleDeleteColumn = (field: string) => {
    if (window.confirm('确认要将该列从当前的在线台账中彻底移除吗？')) {
      setConfigs(prev => prev.map(c => {
        if (c.id === activeConfig.id) {
          return {
            ...c,
            columns: c.columns.filter(col => col.field !== field)
          };
        }
        return c;
      }));
      addSystemLog(`[在线台账] 移除了显示列: ${field}`);
    }
  };

  const handleDeleteLedger = (id: string, name: string) => {
    if (configs.length <= 1) {
      alert('系统必须保留至少一个在线台账，无法删除唯一的配置！');
      return;
    }
    if (window.confirm(`⚠️ 危险：确认将在线台账【${name}】彻底删除吗？删除后此台账结构及手工备注字段不可恢复！`)) {
      const remaining = configs.filter(c => c.id !== id);
      setConfigs(remaining);
      setSelectedConfigId(remaining[0].id);
      addSystemLog(`[在线台账] 彻底删除了台账配置: ${name}`);
    }
  };

  const handleRenameLedgerTitle = () => {
    if (!tempTitle.trim()) return;
    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? { ...c, name: tempTitle.trim() } : c));
    setIsEditingTitle(false);
    addSystemLog(`[在线台账] 已重命名台账名称为: ${tempTitle.trim()}`);
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, isStarred: !c.isStarred } : c));
  };

  // --------------------------------------------------------
  // Excel-style funnel filter actions
  // --------------------------------------------------------
  const getColumnUniqueValues = (col: ViewColumnConfig) => {
    const sources = activeConfig.dataSources && activeConfig.dataSources.length > 0
      ? activeConfig.dataSources
      : [activeConfig.dataSource];

    let combined: any[] = [];
    sources.forEach(src => {
      let raw: any[] = [];
      if (src === 'pre') raw = projects;
      else if (src === 'purchase') raw = contracts.filter(c => c.contractType === 'purchase');
      else if (src === 'service') raw = contracts.filter(c => c.contractType === 'service');
      else if (src === 'bid') raw = bids;

      raw.forEach(item => {
        combined.push({
          ...item,
          __sourceType: src,
          __originalItem: item
        });
      });
    });

    const values = combined.map(row => getCellValue(row, col, activeConfig) || '(空白)');
    return Array.from(new Set(values));
  };

  const toggleFunnelCheckbox = (field: string, val: string) => {
    const currentChecked = excelFilters[field] || [];
    let updated: string[] = [];
    if (currentChecked.includes(val)) {
      updated = currentChecked.filter(item => item !== val);
    } else {
      updated = [...currentChecked, val];
    }
    setExcelFilters(prev => ({
      ...prev,
      [field]: updated
    }));
  };

  const handleClearColumnFilter = (field: string) => {
    setExcelFilters(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
    setActiveFilterDropdown(null);
  };

  const handleApplyColumnFilterSelectAll = (field: string, values: string[]) => {
    setExcelFilters(prev => ({
      ...prev,
      [field]: values
    }));
  };

  const handleClearAllFilters = () => {
    setExcelFilters({});
    setSearchQuery('');
    addSystemLog(`[在线台账] 清空了所有的表格查询与漏斗筛选状态`);
  };

  // --------------------------------------------------------
  // Excel simulated export (with audit logging)
  // --------------------------------------------------------
  const handleExportToExcel = () => {
    const headers = activeConfig.columns.filter(c => c.visible).map(c => c.label);
    addSystemLog(`[数据中心] 成功导出在线台账【${activeConfig.name}】，包含 ${processedRows.length} 行数据，${headers.length} 个导出维度`);
    alert(`📥 已经成功生成并模拟物理下载 Excel 文件：\n【${activeConfig.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')}_${new Date().toISOString().split('T')[0]}.xlsx】\n\n已安全汇集 ${processedRows.length} 行底层业务数据并生成自定义手工列，适合汇报展示。`);
  };

  // Star-sorted ledgers list
  const sortedConfigs = [...configs].sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className={`space-y-4 relative pb-12 animate-fade-in ${isFullScreen ? 'fixed inset-0 z-40 bg-slate-50 p-6 overflow-auto flex flex-col' : 'max-w-none w-full mx-auto'}`}>
      
      {/* 📊 Brand Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">📊</span>
            <span>采购决策数据应用中心 V2 (Online Ledgers)</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 font-normal animate-pulse">
              ● 自动维护中
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            像使用 Excel 一样简单地建立、浏览和维护数据台账。底层工作流同步推进、自动回写数据库、支持智能计算和用户手工备注，彻底释放生产力。
          </p>
        </div>
        
        {/* Actions header group */}
        <div className="flex items-center space-x-2 mt-3 md:mt-0">
          <button
            onClick={handleClearAllFilters}
            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-3xs cursor-pointer flex items-center space-x-1"
            title="清空当前表格上的所有筛选"
          >
            <RotateCcw size={13} className="text-slate-400" />
            <span>清空所有筛选</span>
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg shadow-3xs cursor-pointer flex items-center space-x-1"
            title={isFullScreen ? '退出全屏' : '全屏宽视界使用'}
          >
            {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullScreen ? '退出全屏' : '全屏视界'}</span>
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-5 gap-5 items-start ${isFullScreen ? 'flex-1 min-h-0' : ''}`}>
        
        {/* ========================================================= */}
        {/* LEFT COMPONENT: ONLINE LEDGERS SELECTOR AND LISTS          */}
        {/* ========================================================= */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center space-x-1.5">
              <Database size={12} className="text-slate-400" />
              <span>我的在线台账</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">共 {configs.length} 个</span>
          </div>

          {/* Create LEDGER big Excel styled button */}
          <button
            onClick={handleStartCreation}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Plus size={14} />
            <span>＋ 新建在线台账</span>
          </button>

          {/* Scrollable Ledger list */}
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {sortedConfigs.map(c => {
              const isActive = c.id === selectedConfigId;
              const rawCount = getLedgerRows(c).length;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedConfigId(c.id);
                    setExcelFilters({});
                    setEditingCell(null);
                    setIsEditingTitle(false);
                  }}
                  className={`group w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-between border ${
                    isActive 
                      ? 'bg-slate-800 border-slate-800 text-white font-bold shadow-2xs' 
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-slate-300 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <button
                      onClick={(e) => handleToggleStar(c.id, e)}
                      className={`hover:scale-110 transition-transform ${
                        c.isStarred ? 'text-amber-400' : 'text-slate-300 group-hover:text-slate-400'
                      }`}
                    >
                      <Star size={13} fill={c.isStarred ? 'currentColor' : 'none'} />
                    </button>
                    <span className="truncate">{c.name.replace(/^[^\s]+ /, '')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 ml-1.5">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-500'}`}>
                      {rawCount}行
                    </span>
                    {!isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLedger(c.id, c.name);
                        }}
                        className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all"
                        title="删除台账"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="p-3 bg-blue-50/40 rounded-lg border border-blue-100/50 text-[11px] text-blue-700 space-y-1.5">
              <div className="font-bold flex items-center space-x-1">
                <Info size={11} className="text-blue-600" />
                <span>自动维护法则</span>
              </div>
              <p className="leading-relaxed text-slate-500">
                在线台账不是一次性的查询结果，而是与业务表单数据实时绑定的数据通道。每当您在工作台更新项目状态或新签署合同，此处的台账便会自动重算并完美渲染，零手工统计。
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COMPONENT: SPREADSHEET VIEWER AND GRIDS             */}
        {/* ========================================================= */}
        <div className={`lg:col-span-4 space-y-3 flex flex-col ${isFullScreen ? 'flex-1 min-h-0' : ''}`}>
          
          {activeConfig ? (
            <div className={`space-y-3 ${isFullScreen ? 'flex flex-col flex-1 min-h-0' : ''}`}>
              
              {/* 1. Dashboard Ribbon with Title & Operations */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <button
                    onClick={(e) => handleToggleStar(activeConfig.id, e)}
                    className={`hover:scale-110 transition-transform ${
                      activeConfig.isStarred ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'
                    }`}
                  >
                    <Star size={18} fill={activeConfig.isStarred ? 'currentColor' : 'none'} />
                  </button>

                  {isEditingTitle ? (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameLedgerTitle()}
                        className="px-2 py-1 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                        autoFocus
                      />
                      <button
                        onClick={handleRenameLedgerTitle}
                        className="p-1 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 cursor-pointer"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setIsEditingTitle(false)}
                        className="p-1 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 truncate">
                      <h3 className="text-base font-bold text-slate-800 truncate">
                        {activeConfig.name.replace(/^[^\s]+ /, '')}
                      </h3>
                      <button
                        onClick={() => {
                          setIsEditingTitle(true);
                          setTempTitle(activeConfig.name);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 transition-colors"
                        title="重命名台账"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  )}

                  {/* Badges of sources */}
                  <div className="hidden md:flex items-center space-x-1 shrink-0">
                    {(activeConfig.dataSources || [activeConfig.dataSource]).map(src => (
                      <span key={src} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                        {src === 'pre' ? '前置需求' : src === 'purchase' ? '采购合同' : src === 'service' ? '服务合同' : '标书'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Operations Ribbon */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={handleOpenAddCol}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg cursor-pointer transition-colors flex items-center space-x-1"
                  >
                    <Plus size={13} />
                    <span>新增列</span>
                  </button>

                  <button
                    onClick={() => setIsColumnPanelOpen(!isColumnPanelOpen)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center space-x-1 border ${
                      isColumnPanelOpen 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <SlidersHorizontal size={13} />
                    <span>列排版与显示</span>
                    <ChevronDown size={12} className={`transform transition-transform ${isColumnPanelOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <button
                    onClick={handleExportToExcel}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer transition-colors flex items-center space-x-1"
                  >
                    <FileSpreadsheet size={13} />
                    <span>导出 Excel</span>
                  </button>
                </div>
              </div>

              {/* 2. Collapsible Column Configurator drawer */}
              {isColumnPanelOpen && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3 animate-slide-down shrink-0">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <Columns size={12} className="text-blue-500" />
                      <span>列顺序与可见性设置</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">(拖动台账表头或使用下方按钮配置列的排版)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {activeConfig.columns
                      .sort((a, b) => a.order - b.order)
                      .map((col, index, arr) => {
                        let catBadge = '';
                        let catStyle = '';
                        if (col.category === 'business') { catBadge = '业务'; catStyle = 'bg-blue-50 text-blue-600 border-blue-200'; }
                        else if (col.category === 'status') { catBadge = '流转'; catStyle = 'bg-purple-50 text-purple-600 border-purple-200'; }
                        else if (col.category === 'history') { catBadge = '历史'; catStyle = 'bg-amber-50 text-amber-600 border-amber-200'; }
                        else if (col.category === 'calc') { catBadge = '智能'; catStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200'; }
                        else { catBadge = '手工'; catStyle = 'bg-slate-50 text-slate-600 border-slate-200'; }

                        return (
                          <div
                            key={col.field}
                            className={`p-2 rounded-lg border flex items-center justify-between text-xs transition-all ${
                              col.visible 
                                ? 'bg-slate-50 border-slate-200 text-slate-800 font-medium' 
                                : 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400 opacity-60'
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 truncate">
                              <button
                                onClick={() => handleToggleColumnVis(col.field)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                                title={col.visible ? '隐藏此列' : '显示此列'}
                              >
                                {col.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                              </button>
                              <span className="truncate" title={col.label}>{col.label}</span>
                              <span className={`text-[9px] px-1 rounded-sm border shrink-0 scale-90 ${catStyle}`}>
                                {catBadge}
                              </span>
                            </div>

                            <div className="flex items-center space-x-0.5 shrink-0 ml-1">
                              <button
                                onClick={() => handleShiftColumn(col.field, 'left')}
                                disabled={index === 0}
                                className="p-0.5 text-slate-400 hover:bg-slate-100 disabled:opacity-20 rounded"
                                title="向左移动"
                              >
                                <MoveUp size={10} className="transform -rotate-90" />
                              </button>
                              <button
                                onClick={() => handleShiftColumn(col.field, 'right')}
                                disabled={index === arr.length - 1}
                                className="p-0.5 text-slate-400 hover:bg-slate-100 disabled:opacity-20 rounded"
                                title="向右移动"
                              >
                                <MoveDown size={10} className="transform -rotate-90" />
                              </button>
                              {col.field !== 'name' && col.field !== 'status' && col.field !== '__sourceLabel' && (
                                <button
                                  onClick={() => handleDeleteColumn(col.field)}
                                  className="p-0.5 text-slate-300 hover:text-rose-600 rounded"
                                  title="移除此列"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 3. Search and stats row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                {/* Search query input */}
                <div className="relative w-full sm:max-w-xs">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="输入检索词进行过滤筛选..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-3xs"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-400 flex items-center space-x-3.5">
                  <span>符合过滤条件的台账条目数: <span className="font-bold text-blue-600 font-mono text-sm">{processedRows.length}</span> / <span className="font-mono">{getLedgerRows(activeConfig).length}</span> 项</span>
                  {Object.keys(excelFilters).length > 0 && (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      🛡️ 激活了 {Object.keys(excelFilters).length} 个字段的漏斗过滤
                    </span>
                  )}
                </div>
              </div>

              {/* 4. EXCEL-STYLE INTERACTIVE DATA GRID */}
              <div className={`border border-slate-200 rounded-xl bg-white overflow-auto shadow-3xs relative ${isFullScreen ? 'flex-1 min-h-0' : 'max-h-[560px]'}`}>
                <table className="w-full border-collapse text-left table-fixed">
                  
                  {/* Table Header */}
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="w-12 text-center text-slate-400 font-mono text-xs border-r border-slate-200 select-none py-2.5 bg-slate-50">
                        Row
                      </th>
                      
                      {activeConfig.columns
                        .filter(c => c.visible)
                        .sort((a, b) => a.order - b.order)
                        .map(col => {
                          const isSorted = activeConfig.sorts?.find(s => s.field === col.field);
                          const isFiltered = excelFilters[col.field] && excelFilters[col.field].length > 0;

                          let catBadge = '';
                          let catBadgeStyle = '';
                          if (col.category === 'business') { catBadge = '业务'; catBadgeStyle = 'bg-blue-100 text-blue-700'; }
                          else if (col.category === 'status') { catBadge = '流转'; catBadgeStyle = 'bg-purple-100 text-purple-700'; }
                          else if (col.category === 'history') { catBadge = '历史'; catBadgeStyle = 'bg-amber-100 text-amber-700'; }
                          else if (col.category === 'calc') { catBadge = '智能'; catBadgeStyle = 'bg-emerald-100 text-emerald-700'; }
                          else if (col.category === 'manual') { catBadge = '手工'; catBadgeStyle = 'bg-slate-200 text-slate-700'; }

                          return (
                            <th
                              key={col.field}
                              style={{ width: col.width || 130 }}
                              className="relative font-bold text-slate-700 text-xs border-r border-slate-200 px-3 py-2.5 hover:bg-slate-100/80 group select-none transition-colors"
                            >
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center space-x-1.5 min-w-0">
                                  {/* Sort Trigger Label */}
                                  <span 
                                    className="truncate cursor-pointer hover:text-blue-600 font-bold"
                                    onClick={() => handleToggleColumnSort(col.field)}
                                    title="点击进行升序/降序排列"
                                  >
                                    {col.label}
                                  </span>
                                  {isSorted && (
                                    <span className="text-blue-500 text-[10px] font-mono">
                                      {isSorted.direction === 'asc' ? '▲' : '▼'}
                                    </span>
                                  )}
                                  <span className={`text-[8px] px-1 rounded-sm shrink-0 scale-90 ${catBadgeStyle}`}>
                                    {catBadge}
                                  </span>
                                </div>

                                {/* Excel Funnel filter trigger button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterSearchQuery('');
                                    setActiveFilterDropdown(activeFilterDropdown === col.field ? null : col.field);
                                  }}
                                  className={`p-1 rounded hover:bg-slate-200 cursor-pointer shrink-0 transition-colors ${
                                    isFiltered ? 'text-amber-500 bg-amber-50' : 'text-slate-400 opacity-60 hover:opacity-100'
                                  }`}
                                  title="漏斗筛选器"
                                >
                                  <Filter size={11} fill={isFiltered ? 'currentColor' : 'none'} />
                                </button>
                              </div>

                              {/* Column resize drag border handler */}
                              <div
                                onMouseDown={(e) => handleResizeHeader(e, col.field)}
                                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 hover:w-2 group-hover:bg-slate-200 transition-colors z-20"
                                title="左右拖动调整此列宽"
                              />

                              {/* Excel-style interactive Filter popup inside header cell */}
                              {activeFilterDropdown === col.field && (
                                <div
                                  ref={dropdownRef}
                                  className="absolute top-full right-1 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-slate-700 min-w-[200px] z-50 animate-slide-down font-normal"
                                >
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                                    <span className="text-xs font-bold text-slate-500">
                                      {col.label} 漏斗过滤
                                    </span>
                                    <button 
                                      onClick={() => handleClearColumnFilter(col.field)}
                                      className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                                    >
                                      清空
                                    </button>
                                  </div>

                                  {/* Filter values search */}
                                  <input
                                    type="text"
                                    placeholder="搜索选项..."
                                    value={filterSearchQuery}
                                    onChange={(e) => setFilterSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] mb-2 focus:outline-none"
                                  />

                                  {/* Checkbox unique values list */}
                                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                                    {(() => {
                                      const allVals = getColumnUniqueValues(col);
                                      const filteredVals = allVals.filter(v => v.toLowerCase().includes(filterSearchQuery.toLowerCase()));
                                      
                                      return (
                                        <>
                                          <div className="flex items-center space-x-1.5 py-0.5 border-b border-slate-50">
                                            <button
                                              type="button"
                                              onClick={() => handleApplyColumnFilterSelectAll(col.field, allVals)}
                                              className="text-[10px] text-blue-500 hover:underline cursor-pointer"
                                            >
                                              全选
                                            </button>
                                            <span className="text-slate-300">|</span>
                                            <button
                                              type="button"
                                              onClick={() => handleClearColumnFilter(col.field)}
                                              className="text-[10px] text-blue-500 hover:underline cursor-pointer"
                                            >
                                              清空
                                            </button>
                                          </div>
                                          {filteredVals.map(v => {
                                            const isChecked = (excelFilters[col.field] || []).includes(v);
                                            return (
                                              <label key={v} className="flex items-center space-x-2 py-0.5 hover:bg-slate-50 rounded px-1 cursor-pointer truncate">
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={() => toggleFunnelCheckbox(col.field, v)}
                                                  className="rounded text-blue-600 focus:ring-0 cursor-pointer h-3 w-3"
                                                />
                                                <span className="truncate">{v}</span>
                                              </label>
                                            );
                                          })}
                                        </>
                                      );
                                    })()}
                                  </div>

                                  <div className="border-t border-slate-100 pt-2 mt-2 flex justify-end">
                                    <button
                                      onClick={() => setActiveFilterDropdown(null)}
                                      className="px-2.5 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 cursor-pointer"
                                    >
                                      确定
                                    </button>
                                  </div>
                                </div>
                              )}
                            </th>
                          );
                        })}
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-150">
                    {processedRows.length === 0 ? (
                      <tr>
                        <td colSpan={activeConfig.columns.filter(c => c.visible).length + 1} className="py-12 text-center text-slate-400 text-xs font-semibold">
                          没有符合过滤筛选条件的台账记录。可以尝试 “清空所有筛选” 或双击进行数据补录。
                        </td>
                      </tr>
                    ) : (
                      processedRows.map((row, idx) => {
                        return (
                          <tr key={`${row.__sourceType}-${row.id}`} className="hover:bg-slate-50/75 transition-colors">
                            <td className="text-center text-slate-400 font-mono text-xs border-r border-slate-200 bg-slate-50 py-2">
                              {idx + 1}
                            </td>
                            
                            {activeConfig.columns
                              .filter(c => c.visible)
                              .sort((a, b) => a.order - b.order)
                              .map(col => {
                                const val = getCellValue(row, col, activeConfig);
                                const isEditing = editingCell?.rowId === row.id && editingCell?.field === col.field;
                                const isEditable = col.category === 'business' || col.category === 'manual';

                                return (
                                  <td
                                    key={col.field}
                                    onDoubleClick={() => {
                                      if (isEditable) {
                                        setEditingCell({ rowId: row.id, field: col.field });
                                        // For editing raw business field we look up raw value
                                        const rawVal = col.category === 'business' ? row[col.field] : (activeConfig.manualValues?.[row.id]?.[col.field] || '');
                                        setTempEditValue(rawVal ? String(rawVal) : '');
                                      }
                                    }}
                                    className={`border-r border-slate-150 px-3 py-1.5 text-xs text-slate-700 font-medium truncate relative ${
                                      isEditable ? 'hover:bg-blue-50/35 cursor-cell group/cell' : 'bg-slate-50/20'
                                    }`}
                                  >
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={tempEditValue}
                                        onChange={(e) => setTempEditValue(e.target.value)}
                                        onBlur={() => handleSaveCell(row, col.field, tempEditValue)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveCell(row, col.field, tempEditValue);
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                        className="w-full h-full bg-white border border-blue-500 focus:ring-0 outline-none px-1.5 py-0.5 rounded text-xs font-medium text-slate-800"
                                        autoFocus
                                      />
                                    ) : (
                                      <div className="flex items-center justify-between w-full">
                                        <span className={`truncate ${col.field === 'code' ? 'font-mono text-[11px] text-slate-500' : ''}`} title={val}>
                                          {val || <span className="text-slate-300 italic font-normal">(空白)</span>}
                                        </span>
                                        {isEditable && (
                                          <span className="opacity-0 group-hover/cell:opacity-100 text-[9px] text-blue-500 font-mono scale-90 shrink-0 select-none">
                                            ✎ 双击编辑
                                          </span>
                                        )}
                                        {!isEditable && (
                                          <Lock size={9} className="text-slate-300 shrink-0 opacity-0 group-hover/cell:opacity-60" title="只读属性列 (自动计算)" />
                                        )}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              请选择或创建一个在线台账！
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* DIALOG 1: CREATION FLOW WIZARD ASSISTANT                   */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-2xs animate-fade-in">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-lg w-full flex flex-col p-6 space-y-5 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  新建数据库在线台账 (LEDGER CREATION)
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  像 Excel 一样聚合多模块数据源，由程序引擎全自动重算和维护。
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={16} />
              </button>
            </div>

            {/* Stepper indicator */}
            <div className="flex items-center justify-center space-x-3 text-xs font-bold border-b border-slate-50 pb-2">
              <div className={`flex items-center space-x-1 ${createStep === 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${createStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</span>
                <span>数据来源 (多选)</span>
              </div>
              <span className="text-slate-300">➔</span>
              <div className={`flex items-center space-x-1 ${createStep === 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${createStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</span>
                <span>选取字段显示</span>
              </div>
            </div>

            {/* STEP 1: Select Data Sources */}
            {createStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">在线台账名称:</label>
                  <input
                    type="text"
                    value={newLedgerName}
                    onChange={(e) => setNewLedgerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                    placeholder="例如: 成本统计台账 / 付款完成追踪..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">数据源选择 (勾选您希望合并的数据块):</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    
                    <div 
                      onClick={() => toggleSourceCheckbox('pre')}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        newLedgerSources.includes('pre') 
                          ? 'border-blue-600 bg-blue-50/30' 
                          : 'border-slate-150 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newLedgerSources.includes('pre')}
                          onChange={() => {}} // handled by parent onClick
                          className="rounded text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-700">前置需求</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">包含轮机长提交的询价、比价和备件会签进度</p>
                    </div>

                    <div 
                      onClick={() => toggleSourceCheckbox('purchase')}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        newLedgerSources.includes('purchase') 
                          ? 'border-blue-600 bg-blue-50/30' 
                          : 'border-slate-150 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newLedgerSources.includes('purchase')}
                          onChange={() => {}}
                          className="rounded text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-700">采购合同</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">包含签署好的物理备件/物料买卖与付款合同</p>
                    </div>

                    <div 
                      onClick={() => toggleSourceCheckbox('service')}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        newLedgerSources.includes('service') 
                          ? 'border-blue-600 bg-blue-50/30' 
                          : 'border-slate-150 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newLedgerSources.includes('service')}
                          onChange={() => {}}
                          className="rounded text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-700">服务合同</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">船舶厂修、物料运输等服务类协作合同</p>
                    </div>

                    <div 
                      onClick={() => toggleSourceCheckbox('bid')}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        newLedgerSources.includes('bid') 
                          ? 'border-blue-600 bg-blue-50/30' 
                          : 'border-slate-150 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newLedgerSources.includes('bid')}
                          onChange={() => {}}
                          className="rounded text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-700">投标标书</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">包含商业投标项目及杨总签字归档信息</p>
                    </div>

                  </div>
                </div>

                <div className="pt-2 border-t border-slate-50 flex justify-end">
                  <button
                    onClick={() => setCreateStep(2)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    下一步：选择字段显示 ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Choose Fields to Display */}
            {createStep === 2 && (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                <p className="text-xs text-slate-500 leading-relaxed">
                  请为每种选中的数据源，选择需要显示的列。程序底层未对应的字段将自动填充为<b>(空白)</b>，方便统一排版。
                </p>

                <div className="space-y-4">
                  {newLedgerSources.map(src => {
                    const fields = DB_FIELDS_BY_SOURCE[src];
                    const selected = sourceFieldSelection[src];
                    const label = src === 'pre' ? '前置需求' : src === 'purchase' ? '采购合同' : src === 'service' ? '服务合同' : '投标标书';

                    return (
                      <div key={src} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-150 pb-1">
                          <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>{label} 字段选择</span>
                          </span>
                          <span className="text-[10px] text-slate-400">已选 {selected.length} 个</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {fields.map(f => {
                            const isChecked = selected.includes(f.value);
                            return (
                              <label key={f.value} className="flex items-center space-x-2 py-0.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    let updated = [...selected];
                                    if (isChecked) {
                                      updated = updated.filter(item => item !== f.value);
                                    } else {
                                      updated = [...updated, f.value];
                                    }
                                    setSourceFieldSelection(prev => ({
                                      ...prev,
                                      [src]: updated
                                    }));
                                  }}
                                  className="rounded text-blue-600 cursor-pointer"
                                />
                                <span className="text-slate-600 font-semibold">{f.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
                  <button
                    onClick={() => setCreateStep(1)}
                    className="px-3.5 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    🠔 返回上一步
                  </button>
                  <button
                    onClick={handleFinishCreation}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    🚀 确认生成台账
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG 2: ADD COLUMN WIZARD                                */}
      {/* ========================================================= */}
      {isAddColModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-2xs animate-fade-in">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-md w-full flex flex-col p-6 space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-slate-150 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  新建显示列 (ADD COLUMN WIZARD)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  精确定位列来源，系统将根据来源自动重算与渲染单元格内容。
                </p>
              </div>
              <button onClick={() => setIsAddColModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category radio select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">第一步：选择列来源分类:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { val: 'business', label: '① 数据库字段', desc: '关联底层数据，可双击直接回写' },
                    { val: 'status', label: '② 当前流程状态', desc: '展示当前步骤及完成、异常状态' },
                    { val: 'history', label: '③ 流程历史', desc: '读取某一属性节点被切换完的时间' },
                    { val: 'calc', label: '④ 智能计算', desc: '办理耗时、超期异常等实时计算' },
                    { val: 'manual', label: '⑤ 用户自定义列', desc: '当前台账独立手工输入列，不写回库' }
                  ].map(opt => (
                    <div
                      key={opt.val}
                      onClick={() => setNewColCategory(opt.val as any)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col text-left justify-between ${
                        newColCategory === opt.val 
                          ? 'border-blue-600 bg-blue-50/20' 
                          : 'border-slate-150 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                      <p className="text-[9px] text-slate-400 mt-1 leading-tight">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Dynamic config based on category */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <label className="text-xs font-bold text-slate-500">第二步：配置该列的字段参数:</label>
                
                {newColCategory === 'business' && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block mb-1">请选取需要映射的业务模型物理字段：</span>
                    <select
                      value={newColBusinessField}
                      onChange={(e) => setNewColBusinessField(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700"
                    >
                      {BUSINESS_FIELDS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {newColCategory === 'status' && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block mb-1">请选择流程状态属性：</span>
                    <select
                      value={newColStatusField}
                      onChange={(e) => setNewColStatusField(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700"
                    >
                      {STATUS_FIELDS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {newColCategory === 'history' && (
                  <div className="space-y-2">
                    <span className="text-[11px] text-slate-400 block">
                      选择流程节点属性（读取离开该阶段进入下一阶段的切换时间，系统通过 Node Attribute 统一读取不同模板下同义节点）：
                    </span>
                    <select
                      value={newColHistoryAttr}
                      onChange={(e) => setNewColHistoryAttr(e.target.value as StepAttribute)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <option value="申请">申请时间 (Application)</option>
                      <option value="审批">审批完成时间 (Approval)</option>
                      <option value="采购">采购时间 (Procurement)</option>
                      <option value="签约">签约签署时间 (Contracting)</option>
                      <option value="到货">到货时间 (Delivery)</option>
                      <option value="验收">验收完成时间 (Acceptance)</option>
                      <option value="结算">结算时间 (Settlement)</option>
                      <option value="付款">付款完成时间 (Payment)</option>
                      <option value="寄出">寄出寄送时间 (Dispatch)</option>
                      <option value="完成">归档完成时间 (Completion)</option>
                      <option value="异常">异常挂起时间 (Exception)</option>
                    </select>
                  </div>
                )}

                {newColCategory === 'calc' && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block mb-1">请选择内置的实时智能计算公式：</span>
                    <select
                      value={newColCalcType}
                      onChange={(e) => setNewColCalcType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700"
                    >
                      {CALC_FIELDS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {newColCategory === 'manual' && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block mb-1">请输入该自定义备注列的表头名称:</span>
                    <input
                      type="text"
                      placeholder="例如: 财务复核备注 / 轮机长已核对..."
                      value={newColManualLabel}
                      onChange={(e) => setNewColManualLabel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 placeholder-slate-400"
                    />
                  </div>
                )}
              </div>

            </div>

            <div className="pt-3 border-t border-slate-150 flex justify-end shrink-0">
              <button
                onClick={handleConfirmAddCol}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                💾 确认追加到台账
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
