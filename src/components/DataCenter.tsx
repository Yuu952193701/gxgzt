import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, Database, Plus, Trash2, Edit2, Columns, Filter, ArrowUpDown, 
  ChevronDown, ChevronRight, Save, Copy, Check, X, Search, FileSpreadsheet,
  AlertCircle, Info, MoveUp, MoveDown, Eye, EyeOff
} from 'lucide-react';
import { useAppState } from '../context/AppContext';
import { 
  DataCenterConfig, DataSourceType, ViewColumnConfig, ViewFilterConfig, 
  ViewSortConfig, CustomFieldConfig, SHIPS, MEMBERS
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
    addSystemLog
  } = useAppState();

  // Primary navigation tabs
  const [activeTab, setActiveTab] = useState<'view' | 'template' | 'logs'>('view');

  // Loaded configuration states
  const [configs, setConfigs] = useState<DataCenterConfig[]>(() => {
    const saved = localStorage.getItem('p_workbench_datacenter_configs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing data center configs', e);
      }
    }

    // Default seed configurations representing typical production workflows
    const seeds: DataCenterConfig[] = [
      {
        id: 'view-1',
        name: '登记寄出台账',
        type: 'view',
        isStarred: true,
        dataSource: 'purchase',
        filters: [
          { field: 'status', operator: 'contains', value: '寄出' }
        ],
        columns: [
          { field: 'code', label: '合同编号', visible: true, order: 1, width: 140 },
          { field: 'name', label: '合同名称', visible: true, order: 2, width: 220 },
          { field: 'ship', label: '所属船舶', visible: true, order: 3, width: 100 },
          { field: 'amount', label: '合同金额', visible: true, order: 4, width: 120 },
          { field: 'supplierId', label: '合作供应商', visible: true, order: 5, width: 180 },
          { field: 'status', label: '结算付款节点', visible: true, order: 6, width: 120 },
          { field: 'remark', label: '备注说明', visible: true, order: 7, width: 180 }
        ],
        sorts: [],
        customFields: [
          { id: 'custom_cost_item', label: '成本科目', type: 'text' }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'view-2',
        name: '等待付款申请',
        type: 'view',
        isStarred: true,
        dataSource: 'purchase',
        filters: [
          { field: 'status', operator: 'equals', value: '付款申请' }
        ],
        columns: [
          { field: 'code', label: '合同编号', visible: true, order: 1, width: 140 },
          { field: 'name', label: '合同名称', visible: true, order: 2, width: 220 },
          { field: 'ship', label: '所属船舶', visible: true, order: 3, width: 100 },
          { field: 'amount', label: '合同金额', visible: true, order: 4, width: 120 },
          { field: 'status', label: '结算付款节点', visible: true, order: 5, width: 125 },
          { field: 'dueDate', label: '收付截止日', visible: true, order: 6, width: 120 }
        ],
        sorts: [],
        customFields: [],
        createdAt: new Date().toISOString()
      },
      {
        id: 'template-1',
        name: '2026上半年成本台账',
        type: 'template',
        dataSource: 'purchase',
        filters: [],
        columns: [
          { field: 'code', label: '合同编号', visible: true, order: 1, width: 140 },
          { field: 'name', label: '合同名称', visible: true, order: 2, width: 220 },
          { field: 'ship', label: '所属船舶', visible: true, order: 3, width: 100 },
          { field: 'amount', label: '合同金额', visible: true, order: 4, width: 120 },
          { field: 'supplierId', label: '合作供应商', visible: true, order: 5, width: 180 }
        ],
        sorts: [],
        customFields: [
          { id: 'custom_cost_item', label: '成本科目', type: 'text' }
        ],
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('p_workbench_datacenter_configs', JSON.stringify(seeds));
    return seeds;
  });

  // Keep localStorage in sync with config state changes
  useEffect(() => {
    localStorage.setItem('p_workbench_datacenter_configs', JSON.stringify(configs));
  }, [configs]);

  // Selected view/template ID
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(() => {
    const saved = localStorage.getItem('p_workbench_datacenter_configs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DataCenterConfig[];
        const views = parsed.filter(c => c.type === 'view');
        if (views.length > 0) return views[0].id;
      } catch (e) {}
    }
    return 'view-1';
  });

  // Toggle active item if tab changes to ensure we have a valid selected config
  useEffect(() => {
    const firstOfTab = configs.find(c => c.type === (activeTab === 'view' ? 'view' : 'template'));
    if (firstOfTab) {
      setSelectedConfigId(firstOfTab.id);
    } else {
      setSelectedConfigId(null);
    }
  }, [activeTab]);

  // Quick search query for table filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable panel toggles
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeConfigSection, setActiveConfigSection] = useState<'columns' | 'filters' | 'sorts' | 'custom'>('columns');

  // Inline grid cell editing state
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [tempEditValue, setTempEditValue] = useState('');

  // Editable title in header
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  // Custom iframe-compatible dialogs
  const [appAlert, setAppAlert] = useState<{ type: 'success' | 'info'; title: string; message: string } | null>(null);
  const [deleteConfigInfo, setDeleteConfigInfo] = useState<{ id: string; name: string } | null>(null);
  const [deleteCustomColumnInfo, setDeleteCustomColumnInfo] = useState<{ id: string; label: string } | null>(null);

  // Active configuration lookup
  const activeConfig = configs.find(c => c.id === selectedConfigId);

  // Default fields available for each source
  const DEFAULT_FIELDS_MAP: Record<DataSourceType, { field: string; label: string }[]> = {
    pre: [
      { field: 'code', label: '项目编号' },
      { field: 'name', label: '项目名称' },
      { field: 'ship', label: '所属船舶' },
      { field: 'status', label: '当前流程状态' },
      { field: 'isUrgent', label: '是否紧急' },
      { field: 'dueDate', label: '截止日期' },
      { field: 'remark', label: '备注说明' },
      { field: 'owners', label: '归属成员' },
      { field: 'createdAt', label: '创建时间' },
    ],
    purchase: [
      { field: 'code', label: '合同编号' },
      { field: 'name', label: '合同名称' },
      { field: 'ship', label: '所属船舶' },
      { field: 'status', label: '结算付款节点' },
      { field: 'amount', label: '合同金额' },
      { field: 'supplierId', label: '合作供应商' },
      { field: 'contractStatus', label: '履行状态' },
      { field: 'isUrgent', label: '是否紧急' },
      { field: 'dueDate', label: '收付截止日' },
      { field: 'remark', label: '备注说明' },
      { field: 'owners', label: '归属成员' },
      { field: 'createdAt', label: '签署时间' },
    ],
    service: [
      { field: 'code', label: '合同编号' },
      { field: 'name', label: '合同名称' },
      { field: 'ship', label: '所属船舶' },
      { field: 'status', label: '服务结算节点' },
      { field: 'amount', label: '合同金额' },
      { field: 'supplierId', label: '合作服务商' },
      { field: 'contractStatus', label: '履行状态' },
      { field: 'isUrgent', label: '是否紧急' },
      { field: 'dueDate', label: '服务截止日' },
      { field: 'remark', label: '备注说明' },
      { field: 'owners', label: '归属成员' },
      { field: 'createdAt', label: '签署时间' },
    ],
    bid: [
      { field: 'name', label: '标书名称' },
      { field: 'ship', label: '所属船舶' },
      { field: 'tenderUnit', label: '招标单位' },
      { field: 'status', label: '标书流程节点' },
      { field: 'resultStatus', label: '投标结果' },
      { field: 'isUrgent', label: '是否紧急' },
      { field: 'dueDate', label: '截标日期' },
      { field: 'supplierId', label: '协作供货商' },
      { field: 'remark', label: '备注说明' },
      { field: 'owners', label: '归属成员' },
      { field: 'createdAt', label: '建档时间' },
    ]
  };

  // Star/Favorite toggle handler
  const handleToggleStar = (configId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfigs(prev => prev.map(c => c.id === configId ? { ...c, isStarred: !c.isStarred } : c));
  };

  // Create new configuration template or view
  const handleCreateNewConfig = () => {
    const typeLabel = activeTab === 'view' ? '新动态视图' : '新报表模板';
    const id = `${activeTab}-${Date.now()}`;
    
    // Choose purchase by default
    const defaultSource: DataSourceType = 'purchase';
    const fields = DEFAULT_FIELDS_MAP[defaultSource];
    
    const newConfig: DataCenterConfig = {
      id,
      name: `${typeLabel} #${configs.filter(c => c.type === activeTab).length + 1}`,
      type: activeTab === 'view' ? 'view' : 'template',
      isStarred: false,
      dataSource: defaultSource,
      filters: [],
      columns: fields.map((f, index) => ({
        field: f.field,
        label: f.label,
        visible: index < 6, // Show first 6 columns by default
        order: index + 1,
        width: 130
      })),
      sorts: [],
      customFields: [],
      createdAt: new Date().toISOString()
    };

    setConfigs(prev => [...prev, newConfig]);
    setSelectedConfigId(id);
    setIsConfigOpen(true);
    setActiveConfigSection('columns');
    addSystemLog(`[数据中心] 创建了新的${typeLabel}: ${newConfig.name}`);
  };

  // Convert/Clone View to Template, or vice versa (双向转换)
  const handleConvertConfig = (config: DataCenterConfig) => {
    const targetType = config.type === 'view' ? 'template' : 'view';
    const typeText = targetType === 'view' ? '动态视图' : '报表模板';
    const id = `${targetType}-${Date.now()}`;
    
    const cloned: DataCenterConfig = {
      ...config,
      id,
      name: `${config.name} (转为${typeText})`,
      type: targetType,
      isStarred: false,
      createdAt: new Date().toISOString()
    };

    setConfigs(prev => [...prev, cloned]);
    setActiveTab(targetType);
    setSelectedConfigId(id);
    addSystemLog(`[数据中心] 转换配置: 【${config.name}】已另存为${typeText}【${cloned.name}】`);
    setAppAlert({
      type: 'success',
      title: '转换成功',
      message: `【${config.name}】已成功另存并载入为新${typeText}！`
    });
  };

  // Delete configuration
  const handleDeleteConfig = (id: string, name: string) => {
    setDeleteConfigInfo({ id, name });
  };

  // Update datasource and recreate default columns
  const handleSourceChange = (newSource: DataSourceType) => {
    if (!activeConfig) return;
    const fields = DEFAULT_FIELDS_MAP[newSource];
    const updatedColumns = fields.map((f, index) => ({
      field: f.field,
      label: f.label,
      visible: index < 6,
      order: index + 1,
      width: 130
    }));

    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? {
      ...c,
      dataSource: newSource,
      filters: [],
      sorts: [],
      columns: updatedColumns
    } : c));
  };

  // Add customized column (手动新增列)
  const handleAddCustomColumn = () => {
    if (!activeConfig) return;
    const label = window.prompt('请输入需要新增的手动空白列名称 (如: "成本科目", "核对人"):');
    if (!label || !label.trim()) return;

    const key = `custom_${Date.now()}`;
    const newField: CustomFieldConfig = {
      id: key,
      label: label.trim(),
      type: 'text'
    };

    const newColumn: ViewColumnConfig = {
      field: key,
      label: label.trim(),
      visible: true,
      order: activeConfig.columns.length + 1,
      width: 140
    };

    setConfigs(prev => prev.map(c => {
      if (c.id === activeConfig.id) {
        return {
          ...c,
          customFields: [...c.customFields, newField],
          columns: [...c.columns, newColumn]
        };
      }
      return c;
    }));
    addSystemLog(`[数据中心] 为配置【${activeConfig.name}】手动添加了额外显示列: ${label}`);
  };

  // Dynamic filter management
  const handleAddFilter = () => {
    if (!activeConfig) return;
    const firstField = activeConfig.columns[0]?.field || 'name';
    const newFilter: ViewFilterConfig = {
      field: firstField,
      operator: 'contains',
      value: ''
    };
    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? { ...c, filters: [...c.filters, newFilter] } : c));
  };

  const handleRemoveFilter = (index: number) => {
    if (!activeConfig) return;
    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? {
      ...c,
      filters: c.filters.filter((_, idx) => idx !== index)
    } : c));
  };

  const handleUpdateFilter = (index: number, key: keyof ViewFilterConfig, value: any) => {
    if (!activeConfig) return;
    setConfigs(prev => prev.map(c => {
      if (c.id === activeConfig.id) {
        const updated = [...c.filters];
        updated[index] = { ...updated[index], [key]: value };
        return { ...c, filters: updated };
      }
      return c;
    }));
  };

  // Dynamic sorting management
  const handleAddSort = () => {
    if (!activeConfig) return;
    const firstField = activeConfig.columns[0]?.field || 'name';
    const newSort: ViewSortConfig = {
      field: firstField,
      direction: 'asc'
    };
    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? { ...c, sorts: [...c.sorts, newSort] } : c));
  };

  const handleRemoveSort = (index: number) => {
    if (!activeConfig) return;
    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? {
      ...c,
      sorts: c.sorts.filter((_, idx) => idx !== index)
    } : c));
  };

  const handleUpdateSort = (index: number, key: keyof ViewSortConfig, value: any) => {
    if (!activeConfig) return;
    setConfigs(prev => prev.map(c => {
      if (c.id === activeConfig.id) {
        const updated = [...c.sorts];
        updated[index] = { ...updated[index], [key]: value };
        return { ...c, sorts: updated };
      }
      return c;
    }));
  };

  // Move columns left/right to adjust order
  const handleMoveColumn = (field: string, direction: 'left' | 'right') => {
    if (!activeConfig) return;
    const cols = [...activeConfig.columns].sort((a, b) => a.order - b.order);
    const index = cols.findIndex(c => c.field === field);
    if (index === -1) return;

    if (direction === 'left' && index > 0) {
      const prevCol = cols[index - 1];
      const tempOrder = prevCol.order;
      prevCol.order = cols[index].order;
      cols[index].order = tempOrder;
    } else if (direction === 'right' && index < cols.length - 1) {
      const nextCol = cols[index + 1];
      const tempOrder = nextCol.order;
      nextCol.order = cols[index].order;
      cols[index].order = tempOrder;
    }

    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? { ...c, columns: cols } : c));
  };

  // Toggle column visibility
  const handleToggleColumnVisibility = (field: string) => {
    if (!activeConfig) return;
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

  // Rename config title
  const handleRenameTitle = () => {
    if (!activeConfig || !tempTitle.trim()) return;
    setConfigs(prev => prev.map(c => c.id === activeConfig.id ? { ...c, name: tempTitle.trim() } : c));
    setIsEditingTitle(false);
  };

  // Direct edit save handler - double bind to App Context state
  const handleSaveCellValue = (rowId: string, field: string, val: string) => {
    if (!activeConfig) return;
    
    // Perform numeric parsings if applicable
    let finalValue: any = val;
    if (field === 'amount') {
      finalValue = val; // Store as text but can be parsed numerically if needed
    } else if (field === 'isUrgent') {
      finalValue = val === 'true';
    } else if (field === 'owners') {
      finalValue = val.split(',').map(v => v.trim()).filter(Boolean);
    }

    const source = activeConfig.dataSource;
    if (source === 'pre') {
      updateProject(rowId, { [field]: finalValue });
    } else if (source === 'purchase' || source === 'service') {
      updateContract(rowId, { [field]: finalValue });
    } else if (source === 'bid') {
      updateBid(rowId, { [field]: finalValue });
    }

    setEditingCell(null);
  };

  // --------------------------------------------------------
  // Data Querying Engine (Reading & filtering raw lists)
  // --------------------------------------------------------

  // Fetch raw records from global system state
  const getRawData = (source: DataSourceType): any[] => {
    switch (source) {
      case 'pre':
        return projects;
      case 'purchase':
        return contracts.filter(c => c.contractType === 'purchase');
      case 'service':
        return contracts.filter(c => c.contractType === 'service');
      case 'bid':
        return bids;
      default:
        return [];
    }
  };

  // Apply conditional configurations dynamically
  const getProcessedData = (): any[] => {
    if (!activeConfig) return [];
    
    let rows = getRawData(activeConfig.dataSource);

    // 1. Apply multiple filters
    if (activeConfig.filters.length > 0) {
      rows = rows.filter(row => {
        return activeConfig.filters.every(f => {
          let cellValue = row[f.field];
          
          // Lookup mapping for filters (e.g. searching supplier name instead of ID)
          if (f.field === 'supplierId' && cellValue) {
            const supplierObj = suppliers.find(s => s.id === cellValue);
            cellValue = supplierObj ? supplierObj.name : cellValue;
          }
          if (f.field === 'owners' && Array.isArray(cellValue)) {
            cellValue = cellValue.map(email => {
              const u = users.find(usr => usr.email === email);
              return u ? u.name : email;
            }).join(', ');
          }

          const currentString = String(cellValue ?? '').toLowerCase();
          const filterValue = f.value.toLowerCase();

          switch (f.operator) {
            case 'equals':
              return currentString === filterValue;
            case 'not_equals':
              return currentString !== filterValue;
            case 'contains':
              return currentString.includes(filterValue);
            case 'greater_than_or_equal':
              if (!isNaN(Number(cellValue)) && !isNaN(Number(f.value))) {
                return Number(cellValue) >= Number(f.value);
              }
              return currentString >= filterValue;
            case 'less_than_or_equal':
              if (!isNaN(Number(cellValue)) && !isNaN(Number(f.value))) {
                return Number(cellValue) <= Number(f.value);
              }
              return currentString <= filterValue;
            default:
              return true;
          }
        });
      });
    }

    // 2. Apply customized sorting configuration
    if (activeConfig.sorts.length > 0) {
      rows = [...rows].sort((a, b) => {
        for (const s of activeConfig.sorts) {
          let valA = a[s.field];
          let valB = b[s.field];

          // Lookup translations for sorting consistency
          if (s.field === 'supplierId') {
            valA = suppliers.find(sup => sup.id === valA)?.name || '';
            valB = suppliers.find(sup => sup.id === valB)?.name || '';
          }

          if (valA === undefined || valA === null) valA = '';
          if (valB === undefined || valB === null) valB = '';

          // Compare numbers where appropriate
          const numA = Number(valA);
          const numB = Number(valB);
          if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
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

    // 3. Quick universal search keyword query
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      const visibleFields = activeConfig.columns.filter(c => c.visible).map(c => c.field);
      
      rows = rows.filter(row => {
        return visibleFields.some(field => {
          let val = row[field];
          if (field === 'supplierId' && val) {
            val = suppliers.find(s => s.id === val)?.name || val;
          }
          if (field === 'owners' && Array.isArray(val)) {
            val = val.map(email => users.find(u => u.email === email)?.name || email).join(', ');
          }
          return String(val ?? '').toLowerCase().includes(lowercaseQuery);
        });
      });
    }

    return rows;
  };

  // Helper lookup functions for beautiful grid renders
  const getSupplierName = (id: string) => {
    const s = suppliers.find(sup => sup.id === id);
    return s ? s.name : '未关联公司';
  };

  const getMemberNames = (emails: string[] | undefined) => {
    if (!emails || emails.length === 0) return '未指派';
    return emails.map(email => {
      const u = users.find(usr => usr.email === email);
      return u ? u.name : email;
    }).join(', ');
  };

  // Fetch workflow steps according to datasource module
  const getWorkflowStepsForSource = (source: DataSourceType): string[] => {
    switch (source) {
      case 'pre':
        return preWorkflow.map(s => s.name);
      case 'purchase':
        return postWorkflow.map(s => s.name);
      case 'service':
        return postServiceWorkflow.map(s => s.name);
      case 'bid':
        return bidWorkflow.map(s => s.name);
      default:
        return [];
    }
  };

  // Trigger export of configured report to fake Excel file (Simulated)
  const handleExportToExcel = () => {
    if (!activeConfig) return;
    const items = getProcessedData();
    const headers = activeConfig.columns.filter(c => c.visible).map(c => c.label);
    
    addSystemLog(`[数据中心] 成功导出了报表【${activeConfig.name}】，包含 ${items.length} 条业务记录！`);
    setAppAlert({
      type: 'success',
      title: '导出成功',
      message: `已成功生成并虚拟下载物理表格:
【C:\\采购管理系统\\数据中心\\导出\\${activeConfig.name}_${new Date().toISOString().split('T')[0]}.xlsx】

已安全归并并转换 ${items.length} 行数据和 ${headers.length} 列自定义维度字段！`
    });
  };

  // Star-sorted list of configurations
  const filteredConfigs = configs
    .filter(c => c.type === (activeTab === 'view' ? 'view' : 'template'))
    .sort((a, b) => {
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative pb-12 animate-fade-in">
      
      {/* 📊 Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">📊</span>
            <span>采购数据应用中心 (Data Center)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            实时读取并多维汇聚工作台业务，支持自由列排版、多条件动态查询过滤以及直接回写数据库。
          </p>
        </div>
        
        {/* Module Subtabs */}
        <div className="flex items-center space-x-1.5 mt-3 md:mt-0 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('view')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md cursor-pointer transition-all flex items-center space-x-1.5 ${
              activeTab === 'view' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>✨ 动态视图</span>
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md cursor-pointer transition-all flex items-center space-x-1.5 ${
              activeTab === 'template' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📋 报表模板</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md cursor-not-allowed opacity-65 flex items-center space-x-1.5`}
            title="导出记录归档服务 (预留扩展)"
          >
            <span>📜 导出记录 (预留)</span>
          </button>
        </div>
      </div>

      {activeTab === 'logs' ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
          暂无历史数据，该接口已在数据中心框架层预备，供V3高负荷审计归档使用。
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: CONFIGURATION LISTS (Starred pinned on top) */}
          {/* ========================================================= */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                {activeTab === 'view' ? '✨ 视图选择/收藏' : '📋 报表配置列表'}
              </h3>
              <button
                onClick={handleCreateNewConfig}
                className="p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors cursor-pointer flex items-center space-x-0.5 text-xs font-bold"
                title="新建空数据映射"
              >
                <Plus size={14} />
                <span>新建</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredConfigs.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  没有找到任何配置，请点击新建
                </div>
              ) : (
                filteredConfigs.map(c => {
                  const isActive = c.id === selectedConfigId;
                  const rawCount = getRawData(c.dataSource).length;

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedConfigId(c.id);
                        setSearchQuery('');
                        setIsEditingTitle(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-between border ${
                        isActive 
                          ? 'bg-slate-50 border-blue-200 text-slate-800 font-bold shadow-2xs' 
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <button
                          onClick={(e) => handleToggleStar(c.id, e)}
                          className={`hover:scale-110 transition-transform ${
                            c.isStarred ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'
                          }`}
                        >
                          <Star size={13} fill={c.isStarred ? 'currentColor' : 'none'} />
                        </button>
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-1.5">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded-sm font-mono scale-90">
                          {rawCount}行
                        </span>
                        {isActive && (
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 pt-3.5">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] text-indigo-700 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <Info size={12} />
                  <span>多维架构互通法则</span>
                </div>
                <p className="leading-relaxed">
                  视图和报表共用同一底层配置结构。您可以将筛选好的动态视图<b>“另存为报表”</b>，也可以将满意的报表模板<b>“固化为动态视图”</b>，实时刷新无重复配置工作。
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: CORE WORKSPACE GRID AND CONFIGURATORS */}
          {/* ========================================================= */}
          <div className="lg:col-span-3 space-y-5">
            
            {activeConfig ? (
              <div className="space-y-4">
                
                {/* 1. Header with Title & Operations */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameTitle()}
                          className="px-2 py-1 border border-slate-300 rounded text-sm font-bold focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                          autoFocus
                        />
                        <button
                          onClick={handleRenameTitle}
                          className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 cursor-pointer"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setIsEditingTitle(false)}
                          className="p-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 truncate">
                        <h3 className="text-base font-bold text-slate-800 truncate">{activeConfig.name}</h3>
                        <button
                          onClick={() => {
                            setIsEditingTitle(true);
                            setTempTitle(activeConfig.name);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 transition-colors"
                          title="修改名称"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Collapsible toggle config panel */}
                    <button
                      onClick={() => setIsConfigOpen(!isConfigOpen)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center space-x-1.5 border ${
                        isConfigOpen 
                          ? 'bg-slate-800 text-white border-slate-800' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Filter size={13} />
                      <span>{isConfigOpen ? '收起视图配置' : '配置视图参数'}</span>
                      <ChevronDown size={12} className={`transform transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Convert/Clone Interoperability */}
                    <button
                      onClick={() => handleConvertConfig(activeConfig)}
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors flex items-center space-x-1.5"
                    >
                      <Copy size={13} />
                      <span>{activeConfig.type === 'view' ? '另存为报表模板' : '另存为动态视图'}</span>
                    </button>

                    {/* Export */}
                    <button
                      onClick={handleExportToExcel}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer transition-colors flex items-center space-x-1.5"
                    >
                      <FileSpreadsheet size={13} />
                      <span>生成/下载报表</span>
                    </button>

                    {/* Delete config */}
                    <button
                      onClick={() => handleDeleteConfig(activeConfig.id, activeConfig.name)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="删除此配置"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* 2. Collapsible Configurations Settings Panel */}
                {isConfigOpen && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 animate-slide-down">
                    
                    {/* Subnavigation inside settings panel */}
                    <div className="flex border-b border-slate-100 pb-2.5">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setActiveConfigSection('columns')}
                          className={`text-xs font-bold pb-2 border-b-2 transition-all cursor-pointer ${
                            activeConfigSection === 'columns' 
                              ? 'border-blue-600 text-blue-600' 
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          列顺序与可见性
                        </button>
                        <button
                          onClick={() => setActiveConfigSection('filters')}
                          className={`text-xs font-bold pb-2 border-b-2 transition-all cursor-pointer ${
                            activeConfigSection === 'filters' 
                              ? 'border-blue-600 text-blue-600' 
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          筛选过滤条件 ({activeConfig.filters.length})
                        </button>
                        <button
                          onClick={() => setActiveConfigSection('sorts')}
                          className={`text-xs font-bold pb-2 border-b-2 transition-all cursor-pointer ${
                            activeConfigSection === 'sorts' 
                              ? 'border-blue-600 text-blue-600' 
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          高级排序依据 ({activeConfig.sorts.length})
                        </button>
                        <button
                          onClick={() => setActiveConfigSection('custom')}
                          className={`text-xs font-bold pb-2 border-b-2 transition-all cursor-pointer ${
                            activeConfigSection === 'custom' 
                              ? 'border-blue-600 text-blue-600' 
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          手动扩展空白列 ({activeConfig.customFields.length})
                        </button>
                      </div>
                    </div>

                    {/* Column Source Selection (Visible on columns tab) */}
                    {activeConfigSection === 'columns' && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-xs font-bold text-slate-600">选择数据来源:</span>
                          <select
                            value={activeConfig.dataSource}
                            onChange={(e) => handleSourceChange(e.target.value as DataSourceType)}
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                          >
                            <option value="purchase">采购合同 (Purchase)</option>
                            <option value="service">服务合同 (Service)</option>
                            <option value="pre">前置需求 (Pre-Procurement)</option>
                            <option value="bid">标书项目 (Bid Project)</option>
                          </select>
                          <span className="text-[10px] text-slate-400">
                            (更换数据来源将自动重置底层列字段映射)
                          </span>
                        </div>

                        {/* Column visibility list */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {activeConfig.columns
                            .sort((a, b) => a.order - b.order)
                            .map((col, index, arr) => (
                              <div
                                key={col.field}
                                className={`p-2 rounded-lg border flex items-center justify-between text-xs transition-all ${
                                  col.visible 
                                    ? 'bg-slate-50/50 border-slate-200 text-slate-800' 
                                    : 'bg-slate-50 border-transparent text-slate-400 opacity-60'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5 truncate">
                                  <button
                                    onClick={() => handleToggleColumnVisibility(col.field)}
                                    className="text-slate-400 hover:text-slate-600"
                                    title={col.visible ? "隐藏列" : "显示列"}
                                  >
                                    {col.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                                  </button>
                                  <span className="truncate font-semibold">{col.label}</span>
                                </div>
                                
                                <div className="flex items-center space-x-0.5 shrink-0 ml-1">
                                  <button
                                    onClick={() => handleMoveColumn(col.field, 'left')}
                                    disabled={index === 0}
                                    className={`p-0.5 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none`}
                                    title="向左移动"
                                  >
                                    <MoveUp size={11} className="transform -rotate-90" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveColumn(col.field, 'right')}
                                    disabled={index === arr.length - 1}
                                    className={`p-0.5 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none`}
                                    title="向右移动"
                                  >
                                    <MoveDown size={11} className="transform -rotate-90" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Filter condition management */}
                    {activeConfigSection === 'filters' && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400">
                          您可以为该视图配置任意多重条件过滤链，数据将实时根据操作数与约束过滤计算输出。
                        </p>

                        <div className="space-y-2">
                          {activeConfig.filters.map((filter, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-150 animate-fade-in">
                              
                              {/* Field */}
                              <select
                                value={filter.field}
                                onChange={(e) => handleUpdateFilter(index, 'field', e.target.value)}
                                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                              >
                                {activeConfig.columns.map(c => (
                                  <option key={c.field} value={c.field}>{c.label}</option>
                                ))}
                              </select>

                              {/* Operator */}
                              <select
                                value={filter.operator}
                                onChange={(e) => handleUpdateFilter(index, 'operator', e.target.value as any)}
                                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                              >
                                <option value="contains">包含 (Contains)</option>
                                <option value="equals">等于 (=)</option>
                                <option value="not_equals">不等于 (!=)</option>
                                <option value="greater_than_or_equal">大于等于 (&gt;=)</option>
                                <option value="less_than_or_equal">小于等于 (&lt;=)</option>
                              </select>

                              {/* Value input */}
                              <input
                                type="text"
                                placeholder="输入比对值..."
                                value={filter.value}
                                onChange={(e) => handleUpdateFilter(index, 'value', e.target.value)}
                                className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 flex-grow"
                              />

                              <button
                                onClick={() => handleRemoveFilter(index)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                title="删除此规则"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleAddFilter}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                        >
                          <Plus size={13} />
                          <span>新增过滤规则</span>
                        </button>
                      </div>
                    )}

                    {/* Advanced Sort Rule Configurator */}
                    {activeConfigSection === 'sorts' && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400">
                          设置多级排序权重，在数据溢出较多时可获得有序的分区表格视图。
                        </p>

                        <div className="space-y-2">
                          {activeConfig.sorts.map((sort, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-150 animate-fade-in">
                              <select
                                value={sort.field}
                                onChange={(e) => handleUpdateSort(index, 'field', e.target.value)}
                                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                              >
                                {activeConfig.columns.map(c => (
                                  <option key={c.field} value={c.field}>{c.label}</option>
                                ))}
                              </select>

                              <select
                                value={sort.direction}
                                onChange={(e) => handleUpdateSort(index, 'direction', e.target.value as any)}
                                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                              >
                                <option value="asc">升序 (A-Z ↑)</option>
                                <option value="desc">降序 (Z-A ↓)</option>
                              </select>

                              <button
                                onClick={() => handleRemoveSort(index)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleAddSort}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                        >
                          <Plus size={13} />
                          <span>新增排序级别</span>
                        </button>
                      </div>
                    )}

                    {/* Manual Blank custom Columns */}
                    {activeConfigSection === 'custom' && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400">
                          工作台缺省的个性化列（如：财务标记、成本分类），允许在此追加空字段并直接双击打字录入，录入后的数据将永久写入底层主库并随本模板导出。
                        </p>

                        {activeConfig.customFields.length > 0 && (
                          <div className="border border-slate-150 rounded-lg overflow-hidden divide-y divide-slate-100">
                            {activeConfig.customFields.map(f => (
                              <div key={f.id} className="p-2.5 bg-slate-50 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-800">{f.label}</span>
                                  <span className="text-[9px] text-slate-400 ml-2 font-mono bg-slate-100 px-1 rounded">
                                    字段ID: {f.id}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    setDeleteCustomColumnInfo({ id: f.id, label: f.label });
                                  }}
                                  className="text-rose-500 hover:text-rose-600 p-1 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={handleAddCustomColumn}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                        >
                          <Plus size={13} />
                          <span>追加手动列 (Blank Column)</span>
                        </button>
                      </div>
                    )}

                  </div>
                )}

                {/* 3. Interactive Data Grid Spreadsheet */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                  
                  {/* Grid Toolbar Controls */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="relative max-w-sm w-full">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <Search size={14} />
                      </div>
                      <input
                        type="text"
                        placeholder={`在当前过滤后结果中检索 (${getProcessedData().length}条)...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      />
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                        <span>双击/单击对应单元格，可实现行内即时编辑与数据库自动保存</span>
                      </span>
                    </div>
                  </div>

                  {/* Datagrid Spreadsheet */}
                  <div className="overflow-x-auto w-full">
                    {getProcessedData().length === 0 ? (
                      <div className="text-center py-16 space-y-2">
                        <div className="text-3xl text-slate-300">🔍</div>
                        <p className="text-xs font-bold text-slate-400">
                          没有满足当前过滤器或检索条件的业务数据。
                        </p>
                        <p className="text-[10px] text-slate-400 max-w-md mx-auto">
                          当前筛选设置了 {activeConfig.filters.length} 个规则。您可以收缩、清空这些规则或到工作台中录入对应维度的台账。
                        </p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-slate-100 text-left border-collapse table-fixed">
                        {/* Define Columns widths */}
                        <colgroup>
                          {activeConfig.columns
                            .sort((a, b) => a.order - b.order)
                            .filter(c => c.visible)
                            .map(c => (
                              <col key={c.field} style={{ width: c.width || 140 }} />
                            ))}
                        </colgroup>
                        
                        <thead className="bg-slate-50/80 backdrop-blur-xs font-bold">
                          <tr>
                            {activeConfig.columns
                              .sort((a, b) => a.order - b.order)
                              .filter(c => c.visible)
                              .map(c => (
                                <th 
                                  key={c.field} 
                                  className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200"
                                >
                                  <div className="flex items-center space-x-1 select-none">
                                    <span>{c.label}</span>
                                    {activeConfig.sorts.some(s => s.field === c.field) && (
                                      <ArrowUpDown size={11} className="text-blue-500" />
                                    )}
                                  </div>
                                </th>
                              ))}
                          </tr>
                        </thead>
                        
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {getProcessedData().map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                              {activeConfig.columns
                                .sort((a, b) => a.order - b.order)
                                .filter(c => c.visible)
                                .map((col) => {
                                  const isEditing = editingCell?.rowId === row.id && editingCell?.field === col.field;
                                  
                                  // Raw values
                                  let value = row[col.field];

                                  // Format values according to fields
                                  let displayValue = '';
                                  if (col.field === 'supplierId') {
                                    displayValue = getSupplierName(value);
                                  } else if (col.field === 'owners') {
                                    displayValue = getMemberNames(value);
                                  } else if (col.field === 'isUrgent') {
                                    displayValue = value ? '⚠️ 紧急' : '正常';
                                  } else {
                                    displayValue = String(value ?? '');
                                  }

                                  return (
                                    <td 
                                      key={col.field}
                                      onDoubleClick={() => {
                                        setEditingCell({ rowId: row.id, field: col.field });
                                        // Save raw string representations
                                        if (col.field === 'owners') {
                                          setTempEditValue(Array.isArray(value) ? value.join(', ') : '');
                                        } else {
                                          setTempEditValue(String(value ?? ''));
                                        }
                                      }}
                                      className="px-4 py-3 text-xs text-slate-700 font-medium truncate relative group border-b border-slate-100"
                                    >
                                      {isEditing ? (
                                        <div className="absolute inset-1 z-10 bg-white shadow-md rounded-md border border-blue-500 flex items-center p-1">
                                          {/* Dropdown selectors for standard fields */}
                                          {col.field === 'ship' ? (
                                            <select
                                              value={tempEditValue}
                                              onChange={(e) => handleSaveCellValue(row.id, col.field, e.target.value)}
                                              onBlur={() => handleSaveCellValue(row.id, col.field, tempEditValue)}
                                              className="w-full text-xs font-semibold focus:outline-none bg-white py-0.5"
                                              autoFocus
                                            >
                                              {SHIPS.map(ship => (
                                                <option key={ship} value={ship}>{ship}</option>
                                              ))}
                                            </select>
                                          ) : col.field === 'status' ? (
                                            <select
                                              value={tempEditValue}
                                              onChange={(e) => handleSaveCellValue(row.id, col.field, e.target.value)}
                                              onBlur={() => handleSaveCellValue(row.id, col.field, tempEditValue)}
                                              className="w-full text-xs font-semibold focus:outline-none bg-white py-0.5"
                                              autoFocus
                                            >
                                              {getWorkflowStepsForSource(activeConfig.dataSource).map(step => (
                                                <option key={step} value={step}>{step}</option>
                                              ))}
                                            </select>
                                          ) : col.field === 'isUrgent' ? (
                                            <select
                                              value={tempEditValue}
                                              onChange={(e) => handleSaveCellValue(row.id, col.field, e.target.value)}
                                              onBlur={() => handleSaveCellValue(row.id, col.field, tempEditValue)}
                                              className="w-full text-xs font-semibold focus:outline-none bg-white py-0.5"
                                              autoFocus
                                            >
                                              <option value="true">⚠️ 紧急</option>
                                              <option value="false">正常</option>
                                            </select>
                                          ) : col.field === 'supplierId' ? (
                                            <select
                                              value={tempEditValue}
                                              onChange={(e) => handleSaveCellValue(row.id, col.field, e.target.value)}
                                              onBlur={() => handleSaveCellValue(row.id, col.field, tempEditValue)}
                                              className="w-full text-xs font-semibold focus:outline-none bg-white py-0.5"
                                              autoFocus
                                            >
                                              <option value="">-- 未指派合作方 --</option>
                                              {suppliers.map(sup => (
                                                <option key={sup.id} value={sup.id}>{sup.name}</option>
                                              ))}
                                            </select>
                                          ) : col.field === 'contractStatus' ? (
                                            <select
                                              value={tempEditValue}
                                              onChange={(e) => handleSaveCellValue(row.id, col.field, e.target.value)}
                                              onBlur={() => handleSaveCellValue(row.id, col.field, tempEditValue)}
                                              className="w-full text-xs font-semibold focus:outline-none bg-white py-0.5"
                                              autoFocus
                                            >
                                              <option value="执行中">执行中</option>
                                              <option value="已完成">已完成</option>
                                              <option value="已终止">已终止</option>
                                            </select>
                                          ) : (
                                            <input
                                              type="text"
                                              value={tempEditValue}
                                              onChange={(e) => setTempEditValue(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveCellValue(row.id, col.field, tempEditValue);
                                                if (e.key === 'Escape') setEditingCell(null);
                                              }}
                                              onBlur={() => handleSaveCellValue(row.id, col.field, tempEditValue)}
                                              className="w-full h-full border-0 p-0 text-xs text-slate-800 font-medium focus:ring-0 focus:outline-none"
                                              autoFocus
                                            />
                                          )}
                                        </div>
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-between">
                                          <span className={`truncate ${
                                            col.field === 'isUrgent' && value ? 'text-rose-600 font-bold' : ''
                                          }`}>
                                            {displayValue || <span className="text-slate-300 font-normal italic">双击编辑...</span>}
                                          </span>
                                          <button
                                            onClick={() => {
                                              setEditingCell({ rowId: row.id, field: col.field });
                                              if (col.field === 'owners') {
                                                setTempEditValue(Array.isArray(value) ? value.join(', ') : '');
                                              } else {
                                                setTempEditValue(String(value ?? ''));
                                              }
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-600 rounded bg-slate-100/80 cursor-pointer ml-1 transition-opacity shrink-0"
                                            title="快捷编辑单元格"
                                          >
                                            <Edit2 size={10} />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="p-3 border-t border-slate-100 bg-slate-50/30 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>
                      当前显示过滤行数: <b>{getProcessedData().length}</b> 行 / 全表：<b>{getRawData(activeConfig.dataSource).length}</b> 行
                    </span>
                    <span>
                      💡 双击任意单元格进入行内快捷编辑。主工作台台账信息实时双向联动更新。
                    </span>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
                请先在左侧选择或新建一个数据配置视图，体验一键归纳过滤能力。
              </div>
            )}

          </div>

        </div>
      )}

      {/* Custom Non-Blocking Iframe-Compatible Dialogs */}
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
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfigInfo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start space-x-3 text-left">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0 mt-0.5">
                <Trash2 size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">确认删除配置视图？</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  确定要彻底删除该配置视图/模板【<span className="font-bold text-slate-800">{deleteConfigInfo.name}</span>】吗？
                  删除后，对应视图的过滤及排序定制将不再保留，此操作不可撤销。
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfigInfo(null)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfigs(prev => prev.filter(c => c.id !== deleteConfigInfo.id));
                  addSystemLog(`[数据中心] 删除了数据配置: ${deleteConfigInfo.name}`);
                  setDeleteConfigInfo(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteCustomColumnInfo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start space-x-3 text-left">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0 mt-0.5">
                <Trash2 size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">确认删除手动添加列？</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  您确定要删除手动列【<span className="font-bold text-slate-800">{deleteCustomColumnInfo.label}</span>】吗？
                  删除后，对应在交互格子里录入的手动空白单元格数据也将一并被彻底清除。
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteCustomColumnInfo(null)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeConfig) {
                    setConfigs(prev => prev.map(c => {
                      if (c.id === activeConfig.id) {
                        return {
                          ...c,
                          customFields: c.customFields.filter(cf => cf.id !== deleteCustomColumnInfo.id),
                          columns: c.columns.filter(col => col.field !== deleteCustomColumnInfo.id)
                        };
                      }
                      return c;
                    }));
                  }
                  setDeleteCustomColumnInfo(null);
                }}
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
