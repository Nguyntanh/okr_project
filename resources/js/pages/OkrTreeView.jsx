import React, { useState, useEffect, useCallback } from "react";
import { CycleDropdown } from "../components/Dropdown";
import ToastNotification from "../components/ToastNotification";

export default function OkrTreeView({ cyclesList: initialCycles = [], currentUser }) {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [cycleFilter, setCycleFilter] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [fetchedCycles, setFetchedCycles] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const cyclesList = initialCycles?.length ? initialCycles : fetchedCycles;

    useEffect(() => {
        if (initialCycles?.length) {
            return;
        }
        (async () => {
            try {
                const res = await fetch("/cycles", {
                    headers: { Accept: "application/json" },
                });
                const json = await res.json();
                if (Array.isArray(json.data)) {
                    setFetchedCycles(json.data);
                }
            } catch (error) {
                console.error("Failed to load cycles", error);
            }
        })();
    }, [initialCycles]);

    // Tải OKR tree
    const fetchOkrTree = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (cycleFilter) params.append("cycle_id", cycleFilter);

            const res = await fetch(`/company-okrs-tree?${params}`, {
                headers: {
                    Accept: "application/json",
                },
                credentials: "omit",
            });
            const json = await res.json();

            if (json.success) {
                setTreeData(json.data);
                // Mở rộng tất cả các node mặc định
                const initialExpanded = new Set();
                json.data.forEach((company) => {
                    initialExpanded.add(`company-${company.objective_id}`);
                });
                setExpandedNodes(initialExpanded);
            } else {
                throw new Error(json.message || "Lỗi tải dữ liệu");
            }
        } catch (err) {
            setToast({
                type: "error",
                message: err.message || "Không tải được OKR tree",
            });
        } finally {
            setLoading(false);
        }
    }, [cycleFilter]);

    // Tự động chọn quý hiện tại
    useEffect(() => {
        if (!cycleFilter && cyclesList.length > 0) {
            const now = new Date();
            const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
            const currentYear = now.getFullYear();

            const current = cyclesList.find((c) => {
                const match = c.cycle_name.match(/Quý (\d+) năm (\d+)/);
                return (
                    match &&
                    parseInt(match[1]) === currentQuarter &&
                    parseInt(match[2]) === currentYear
                );
            });

            if (current) setCycleFilter(current.cycle_id);
        }
    }, [cyclesList, cycleFilter]);

    // Load dữ liệu
    useEffect(() => {
        fetchOkrTree();
    }, [fetchOkrTree]);

    const toggleNode = (nodeId) => {
        setExpandedNodes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    };

    const formatPercent = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? `${n.toFixed(1)}%` : "0%";
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            draft: "bg-gray-100 text-gray-700",
            active: "bg-blue-100 text-blue-700",
            completed: "bg-emerald-100 text-emerald-700",
        };
        return statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-700";
    };

    const getStatusText = (status) => {
        const statusMap = {
            draft: "Bản nháp",
            active: "Đang thực hiện",
            completed: "Hoàn thành",
        };
        return statusMap[status?.toLowerCase()] || status || "Chưa xác định";
    };

    const getLevelBadge = (level) => {
        const levelMap = {
            company: "bg-purple-100 text-purple-800",
            unit: "bg-blue-100 text-blue-800",
            individual: "bg-green-100 text-green-800",
        };
        return levelMap[level] || "bg-gray-100 text-gray-800";
    };

    const getLevelText = (level) => {
        const levelMap = {
            company: "Công ty",
            unit: "Phòng ban",
            individual: "Cá nhân",
        };
        return levelMap[level] || level;
    };

    // Render một node Objective
    const renderObjectiveNode = (objective, depth = 0, parentType = null) => {
        const nodeId = `${objective.level}-${objective.objective_id}`;
        const isExpanded = expandedNodes.has(nodeId);
        const hasChildren = objective.children && objective.children.length > 0;

        return (
            <div key={nodeId} className="mb-2">
                <div
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                        depth === 0
                            ? "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200"
                            : depth === 1
                            ? "bg-blue-50 border-blue-200"
                            : "bg-green-50 border-green-200"
                    }`}
                    style={{ marginLeft: `${depth * 24}px` }}
                >
                    {/* Expand/Collapse button */}
                    {hasChildren && (
                        <button
                            onClick={() => toggleNode(nodeId)}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-white/50 transition-colors"
                        >
                            <svg
                                className={`w-4 h-4 transition-transform ${
                                    isExpanded ? "rotate-90" : ""
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    )}
                    {!hasChildren && <div className="w-6" />}

                    {/* Level badge */}
                    <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${getLevelBadge(
                            objective.level
                        )}`}
                    >
                        {getLevelText(objective.level)}
                    </span>

                    {/* Objective title */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">
                            {objective.obj_title}
                        </h3>
                        {objective.description && (
                            <p className="text-sm text-slate-600 truncate mt-1">
                                {objective.description}
                            </p>
                        )}
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">
                                {formatPercent(objective.progress_percent)}
                            </div>
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                    style={{
                                        width: `${Math.min(
                                            objective.progress_percent || 0,
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Status badge */}
                        <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${getStatusBadge(
                                objective.status
                            )}`}
                        >
                            {getStatusText(objective.status)}
                        </span>

                        {/* User info (for individual) */}
                        {objective.level === "individual" && objective.user_name && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                {objective.user_avatar ? (
                                    <img
                                        src={objective.user_avatar}
                                        alt={objective.user_name}
                                        className="w-6 h-6 rounded-full"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-xs font-semibold text-slate-600">
                                        {objective.user_name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span>{objective.user_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Key Results */}
                {objective.key_results && objective.key_results.length > 0 && (
                    <div
                        className="ml-12 mt-2 space-y-1"
                        style={{ marginLeft: `${depth * 24 + 48}px` }}
                    >
                        {objective.key_results.map((kr) => (
                            <div
                                key={kr.kr_id}
                                className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200"
                            >
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-slate-700">
                                        {kr.kr_title}
                                    </span>
                                    {kr.assigned_to && (
                                        <span className="text-xs text-slate-500 ml-2">
                                            ({kr.assigned_to})
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-600">
                                        {formatPercent(kr.progress_percent)}
                                    </span>
                                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all"
                                            style={{
                                                width: `${Math.min(
                                                    kr.progress_percent || 0,
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Children */}
                {isExpanded && hasChildren && (
                    <div className="mt-2">
                        {objective.children.map((child) =>
                            renderObjectiveNode(child, depth + 1, objective.level)
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Render department node
    const renderDepartmentNode = (department, depth = 0) => {
        const nodeId = `dept-${department.department_id}`;
        const isExpanded = expandedNodes.has(nodeId);
        const hasObjectives = department.objectives && department.objectives.length > 0;

        return (
            <div key={nodeId} className="mb-3">
                <div
                    className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200"
                    style={{ marginLeft: `${depth * 24}px` }}
                >
                    {hasObjectives && (
                        <button
                            onClick={() => toggleNode(nodeId)}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-white/50 transition-colors"
                        >
                            <svg
                                className={`w-4 h-4 transition-transform ${
                                    isExpanded ? "rotate-90" : ""
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    )}
                    {!hasObjectives && <div className="w-6" />}

                    <div className="flex-1">
                        <h2 className="font-bold text-lg text-blue-900">
                            📁 {department.department_name}
                        </h2>
                        <p className="text-sm text-blue-600">
                            {department.objectives?.length || 0} OKR
                        </p>
                    </div>
                </div>

                {isExpanded && hasObjectives && (
                    <div className="mt-2">
                        {department.objectives.map((obj) =>
                            renderObjectiveNode(obj, depth + 1, "department")
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mx-auto w-full max-w-7xl p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Cây phân cấp OKR
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Xem OKR từ công ty xuống phòng ban và cá nhân
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <CycleDropdown
                            cyclesList={cyclesList}
                            cycleFilter={cycleFilter}
                            handleCycleChange={setCycleFilter}
                            dropdownOpen={dropdownOpen}
                            setDropdownOpen={setDropdownOpen}
                        />
                    </div>
                </div>
            </div>

            {/* Tree View */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-slate-600">Đang tải...</span>
                </div>
            ) : treeData.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-600">
                        Chưa có OKR nào trong chu kỳ này.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    {treeData.map((item) => {
                        if (item.type === "department") {
                            return renderDepartmentNode(item, 0);
                        } else {
                            // Company objective
                            return (
                                <div key={`company-${item.objective_id}`} className="mb-6">
                                    {renderObjectiveNode(item, 0)}
                                    {/* Render departments under company */}
                                    {item.children &&
                                        item.children.map((dept) =>
                                            renderDepartmentNode(dept, 1)
                                        )}
                                </div>
                            );
                        }
                    })}
                </div>
            )}

            <ToastNotification toast={toast} />
        </div>
    );
}



