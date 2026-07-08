import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Star, Database, Plus, Trash2, Edit2, Columns, Filter, ArrowUpDown, 
  ChevronDown, ChevronRight, Save, Copy, Check, X, Search, FileSpreadsheet,
  AlertCircle, Info, MoveUp, MoveDown, Eye, EyeOff, Maximize2, Minimize2,
  Sparkles, SlidersHorizontal, Calculator, History, FileCheck, Layers, Settings2,
  ChevronLeft, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { useAppState } from '../context/AppContext';
import { 
  DataSourceType, SHIPS, MEMBERS, ViewFilterConfig, ViewSortConfig
} from '../types';

// Extend column config for V2
export interface V2ColumnConfig {
  field: string;         // Unique key, e.g. 'code', 'custom_123'
  label: string;         // Column name
  visible: boolean;
  width: number;
  order: number;
  
  // V2 Additions
  columnSource: 'db' | 'state' | 'history' | 'calc' | 'manual';
  
  // For 'db' or 'state'
  dbField?: string;      // e.g. 'code', 'name', 'status', 'isUrgent'
  
  // For 'history'
  historyConfig?: {
    nodeAttr: string;    // Node attribute name, e.g. '结算'
    metric: 'enter_time' | 'complete_time' | 'passed' | 'stay_time' | 'latency_between';
    targetNodeAttr?: string; // For latency_between
  };
  
  // For 'calc'
  calcConfig?: {
    op: 'add' | 'sub' | 'count' | 'condition' | 'datediff' | 'percentage' | 'isnull' | 'formula';
    fieldA: string;
    fieldB?: string;
    fieldC?: string;
    constantVal?: string;
  };
}

