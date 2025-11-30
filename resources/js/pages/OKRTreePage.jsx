import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Position,
    ReactFlowProvider,
    useReactFlow,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { CycleDropdown } from "../components/Dropdown";
import ToastNotification from "../components/ToastNotification";

// Custom Node Component cho Objective
const ObjectiveNode = ({ data }) => {
    const getLevelColor = (level) => {
        const colors = {
            company: "bg-blue-500",
            unit: "bg-purple-500",
            team: "bg-green-500",
            person: "bg-yellow-500",
        };
        return colors[level] || "bg-gray-500";
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

    return (
        <div className="bg-white rounded-lg border-2 border-gray-300 shadow-lg p-4 min-w-[280px] max-w-[320px]">
            <div className="flex items-start gap-3 mb-3">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getLevelColor(data.level)}`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-600 uppercase">Objective</span>
                        {data.level && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                Cấp: {getLevelLabel(data.level)}
                            </span>
                        )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
                        {data.obj_title}
                    </h3>
                    {data.department && (
                        <p className="text-xs text-gray-500">
                            {data.department.department_name}
                        </p>
                    )}
                </div>
            </div>

            <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">Tiến độ</span>
                    <span className="text-xs font-bold text-gray-900">
                        {formatProgress(data.progress_percent)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${
                            (data.progress_percent || 0) >= 80
                                ? "bg-green-500"
                                : (data.progress_percent || 0) >= 50
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, data.progress_percent || 0))}%` }}
                    />
                </div>
            </div>

            {data.user && (
                <div className="text-xs text-gray-500 mt-2">
                    {data.user.full_name}
                </div>
            )}
        </div>
    );
};

// Custom Node Component cho Key Result
const KeyResultNode = ({ data }) => {
    const formatProgress = (progress) => {
        return typeof progress === 'number' ? Math.round(progress * 10) / 10 : 0;
    };

    return (
        <div className="bg-white rounded-lg border-2 border-indigo-300 shadow-lg p-4 min-w-[280px] max-w-[320px]">
            <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-indigo-500">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-600 uppercase">Key Result</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
                        {data.kr_title}
                    </h3>
                </div>
            </div>

            <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">Tiến độ</span>
                    <span className="text-xs font-bold text-gray-900">
                        {formatProgress(data.progress_percent)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${
                            (data.progress_percent || 0) >= 80
                                ? "bg-green-500"
                                : (data.progress_percent || 0) >= 50
                                ? "bg-yellow-500"
                                : "bg-indigo-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, data.progress_percent || 0))}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                    <span className="text-gray-600">Hiện tại: </span>
                    <span className="font-semibold text-gray-900">{data.current_value || 0}</span>
                </div>
                <div>
                    <span className="text-gray-600">Mục tiêu: </span>
                    <span className="font-semibold text-gray-900">{data.target_value || 0} {data.unit || 'number'}</span>
                </div>
            </div>

            {data.assigned_user && (
                <div className="text-xs text-gray-500">
                    Người phụ trách: {data.assigned_user.full_name}
                </div>
            )}
        </div>
    );
};

// Node types
const nodeTypes = {
    objective: ObjectiveNode,
    key_result: KeyResultNode,
};

// Inner component để sử dụng useReactFlow hook
function OKRTreeFlow({ 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    nodeTypes, 
    layoutDirection 
}) {
    const { fitView } = useReactFlow();

    // Auto fit view khi nodes hoặc layout direction thay đổi
    useEffect(() => {
        if (nodes.length === 0) return;
        
        const timer = setTimeout(() => {
            fitView({
                padding: 0.2,
                maxZoom: 1.5,
                duration: 300,
            });
        }, 300);
        
        return () => clearTimeout(timer);
    }, [nodes, layoutDirection, fitView]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ 
                padding: 0.2,
                includeHiddenNodes: false,
                maxZoom: 1.5,
                minZoom: 0.3
            }}
            minZoom={0.1}
            maxZoom={2}
        >
            <Controls />
            <MiniMap 
                nodeColor={(node) => {
                    if (node.type === 'key_result') return '#6366f1';
                    return '#3b82f6';
                }}
                maskColor="rgba(0, 0, 0, 0.1)"
            />
            <Background color="#f1f5f9" gap={16} />
        </ReactFlow>
    );
}

