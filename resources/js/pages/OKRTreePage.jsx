import React, { useState, useEffect } from "react";
import { CycleDropdown } from "../components/Dropdown";
import ToastNotification from "../components/ToastNotification";

export default function OKRTreePage() {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [cycleId, setCycleId] = useState(null);
    const [cyclesList, setCyclesList] = useState([]);
    const [companyObjectives, setCompanyObjectives] = useState([]);
    const [selectedObjectiveId, setSelectedObjectiveId] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [objectiveDropdownOpen, setObjectiveDropdownOpen] = useState(false);

    // Load cycles
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/cycles", {
                    headers: { Accept: "application/json" },
                });
                const json = await res.json();
                if (Array.isArray(json.data) && json.data.length > 0) {
                    setCyclesList(json.data);
                    const today = new Date();
                    const currentCycle = json.data.find(c => {
                        if (c.start_date && c.end_date) {
                            const start = new Date(c.start_date);
                            const end = new Date(c.end_date);
                            return today >= start && today <= end;
                        }
                        return false;
                    });
                    if (currentCycle) {
                        setCycleId(currentCycle.cycle_id);
                    }
                }
            } catch (error) {
                console.error("Error loading cycles:", error);
            }
        })();
    }, []);

    // Load company objectives khi cycle thay đổi
    useEffect(() => {
        if (cycleId === null && cyclesList.length > 0) {
            return;
        }

        (async () => {
            try {
                const url = cycleId 
                    ? `/api/okr-tree/company-objectives?cycle_id=${cycleId}`
                    : '/api/okr-tree/company-objectives';
                const res = await fetch(url, {
                    headers: { Accept: "application/json" },
                });
                const json = await res.json();

                if (json.success) {
                    setCompanyObjectives(json.data || []);
                    // Tự động chọn objective đầu tiên nếu chưa có selection hoặc selection không còn trong danh sách
                    if (json.data && json.data.length > 0) {
                        const currentSelected = json.data.find(obj => obj.objective_id === selectedObjectiveId);
                        if (!currentSelected) {
                            setSelectedObjectiveId(json.data[0].objective_id);
                        }
                    } else {
                        setSelectedObjectiveId(null);
                    }
                }
            } catch (error) {
                console.error("Error loading company objectives:", error);
            }
        })();
    }, [cycleId, cyclesList.length]);

    // Load tree data khi objective được chọn
    useEffect(() => {
        if (!selectedObjectiveId) {
            setTreeData(null);
            return;
        }

        setLoading(true);
        (async () => {
            try {
                const url = cycleId 
                    ? `/api/okr-tree?cycle_id=${cycleId}&objective_id=${selectedObjectiveId}`
                    : `/api/okr-tree?objective_id=${selectedObjectiveId}`;
                const res = await fetch(url, {
                    headers: { Accept: "application/json" },
                });
                const json = await res.json();

                if (json.success) {
                    setTreeData(json.data);
                    // Auto expand root node
                    if (json.data) {
                        const rootId = json.data.objective_id || json.data.kr_id;
                        if (rootId) {
                            setExpandedNodes(new Set([rootId]));
                        }
                    }
                } else {
                    setToast({
                        type: "error",
                        message: json.message || "Không thể tải dữ liệu tree view",
                    });
                }
            } catch (error) {
                setToast({
                    type: "error",
                    message: "Lỗi khi tải dữ liệu tree view",
                });
            } finally {
                setLoading(false);
            }
        })();
    }, [selectedObjectiveId, cycleId]);

    const toggleNode = (nodeId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const getLevelLabel = (level) => {
        const labels = {
            company: "Công ty",
            unit: "Đơn vị",
            team: "Nhóm",
            person: "Cá nhân",
        };
        return labels[level] || level || "";
    };

    const formatProgress = (progress) => {
        return typeof progress === 'number' ? Math.round(progress * 10) / 10 : 0;
    };

    const TreeNode = ({ node, depth = 0, isLast = false, parentHasSiblings = false }) => {
        const nodeId = node.objective_id || node.kr_id;
        const isObjective = node.type === 'objective' || node.objective_id;
        const isKeyResult = node.type === 'key_result' || node.kr_id;
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(nodeId);

        return (
            <div className="flex">
                {/* Connection Lines */}
                {depth > 0 && (
                    <div className="flex-shrink-0 relative" style={{ width: '40px' }}>
                        {/* Vertical line */}
                        {!isLast && (
                            <div 
                                className="absolute left-5 top-0 w-0.5 bg-gray-300"
                                style={{ height: '100%' }}
                            />
                        )}
                        {/* Horizontal connector */}
                        <div 
                            className="absolute left-5 top-6 w-5 h-0.5 bg-gray-300"
                        />
                        {/* Vertical line to parent */}
                        {parentHasSiblings && (
                            <div 
                                className="absolute left-5 top-0 w-0.5 bg-gray-300"
                                style={{ height: '6px' }}
                            />
                        )}
                    </div>
                )}

                {/* Node Content */}
                <div className="flex-1 pb-4">
                    <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 max-w-md">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                isObjective ? 'bg-blue-500' : 'bg-indigo-500'
                            }`}>
                                {isObjective ? (
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                )}
                            </div>

                            {/* Title and Type */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-gray-600 uppercase">
                                        {isObjective ? 'Objective' : 'Key Result'}
                                    </span>
                                    {isObjective && node.level && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                            Cấp: {getLevelLabel(node.level)}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                    {isObjective ? node.obj_title : node.kr_title}
                                </h3>
                                {isObjective && node.department && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Cấp: {node.department.department_name}
                                    </p>
                                )}
                            </div>

                            {/* Expand/Collapse Button */}
                            {hasChildren && (
                                <button
                                    onClick={() => toggleNode(nodeId)}
                                    className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                >
                                    {isExpanded ? (
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Progress Section */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700">Tiến độ</span>
                                <span className="text-sm font-bold text-gray-900">
                                    {formatProgress(isObjective ? node.progress_percent : node.progress_percent)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full transition-all ${
                                        (node.progress_percent || 0) >= 80
                                            ? "bg-green-500"
                                            : (node.progress_percent || 0) >= 50
                                            ? "bg-yellow-500"
                                            : "bg-blue-500"
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, node.progress_percent || 0))}%` }}
                                />
                            </div>
                        </div>

                        {/* Current/Target Values (for Key Results) */}
                        {(isKeyResult || node.kr_id) && (
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                    <span className="text-gray-600">Hiện tại: </span>
                                    <span className="font-semibold text-gray-900">{node.current_value || 0}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Mục tiêu: </span>
                                    <span className="font-semibold text-gray-900">{node.target_value || 0} {node.unit || 'number'}</span>
                                </div>
                            </div>
                        )}

                        {/* Assigned User */}
                        {node.assigned_user && (
                            <div className="text-xs text-gray-500">
                                Người phụ trách: {node.assigned_user.full_name}
                            </div>
                        )}
                    </div>

                    {/* Children */}
                    {hasChildren && isExpanded && (
                        <div className="mt-4 ml-0">
                            {node.children.map((child, index) => (
                                <TreeNode
                                    key={child.objective_id || child.kr_id}
                                    node={child}
                                    depth={depth + 1}
                                    isLast={index === node.children.length - 1}
                                    parentHasSiblings={node.children.length > 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.relative')) {
                setObjectiveDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading && !treeData) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Đang tải dữ liệu...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Tree View OKR</h1>
                <div className="flex items-center gap-4 flex-wrap">
                    {cyclesList && cyclesList.length > 0 && (
                        <CycleDropdown
                            cyclesList={cyclesList}
                            cycleFilter={cycleId}
                            handleCycleChange={setCycleId}
                            dropdownOpen={dropdownOpen}
                            setDropdownOpen={setDropdownOpen}
                        />
                    )}
                    
                    {/* Company Objective Dropdown */}
                    {companyObjectives && companyObjectives.length > 0 && (
                        <div className="relative w-64">
                            <button
                                onClick={() => setObjectiveDropdownOpen((prev) => !prev)}
                                className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <span className="flex items-center gap-2 truncate">
                                    {companyObjectives.find(
                                        (obj) => String(obj.objective_id) === String(selectedObjectiveId)
                                    )?.obj_title || "Chọn Objective công ty"}
                                </span>
                                <svg
                                    className={`w-4 h-4 transition-transform ${
                                        objectiveDropdownOpen ? "rotate-180" : ""
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {objectiveDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-y-auto">
                                    {companyObjectives.map((obj) => (
                                        <label
                                            key={obj.objective_id}
                                            className={`flex items-center gap-3 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors ${
                                                String(selectedObjectiveId) === String(obj.objective_id)
                                                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                                                    : ""
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="objective"
                                                value={obj.objective_id}
                                                checked={
                                                    String(selectedObjectiveId) === String(obj.objective_id)
                                                }
                                                onChange={(e) => {
                                                    setSelectedObjectiveId(Number(e.target.value));
                                                    setObjectiveDropdownOpen(false);
                                                }}
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {obj.obj_title}
                                                </p>
                                                {obj.cycle_name && (
                                                    <p className="text-xs text-gray-500">
                                                        {obj.cycle_name}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {!selectedObjectiveId ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm">
                    Vui lòng chọn Objective cấp công ty để xem tree view
                </div>
            ) : !treeData ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm">
                    Đang tải dữ liệu...
                </div>
            ) : (
                <div className="space-y-4">
                    <TreeNode
                        key={treeData.objective_id || treeData.kr_id}
                        node={treeData}
                        depth={0}
                        isLast={true}
                        parentHasSiblings={false}
                    />
                </div>
            )}

            {toast && (
                <ToastNotification
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}