// Unified Online Ledger Configuration
export interface V2LedgerConfig {
  id: string;
  name: string;
  isStarred: boolean;
  dataSources: DataSourceType[]; // e.g. ['pre', 'purchase']
  filters: ViewFilterConfig[];
  columns: V2ColumnConfig[];
  sorts: ViewSortConfig[];
  manualData: Record<string, Record<string, string>>; // rowId -> fieldKey -> cellValue
  createdAt: string;
}

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
    nodeAttributes,
    addNodeAttribute,
    deleteNodeAttribute,
    updateNodeAttribute,
    addSystemLog
  } = useAppState();

  // 1. Permanently Saved Ledger Configurations State
  const [ledgers, setLedgers] = useState<V2LedgerConfig[]>(() => {
    const saved = localStorage.getItem('p_workbench_datacenter_v2_ledgers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing ledgers V2', e);
      }
    }

    // Default Seed Ledger reflecting real procurement requirements
    const seeds: V2LedgerConfig[] = [
      {
        id: 'ledger-seed-1',
        name: '采购服务综合收支明细台账',
        isStarred: true,
        dataSources: ['purchase', 'service'],
        filters: [],
        columns: [
          { field: 'code', label: '合同编号', visible: true, width: 140, order: 1, columnSource: 'db', dbField: 'code' },
          { field: 'name', label: '合同名称', visible: true, width: 220, order: 2, columnSource: 'db', dbField: 'name' },
          { field: 'ship', label: '所属船舶', visible: true, width: 110, order: 3, columnSource: 'db', dbField: 'ship' },
          { field: 'amount', label: '合同金额', visible: true, width: 130, order: 4, columnSource: 'db', dbField: 'amount' },
          { field: 'supplierId', label: '合作商名称', visible: true, width: 180, order: 5, columnSource: 'db', dbField: 'supplierId' },
          { field: 'status_name', label: '当前所处节点', visible: true, width: 130, order: 6, columnSource: 'state', dbField: 'nodeName' },
          { field: 'status_attr', label: '核心业务属性', visible: true, width: 110, order: 7, columnSource: 'state', dbField: 'nodeAttr' },
          { field: 'is_finished', label: '履行完成状态', visible: true, width: 110, order: 8, columnSource: 'state', dbField: 'isFinished' }
        ],
        sorts: [],
        manualData: {},
        createdAt: new Date().toISOString()
      },
      {
        id: 'ledger-seed-2',
        name: '前置需求项目流转监控账',
        isStarred: false,
        dataSources: ['pre'],
        filters: [],
        columns: [
          { field: 'code', label: '项目编号', visible: true, width: 130, order: 1, columnSource: 'db', dbField: 'code' },
          { field: 'name', label: '项目名称', visible: true, width: 200, order: 2, columnSource: 'db', dbField: 'name' },
          { field: 'ship', label: '所属船舶', visible: true, width: 110, order: 3, columnSource: 'db', dbField: 'ship' },
          { field: 'owners', label: '需求负责人', visible: true, width: 140, order: 4, columnSource: 'db', dbField: 'owners' },
          { field: 'status_name', label: '当前状态', visible: true, width: 130, order: 5, columnSource: 'state', dbField: 'nodeName' },
          { field: 'is_overdue', label: '是否延迟异常', visible: true, width: 110, order: 6, columnSource: 'state', dbField: 'isOverdue' }
        ],
        sorts: [],
        manualData: {},
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('p_workbench_datacenter_v2_ledgers', JSON.stringify(seeds));
    return seeds;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('p_workbench_datacenter_v2_ledgers', JSON.stringify(ledgers));
  }, [ledgers]);

  // Selected Ledger ID
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(() => {
    if (ledgers.length > 0) return ledgers[0].id;
    return null;
  });

  // Active Ledger Lookup
  const activeLedger = useMemo(() => {
    return ledgers.find(l => l.id === selectedLedgerId) || ledgers[0] || null;
  }, [ledgers, selectedLedgerId]);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [isSortsPanelOpen, setIsSortsPanelOpen] = useState(false);
  const [isNodeAttrModalOpen, setIsNodeAttrModalOpen] = useState(false);
  const [isCreateLedgerModalOpen, setIsCreateLedgerModalOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);

  // Creating Ledger States
  const [newLedgerName, setNewLedgerName] = useState('');
  const [newLedgerSources, setNewLedgerSources] = useState<DataSourceType[]>(['purchase']);
  const [selectedImportFields, setSelectedImportFields] = useState<string[]>(['code', 'name', 'ship', 'amount', 'supplierId', 'nodeName']);

  // Adding Column States
  const [newColSource, setNewColSource] = useState<'db' | 'state' | 'history' | 'calc' | 'manual'>('db');
  const [newColLabel, setNewColLabel] = useState('');
  // Source 1 (db)
  const [newColDbField, setNewColDbField] = useState('code');
  // Source 2 (state)
  const [newColStateField, setNewColStateField] = useState('nodeName');
  // Source 3 (history)
  const [newColHistMetric, setNewColHistMetric] = useState<'enter_time' | 'complete_time' | 'passed' | 'stay_time' | 'latency_between'>('enter_time');
  const [newColHistNodeAttr, setNewColHistNodeAttr] = useState('');
  const [newColHistTargetNodeAttr, setNewColHistTargetNodeAttr] = useState('');
  // Source 4 (calc)
  const [newColCalcOp, setNewColCalcOp] = useState<'add' | 'sub' | 'count' | 'condition' | 'datediff' | 'percentage' | 'isnull' | 'formula'>('add');
  const [newColCalcFieldA, setNewColCalcFieldA] = useState('');
  const [newColCalcFieldB, setNewColCalcFieldB] = useState('');
  const [newColCalcFieldC, setNewColCalcFieldC] = useState('');
  const [newColCalcConstant, setNewColCalcConstant] = useState('');

  // Inline Cell Edit States
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [tempEditValue, setTempEditValue] = useState('');

  // Node Attribute Management States
  const [newNodeAttr, setNewNodeAttr] = useState('');
  const [editingNodeAttr, setEditingNodeAttr] = useState<string | null>(null);
  const [editingNodeAttrValue, setEditingNodeAttrValue] = useState('');

  // Notification / Success Alerts
  const [appAlert, setAppAlert] = useState<{ type: 'success' | 'info'; title: string; message: string } | null>(null);

  // Status Resolvers inside local context
  const getProjectStatusName = (p: any): string => {
    if (!p) return '';
    const statusVal = typeof p === 'string' ? p : p.status;
    const templateId = typeof p === 'string' ? undefined : p.templateId;
    const tpl = (templateId ? workflowTemplates.find(t => t.id === templateId) : null) || 
                workflowTemplates.find(t => t.module === 'pre' && t.isDefault) ||
                workflowTemplates.find(t => t.module === 'pre');
    const steps = tpl?.steps || preWorkflow;
    let step = steps.find(s => s.id === statusVal || s.name === statusVal);
    
    if (!step && typeof p === 'string') {
      for (const t of workflowTemplates.filter(t => t.module === 'pre')) {
        step = t.steps.find(s => s.id === statusVal || s.name === statusVal);
        if (step) break;
      }
    }
    return step ? step.name : statusVal;
  };

  const getContractStatusName = (c: any): string => {
    if (!c) return '';
    const statusVal = typeof c === 'string' ? c : c.status;
    const templateId = typeof c === 'string' ? undefined : c.templateId;
    const contractType = typeof c === 'string' ? undefined : c.contractType;
    const moduleType = contractType === 'service' ? 'service' : 'purchase';
    const tpl = (templateId ? workflowTemplates.find(t => t.id === templateId) : null) || 
                workflowTemplates.find(t => t.module === moduleType && t.isDefault) ||
                workflowTemplates.find(t => t.module === moduleType) ||
                workflowTemplates.find(t => t.module === 'purchase');
    const steps = tpl?.steps || (contractType === 'service' ? postServiceWorkflow : postWorkflow);
    let step = steps.find(s => s.id === statusVal || s.name === statusVal);
    
    if (!step && typeof c === 'string') {
      for (const t of workflowTemplates.filter(t => t.module === 'purchase' || t.module === 'service')) {
        step = t.steps.find(s => s.id === statusVal || s.name === statusVal);
        if (step) break;
      }
    }
    return step ? step.name : statusVal;
  };

  const getBidStatusName = (b: any): string => {
    if (!b) return '';
    const statusVal = typeof b === 'string' ? b : b.status;
    const templateId = typeof b === 'string' ? undefined : b.templateId;
    const tpl = (templateId ? workflowTemplates.find(t => t.id === templateId) : null) || 
                workflowTemplates.find(t => t.module === 'bid' && t.isDefault) ||
                workflowTemplates.find(t => t.module === 'bid');
    const steps = tpl?.steps || bidWorkflow;
    let step = steps.find(s => s.id === statusVal || s.name === statusVal);
    
    if (!step && typeof b === 'string') {
      for (const t of workflowTemplates.filter(t => t.module === 'bid')) {
        step = t.steps.find(s => s.id === statusVal || s.name === statusVal);
        if (step) break;
      }
    }
    return step ? step.name : statusVal;
  };

  // Raw Field Mapping lookup
  const FIELD_METADATA_MAP: Record<string, string> = {
    code: '编号 / 合同号',
    name: '业务名称',
    ship: '所属船舶',
    amount: '合同/项目金额',
    supplierId: '合作公司 / 供应商',
    owners: '归属负责人',
    dueDate: '收收付/截止日期',
    createdAt: '创建/签署时间',
    tags: '标签分类',
    remark: '备注说明'
  };

  // Node Attribute Lists Initialization
  useEffect(() => {
    if (nodeAttributes.length > 0 && !newColHistNodeAttr) {
      setNewColHistNodeAttr(nodeAttributes[0]);
      setNewColHistTargetNodeAttr(nodeAttributes[0]);
    }
  }, [nodeAttributes]);

  // ----------------------------------------------------------------------
  // DYNAMIC COMPILATION OF MERGED DATA SOURCES (ONLINE COEXISTENCE)
  // ----------------------------------------------------------------------
  
  // Create logical rows uniting active data sources
  const compiledRows = useMemo(() => {
    if (!activeLedger) return [];
    
    const rows: { id: string; sourceType: DataSourceType; original: any }[] = [];
    
    activeLedger.dataSources.forEach(source => {
      if (source === 'pre') {
        projects.forEach(p => {
          rows.push({ id: p.id, sourceType: 'pre', original: p });
        });
      } else if (source === 'purchase') {
        contracts.filter(c => c.contractType === 'purchase').forEach(c => {
          rows.push({ id: c.id, sourceType: 'purchase', original: c });
        });
      } else if (source === 'service') {
        contracts.filter(c => c.contractType === 'service').forEach(c => {
          rows.push({ id: c.id, sourceType: 'service', original: c });
        });
      } else if (source === 'bid') {
        bids.forEach(b => {
          rows.push({ id: b.id, sourceType: 'bid', original: b });
        });
      }
    });
    
    return rows;
  }, [activeLedger, projects, contracts, bids]);

  // ----------------------------------------------------------------------
  // CELL VALUE RESOLVER (THE CORE COMPUTATION ENGINE)
  // ----------------------------------------------------------------------
  const getCellValue = (row: { id: string; sourceType: DataSourceType; original: any }, col: V2ColumnConfig): string => {
    const item = row.original;
    const sourceType = row.sourceType;
    
    // 1. Business Fields
    if (col.columnSource === 'db') {
      const dbField = col.dbField || col.field;
      const val = item[dbField];
      
      if (dbField === 'supplierId' && val) {
        const sup = suppliers.find(s => s.id === val);
        return sup ? sup.name : val;
      }
      if (dbField === 'owners' && Array.isArray(val)) {
        return val.map(email => {
          const u = users.find(usr => usr.email === email);
          return u ? u.name : email;
        }).join(', ');
      }
      if (dbField === 'tags' && Array.isArray(val)) {
        return val.join(', ');
      }
      if (dbField === 'amount') {
        return val ? `¥${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
      }
      return val !== undefined && val !== null ? String(val) : '-';
    }
    
    // 2. Current Workflow States
    if (col.columnSource === 'state') {
      const stateField = col.dbField || col.field;
      
      if (stateField === 'nodeName') {
        if (sourceType === 'pre') return getProjectStatusName(item);
        if (sourceType === 'purchase' || sourceType === 'service') return getContractStatusName(item);
        if (sourceType === 'bid') return getBidStatusName(item);
        return item.status || '-';
      }
      
      if (stateField === 'nodeColor') {
        const tpl = workflowTemplates.find(t => t.id === item.templateId) ||
                    workflowTemplates.find(t => t.module === (sourceType === 'pre' ? 'pre' : sourceType === 'bid' ? 'bid' : sourceType === 'service' ? 'service' : 'purchase') && t.isDefault) ||
                    workflowTemplates.find(t => t.module === (sourceType === 'pre' ? 'pre' : sourceType === 'bid' ? 'bid' : sourceType === 'service' ? 'service' : 'purchase'));
        const steps = tpl?.steps || (sourceType === 'pre' ? preWorkflow : sourceType === 'bid' ? bidWorkflow : sourceType === 'service' ? postServiceWorkflow : postWorkflow);
        const step = steps.find(s => s.id === item.status) || steps.find(s => s.name === item.status);
        return step?.color || 'yellow';
      }
      
      if (stateField === 'nodeAttr') {
        const tpl = workflowTemplates.find(t => t.id === item.templateId) ||
                    workflowTemplates.find(t => t.module === (sourceType === 'pre' ? 'pre' : sourceType === 'bid' ? 'bid' : sourceType === 'service' ? 'service' : 'purchase') && t.isDefault) ||
                    workflowTemplates.find(t => t.module === (sourceType === 'pre' ? 'pre' : sourceType === 'bid' ? 'bid' : sourceType === 'service' ? 'service' : 'purchase'));
        const steps = tpl?.steps || (sourceType === 'pre' ? preWorkflow : sourceType === 'bid' ? bidWorkflow : sourceType === 'service' ? postServiceWorkflow : postWorkflow);
        const step = steps.find(s => s.id === item.status) || steps.find(s => s.name === item.status);
        return step?.nodeAttribute || '未绑定';
      }
      
      if (stateField === 'templateName') {
        return item.templateName || workflowTemplates.find(t => t.id === item.templateId)?.name || '系统默认模板';
      }
      
      if (stateField === 'isFinished') {
        const tpl = workflowTemplates.find(t => t.id === item.templateId) ||
                    workflowTemplates.find(t => t.module === (sourceType === 'pre' ? 'pre' : sourceType === 'bid' ? 'bid' : sourceType === 'service' ? 'service' : 'purchase') && t.isDefault) ||
                    workflowTemplates.find(t => t.module === (sourceType === 'pre' ? 'pre' : sourceType === 'bid' ? 'bid' : sourceType === 'service' ? 'service' : 'purchase'));
        const steps = tpl?.steps || (sourceType === 'pre' ? preWorkflow : sourceType === 'bid' ? bidWorkflow : sourceType === 'service' ? postServiceWorkflow : postWorkflow);
        const isLast = steps.length > 0 && (steps[steps.length - 1].id === item.status || steps[steps.length - 1].name === item.status);
        return isLast ? '✅ 已归档完成' : '🔄 流程执行中';
      }
      
      if (stateField === 'isOverdue') {
        if (!item.dueDate) return '正常';
        const isPast = new Date(item.dueDate) < new Date();
        return isPast ? '🚨 异常 (已延期)' : '🟢 正常履约中';
      }
    }
    
    // 3. Workflow History (Reads process logs)
    if (col.columnSource === 'history') {
      const config = col.historyConfig;
      if (!config) return '-';
      const historyList = item.history || [];
      
      // helper to find all step IDs belonging to a node attribute or matching step name
      const getMatchingSteps = (attrOrName: string) => {
        const matchSet = new Set<string>();
        workflowTemplates.forEach(t => t.steps.forEach(s => {
          if (s.nodeAttribute === attrOrName || s.name === attrOrName) matchSet.add(s.id), matchSet.add(s.name);
        }));
        [preWorkflow, postWorkflow, postServiceWorkflow, bidWorkflow].forEach(steps => {
          steps.forEach(s => {
            if (s.nodeAttribute === attrOrName || s.name === attrOrName) matchSet.add(s.id), matchSet.add(s.name);
          });
        });
        return Array.from(matchSet);
      };
      
      const targetSteps = getMatchingSteps(config.nodeAttr);
      
      if (config.metric === 'enter_time') {
        const log = historyList.find((h: any) => targetSteps.includes(h.toStep));
        if (log) return log.time;
        // fallback to creation time if item is at the start step
        if (item.createdAt && targetSteps.includes(item.status)) {
          return item.createdAt.substring(0, 16).replace('T', ' ');
        }
        return '-';
      }
      
      if (config.metric === 'complete_time') {
        // *Default complete rule: leaves the node, i.e., fromStep matches target steps*
        const log = historyList.find((h: any) => h.fromStep && targetSteps.includes(h.fromStep));
        if (log) return log.time;
        return '-';
      }
      
      if (config.metric === 'passed') {
        const passed = historyList.some((h: any) => targetSteps.includes(h.toStep) || (h.fromStep && targetSteps.includes(h.fromStep))) || targetSteps.includes(item.status);
        return passed ? '是' : '否';
      }
      
      if (config.metric === 'stay_time') {
        const enterLog = historyList.find((h: any) => targetSteps.includes(h.toStep));
        const enterTimeStr = enterLog ? enterLog.time : (targetSteps.includes(item.status) ? item.createdAt : null);
        if (!enterTimeStr) return '-';
        
        const leaveLog = historyList.find((h: any) => h.fromStep && targetSteps.includes(h.fromStep));
        const leaveTimeStr = leaveLog ? leaveLog.time : null;
        
        const tStart = new Date(enterTimeStr.replace(' ', 'T'));
        const tEnd = leaveTimeStr ? new Date(leaveTimeStr.replace(' ', 'T')) : new Date();
        const diffDays = Math.max(0, Math.floor((tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60 * 24)));
        return `${diffDays} 天`;
      }
      
      if (config.metric === 'latency_between') {
        const targetStepsB = getMatchingSteps(config.targetNodeAttr || '');
        const leaveLogA = historyList.find((h: any) => h.fromStep && targetSteps.includes(h.fromStep));
        const leaveLogB = historyList.find((h: any) => h.fromStep && targetStepsB.includes(h.fromStep));
        
        if (leaveLogA && leaveLogB) {
          const tA = new Date(leaveLogA.time.replace(' ', 'T'));
          const tB = new Date(leaveLogB.time.replace(' ', 'T'));
          const diffDays = Math.floor(Math.abs(tB.getTime() - tA.getTime()) / (1000 * 60 * 60 * 24));
          return `${diffDays} 天`;
        }
        return '未完成流转';
      }
    }
    
    // 4. Smart Calculated Fields
    if (col.columnSource === 'calc') {
      const config = col.calcConfig;
      if (!config) return '-';
      
      const valA = getCellValueByKey(row, config.fieldA);
      const valB = config.fieldB ? getCellValueByKey(row, config.fieldB) : '';
      const valC = config.fieldC ? getCellValueByKey(row, config.fieldC) : '';
      
      const parseNum = (s: string) => {
        const cleaned = s.replace(/[^\d.-]/g, '');
        const n = Number(cleaned);
        return isNaN(n) ? 0 : n;
      };
      
      if (config.op === 'add') {
        return `¥${(parseNum(valA) + parseNum(valB)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (config.op === 'sub') {
        return `¥${(parseNum(valA) - parseNum(valB)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (config.op === 'count') {
        if (!valA || valA === '-') return '0';
        return String(valA.split(',').length);
      }
      if (config.op === 'condition') {
        const isEmpty = !valA || valA.trim() === '' || valA === '-' || valA === '未指派';
        return isEmpty ? valC : valB;
      }
      if (config.op === 'datediff') {
        if (!valA || !valB || valA === '-' || valB === '-') return '-';
        const dA = new Date(valA);
        const dB = new Date(valB);
        if (isNaN(dA.getTime()) || isNaN(dB.getTime())) return '-';
        const days = Math.floor((dA.getTime() - dB.getTime()) / (1000 * 60 * 60 * 24));
        return `${days} 天`;
      }
      if (config.op === 'percentage') {
        const nA = parseNum(valA);
        const nB = parseNum(valB);
        if (nB === 0) return '0.0%';
        return `${((nA / nB) * 100).toFixed(1)}%`;
      }
      if (config.op === 'isnull') {
        const empty = !valA || valA.trim() === '' || valA === '-' || valA === '未指派';
        return empty ? '是 (空值)' : '否 (非空)';
      }
      if (config.op === 'formula') {
        const nA = parseNum(valA);
        const factor = Number(config.constantVal) || 0;
        return `¥${(nA * factor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
    
    // 5. Manual User Custom Columns (Scoped and saved within this specific ledger config)
    if (col.columnSource === 'manual') {
      const data = activeLedger.manualData || {};
      const rowData = data[row.id] || {};
      return rowData[col.field] || '';
    }
    
    return '-';
  };

  const getCellValueByKey = (row: any, fieldKey: string): string => {
    if (!activeLedger) return '';
    const col = activeLedger.columns.find(c => c.field === fieldKey);
    if (!col) return '';
    return getCellValue(row, col);
  };

  // ----------------------------------------------------------------------
  // LEDGER ROW FILTERING AND SORTING ENGINE
  // ----------------------------------------------------------------------
  const processedRows = useMemo(() => {
    if (!activeLedger) return [];
    
    let result = [...compiledRows];
    
    // 1. Apply configured ledger filters
    if (activeLedger.filters.length > 0) {
      result = result.filter(row => {
        return activeLedger.filters.every(f => {
          const cellValue = getCellValueByKey(row, f.field);
          const currentString = cellValue.toLowerCase();
          const filterValue = f.value.toLowerCase();
          
          switch (f.operator) {
            case 'equals':
              return currentString === filterValue;
            case 'not_equals':
              return currentString !== filterValue;
            case 'contains':
              return currentString.includes(filterValue);
            case 'greater_than_or_equal': {
              const numCell = Number(cellValue.replace(/[^\d.-]/g, ''));
              const numF = Number(f.value);
              if (!isNaN(numCell) && !isNaN(numF)) return numCell >= numF;
              return currentString >= filterValue;
            }
            case 'less_than_or_equal': {
              const numCell = Number(cellValue.replace(/[^\d.-]/g, ''));
              const numF = Number(f.value);
              if (!isNaN(numCell) && !isNaN(numF)) return numCell <= numF;
              return currentString <= filterValue;
            }
            default:
              return true;
          }
        });
      });
    }
    
    // 2. Apply configured sorts
    if (activeLedger.sorts.length > 0) {
      result.sort((a, b) => {
        for (const s of activeLedger.sorts) {
          const valA = getCellValueByKey(a, s.field);
          const valB = getCellValueByKey(b, s.field);
          
          const numA = Number(valA.replace(/[^\d.-]/g, ''));
          const numB = Number(valB.replace(/[^\d.-]/g, ''));
          
          if (!isNaN(numA) && !isNaN(numB) && valA !== '-' && valB !== '-') {
            if (numA < numB) return s.direction === 'asc' ? -1 : 1;
            if (numA > numB) return s.direction === 'asc' ? 1 : -1;
          } else {
            if (valA < valB) return s.direction === 'asc' ? -1 : 1;
            if (valA > valB) return s.direction === 'asc' ? 1 : -1;
          }
        }
        return 0;
      });
    }
    
    // 3. Apply global search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row => {
        return activeLedger.columns.some(col => {
          if (!col.visible) return false;
          const val = getCellValue(row, col);
          return val.toLowerCase().includes(query);
        });
      });
    }
    
    return result;
  }, [activeLedger, compiledRows, searchQuery]);

  // ----------------------------------------------------------------------
  // DYNAMIC COLUMNS ORDER RESOLVER
  // ----------------------------------------------------------------------
  const sortedColumns = useMemo(() => {
    if (!activeLedger) return [];
    return [...activeLedger.columns].sort((a, b) => a.order - b.order);
  }, [activeLedger]);

  // ----------------------------------------------------------------------
  // ACTIONS / HANDLERS
  // ----------------------------------------------------------------------
  
  // Ledger Star toggling
  const handleToggleLedgerStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLedgers(prev => prev.map(l => l.id === id ? { ...l, isStarred: !l.isStarred } : l));
  };

  // Create Ledger (Unified V2 Setup Flow)
  const handleCreateLedger = () => {
    const name = newLedgerName.trim();
    if (!name) {
      alert('请先输入台账名称');
      return;
    }
    if (newLedgerSources.length === 0) {
      alert('请至少选择一个业务数据源');
      return;
    }
    
    const id = `ledger-${Date.now()}`;
    const initialColumns: V2ColumnConfig[] = [];
    let order = 1;

    // Auto generate selected fields as Columns
    selectedImportFields.forEach(field => {
      let colLabel = FIELD_METADATA_MAP[field] || field;
      let source: 'db' | 'state' = 'db';
      if (field === 'nodeName') {
        colLabel = '当前节点状态';
        source = 'state';
      }

      initialColumns.push({
        field: field === 'nodeName' ? 'status_name' : field,
        label: colLabel,
        visible: true,
        width: field === 'name' ? 220 : 130,
        order: order++,
        columnSource: source,
        dbField: field
      });
    });

    // Add Node Attribute by default as helper state column
    initialColumns.push({
      field: 'status_attr',
      label: '业务属性节点',
      visible: true,
      width: 120,
      order: order++,
      columnSource: 'state',
      dbField: 'nodeAttr'
    });

    const newLedger: V2LedgerConfig = {
      id,
      name,
      isStarred: false,
      dataSources: [...newLedgerSources],
      filters: [],
      columns: initialColumns,
      sorts: [],
      manualData: {},
      createdAt: new Date().toISOString()
    };

    setLedgers(prev => [...prev, newLedger]);
    setSelectedLedgerId(id);
    setIsCreateLedgerModalOpen(false);
    
    // reset form
    setNewLedgerName('');
    setNewLedgerSources(['purchase']);
    setSelectedImportFields(['code', 'name', 'ship', 'amount', 'supplierId', 'nodeName']);
    
    addSystemLog(`[在线台账] 新增台账【${name}】配置成功，已自动关联 ${newLedgerSources.join(',')}。`);
  };

  // Add Column (Modular Redesign Step-by-Step UI)
  const handleConfirmAddColumn = () => {
    if (!activeLedger) return;
    const label = newColLabel.trim();
    if (!label) {
      alert('请填写列标题名称');
      return;
    }

    const fieldKey = `col_${newColSource}_${Date.now()}`;
    const nextOrder = activeLedger.columns.length + 1;

    const newCol: V2ColumnConfig = {
      field: fieldKey,
      label,
      visible: true,
      width: 140,
      order: nextOrder,
      columnSource: newColSource
    };

    // Fill configurations depending on chosen Column Source
    if (newColSource === 'db') {
      newCol.dbField = newColDbField;
    } else if (newColSource === 'state') {
      newCol.dbField = newColStateField;
    } else if (newColSource === 'history') {
      newCol.historyConfig = {
        nodeAttr: newColHistNodeAttr,
        metric: newColHistMetric,
        targetNodeAttr: newColHistTargetNodeAttr || undefined
      };
    } else if (newColSource === 'calc') {
      newCol.calcConfig = {
        op: newColCalcOp,
        fieldA: newColCalcFieldA,
        fieldB: newColCalcFieldB || undefined,
        fieldC: newColCalcFieldC || undefined,
        constantVal: newColCalcConstant || undefined
      };
    }

    setLedgers(prev => prev.map(l => {
      if (l.id === activeLedger.id) {
        return {
          ...l,
          columns: [...l.columns, newCol]
        };
      }
      return l;
    }));

    setIsAddColumnModalOpen(false);
    
    // reset column inputs
    setNewColLabel('');
    setNewColSource('db');
    addSystemLog(`[在线台账] 成功为【${activeLedger.name}】追加了「${label}」列（来源属性: ${newColSource}）。`);
  };

  // Remove Column
  const handleRemoveColumn = (field: string, label: string) => {
    if (!activeLedger) return;
    if (confirm(`确定要删除列“${label}”吗？这将在当前台账中永久清除该字段。`)) {
      setLedgers(prev => prev.map(l => {
        if (l.id === activeLedger.id) {
          return {
            ...l,
            columns: l.columns.filter(col => col.field !== field)
          };
        }
        return l;
      }));
      addSystemLog(`[在线台账] 删除了台账【${activeLedger.name}】中的「${label}」列。`);
    }
  };

  // Drag-and-drop simulated / manual Column Move
  const handleMoveColumn = (field: string, direction: 'left' | 'right') => {
    if (!activeLedger) return;
    const cols = [...activeLedger.columns].sort((a, b) => a.order - b.order);
    const index = cols.findIndex(col => col.field === field);
    if (index === -1) return;

    if (direction === 'left' && index > 0) {
      const tempOrder = cols[index - 1].order;
      cols[index - 1].order = cols[index].order;
      cols[index].order = tempOrder;
    } else if (direction === 'right' && index < cols.length - 1) {
      const tempOrder = cols[index + 1].order;
      cols[index + 1].order = cols[index].order;
      cols[index].order = tempOrder;
    }

    setLedgers(prev => prev.map(l => l.id === activeLedger.id ? { ...l, columns: cols } : l));
  };

  // Width adjust
  const handleResizeColumn = (field: string, delta: number) => {
    if (!activeLedger) return;
    setLedgers(prev => prev.map(l => {
      if (l.id === activeLedger.id) {
        return {
          ...l,
          columns: l.columns.map(col => col.field === field ? { ...col, width: Math.max(60, (col.width || 120) + delta) } : col)
        };
      }
      return l;
    }));
  };

  // Toggle Visibility
  const handleToggleColumnVisibility = (field: string) => {
    if (!activeLedger) return;
    setLedgers(prev => prev.map(l => {
      if (l.id === activeLedger.id) {
        return {
          ...l,
          columns: l.columns.map(col => col.field === field ? { ...col, visible: !col.visible } : col)
        };
      }
      return l;
    }));
  };

  // Inline Editing Manual Cells (saves to local config manualData, strictly persistent)
  const handleSaveManualCell = (rowId: string, field: string, val: string) => {
    if (!activeLedger) return;
    setLedgers(prev => prev.map(l => {
      if (l.id === activeLedger.id) {
        const manual = { ...l.manualData };
        if (!manual[rowId]) manual[rowId] = {};
        manual[rowId][field] = val;
        return {
          ...l,
          manualData: manual
        };
      }
      return l;
    }));
    setEditingCell(null);
  };

  // Delete Ledger
  const handleDeleteLedger = (id: string, name: string) => {
    if (confirm(`确定要永久删除台账【${name}】吗？此操作将丢失台账内的自定列排序、手动附加批注等信息，不可撤销。`)) {
      const remaining = ledgers.filter(l => l.id !== id);
      setLedgers(remaining);
      if (selectedLedgerId === id) {
        setSelectedLedgerId(remaining.length > 0 ? remaining[0].id : null);
      }
      addSystemLog(`[在线台账] 删除了台账【${name}】。`);
    }
  };

  // Export to Excel (Generates standard CSV download)
  const handleExportCSV = () => {
    if (!activeLedger) return;
    const activeCols = sortedColumns.filter(c => c.visible);
    const headers = activeCols.map(c => c.label);
    
    // Header row
    let csvContent = '\uFEFF' + headers.join(',') + '\n';
    
    // Body rows
    processedRows.forEach(row => {
      const rowValues = activeCols.map(col => {
        const val = getCellValue(row, col);
        // Clean double quotes
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvContent += rowValues.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeLedger.name}_台账导出_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addSystemLog(`[在线台账] 成功导出台账【${activeLedger.name}】至外部 Excel/CSV，包含 ${processedRows.length} 条数据。`);
    
    setAppAlert({
      type: 'success',
      title: '导出完成',
      message: `台账「${activeLedger.name}」已转换为 Excel 可读的 CSV 文件并自动下载。\n共成功导出 ${processedRows.length} 条合并记录，包含 ${headers.length} 维度属性！`
    });
  };

  // ----------------------------------------------------------------------
  // DYNAMIC CONFIG FOR FILTERS & SORTS
  // ----------------------------------------------------------------------
  const handleAddFilter = () => {
    if (!activeLedger) return;
    const firstCol = activeLedger.columns[0]?.field || '';
    const newFilter: ViewFilterConfig = {
      field: firstCol,
      operator: 'contains',
      value: ''
    };
    setLedgers(prev => prev.map(l => l.id === activeLedger.id ? { ...l, filters: [...l.filters, newFilter] } : l));
  };

  const handleUpdateFilter = (index: number, key: keyof ViewFilterConfig, value: any) => {
    if (!activeLedger) return;
    setLedgers(prev => prev.map(l => {
      if (l.id === activeLedger.id) {
        const list = [...l.filters];
        list[index] = { ...list[index], [key]: value };
        return { ...l, filters: list };
      }
      return l;
    }));
  };

  const handleRemoveFilter = (index: number) => {
    if (!activeLedger) return;
    setLedgers(prev => prev.map(l => l.id === activeLedger.id ? { ...l, filters: l.filters.filter((_, idx) => idx !== index) } : l));
  };

  const handleAddSort = () => {
    if (!activeLedger) return;
    const firstCol = activeLedger.columns[0]?.field || '';
    const newSort: ViewSortConfig = {
      field: firstCol,
      direction: 'asc'
    };
    setLedgers(prev => prev.map(l => l.id === activeLedger.id ? { ...l, sorts: [...l.sorts, newSort] } : l));
  };

  const handleUpdateSort = (index: number, key: keyof ViewSortConfig, value: any) => {
    if (!activeLedger) return;
    setLedgers(prev => prev.map(l => {
      if (l.id === activeLedger.id) {
        const list = [...l.sorts];
        list[index] = { ...list[index], [key]: value };
        return { ...l, sorts: list };
      }
      return l;
    }));
  };

  const handleRemoveSort = (index: number) => {
    if (!activeLedger) return;
    setLedgers(prev => prev.map(l => l.id === activeLedger.id ? { ...l, sorts: l.sorts.filter((_, idx) => idx !== index) } : l));
  };

  // Node Attribute Lists Management
  const handleAddNodeAttr = () => {
    const val = newNodeAttr.trim();
    if (!val) return;
    if (nodeAttributes.includes(val)) {
      alert('属性已存在');
      return;
    }
    addNodeAttribute(val);
    setNewNodeAttr('');
    addSystemLog(`[流程节点属性] 新增了统一业务属性「${val}」。`);
  };

  const handleUpdateNodeAttr = (oldVal: string) => {
    const newVal = editingNodeAttrValue.trim();
    if (!newVal || newVal === oldVal) {
      setEditingNodeAttr(null);
      return;
    }
    updateNodeAttribute(oldVal, newVal);
    setEditingNodeAttr(null);
    addSystemLog(`[流程节点属性] 更新属性「${oldVal}」为「${newVal}」。`);
  };

  const handleDeleteNodeAttr = (val: string) => {
    if (confirm(`确定删除业务属性「${val}」吗？\n这将解除所有工作流模板步骤绑定的对应属性。`)) {
      deleteNodeAttribute(val);
      addSystemLog(`[流程节点属性] 删除了统一业务属性「${val}」。`);
    }
  };

  return (
    <div className={`space-y-6 max-w-7xl mx-auto relative pb-12 animate-fade-in ${isFullScreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto max-w-none' : ''}`}>
      
      {/* 📊 Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">📊</span>
              <span>数据台账中心 V2 (Procurement Ledgers)</span>
            </h2>
            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>数据自动挂载 - 实时响应</span>
            </span>
          </div>
          
          <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1.5 font-medium">
            <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">Slogan</span>
            <span className="italic">“所有复杂的东西交给系统，所有简单的东西留给用户。”</span>
            <span className="text-slate-300">|</span>
            <span>像 Excel 一样，建立由数据库自动维护、实时更新的在线台账</span>
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center space-x-2 mt-3 md:mt-0 shrink-0">
          <button
            onClick={() => setIsNodeAttrModalOpen(true)}
            className="px-3 py-1.8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer"
            title="管理跨模板统一追踪的流程节点属性"
          >
            <Settings2 size={13.5} />
            <span>⚙️ 节点业务属性映射</span>
          </button>
          
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.8 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all cursor-pointer"
            title={isFullScreen ? '退出全屏' : '全屏宽表视图'}
          >
            {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Grid Layout of Ledgers and Active Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Ledger List Drawer */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-3xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-1">
                <Layers size={11} className="text-slate-400" />
                <span>在线台账列表 ({ledgers.length})</span>
              </span>
              
              <button
                onClick={() => setIsCreateLedgerModalOpen(true)}
                className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all shadow-3xs hover:scale-105 cursor-pointer flex items-center justify-center"
                title="创建新台账"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Quick search in left side */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索台账..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-lg pl-8 pr-3 py-1.8 text-xs focus:ring-1 focus:ring-blue-100 focus:outline-none font-medium text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {ledgers.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white">
                  暂无在线台账，请点击右上方加号新建
                </div>
              ) : (
                ledgers.map(l => {
                  const isActive = l.id === selectedLedgerId;
                  return (
                    <div
                      key={l.id}
                      onClick={() => setSelectedLedgerId(l.id)}
                      className={`group p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isActive 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs truncate max-w-[160px]">
                          {l.name}
                        </span>
                        
                        <div className="flex items-center space-x-1 shrink-0 ml-1.5">
                          <button
                            onClick={(e) => handleToggleLedgerStar(l.id, e)}
                            className={`p-0.5 rounded transition-colors ${
                              isActive
                                ? 'text-blue-200 hover:text-yellow-200'
                                : l.isStarred ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'
                            }`}
                          >
                            <Star size={11} fill={l.isStarred ? 'currentColor' : 'none'} />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLedger(l.id, l.name);
                            }}
                            className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                              isActive 
                                ? 'text-blue-100 hover:text-rose-200' 
                                : 'text-slate-300 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 font-mono text-[9px]">
                        <span className={isActive ? 'text-blue-200' : 'text-slate-400'}>
                          数据源: {l.dataSources.map(s => {
                            if (s === 'pre') return '需求';
                            if (s === 'purchase') return '采购合同';
                            if (s === 'service') return '服务合同';
                            if (s === 'bid') return '标书';
                            return s;
                          }).join('/')}
                        </span>
                        <span className={isActive ? 'text-blue-200' : 'text-slate-400'}>
                          {l.columns.length} 维度
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick tips */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-700 space-y-1.5 leading-relaxed font-medium">
            <p className="font-bold flex items-center space-x-1">
              <Info size={11} />
              <span>数据中心 V2 产品设计：</span>
            </p>
            <p>1. 数据自动提取：跨模块并存的多维数据模型，无需任何强制合并和转换。</p>
            <p>2. 节点属性解耦：不限制各流程自定义名称，基于属性聚合映射，实现完美一致追踪。</p>
            <p>3. 智能加总计算：支持多维度业务数据二次智能汇总，完全不占额外存储。</p>
          </div>
        </div>

        {/* Right Side: Active Wide Table */}
        <div className="lg:col-span-9 space-y-4">
          {activeLedger ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
              
              {/* Ledger Configuration Toolbar */}
              <div className="bg-slate-50/50 border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
                    <span className="text-base">📋</span>
                    <span>{activeLedger.name}</span>
                  </h3>
                  
                  <span className="text-slate-300">|</span>
                  
                  {/* Sync status */}
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                    关联源: {activeLedger.dataSources.map(s => {
                      if (s === 'pre') return '前置需求';
                      if (s === 'purchase') return '采购合同';
                      if (s === 'service') return '服务合同';
                      if (s === 'bid') return '投标/标书';
                      return s;
                    }).join(', ')}
                  </span>
                </div>

                {/* Table Interactions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsColumnPanelOpen(!isColumnPanelOpen)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                      isColumnPanelOpen 
                        ? 'bg-blue-50 border border-blue-300 text-blue-700' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Columns size={12} />
                    <span>自定义列 ({activeLedger.columns.length})</span>
                  </button>

                  <button
                    onClick={() => setIsFiltersPanelOpen(!isFiltersPanelOpen)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                      isFiltersPanelOpen || activeLedger.filters.length > 0
                        ? 'bg-amber-50 border border-amber-300 text-amber-700' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Filter size={12} />
                    <span>条件过滤 ({activeLedger.filters.length})</span>
                  </button>

                  <button
                    onClick={() => setIsSortsPanelOpen(!isSortsPanelOpen)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                      isSortsPanelOpen || activeLedger.sorts.length > 0
                        ? 'bg-indigo-50 border border-indigo-300 text-indigo-700' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpDown size={12} />
                    <span>多列排序 ({activeLedger.sorts.length})</span>
                  </button>

                  <span className="text-slate-200">|</span>

                  <button
                    onClick={handleExportCSV}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-3xs transition-all hover:scale-103"
                  >
                    <FileSpreadsheet size={12} />
                    <span>导出为 Excel (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Sub-panels Drawer: Column Toggles / Dragging orders */}
              {isColumnPanelOpen && (
                <div className="bg-slate-50/50 border-b border-slate-200 p-4 space-y-3 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                      <Columns size={13} className="text-blue-500" />
                      <span>配置台账列排版、调整列宽及显示排序</span>
                    </span>
                    <button
                      onClick={() => setIsAddColumnModalOpen(true)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition-all shadow-3xs cursor-pointer flex items-center space-x-1"
                    >
                      <Plus size={12} />
                      <span>新增列 (智能属性)</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-44 overflow-y-auto py-1">
                    {sortedColumns.map(col => {
                      let sourceColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      if (col.columnSource === 'state') sourceColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      if (col.columnSource === 'history') sourceColor = 'bg-purple-50 text-purple-700 border-purple-200';
                      if (col.columnSource === 'calc') sourceColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      if (col.columnSource === 'manual') sourceColor = 'bg-pink-50 text-pink-700 border-pink-200';

                      return (
                        <div key={col.field} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium">
                          <div className="flex items-center space-x-2 truncate">
                            <input
                              type="checkbox"
                              checked={col.visible}
                              onChange={() => handleToggleColumnVisibility(col.field)}
                              className="rounded text-blue-600 focus:ring-blue-100 cursor-pointer"
                            />
                            <span className="truncate max-w-[85px]" title={col.label}>{col.label}</span>
                            <span className={`text-[8px] px-1 rounded-sm border truncate shrink-0 scale-90 ${sourceColor}`}>
                              {col.columnSource === 'db' ? '库' : col.columnSource === 'state' ? '状态' : col.columnSource === 'history' ? '历史' : col.columnSource === 'calc' ? '算' : '手'}
                            </span>
                          </div>
                          
                          {/* Reordering Controls */}
                          <div className="flex items-center space-x-0.5 shrink-0 ml-1.5">
                            <button
                              onClick={() => handleMoveColumn(col.field, 'left')}
                              className="p-0.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded border border-slate-200"
                              title="向左移一位"
                            >
                              <MoveUp size={10} className="rotate-270" />
                            </button>
                            <button
                              onClick={() => handleMoveColumn(col.field, 'right')}
                              className="p-0.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded border border-slate-200"
                              title="向右移一位"
                            >
                              <MoveDown size={10} className="rotate-270" />
                            </button>
                            <button
                              onClick={() => handleResizeColumn(col.field, 20)}
                              className="px-1 py-0.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-[9px] font-mono"
                              title="加宽 20px"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleResizeColumn(col.field, -20)}
                              className="px-1 py-0.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-[9px] font-mono"
                              title="缩窄 20px"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleRemoveColumn(col.field, col.label)}
                              className="p-0.5 text-slate-300 hover:text-rose-600 rounded"
                              title="删除此维度"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-panels Drawer: Filters Config */}
              {isFiltersPanelOpen && (
                <div className="bg-slate-50/50 border-b border-slate-200 p-4 space-y-3 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                      <Filter size={13} className="text-amber-500" />
                      <span>配置动态条件过滤器 (AND 联合生效)</span>
                    </span>
                    <button
                      onClick={handleAddFilter}
                      className="px-2 py-0.8 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold transition-all shadow-3xs cursor-pointer flex items-center space-x-1"
                    >
                      <Plus size={11} />
                      <span>添加新过滤条件</span>
                    </button>
                  </div>

                  {activeLedger.filters.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 bg-white border border-dashed border-slate-250 rounded-lg">
                      目前未应用任何过滤条件。所有合并的数据行均处于加载显示状态。
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {activeLedger.filters.map((filt, idx) => (
                        <div key={idx} className="flex items-center space-x-2 bg-white p-2 border border-slate-200 rounded-lg">
                          <select
                            value={filt.field}
                            onChange={(e) => handleUpdateFilter(idx, 'field', e.target.value)}
                            className="p-1 rounded border border-slate-200 bg-white"
                          >
                            {activeLedger.columns.map(c => (
                              <option key={c.field} value={c.field}>{c.label}</option>
                            ))}
                          </select>

                          <select
                            value={filt.operator}
                            onChange={(e) => handleUpdateFilter(idx, 'operator', e.target.value as any)}
                            className="p-1 rounded border border-slate-200 bg-white font-bold text-slate-600"
                          >
                            <option value="contains">包含 (Contains)</option>
                            <option value="equals">精确匹配 (Equals)</option>
                            <option value="not_equals">不等于 (Not Equals)</option>
                            <option value="greater_than_or_equal">大于或等于 (&gt;=)</option>
                            <option value="less_than_or_equal">小于或等于 (&lt;=)</option>
                          </select>

                          <input
                            type="text"
                            value={filt.value}
                            onChange={(e) => handleUpdateFilter(idx, 'value', e.target.value)}
                            placeholder="过滤阈值..."
                            className="flex-1 p-1 rounded border border-slate-200 font-medium text-slate-700 bg-white"
                          />

                          <button
                            onClick={() => handleRemoveFilter(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-panels Drawer: Sorts Config */}
              {isSortsPanelOpen && (
                <div className="bg-slate-50/50 border-b border-slate-200 p-4 space-y-3 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                      <ArrowUpDown size={13} className="text-indigo-500" />
                      <span>配置多列联合排序规则 (优先级由上至下)</span>
                    </span>
                    <button
                      onClick={handleAddSort}
                      className="px-2 py-0.8 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold transition-all shadow-3xs cursor-pointer flex items-center space-x-1"
                    >
                      <Plus size={11} />
                      <span>添加排序维度</span>
                    </button>
                  </div>

                  {activeLedger.sorts.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 bg-white border border-dashed border-slate-250 rounded-lg">
                      目前未设定自定义排序，数据按系统默认建档时间升序排列。
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {activeLedger.sorts.map((srt, idx) => (
                        <div key={idx} className="flex items-center space-x-2 bg-white p-2 border border-slate-200 rounded-lg">
                          <select
                            value={srt.field}
                            onChange={(e) => handleUpdateSort(idx, 'field', e.target.value)}
                            className="p-1 rounded border border-slate-200 bg-white"
                          >
                            {activeLedger.columns.map(c => (
                              <option key={c.field} value={c.field}>{c.label}</option>
                            ))}
                          </select>

                          <select
                            value={srt.direction}
                            onChange={(e) => handleUpdateSort(idx, 'direction', e.target.value as any)}
                            className="p-1 rounded border border-slate-200 bg-white font-bold text-slate-600"
                          >
                            <option value="asc">升序排列 (A-Z, Low-High)</option>
                            <option value="desc">降序排列 (Z-A, High-Low)</option>
                          </select>

                          <button
                            onClick={() => handleRemoveSort(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* The Excel Ledger Grid (Highly responsive, wide layout) */}
              <div className="overflow-x-auto overflow-y-auto max-h-[500px] border-b border-slate-200">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-100 sticky top-0 z-10 select-none border-b border-slate-200 shadow-3xs">
                      {/* Fixed metadata column */}
                      <th className="w-[110px] bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider p-2.5 text-center font-mono border-r border-slate-200">
                        模块来源
                      </th>
                      
                      {sortedColumns.filter(c => c.visible).map(col => (
                        <th 
                          key={col.field} 
                          style={{ width: `${col.width || 130}px` }}
                          className="bg-slate-100 text-[11px] font-extrabold text-slate-700 p-2.5 border-r border-slate-200 relative group truncate"
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate" title={col.label}>{col.label}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-150">
                    {processedRows.length === 0 ? (
                      <tr>
                        <td 
                          colSpan={sortedColumns.filter(c => c.visible).length + 1} 
                          className="text-center p-16 text-xs text-slate-400 bg-slate-50/50"
                        >
                          没有找到符合当前过滤和查询条件的台账数据。请调整过滤面板或清空查询搜索词。
                        </td>
                      </tr>
                    ) : (
                      processedRows.map((row, rIdx) => {
                        let moduleBadge = 'bg-blue-50 text-blue-700 border-blue-100';
                        let moduleText = '采购合同';
                        if (row.sourceType === 'pre') {
                          moduleBadge = 'bg-amber-50 text-amber-700 border-amber-100';
                          moduleText = '需求项目';
                        } else if (row.sourceType === 'service') {
                          moduleBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                          moduleText = '服务合同';
                        } else if (row.sourceType === 'bid') {
                          moduleBadge = 'bg-purple-50 text-purple-700 border-purple-100';
                          moduleText = '标书投标';
                        }

                        return (
                          <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Source module identifier badge */}
                            <td className="p-2.5 text-center border-r border-slate-200 bg-slate-50/30">
                              <span className={`inline-flex items-center text-[10px] px-1.8 py-0.5 rounded-full border font-bold ${moduleBadge}`}>
                                {moduleText}
                              </span>
                            </td>

                            {sortedColumns.filter(c => c.visible).map(col => {
                              const valueStr = getCellValue(row, col);
                              const isEditableManual = col.columnSource === 'manual';
                              const isEditingThis = editingCell?.rowId === row.id && editingCell?.field === col.field;
                              
                              // Display node color indicator for state color columns
                              const isNodeColor = col.columnSource === 'state' && col.dbField === 'nodeColor';
                              let colorDot = '';
                              if (isNodeColor) {
                                if (valueStr === 'green') colorDot = 'bg-emerald-500 text-emerald-700';
                                else if (valueStr === 'blue') colorDot = 'bg-blue-500 text-blue-700';
                                else if (valueStr === 'red') colorDot = 'bg-rose-500 text-rose-700';
                                else colorDot = 'bg-amber-500 text-amber-700';
                              }

                              return (
                                <td 
                                  key={col.field} 
                                  className={`p-2.5 border-r border-slate-200 text-xs font-medium text-slate-700 truncate ${
                                    isEditableManual ? 'bg-pink-50/5 hover:bg-pink-50/20 cursor-pointer font-bold border-dashed' : ''
                                  }`}
                                  onClick={() => {
                                    if (isEditableManual && !isEditingThis) {
                                      setEditingCell({ rowId: row.id, field: col.field });
                                      setTempEditValue(valueStr);
                                    }
                                  }}
                                  title={isEditableManual ? '双击或选中输入自定内容，仅存留于本台账中' : valueStr}
                                >
                                  {isEditingThis ? (
                                    <input
                                      type="text"
                                      value={tempEditValue}
                                      onChange={(e) => setTempEditValue(e.target.value)}
                                      onBlur={() => handleSaveManualCell(row.id, col.field, tempEditValue)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveManualCell(row.id, col.field, tempEditValue);
                                        else if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                      autoFocus
                                      className="w-full bg-white border border-blue-500 p-1 text-xs focus:outline-none rounded font-bold text-slate-800"
                                    />
                                  ) : isNodeColor ? (
                                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase ${colorDot}`}>
                                      <span>{valueStr}</span>
                                    </span>
                                  ) : (
                                    <span className={col.field === 'code' ? 'font-mono' : ''}>
                                      {valueStr || '-'}
                                    </span>
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

              {/* Table Footer Stats */}
              <div className="bg-slate-50 border-t border-slate-200 p-2.5 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-500 font-mono gap-2">
                <div className="flex items-center space-x-3">
                  <span>共检索到数据 <strong>{processedRows.length}</strong> 行 </span>
                  <span>|</span>
                  <span>关联底层工作流模板数: <strong>{workflowTemplates.length}</strong> </span>
                </div>
                <div>
                  <span>台账安全加载完成：{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-400 space-y-3">
              <span className="text-4xl block">📊</span>
              <p className="font-bold text-slate-600">采购数据台账中心 V2 暂无活跃台账</p>
              <p className="text-xs text-slate-400">您可以在左上角点击“+”创建一个新的 Excel 实时合并台账。</p>
            </div>
          )}
        </div>
      </div>

      {/* ======================= MODAL: CREATE ONLINE LEDGER (STEP-BY-STEP Flow) ======================= */}
      {isCreateLedgerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 max-w-lg w-full p-6 space-y-5 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
                <span className="p-1 bg-blue-50 text-blue-600 rounded">📊</span>
                <span>新建在线台账 (Excel 实时联动)</span>
              </h3>
              <button 
                onClick={() => setIsCreateLedgerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            {/* Slogan card */}
            <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-3 text-xs text-indigo-700 leading-relaxed font-medium">
              在台账里，不应有强制统一的数据模型，不同模块的数据可以并存，系统将自动汇总列模型。
            </div>

            {/* Step 1: Ledger name & source selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                  1. 给新台账起个名字 (Excel Ledger Name)：
                </label>
                <input
                  type="text"
                  placeholder="如: 2026上半年总合同台账、各船舶服务流转监控..."
                  value={newLedgerName}
                  onChange={(e) => setNewLedgerName(e.target.value)}
                  className="w-full px-3 py-1.8 rounded-lg border border-slate-250 text-xs font-semibold focus:ring-1 focus:ring-blue-150 focus:outline-none text-slate-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                  2. 勾选需要聚合的数据源 (支持多选并行)：
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'pre', label: '前置需求项目池 (Demand Projects)' },
                    { key: 'purchase', label: '采购合同文件 (Purchase Contracts)' },
                    { key: 'service', label: '服务合同文件 (Service Contracts)' },
                    { key: 'bid', label: '标书投标池 (Bidding Vault)' }
                  ].map(item => {
                    const checked = newLedgerSources.includes(item.key as DataSourceType);
                    return (
                      <label 
                        key={item.key} 
                        className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          checked 
                            ? 'bg-blue-50/50 border-blue-400 text-blue-800' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setNewLedgerSources(newLedgerSources.filter(s => s !== item.key));
                            } else {
                              setNewLedgerSources([...newLedgerSources, item.key as DataSourceType]);
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-100 mt-0.5 cursor-pointer"
                        />
                        <div>
                          <p className="font-bold text-xs">{item.label.split(' (')[0]}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.label.split(' (')[1].replace(')', '')}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                  3. 选择初始载入显示的业务字段：
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto">
                  {Object.entries(FIELD_METADATA_MAP).map(([key, label]) => {
                    const checked = selectedImportFields.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (checked) {
                            setSelectedImportFields(selectedImportFields.filter(f => f !== key));
                          } else {
                            setSelectedImportFields([...selectedImportFields, key]);
                          }
                        }}
                        className={`px-2.5 py-1 text-[11px] rounded border font-medium transition-all ${
                          checked 
                            ? 'bg-blue-500 border-blue-500 text-white' 
                            : 'bg-white border-slate-250 text-slate-600 hover:border-slate-350'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      const isChecked = selectedImportFields.includes('nodeName');
                      if (isChecked) {
                        setSelectedImportFields(selectedImportFields.filter(f => f !== 'nodeName'));
                      } else {
                        setSelectedImportFields([...selectedImportFields, 'nodeName']);
                      }
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded border font-medium transition-all ${
                      selectedImportFields.includes('nodeName') 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-white border-slate-250 text-slate-600 hover:border-slate-350'
                    }`}
                  >
                    🚀 当前流程节点名称
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={() => setIsCreateLedgerModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleCreateLedger}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-3xs transition-all hover:scale-103 cursor-pointer"
              >
                创建并载入在线台账
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ADD CUSTOM COLUMN (V2 STEP-BY-STEP DESIGN) ======================= */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 max-w-lg w-full p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
                <span className="p-1 bg-indigo-50 text-indigo-600 rounded">➕</span>
                <span>新增台账列维度 (5类列来源定义)</span>
              </h3>
              <button 
                onClick={() => setIsAddColumnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            {/* Input label first */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                第一步: 给追加的列起一个表头标题 (Label)：
              </label>
              <input
                type="text"
                placeholder="如: 实际发票到达时间、利息计算、超期预警、备注批注..."
                value={newColLabel}
                onChange={(e) => setNewColLabel(e.target.value)}
                className="w-full px-3 py-1.8 rounded-lg border border-slate-250 text-xs font-semibold focus:ring-1 focus:ring-indigo-150 focus:outline-none text-slate-700 bg-white"
              />
            </div>

            {/* Step 1: Choose column source */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                第二步: 选择此列的“数据源头机制” (Column Source Type)：
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { key: 'db', title: '① 数据库字段', desc: '读取底层表单字段', icon: <Database size={11} /> },
                  { key: 'state', title: '② 当前流程状态', desc: '读取实时推进进度', icon: <Sparkles size={11} /> },
                  { key: 'history', title: '③ 流程历史耗时', desc: '通过日志解析时效', icon: <History size={11} /> },
                  { key: 'calc', title: '④ 跨列智能计算', desc: '加减/日期差/条件加总', icon: <Calculator size={11} /> },
                  { key: 'manual', title: '⑤ 自定义备注列', desc: '手工自由录入/永久存留', icon: <Edit2 size={11} /> }
                ].map(src => {
                  const active = newColSource === src.key;
                  return (
                    <button
                      key={src.key}
                      onClick={() => setNewColSource(src.key as any)}
                      className={`flex flex-col items-start p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        active 
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-1 ring-indigo-200' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold text-[11px] flex items-center space-x-1">
                        {src.icon}
                        <span>{src.title}</span>
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">{src.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Dynamic config form */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 min-h-[140px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                第三步: 设定对应的源头算法配置：
              </span>

              {/* 1. Database fields selection */}
              {newColSource === 'db' && (
                <div className="space-y-1.5 text-xs">
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    系统将从数据库该行的主记录上直接抽取字段的值：
                  </p>
                  <select
                    value={newColDbField}
                    onChange={(e) => setNewColDbField(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {Object.entries(FIELD_METADATA_MAP).map(([key, val]) => (
                      <option key={key} value={key}>{key} ({val})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 2. Current Workflow state configuration */}
              {newColSource === 'state' && (
                <div className="space-y-1.5 text-xs">
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    调取工作流模板与推进引擎的实时计算属性：
                  </p>
                  <select
                    value={newColStateField}
                    onChange={(e) => setNewColStateField(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-bold text-slate-700"
                  >
                    <option value="nodeName">当前所处流程步骤名称 (e.g. 收到签字对账单)</option>
                    <option value="nodeColor">当前流程节点的报警颜色 (yellow/green/blue/red)</option>
                    <option value="nodeAttr">当前流程步骤所映射的全局业务属性 (e.g. 结算)</option>
                    <option value="templateName">当前行绑定的业务工作流模板名称</option>
                    <option value="isFinished">是否已走完最末端节点归档完成 (是 / 否)</option>
                    <option value="isOverdue">当前是否已超过收付/截止日发生超期异常</option>
                  </select>
                </div>
              )}

              {/* 3. Workflow History logs configuration */}
              {newColSource === 'history' && (
                <div className="space-y-2 text-xs">
                  <div className="bg-purple-100/40 p-2 text-[10px] text-purple-800 rounded border border-purple-100 font-medium">
                    ⚠️ <strong>V2 规范：</strong> 节点的“完成/离开时间”默认为系统离开此节点（即进入下一节点）的动作时刻，而非进入该节点时间，确保时效准确！
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-bold">指标类型 (Metric)：</label>
                      <select
                        value={newColHistMetric}
                        onChange={(e) => setNewColHistMetric(e.target.value as any)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs"
                      >
                        <option value="enter_time">进入节点时间</option>
                        <option value="complete_time">完成/离开节点时间</option>
                        <option value="passed">是否经过该节点 (是/否)</option>
                        <option value="stay_time">在某节点滞留总天数</option>
                        <option value="latency_between">两节点流转流逝耗时</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-bold">节点业务属性 (或节点名称)：</label>
                      <select
                        value={newColHistNodeAttr}
                        onChange={(e) => setNewColHistNodeAttr(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs font-bold"
                      >
                        {nodeAttributes.map(attr => (
                          <option key={attr} value={attr}>{attr}</option>
                        ))}
                        {getWorkflowStepsForSource('purchase').map(name => (
                          <option key={name} value={name}>{name} (节点名称)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {newColHistMetric === 'latency_between' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-bold">到目标节点 (Target Node Attribute)：</label>
                      <select
                        value={newColHistTargetNodeAttr}
                        onChange={(e) => setNewColHistTargetNodeAttr(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs font-bold text-slate-700"
                      >
                        {nodeAttributes.map(attr => (
                          <option key={attr} value={attr}>{attr}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Calculated smart column configuration */}
              {newColSource === 'calc' && (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-bold">运算规则 (Calculation Rule)：</label>
                      <select
                        value={newColCalcOp}
                        onChange={(e) => setNewColCalcOp(e.target.value as any)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs font-bold"
                      >
                        <option value="add">两列数字加和 (+)</option>
                        <option value="sub">两列数字相减 (-)</option>
                        <option value="count">成员/批次计数 (Count)</option>
                        <option value="condition">条件填充 (If empty fill B else C)</option>
                        <option value="datediff">日期天数差值 (Date A - Date B)</option>
                        <option value="percentage">两列百分比占比 (A / B * 100)</option>
                        <option value="isnull">是否为空判定 (Is Null)</option>
                        <option value="formula">乘以固定常量系数 (e.g. A * 0.1 代理费)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-bold">第一操作列 (Operand Column A)：</label>
                      <select
                        value={newColCalcFieldA}
                        onChange={(e) => setNewColCalcFieldA(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs font-semibold text-slate-700"
                      >
                        <option value="">-- 请选择数据源字段 --</option>
                        {activeLedger.columns.map(c => (
                          <option key={c.field} value={c.field}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Operational fields depending on rule */}
                  {['add', 'sub', 'condition', 'datediff', 'percentage'].includes(newColCalcOp) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 font-bold">第二操作列 (Operand Column B)：</label>
                        <select
                          value={newColCalcFieldB}
                          onChange={(e) => setNewColCalcFieldB(e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs text-slate-700"
                        >
                          <option value="">-- 请选择数据源字段 --</option>
                          {activeLedger.columns.map(c => (
                            <option key={c.field} value={c.field}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      {newColCalcOp === 'condition' && (
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1 font-bold">第三操作列 (Operand Column C)：</label>
                          <select
                            value={newColCalcFieldC}
                            onChange={(e) => setNewColCalcFieldC(e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs text-slate-700"
                          >
                            <option value="">-- 请选择数据源字段 --</option>
                            {activeLedger.columns.map(c => (
                              <option key={c.field} value={c.field}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {newColCalcOp === 'formula' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-bold">乘以固定常量 (e.g. 0.06 = 6%税率)：</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.06"
                        value={newColCalcConstant}
                        onChange={(e) => setNewColCalcConstant(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs font-semibold font-mono text-slate-700"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 5. Manual empty input */}
              {newColSource === 'manual' && (
                <div className="space-y-1.5 text-xs text-pink-700">
                  <div className="bg-pink-50 border border-pink-100 rounded-lg p-2.5 leading-relaxed text-[11px] font-medium">
                    💡 <strong>备注特性：</strong> 此列数据完全由采购人员手动在此 Excel 网格内录入双击编辑。
                    单元格的值仅在当前在线台账「{activeLedger.name}」中持久化保存，不写回主合同数据库，适合作为“领导临时备注”、“报送状态”等用途。
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setIsAddColumnModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold text-slate-600 transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddColumn}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-3xs transition-all hover:scale-103 cursor-pointer"
              >
                确定加入此列
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: NODE BUSINESS ATTRIBUTE MAPPING MANAGER ======================= */}
      {isNodeAttrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 max-w-md w-full p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
                <span className="p-1 bg-indigo-50 text-indigo-600 rounded">⚙️</span>
                <span>管理跨模板映射节点属性</span>
              </h3>
              <button 
                onClick={() => setIsNodeAttrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-medium bg-slate-50 border border-slate-150 p-3 rounded-lg">
              通过绑定统一的业务节点属性，即使不同模板中的步骤名称五花八门，数据中心仍能准确追踪（例如：将采购合同的“收到签字对账单”与服务合同的“服务验收完成”统一绑定为“结算”属性）。
            </p>

            {/* Quick add */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                添加新通用业务属性：
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  placeholder="如: 开票、签章、退单、付款申请..."
                  value={newNodeAttr}
                  onChange={(e) => setNewNodeAttr(e.target.value)}
                  className="flex-1 px-3 py-1.8 rounded-lg border border-slate-250 text-xs font-semibold focus:ring-1 focus:ring-indigo-150 focus:outline-none text-slate-700 bg-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNodeAttr()}
                />
                <button
                  onClick={handleAddNodeAttr}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-3xs transition-all cursor-pointer"
                >
                  添加
                </button>
              </div>
            </div>

            {/* Attribute list */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                当前属性列表 ({nodeAttributes.length})：
              </label>
              <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-150 bg-slate-50/50">
                {nodeAttributes.map((attr, idx) => {
                  const isEditingThis = editingNodeAttr === attr;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white text-xs hover:bg-slate-50/50 transition-colors">
                      {isEditingThis ? (
                        <div className="flex items-center space-x-1.5 flex-1 mr-2">
                          <input
                            type="text"
                            value={editingNodeAttrValue}
                            onChange={(e) => setEditingNodeAttrValue(e.target.value)}
                            className="flex-1 px-2 py-1 rounded border border-blue-500 text-xs font-bold text-slate-800 bg-white focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateNodeAttr(attr);
                              else if (e.key === 'Escape') setEditingNodeAttr(null);
                            }}
                          />
                          <button
                            onClick={() => handleUpdateNodeAttr(attr)}
                            className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded border border-emerald-200"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setEditingNodeAttr(null)}
                            className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded border border-rose-200"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-700">🏷️ {attr}</span>
                      )}

                      {!isEditingThis && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingNodeAttr(attr);
                              setEditingNodeAttrValue(attr);
                            }}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded"
                            title="重命名属性"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteNodeAttr(attr)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                            title="删除该属性"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsNodeAttrModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Non-Blocking Iframe-Compatible success Dialog */}
      {appAlert && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start space-x-3 text-left">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                <span className="text-lg">🎉</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">{appAlert.title}</h3>
                <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">
                  {appAlert.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setAppAlert(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-3xs"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Fetch helper mapping for the sources
const getWorkflowStepsForSource = (source: DataSourceType): string[] => {
  return [];
};
