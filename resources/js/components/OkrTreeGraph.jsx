import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

export default function OkrTreeGraph({ treeData, highlightedObjectiveId, onNodeClick }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Chuyển đổi treeData thành nodes và edges
    const { graphNodes, graphEdges } = useMemo(() => {
        if (!treeData || treeData.length === 0) {
            return { graphNodes: [], graphEdges: [] };
        }

        const nodes = [];
        const edges = [];
        const nodeWidth = 250;
        const horizontalSpacing = 400;
        const verticalSpacing = 250;
        let nodeCounter = 0;

        // Hàm đệ quy để tính số lượng nodes con
        const countChildren = (item) => {
            let count = 1;
            if (item.children && item.children.length > 0) {
                count += item.children.reduce((sum, child) => sum + countChildren(child), 0);
            }
            if (item.objectives && item.objectives.length > 0) {
                count += item.objectives.reduce((sum, obj) => sum + countChildren(obj), 0);
            }
            return count;
        };

        // Hàm đệ quy để tạo nodes và edges
        const processNode = (item, depth = 0, parentId = null, siblingIndex = 0, totalSiblings = 1, yOffset = 0) => {
            const nodeId = item.type === 'department' 
                ? `dept-${item.department_id}` 
                : `obj-${item.objective_id || nodeCounter++}`;
            
            // Tính toán vị trí
            const x = 100 + depth * horizontalSpacing;
            
            // Tính y dựa trên tổng số nodes con của các siblings trước đó
            let y = 200 + yOffset;
            
            // Tạo node
            const isHighlighted = highlightedObjectiveId && 
                item.objective_id == highlightedObjectiveId;
            
            let nodeLabel = '';
            let nodeType = '';
            let badgeColor = '';
            
            if (item.type === 'department') {
                nodeLabel = `📁 ${item.department_name}`;
                nodeType = 'department';
                badgeColor = 'bg-blue-100 text-blue-800';
            } else {
                nodeLabel = item.obj_title || 'OKR';
                nodeType = item.level || 'individual';
                if (nodeType === 'company') {
                    badgeColor = 'bg-purple-100 text-purple-800';
                } else if (nodeType === 'unit') {
                    badgeColor = 'bg-blue-100 text-blue-800';
                } else {
                    badgeColor = 'bg-green-100 text-green-800';
                }
            }

            const node = {
                id: nodeId,
                type: 'default',
                position: { x, y },
                data: {
                    label: (
                        <div className={`p-4 rounded-lg border-2 shadow-sm min-w-[220px] max-w-[220px] ${
                            isHighlighted 
                                ? 'bg-yellow-50 border-yellow-400 shadow-lg ring-2 ring-yellow-300' 
                                : nodeType === 'company'
                                ? 'bg-purple-50 border-purple-300'
                                : nodeType === 'unit'
                                ? 'bg-blue-50 border-blue-300'
                                : nodeType === 'department'
                                ? 'bg-indigo-50 border-indigo-300'
                                : 'bg-green-50 border-green-300'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${badgeColor}`}>
                                    {nodeType === 'company' ? 'Công ty' : nodeType === 'unit' ? 'Phòng ban' : nodeType === 'department' ? 'Phòng ban' : 'Cá nhân'}
                                </span>
                            </div>
                            <div className="font-semibold text-sm mb-2 line-clamp-2">
                                {nodeLabel}
                            </div>
                            {item.progress_percent !== undefined && (
                                <div className="mt-2">
                                    <div className="text-xs text-slate-600 mb-1">
                                        {item.progress_percent.toFixed(1)}%
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                            style={{ width: `${Math.min(item.progress_percent || 0, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {item.user_name && (
                                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                    <span>👤</span>
                                    <span className="truncate">{item.user_name}</span>
                                </div>
                            )}
                            {isHighlighted && (
                                <div className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded mt-2 text-center font-semibold">
                                    ⭐ OKR này
                                </div>
                            )}
                        </div>
                    ),
                },
                style: {
                    width: nodeWidth,
                },
            };

            nodes.push(node);

            // Tạo edge từ parent
            if (parentId) {
                edges.push({
                    id: `e-${parentId}-${nodeId}`,
                    source: parentId,
                    target: nodeId,
                    type: 'smoothstep',
                    animated: true,
                    style: { strokeWidth: 2, stroke: isHighlighted ? '#fbbf24' : '#94a3b8' },
                });
            }

            let currentYOffset = yOffset + verticalSpacing;

            // Xử lý children
            if (item.children && item.children.length > 0) {
                item.children.forEach((child, index) => {
                    const childYOffset = processNode(
                        child, 
                        depth + 1, 
                        nodeId, 
                        index, 
                        item.children.length,
                        currentYOffset
                    );
                    currentYOffset = childYOffset;
                });
            }

            // Xử lý objectives trong department
            if (item.objectives && item.objectives.length > 0) {
                item.objectives.forEach((obj, index) => {
                    const objYOffset = processNode(
                        obj, 
                        depth + 1, 
                        nodeId, 
                        index, 
                        item.objectives.length,
                        currentYOffset
                    );
                    currentYOffset = objYOffset;
                });
            }

            return currentYOffset;
        };

        // Xử lý tất cả items trong treeData
        let startYOffset = 0;
        treeData.forEach((item, index) => {
            console.log('OkrTreeGraph: Processing tree item:', {
                index,
                item,
                hasChildren: !!(item.children && item.children.length > 0),
                hasObjectives: !!(item.objectives && item.objectives.length > 0),
                type: item.type,
                objective_id: item.objective_id,
                department_id: item.department_id,
            });
            try {
                startYOffset = processNode(item, 0, null, index, treeData.length, startYOffset);
            } catch (error) {
                console.error('Error processing node:', error, item);
            }
        });

        console.log('OkrTreeGraph: Generated', {
            nodesCount: nodes.length,
            edgesCount: edges.length,
            firstNode: nodes[0],
            firstEdge: edges[0],
        });

        return { graphNodes: nodes, graphEdges: edges };
    }, [treeData, highlightedObjectiveId]);

    // Cập nhật nodes và edges khi treeData thay đổi
    useEffect(() => {
        console.log('OkrTreeGraph: Setting nodes and edges', {
            nodesCount: graphNodes.length,
            edgesCount: graphEdges.length,
            nodes: graphNodes,
            edges: graphEdges,
        });
        setNodes(graphNodes);
        setEdges(graphEdges);
    }, [graphNodes, graphEdges, setNodes, setEdges]);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    if (!treeData || treeData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-slate-600">Không có dữ liệu để hiển thị</p>
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div className="flex items-center justify-center" style={{ width: '100%', height: '600px' }}>
                <p className="text-slate-600">Đang xử lý dữ liệu...</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '600px', position: 'relative' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
                attributionPosition="bottom-left"
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            >
                <Background variant="dots" gap={12} size={1} />
                <Controls />
                <MiniMap 
                    nodeColor={(node) => {
                        if (node.data?.label?.props?.children?.props?.className?.includes('yellow')) {
                            return '#fbbf24';
                        }
                        return '#94a3b8';
                    }}
                />
            </ReactFlow>
        </div>
    );
}