export default function OKRTreePage() {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [cycleId, setCycleId] = useState(null);
    const [cyclesList, setCyclesList] = useState([]);
    const [companyObjectives, setCompanyObjectives] = useState([]);
    const [selectedObjectiveId, setSelectedObjectiveId] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [objectiveDropdownOpen, setObjectiveDropdownOpen] = useState(false);
    const [layoutDirection, setLayoutDirection] = useState('horizontal'); // 'horizontal' or 'vertical'
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
            setNodes([]);
            setEdges([]);
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

    // Function to get layout using dagre
    const getLayoutedElements = useCallback((nodes, edges, direction = 'TB') => {
        // Kiểm tra nodes và edges hợp lệ
        if (!nodes || nodes.length === 0) {
            return { nodes: [], edges: [] };
        }

        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));
        dagreGraph.setGraph({ 
            rankdir: direction,
            nodesep: 100, // Khoảng cách giữa các nodes cùng level
            ranksep: 150, // Khoảng cách giữa các levels
            align: 'C', // Căn giữa (Center) thay vì UL (Upper Left)
            marginx: 50,
            marginy: 50,
        });

        // Kích thước node
        const nodeWidth = 320;
        const nodeHeight = 220;

        // Chỉ thêm nodes có id hợp lệ
        nodes.forEach((node) => {
            if (node && node.id) {
                dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
            }
        });

        // Chỉ thêm edges có source và target hợp lệ
        edges.forEach((edge) => {
            if (edge && edge.source && edge.target) {
                // Kiểm tra cả source và target đều tồn tại trong graph
                if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
                    dagreGraph.setEdge(edge.source, edge.target);
                }
            }
        });

        dagre.layout(dagreGraph);

        // Nhóm nodes theo rank để căn giữa từng level
        const nodesByRank = {};
        const rankOffsets = {}; // Lưu offset cho mỗi rank

        nodes.forEach((node) => {
            if (!node || !node.id) return;
            
            const nodeWithPosition = dagreGraph.node(node.id);
            // Kiểm tra node có tồn tại trong graph không
            if (!nodeWithPosition || typeof nodeWithPosition.x !== 'number' || typeof nodeWithPosition.y !== 'number') {
                console.warn(`Node ${node.id} not found in dagre graph or has invalid position`);
                return;
            }
            // Sử dụng giá trị rank chính xác (có thể có sai số nhỏ do floating point)
            // Làm tròn với tolerance nhỏ để nhóm các nodes trong cùng rank
            const rankValue = direction === 'LR' ? nodeWithPosition.y : nodeWithPosition.x;
            const rank = Math.round(rankValue * 100) / 100;
            
            // Đảm bảo rank là một số hợp lệ
            if (isNaN(rank) || !isFinite(rank)) {
                console.warn(`Invalid rank for node ${node.id}:`, rankValue);
                return;
            }
            
            const rankKey = String(rank);
            if (!nodesByRank[rankKey]) {
                nodesByRank[rankKey] = [];
            }
            nodesByRank[rankKey].push({ node, nodeWithPosition });
        });

        // Tính toán offset để căn giữa từng rank
        Object.keys(nodesByRank).forEach((rankKey) => {
            const rankNodes = nodesByRank[rankKey];
            if (!rankNodes || rankNodes.length === 0) return;

            // Tìm min và max position trong rank này
            let minPos = Infinity;
            let maxPos = -Infinity;

            rankNodes.forEach(({ nodeWithPosition }) => {
                if (!nodeWithPosition) return;
                
                if (direction === 'LR') {
                    // Layout ngang: căn giữa theo chiều ngang (X)
                    const x = nodeWithPosition.x - nodeWidth / 2;
                    minPos = Math.min(minPos, x);
                    maxPos = Math.max(maxPos, x + nodeWidth);
                } else {
                    // Layout dọc: căn giữa theo chiều dọc (Y)
                    const y = nodeWithPosition.y - nodeHeight / 2;
                    minPos = Math.min(minPos, y);
                    maxPos = Math.max(maxPos, y + nodeHeight);
                }
            });

            // Tính center của rank và offset để căn giữa
            if (isFinite(minPos) && isFinite(maxPos)) {
                const rankCenter = (minPos + maxPos) / 2;
                rankOffsets[rankKey] = -rankCenter;
            }
        });

        // Tính toán bounding box để căn giữa toàn bộ graph
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        nodes.forEach((node) => {
            if (!node || !node.id) return;
            
            const nodeWithPosition = dagreGraph.node(node.id);
            // Kiểm tra node có tồn tại trong graph không
            if (!nodeWithPosition || typeof nodeWithPosition.x !== 'number' || typeof nodeWithPosition.y !== 'number') {
                console.warn(`Node ${node.id} not found in dagre graph when calculating bounding box`);
                return;
            }
            // Làm tròn rank để lấy offset (giống như khi nhóm)
            const rankValue = direction === 'LR' ? nodeWithPosition.y : nodeWithPosition.x;
            const rank = Math.round(rankValue * 100) / 100;
            const rankKey = String(rank);
            const rankOffset = rankOffsets[rankKey] || 0;

            let x, y;
            if (direction === 'LR') {
                x = nodeWithPosition.x - nodeWidth / 2 + rankOffset;
                y = nodeWithPosition.y - nodeHeight / 2;
            } else {
                x = nodeWithPosition.x - nodeWidth / 2;
                y = nodeWithPosition.y - nodeHeight / 2 + rankOffset;
            }
            
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x + nodeWidth);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y + nodeHeight);
        });

        // Tính center của graph
        const graphCenterX = (minX + maxX) / 2;
        const graphCenterY = (minY + maxY) / 2;
        
        // Offset để đưa center của graph về (0, 0) - fitView sẽ tự động căn giữa
        const offsetX = -graphCenterX;
        const offsetY = -graphCenterY;

        nodes.forEach((node) => {
            if (!node || !node.id) return;
            
            const nodeWithPosition = dagreGraph.node(node.id);
            // Kiểm tra node có tồn tại trong graph không
            if (!nodeWithPosition || typeof nodeWithPosition.x !== 'number' || typeof nodeWithPosition.y !== 'number') {
                console.warn(`Node ${node.id} not found in dagre graph when setting position`);
                // Set default position nếu node không tồn tại
                node.position = { x: 0, y: 0 };
                return;
            }
            // Làm tròn rank để lấy offset (giống như khi nhóm)
            const rankValue = direction === 'LR' ? nodeWithPosition.y : nodeWithPosition.x;
            const rank = Math.round(rankValue * 100) / 100;
            const rankKey = String(rank);
            const rankOffset = rankOffsets[rankKey] || 0;

            node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
            node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;
            
            if (direction === 'LR') {
                node.position = {
                    x: nodeWithPosition.x - nodeWidth / 2 + rankOffset + offsetX,
                    y: nodeWithPosition.y - nodeHeight / 2 + offsetY,
                };
            } else {
                node.position = {
                    x: nodeWithPosition.x - nodeWidth / 2 + offsetX,
                    y: nodeWithPosition.y - nodeHeight / 2 + rankOffset + offsetY,
                };
            }
        });

        return { nodes, edges };
    }, []);

    // Convert tree data to ReactFlow nodes and edges
    useEffect(() => {
        if (!treeData) {
            setNodes([]);
            setEdges([]);
            return;
        }

        const buildFlowData = (node, parentId = null) => {
            // Đảm bảo node có id hợp lệ
            if (!node) return { nodes: [], edges: [] };
            
            const nodeId = node.objective_id ? `obj-${node.objective_id}` : (node.kr_id ? `kr-${node.kr_id}` : null);
            if (!nodeId) {
                console.warn('Node missing both objective_id and kr_id:', node);
                return { nodes: [], edges: [] };
            }
            
            const nodeType = node.type === 'key_result' || node.kr_id ? 'key_result' : 'objective';
            
            const flowNode = {
                id: nodeId,
                type: nodeType,
                data: node,
            };

            const flowNodes = [flowNode];
            const flowEdges = [];

            // Add edge from parent
            if (parentId) {
                flowEdges.push({
                    id: `${parentId}-${nodeId}`,
                    source: parentId,
                    target: nodeId,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#94a3b8', strokeWidth: 2 },
                });
            }

            // Process children
            if (node.children && node.children.length > 0) {
                node.children.forEach((child) => {
                    const childData = buildFlowData(child, nodeId);
                    flowNodes.push(...childData.nodes);
                    flowEdges.push(...childData.edges);
                });
            }

            return { nodes: flowNodes, edges: flowEdges };
        };

        const flowData = buildFlowData(treeData);
        
        // Sử dụng dagre để tự động layout
        const direction = layoutDirection === 'horizontal' ? 'LR' : 'TB'; // LR = Left to Right, TB = Top to Bottom
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            flowData.nodes,
            flowData.edges,
            direction
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [treeData, layoutDirection, setNodes, setEdges, getLayoutedElements]);


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
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Tree View OKR</h1>
                    {/* Layout Toggle Button */}
                    {treeData && (
                        <button
                            onClick={() => setLayoutDirection(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            title={layoutDirection === 'horizontal' ? 'Chuyển sang dọc' : 'Chuyển sang ngang'}
                        >
                            {layoutDirection === 'horizontal' ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <span className="text-sm font-medium">Dọc</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    <span className="text-sm font-medium">Ngang</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
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
                <div className="bg-white rounded-lg shadow-sm" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
                    <ReactFlowProvider>
                        <OKRTreeFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            nodeTypes={nodeTypes}
                            layoutDirection={layoutDirection}
                        />
                    </ReactFlowProvider>
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
