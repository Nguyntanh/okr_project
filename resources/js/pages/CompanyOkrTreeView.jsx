import React, { useState, useEffect, useCallback, useRef } from "react";
import { CycleDropdown } from "../components/Dropdown";
import ToastNotification from "../components/ToastNotification";
import ObjectiveDetailModal from "../components/ObjectiveDetailModal";
import { LuAlignCenterHorizontal } from "react-icons/lu";

// Component Card cho mỗi node trong tree view ngang
function OkrCard({ node, onNodeClick, onToggle, isExpanded, hasChildren, cycleName, onToggleKR, hasLinkedObjectives, onToggleLinked, linkedExpanded, hasKeyResults: propHasKeyResults, krExpanded: propKrExpanded }) {
    const getInitials = (name) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    const getRoleText = () => {
        if (node.type === 'company' || node.type === 'unit-objective' || node.type === 'person-objective') {
            return 'Objective';
        }
        return 'Key Result';
    };

    const getLevelText = () => {
        if (node.type === 'company') return 'Công ty';
        if (node.type === 'unit-objective') return node.d_name || 'Phòng ban';
        if (node.type === 'person-objective') return node.full_name || 'Cá nhân';
        return 'Cá nhân';
    };

    const progress = Number(node.progress_percent || 0);
    const progressColor = progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500';
    // Nếu có propHasKeyResults (cho O->O links), dùng nó; nếu không, dùng node.key_results
    const hasKeyResults = propHasKeyResults !== undefined ? propHasKeyResults : (node.key_results && node.key_results.length > 0);
    // krExpanded: nếu có prop (cho O->O links), dùng nó; nếu không, dùng logic cũ
    const krExpanded = propKrExpanded !== undefined ? propKrExpanded : (hasKeyResults && isExpanded);

    return (
        <div className="flex flex-col items-center flex-shrink-0" style={{ width: '280px' }}>
            {/* Card */}
            <div
                className="relative w-full rounded-lg border border-slate-300 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => {
                    if (onNodeClick && (node.type === 'company' || node.type === 'unit-objective' || node.type === 'person-objective')) {
                        onNodeClick(node);
                    }
                }}
            >
                {/* Header với Avatar và Tên */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-white">
                    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-blue-100">
                        {node.type === 'user' && node.full_name ? getInitials(node.full_name) : 
                         node.type === 'company' ? 'CT' :
                         node.type === 'department' ? 'PB' : 
                         node.type === 'kr' ? 'KR' : 'OK'}
                    </div>
                    <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                            <div className="font-semibold text-slate-900 truncate text-base leading-snug flex-1">
                                {node.type === 'company' && node.obj_title}
                                {node.type === 'department' && node.d_name}
                                {node.type === 'user' && node.full_name}
                                {(node.type === 'unit-objective' || node.type === 'person-objective') && node.obj_title}
                                {node.type === 'kr' && node.kr_title}
                            </div>
                            {/* Icon link cho KR hoặc Objective được liên kết */}
                            {node.is_linked && (
                                <div className="flex-shrink-0" title={node.type === 'kr' ? "Key Result được liên kết" : "Objective được liên kết"}>
                                    {/* Cả O->O và O->KR đều dùng LuAlignCenterHorizontal */}
                                    <LuAlignCenterHorizontal className="w-4 h-4 text-blue-500" />
                                </div>
                            )}
                        </div>
                        {/* Role/Type ngay dưới tên */}
                        <div className="mt-0.5">
                            <span className="text-xs text-slate-500">{getRoleText()}</span>
                        </div>
                    </div>
                </div>

                {/* Level và Progress - gộp chung */}
                <div className={`px-4 bg-white space-y-3 ${(hasKeyResults && (node.type === 'company' || node.type === 'unit-objective' || node.type === 'person-objective')) || (hasKeyResults && node.type === 'kr') ? 'py-3 pb-6' : 'py-3'}`}>
                    {/* Level - chỉ cho Objective */}
                    {(node.type === 'company' || node.type === 'unit-objective' || node.type === 'person-objective') && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">Level:</span>
                            <span className="text-xs font-semibold text-slate-900">{getLevelText()}</span>
                        </div>
                    )}

                    {/* Progress Bar - cho cả Objective và KR */}
                    {(node.type === 'company' || node.type === 'unit-objective' || node.type === 'person-objective' || node.type === 'kr') && (
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-slate-600">Progress</span>
                                <span className="text-xs font-semibold text-slate-900">{progress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>


                {/* KR Details - hiển thị current/target cho KR */}
                {node.type === 'kr' && (
                    <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50/50">
                        <div className="text-xs text-slate-600 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Current:</span>
                                <span className="font-semibold text-slate-900">{node.current_value || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Target:</span>
                                <span className="font-semibold text-slate-900">{node.target_value || 0} {node.unit || ''}</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Chevron button ở chính giữa và trên cạnh dưới của card - cho Objective có Key Results hoặc KR có linked objectives */}
            {((hasKeyResults && (node.type === 'company' || node.type === 'unit-objective' || node.type === 'person-objective')) || (hasKeyResults && node.type === 'kr') || (hasLinkedObjectives && node.type === 'kr')) && (
                <div className="relative flex items-center justify-center w-full -mt-4 z-20">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasKeyResults && onToggleKR) {
                                onToggleKR();
                            } else if (hasLinkedObjectives && onToggleLinked) {
                                onToggleLinked();
                            }
                        }}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-slate-400 shadow-md flex items-center justify-center hover:bg-slate-50 hover:border-blue-500 transition-all"
                        title={(hasKeyResults && krExpanded) || (hasLinkedObjectives && linkedExpanded) ? "Thu gọn" : "Mở rộng"}
                    >
                        {((hasKeyResults && krExpanded) || (hasLinkedObjectives && linkedExpanded)) ? (
                            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                        )}
                    </button>
                </div>
            )}

            {/* Connection Line và Collapse Button - chỉ cho children nodes (users, objectives), không phải KR */}
            {hasChildren && !hasKeyResults && (
                <div className="flex items-center w-full mt-4">
                    <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-slate-300 to-slate-300"></div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onToggle) onToggle();
                        }}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-slate-400 shadow-md flex items-center justify-center hover:bg-slate-50 hover:border-blue-500 transition-all z-10"
                        title={isExpanded ? "Thu gọn" : "Mở rộng"}
                    >
                        <svg 
                            className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div className="flex-1 h-1 bg-gradient-to-l from-transparent via-slate-300 to-slate-300"></div>
                </div>
            )}
        </div>
    );
}

// Component hiển thị horizontal tree cho một branch
function HorizontalTreeBranch({ items, onNodeClick, expandedNodes, toggleNode, cycleName, level = 0, onToggleKR }) {
    if (!items || items.length === 0) return null;

    return (
        <div className="flex flex-col items-center">
            {/* Cards ngang */}
            <div className="flex items-start gap-6 justify-center overflow-x-auto pb-6 px-2" style={{ minHeight: '200px' }}>
                {items.map((item, index) => {
                    const itemId = item.objective_id || item.department_id || item.user_id || item.kr_id || `item-${index}`;
                    const isExpanded = expandedNodes.has(itemId);
                    const hasChildren = 
                        (item.key_results && item.key_results.length > 0) ||
                        (item.objectives && item.objectives.length > 0) ||
                        (item.users && item.users.length > 0) ||
                        (item.linked_objectives && item.linked_objectives.length > 0);
                    const isObjective = item.objective_id && (item.level === 'company' || item.level === 'unit' || item.level === 'person');
                    const hasKeyResults = item.key_results && item.key_results.length > 0;
                    const hasLinkedObjectives = item.linked_objectives && item.linked_objectives.length > 0;
                    const krExpanded = expandedNodes.has(`kr-${itemId}`);
                    const linkedExpanded = expandedNodes.has(`linked-${itemId}`);

                    return (
                        <React.Fragment key={itemId}>
                            <div className="flex flex-col items-center">
                                <OkrCard
                                    node={{
                                        ...item,
                                        type: item.objective_id ? (item.level === 'company' ? 'company' : item.level === 'unit' ? 'unit-objective' : 'person-objective') :
                                              item.department_id ? 'department' : 
                                              item.kr_id ? 'kr' : 'user',
                                    }}
                                    onNodeClick={onNodeClick}
                                    onToggle={() => {}}
                                    onToggleKR={() => toggleNode(`kr-${itemId}`)}
                                    isExpanded={krExpanded}
                                    hasChildren={false}
                                    cycleName={cycleName}
                                />
                                
                                {/* Key Results hiển thị như children nodes ngang dưới Objective */}
                                {isObjective && hasKeyResults && krExpanded && (
                                    <div className="flex flex-col items-center w-full mt-2">
                                        {/* Container cho KR với đường nối mềm mại bằng SVG path */}
                                        <div className="relative w-full flex flex-col items-center" style={{ minHeight: '60px' }}>
                                            {/* SVG để vẽ đường nối mềm mại với đường cong bezier - bắt đầu từ trên để chạm O */}
                                            <svg 
                                                className="absolute left-0 w-full pointer-events-none"
                                                style={{ height: '68px', top: '-8px' }}
                                                viewBox="0 -8 1000 68"
                                                preserveAspectRatio="xMidYMin slice"
                                            >
                                                {item.key_results.length === 1 ? (
                                                    // Nếu chỉ có 1 KR: đường thẳng đơn giản
                                                    <path
                                                        d="M 500 -8 L 500 60"
                                                        stroke="#cbd5e1"
                                                        strokeWidth="2"
                                                        fill="none"
                                                        strokeLinecap="round"
                                                    />
                                                ) : (
                                                    // Nếu có nhiều KR: đường thẳng đứng, ngang, thẳng đứng
                                                    (() => {
                                                        const cardWidth = 280;
                                                        const gap = 24;
                                                        const horizontalLineWidth = (item.key_results.length - 1) * (cardWidth + gap);
                                                        const centerX = 500; // Center trong viewBox
                                                        const verticalStart = -8; // Bắt đầu từ trên để chạm vào O
                                                        const horizontalY = 25;
                                                        const bottomY = 60;
                                                        
                                                        // Tính toán vị trí trong viewBox (1000 = 100%)
                                                        const halfWidth = horizontalLineWidth / 2;
                                                        const leftX = centerX - halfWidth;
                                                        const rightX = centerX + halfWidth;
                                                        
                                                        // Tạo path với đường thẳng: đứng -> ngang -> đứng
                                                        let path = `M ${centerX} ${verticalStart} `;
                                                        // Đường thẳng đứng xuống đến đường ngang
                                                        path += `L ${centerX} ${horizontalY} `;
                                                        
                                                        // Đường ngang
                                                        path += `L ${leftX} ${horizontalY} `;
                                                        path += `L ${rightX} ${horizontalY} `;
                                                        
                                                        // Thêm các đường thẳng đứng xuống từng KR
                                                        item.key_results.forEach((_, krIndex) => {
                                                            const offsetFromCenter = (krIndex - (item.key_results.length - 1) / 2) * (cardWidth + gap);
                                                            const krX = centerX + offsetFromCenter;
                                                            path += `M ${krX} ${horizontalY} `;
                                                            path += `L ${krX} ${bottomY} `;
                                                        });
                                                        
                                                        return (
                                                            <path
                                                                d={path}
                                                                stroke="#cbd5e1"
                                                                strokeWidth="2"
                                                                fill="none"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        );
                                                    })()
                                                )}
                                            </svg>
                                            
                                            {/* Cards KR ngang */}
                                            <div className="flex items-start gap-6 justify-center relative z-10" style={{ paddingTop: '60px' }}>
                                                {item.key_results.map((kr) => {
                                                    const krId = `kr-${itemId}-${kr.kr_id}`;
                                                    // Kiểm tra xem đây có phải là O->O link (virtual KR) không
                                                    const isLinkedObjective = kr.is_linked_objective && kr.linked_objective_data;
                                                    // Nếu là O->O, lấy key_results từ linked_objective_data
                                                    const krKeyResults = isLinkedObjective 
                                                        ? (kr.linked_objective_data.key_results || [])
                                                        : [];
                                                    const hasKrKeyResults = krKeyResults.length > 0;
                                                    const krKeyResultsExpanded = expandedNodes.has(`kr-keyresults-${krId}`);
                                                    
                                                    // O->KR links (linked_objectives)
                                                    const krHasLinkedObjectives = kr.linked_objectives && kr.linked_objectives.length > 0;
                                                    const krLinkedExpanded = expandedNodes.has(`linked-${krId}`);
                                                    
                                                    return (
                                                        <div key={kr.kr_id} className="flex flex-col items-center">
                                                            <OkrCard
                                                                node={{
                                                                    ...kr,
                                                                    type: 'kr',
                                                                    kr_title: kr.kr_title,
                                                                    progress_percent: kr.progress_percent,
                                                                    current_value: kr.current_value,
                                                                    target_value: kr.target_value,
                                                                    unit: kr.unit,
                                                                    status: kr.status,
                                                                    is_linked: kr.is_linked,
                                                                    is_linked_objective: kr.is_linked_objective, // Flag để phân biệt O->O với O->KR
                                                                }}
                                                                onNodeClick={onNodeClick}
                                                                onToggle={() => {}}
                                                                isExpanded={false}
                                                                hasChildren={false}
                                                                cycleName={cycleName}
                                                                hasLinkedObjectives={krHasLinkedObjectives}
                                                                onToggleLinked={() => toggleNode(`linked-${krId}`)}
                                                                linkedExpanded={krLinkedExpanded}
                                                                // Cho O->O links: có thể expand để xem KR của O nguồn
                                                                hasKeyResults={hasKrKeyResults}
                                                                onToggleKR={() => toggleNode(`kr-keyresults-${krId}`)}
                                                                krExpanded={krKeyResultsExpanded}
                                                            />
                                                            
                                                            {/* Hiển thị KR của O nguồn (O->O) khi expand */}
                                                            {isLinkedObjective && hasKrKeyResults && krKeyResultsExpanded && (
                                                                <div className="flex flex-col items-center w-full mt-2">
                                                                    <div className="relative w-full flex flex-col items-center" style={{ minHeight: '68px' }}>
                                                                        <svg 
                                                                            className="absolute left-0 w-full pointer-events-none z-0"
                                                                            style={{ height: '68px', top: '-20px' }}
                                                                            viewBox="0 -20 1000 68"
                                                                            preserveAspectRatio="xMidYMin slice"
                                                                        >
                                                                            {krKeyResults.length === 1 ? (
                                                                                <path
                                                                                    d="M 500 -20 L 500 48"
                                                                                    stroke="#cbd5e1"
                                                                                    strokeWidth="2"
                                                                                    fill="none"
                                                                                    strokeLinecap="round"
                                                                                />
                                                                            ) : (
                                                                                (() => {
                                                                                    const cardWidth = 280;
                                                                                    const gap = 24;
                                                                                    const horizontalLineWidth = (krKeyResults.length - 1) * (cardWidth + gap);
                                                                                    const centerX = 500;
                                                                                    const verticalStart = -20;
                                                                                    const horizontalY = 5;
                                                                                    const bottomY = 48;
                                                                                    
                                                                                    const halfWidth = horizontalLineWidth / 2;
                                                                                    const leftX = centerX - halfWidth;
                                                                                    const rightX = centerX + halfWidth;
                                                                                    
                                                                                    let path = `M ${centerX} ${verticalStart} `;
                                                                                    path += `L ${centerX} ${horizontalY} `;
                                                                                    path += `L ${leftX} ${horizontalY} `;
                                                                                    path += `L ${rightX} ${horizontalY} `;
                                                                                    
                                                                                    krKeyResults.forEach((_, krIndex) => {
                                                                                        const offsetFromCenter = (krIndex - (krKeyResults.length - 1) / 2) * (cardWidth + gap);
                                                                                        const krX = centerX + offsetFromCenter;
                                                                                        path += `M ${krX} ${horizontalY} `;
                                                                                        path += `L ${krX} ${bottomY} `;
                                                                                    });
                                                                                    
                                                                                    return (
                                                                                        <path
                                                                                            d={path}
                                                                                            stroke="#cbd5e1"
                                                                                            strokeWidth="2"
                                                                                            fill="none"
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                        />
                                                                                    );
                                                                                })()
                                                                            )}
                                                                        </svg>
                                                                        
                                                                        <div className="flex items-start gap-6 justify-center relative z-10" style={{ paddingTop: '48px' }}>
                                                                            {krKeyResults.map((sourceKr) => (
                                                                                <div key={sourceKr.kr_id} className="flex flex-col items-center">
                                                                                    <OkrCard
                                                                                        node={{
                                                                                            ...sourceKr,
                                                                                            type: 'kr',
                                                                                            kr_title: sourceKr.kr_title,
                                                                                            progress_percent: sourceKr.progress_percent,
                                                                                            current_value: sourceKr.current_value,
                                                                                            target_value: sourceKr.target_value,
                                                                                            unit: sourceKr.unit,
                                                                                            status: sourceKr.status,
                                                                                        }}
                                                                                        onNodeClick={onNodeClick}
                                                                                        onToggle={() => {}}
                                                                                        isExpanded={false}
                                                                                        hasChildren={false}
                                                                                        cycleName={cycleName}
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Hiển thị linked objectives của KR (O->KR) - giống như O-KR với đường nối */}
                                                            {krHasLinkedObjectives && krLinkedExpanded && (
                                                                <div className="flex flex-col items-center w-full mt-2">
                                                                    {/* Container cho linked objectives với đường nối mềm mại bằng SVG path */}
                                                                    <div className="relative w-full flex flex-col items-center" style={{ minHeight: '88px' }}>
                                                                        {/* SVG để vẽ đường nối - bắt đầu từ chevron button (ngay dưới KR card) xuống */}
                                                                        <svg 
                                                                            className="absolute left-0 w-full pointer-events-none z-0"
                                                                            style={{ height: '88px', top: '-20px' }}
                                                                            viewBox="0 -20 1000 88"
                                                                            preserveAspectRatio="xMidYMin slice"
                                                                        >
                                                                            {kr.linked_objectives.length === 1 ? (
                                                                                // Nếu chỉ có 1 O: đường thẳng đơn giản từ chevron button xuống
                                                                                <path
                                                                                    d="M 500 -20 L 500 68"
                                                                                    stroke="#cbd5e1"
                                                                                    strokeWidth="2"
                                                                                    fill="none"
                                                                                    strokeLinecap="round"
                                                                                />
                                                                            ) : (
                                                                                // Nếu có nhiều O: đường thẳng đứng, ngang, thẳng đứng
                                                                                (() => {
                                                                                    const cardWidth = 280;
                                                                                    const gap = 24;
                                                                                    const horizontalLineWidth = (kr.linked_objectives.length - 1) * (cardWidth + gap);
                                                                                    const centerX = 500; // Center trong viewBox
                                                                                    const verticalStart = -20; // Bắt đầu từ chevron button (ngay dưới KR card)
                                                                                    const horizontalY = 25;
                                                                                    const bottomY = 68;
                                                                                    
                                                                                    // Tính toán vị trí trong viewBox (1000 = 100%)
                                                                                    const halfWidth = horizontalLineWidth / 2;
                                                                                    const leftX = centerX - halfWidth;
                                                                                    const rightX = centerX + halfWidth;
                                                                                    
                                                                                    // Tạo path với đường thẳng: đứng -> ngang -> đứng
                                                                                    let path = `M ${centerX} ${verticalStart} `;
                                                                                    // Đường thẳng đứng xuống đến đường ngang
                                                                                    path += `L ${centerX} ${horizontalY} `;
                                                                                    
                                                                                    // Đường ngang
                                                                                    path += `L ${leftX} ${horizontalY} `;
                                                                                    path += `L ${rightX} ${horizontalY} `;
                                                                                    
                                                                                    // Thêm các đường thẳng đứng xuống từng O
                                                                                    kr.linked_objectives.forEach((_, objIndex) => {
                                                                                        const offsetFromCenter = (objIndex - (kr.linked_objectives.length - 1) / 2) * (cardWidth + gap);
                                                                                        const objX = centerX + offsetFromCenter;
                                                                                        path += `M ${objX} ${horizontalY} `;
                                                                                        path += `L ${objX} ${bottomY} `;
                                                                                    });
                                                                                    
                                                                                    return (
                                                                                        <path
                                                                                            d={path}
                                                                                            stroke="#cbd5e1"
                                                                                            strokeWidth="2"
                                                                                            fill="none"
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                        />
                                                                                    );
                                                                                })()
                                                                            )}
                                                                        </svg>
                                                                        
                                                                        {/* Cards linked objectives ngang */}
                                                                        <div className="flex items-start gap-6 justify-center relative z-10" style={{ paddingTop: '68px' }}>
                                                                            {kr.linked_objectives.map((linkedObj) => {
                                                                                const linkedObjId = linkedObj.objective_id || `linked-${kr.kr_id}-${linkedObj.obj_title}`;
                                                                                const hasKeyResults = linkedObj.key_results && linkedObj.key_results.length > 0;
                                                                                const linkedObjKrExpanded = expandedNodes.has(`kr-${linkedObjId}`);
                                                                                return (
                                                                                    <div key={linkedObjId} className="flex flex-col items-center">
                                                                                        <OkrCard
                                                                                            node={{
                                                                                                ...linkedObj,
                                                                                                type: linkedObj.level === 'company' ? 'company' : linkedObj.level === 'unit' ? 'unit-objective' : 'person-objective',
                                                                                                obj_title: linkedObj.obj_title,
                                                                                                progress_percent: linkedObj.progress_percent,
                                                                                                status: linkedObj.status,
                                                                                                key_results: linkedObj.key_results,
                                                                                                is_linked: true,
                                                                                            }}
                                                                                            onNodeClick={onNodeClick}
                                                                                            onToggle={() => toggleNode(linkedObjId)}
                                                                                            onToggleKR={() => toggleNode(`kr-${linkedObjId}`)}
                                                                                            isExpanded={linkedObjKrExpanded}
                                                                                            hasChildren={hasKeyResults}
                                                                                            cycleName={cycleName}
                                                                                        />
                                                                                        
                                                                                        {/* Hiển thị KR của O được liên kết - giống như O-KR */}
                                                                                        {hasKeyResults && linkedObjKrExpanded && (
                                                                                            <div className="flex flex-col items-center w-full mt-2">
                                                                                                <div className="relative w-full flex flex-col items-center" style={{ minHeight: '68px' }}>
                                                                                                    <svg 
                                                                                                        className="absolute left-0 w-full pointer-events-none z-0"
                                                                                                        style={{ height: '68px', top: '-8px' }}
                                                                                                        viewBox="0 -8 1000 68"
                                                                                                        preserveAspectRatio="xMidYMin slice"
                                                                                                    >
                                                                                                        {linkedObj.key_results.length === 1 ? (
                                                                                                            <path
                                                                                                                d="M 500 -8 L 500 60"
                                                                                                                stroke="#cbd5e1"
                                                                                                                strokeWidth="2"
                                                                                                                fill="none"
                                                                                                                strokeLinecap="round"
                                                                            />
                                                                                                        ) : (
                                                                                                            (() => {
                                                                                                                const cardWidth = 280;
                                                                                                                const gap = 24;
                                                                                                                const horizontalLineWidth = (linkedObj.key_results.length - 1) * (cardWidth + gap);
                                                                                                                const centerX = 500;
                                                                                                                const verticalStart = -8; // Bắt đầu từ trên để chạm vào O
                                                                                                                const horizontalY = 25;
                                                                                                                const bottomY = 60;
                                                                                                                const halfWidth = horizontalLineWidth / 2;
                                                                                                                const leftX = centerX - halfWidth;
                                                                                                                const rightX = centerX + halfWidth;
                                                                                                                
                                                                                                                // Tạo path với đường thẳng: đứng -> ngang -> đứng
                                                                                                                let path = `M ${centerX} ${verticalStart} `;
                                                                                                                // Đường thẳng đứng xuống đến đường ngang
                                                                                                                path += `L ${centerX} ${horizontalY} `;
                                                                                                                
                                                                                                                // Đường ngang
                                                                                                                path += `L ${leftX} ${horizontalY} `;
                                                                                                                path += `L ${rightX} ${horizontalY} `;
                                                                                                                
                                                                                                                // Thêm các đường thẳng đứng xuống từng KR
                                                                                                                linkedObj.key_results.forEach((_, krIndex) => {
                                                                                                                    const offsetFromCenter = (krIndex - (linkedObj.key_results.length - 1) / 2) * (cardWidth + gap);
                                                                                                                    const krX = centerX + offsetFromCenter;
                                                                                                                    path += `M ${krX} ${horizontalY} `;
                                                                                                                    path += `L ${krX} ${bottomY} `;
                                                                                                                });
                                                                                                                
                                                                                                                return (
                                                                                                                    <path
                                                                                                                        d={path}
                                                                                                                        stroke="#cbd5e1"
                                                                                                                        strokeWidth="2"
                                                                                                                        fill="none"
                                                                                                                        strokeLinecap="round"
                                                                                                                        strokeLinejoin="round"
                                                                                                                    />
                                                                                                                );
                                                                            })()
                                                                                                        )}
                                                                    </svg>
                                                                                                    
                                                                    <div className="flex items-start gap-6 justify-center relative z-10" style={{ paddingTop: '60px' }}>
                                                                        {linkedObj.key_results.map((linkedKr) => (
                                                                            <div key={linkedKr.kr_id} className="flex flex-col items-center">
                                                                                <OkrCard
                                                                                    node={{
                                                                                        ...linkedKr,
                                                                                        type: 'kr',
                                                                                        kr_title: linkedKr.kr_title,
                                                                                        progress_percent: linkedKr.progress_percent,
                                                                                        current_value: linkedKr.current_value,
                                                                                        target_value: linkedKr.target_value,
                                                                                        unit: linkedKr.unit,
                                                                                        status: linkedKr.status,
                                                                                    }}
                                                                                    onNodeClick={onNodeClick}
                                                                                    onToggle={() => {}}
                                                                                    isExpanded={false}
                                                                                    hasChildren={false}
                                                                                    cycleName={cycleName}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Linked Objectives - hiển thị các OKR cấp dưới được liên kết (O->O) */}
                                {isObjective && hasLinkedObjectives && isExpanded && (
                                    <div className="flex flex-col items-center w-full mt-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <LuAlignCenterHorizontal className="w-4 h-4 text-blue-500" />
                                            <span className="text-sm font-medium text-slate-600">Liên kết đến</span>
                                        </div>
                                        <HorizontalTreeBranch
                                            items={item.linked_objectives.map(linkedObj => ({
                                                ...linkedObj,
                                                level: linkedObj.level || 'unit',
                                                is_linked: true,
                                            }))}
                                            onNodeClick={onNodeClick}
                                            expandedNodes={expandedNodes}
                                            toggleNode={toggleNode}
                                            cycleName={cycleName}
                                            onToggleKR={onToggleKR}
                                            level={level + 1}
                                        />
                                    </div>
                                )}

                                {/* Children nodes (objectives, users) - hiển thị khi expand */}
                                {hasChildren && isExpanded && (
                                    <div className="flex flex-col items-center w-full mt-6">
                                        {item.objectives && item.objectives.length > 0 && (
                                            <HorizontalTreeBranch
                                                items={item.objectives}
                                                onNodeClick={onNodeClick}
                                                expandedNodes={expandedNodes}
                                                toggleNode={toggleNode}
                                                cycleName={cycleName}
                                                onToggleKR={onToggleKR}
                                                level={level + 1}
                                            />
                                        )}
                                        {item.users && item.users.length > 0 && (
                                            <HorizontalTreeBranch
                                                items={item.users}
                                                onNodeClick={onNodeClick}
                                                expandedNodes={expandedNodes}
                                                toggleNode={toggleNode}
                                                cycleName={cycleName}
                                                onToggleKR={onToggleKR}
                                                level={level + 1}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                            {index < items.length - 1 && (
                                <div className="flex items-center self-center flex-shrink-0">
                                    <div className="w-8 h-1 bg-gradient-to-r from-slate-300 to-slate-200"></div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

export default function CompanyOkrTreeView() {
    const [treeData, setTreeData] = useState({ company: [], departments: [] });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [cycleFilter, setCycleFilter] = useState(null);
    const [cyclesList, setCyclesList] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [selectedObjective, setSelectedObjective] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [currentCycleName, setCurrentCycleName] = useState("");
    
    // Zoom and Pan state
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Tải danh sách cycles
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/cycles", {
                    headers: { Accept: "application/json" },
                });
                const json = await res.json();
                if (json.data && Array.isArray(json.data)) {
                    setCyclesList(json.data);
                    // Tự động chọn cycle hiện tại
                    const now = new Date();
                    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
                    const currentYear = now.getFullYear();
                    const currentCycle = json.data.find((cycle) => {
                        const match = cycle.cycle_name.match(/Quý (\d+) năm (\d+)/);
                        if (!match) return false;
                        const quarter = parseInt(match[1]);
                        const year = parseInt(match[2]);
                        return quarter === currentQuarter && year === currentYear;
                    });
                    if (currentCycle) {
                        setCycleFilter(currentCycle.cycle_id);
                        setCurrentCycleName(currentCycle.cycle_name);
                    } else if (json.data.length > 0) {
                        setCycleFilter(json.data[0].cycle_id);
                        setCurrentCycleName(json.data[0].cycle_name);
                    }
                }
            } catch (err) {
                console.error("Error loading cycles:", err);
            }
        })();
    }, []);

    // Tải dữ liệu tree view
    const fetchTreeData = useCallback(async () => {
        if (!cycleFilter) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({ cycle_id: cycleFilter });
            const res = await fetch(`/api/company-okrs/tree-view?${params}`, {
                headers: { Accept: "application/json" },
            });
            const json = await res.json();
            if (json.success) {
                setTreeData(json.data || { company: [], departments: [] });
                setCurrentCycleName(json.current_cycle_name || "");
                // Tự động expand tất cả nodes cấp 1
                const newExpanded = new Set();
                json.data?.company?.forEach((obj) => {
                    newExpanded.add(`company-obj-${obj.objective_id}`);
                });
                json.data?.departments?.forEach((dept) => {
                    newExpanded.add(`dept-${dept.department_id}`);
                });
                setExpandedNodes(newExpanded);
            } else {
                throw new Error(json.message || "Không tải được dữ liệu");
            }
        } catch (err) {
            setToast({ type: "error", message: err.message || "Không tải được dữ liệu" });
            setTreeData({ company: [], departments: [] });
        } finally {
            setLoading(false);
        }
    }, [cycleFilter]);

    useEffect(() => {
        fetchTreeData();
    }, [fetchTreeData]);

    // Ẩn scrollbar của body khi ở trang tree view
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    // Tự động căn giữa Tree view khi dữ liệu được tải
    useEffect(() => {
        if (!loading && containerRef.current && (treeData.company?.length > 0 || treeData.departments?.length > 0)) {
            // Đợi một chút để DOM render xong
            const timeoutId = setTimeout(() => {
                const container = containerRef.current;
                const content = container?.querySelector('.zoomable-content');
                if (container && content) {
                    const containerWidth = container.clientWidth;
                    const containerHeight = container.clientHeight;
                    const contentRect = content.getBoundingClientRect();
                    const contentWidth = contentRect.width;
                    const contentHeight = contentRect.height;
                    
                    // Tính toán vị trí để căn giữa
                    const centerX = (containerWidth - contentWidth * scale) / 2;
                    const centerY = (containerHeight - contentHeight * scale) / 2;
                    
                    setPosition({ x: centerX, y: Math.max(0, centerY) });
                }
            }, 200);
            
            return () => clearTimeout(timeoutId);
        }
    }, [loading, treeData, scale]);

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

    const handleNodeClick = (node) => {
        if (node.type === 'company' || node.type === 'unit-objective' || node.type === 'person-objective') {
            setSelectedObjective(node);
            setShowDetailModal(true);
        }
    };

    // Flatten tree data thành các branches để hiển thị ngang
    const renderTreeBranches = () => {
        const branches = [];

        // Company level
        if (treeData.company && treeData.company.length > 0) {
            treeData.company.forEach((companyObj) => {
                const companyId = `company-obj-${companyObj.objective_id}`;
                const isExpanded = expandedNodes.has(companyId);

                branches.push(
                    <div key={companyId} className="mb-12 flex justify-center">
                        <HorizontalTreeBranch
                            items={[companyObj]}
                            onNodeClick={handleNodeClick}
                            expandedNodes={expandedNodes}
                            toggleNode={toggleNode}
                            cycleName={currentCycleName}
                            onToggleKR={toggleNode}
                        />
                    </div>
                );
            });
        }

        // Department level
        if (treeData.departments && treeData.departments.length > 0) {
            treeData.departments.forEach((dept) => {
                const deptId = `dept-${dept.department_id}`;
                const isDeptExpanded = expandedNodes.has(deptId);

                branches.push(
                    <div key={deptId} className="mb-12">
                        {/* Department Objectives */}
                        {dept.objectives && dept.objectives.length > 0 && (
                            <div className="flex justify-center">
                                <HorizontalTreeBranch
                                items={dept.objectives}
                                onNodeClick={handleNodeClick}
                                expandedNodes={expandedNodes}
                                toggleNode={toggleNode}
                                cycleName={currentCycleName}
                                onToggleKR={toggleNode}
                            />
                            </div>
                        )}
                        {/* Users trong department */}
                        {dept.objectives && dept.objectives.map((unitObj) => {
                            const unitObjId = `unit-obj-${unitObj.objective_id}`;
                            const isUnitExpanded = expandedNodes.has(unitObjId);
                            
                            if (!isUnitExpanded || !unitObj.users || unitObj.users.length === 0) return null;

                            return (
                                <div key={unitObjId} className="mt-8 flex justify-center">
                                    <HorizontalTreeBranch
                                        items={unitObj.users}
                                        onNodeClick={handleNodeClick}
                                        expandedNodes={expandedNodes}
                                        toggleNode={toggleNode}
                                        cycleName={currentCycleName}
                                        onToggleKR={toggleNode}
                                    />
                                    {/* Person Objectives của users */}
                                    {unitObj.users.map((user) => {
                                        const userId = `user-${user.user_id}`;
                                        const isUserExpanded = expandedNodes.has(userId);
                                        
                                        if (!isUserExpanded || !user.objectives || user.objectives.length === 0) return null;

                                        return (
                                            <div key={userId} className="mt-8 flex justify-center">
                                                <HorizontalTreeBranch
                                                    items={user.objectives}
                                                    onNodeClick={handleNodeClick}
                                                    expandedNodes={expandedNodes}
                                                    toggleNode={toggleNode}
                                                    cycleName={currentCycleName}
                                                    onToggleKR={toggleNode}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                );
            });
        }

        return branches;
    };

    // Zoom handlers - zoom từ center của container
    const handleZoomIn = () => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        const newScale = Math.min(scale + 0.05, 3);
        const scaleChange = newScale / scale;
        
        // Điều chỉnh vị trí để zoom từ center
        const newX = centerX - (centerX - position.x) * scaleChange;
        const newY = centerY - (centerY - position.y) * scaleChange;
        
        setScale(newScale);
        setPosition({ x: newX, y: newY });
    };

    const handleZoomOut = () => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        const newScale = Math.max(scale - 0.05, 0.3);
        const scaleChange = newScale / scale;
        
        // Điều chỉnh vị trí để zoom từ center
        const newX = centerX - (centerX - position.x) * scaleChange;
        const newY = centerY - (centerY - position.y) * scaleChange;
        
        setScale(newScale);
        setPosition({ x: newX, y: newY });
    };

    const handleResetZoom = () => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const content = container.querySelector('.zoomable-content');
        if (container && content) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const contentWidth = content.scrollWidth;
            const contentHeight = content.scrollHeight;
            
            // Tính toán vị trí để căn giữa
            const centerX = (containerWidth - contentWidth) / 2;
            const centerY = (containerHeight - contentHeight) / 2;
            
            setScale(1);
            setPosition({ x: centerX, y: Math.max(0, centerY) });
        }
    };

    // Pan handlers
    const handleMouseDown = useCallback((e) => {
        // Chỉ drag khi click vào background, không phải vào các element tương tác
        const isInteractiveElement = e.target.closest('button, a, [role="button"], .cursor-pointer, .hover\\:shadow-md');
        const isInControls = e.target.closest('.absolute.top-4');
        const isInContent = e.target.closest('.zoomable-content');
        
        // Cho phép drag nếu:
        // 1. Không phải element tương tác (button, link, etc.)
        // 2. Không phải trong controls overlay
        // 3. Click vào background hoặc vào content area (nhưng không phải vào card/button)
        if (!isInteractiveElement && !isInControls) {
            // Nếu click vào content area, kiểm tra xem có click vào card/button không
            if (isInContent) {
                const isClickableElement = e.target.closest('.rounded-lg.border, .rounded-full.border');
                if (isClickableElement) {
                    return; // Không drag nếu click vào card
                }
            }
            
            if (e.button !== 0) return; // Only left mouse button
            e.preventDefault();
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        }
    }, [position]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Wheel zoom - chỉ zoom khi chuột ở trong container
    const handleWheel = useCallback((e) => {
        // Chỉ zoom khi chuột ở trong container, không zoom khi ở ngoài
        if (containerRef.current && containerRef.current.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY > 0 ? -0.02 : 0.02;
            setScale((prev) => Math.max(0.3, Math.min(3, prev + delta)));
        }
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Zoomable and Pannable Container */}
            <div
                ref={containerRef}
                className="relative w-full h-full overflow-hidden bg-slate-50"
                onMouseDown={handleMouseDown}
                onWheel={handleWheel}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onWheelCapture={(e) => {
                    // Ngăn scroll trang khi zoom trong container
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                {/* Controls overlay - không bị zoom */}
                <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
                    <div className="pointer-events-auto">
                        <CycleDropdown
                            cyclesList={cyclesList}
                            cycleFilter={cycleFilter}
                            handleCycleChange={setCycleFilter}
                            dropdownOpen={dropdownOpen}
                            setDropdownOpen={setDropdownOpen}
                        />
                    </div>
                    
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg shadow-sm p-2 pointer-events-auto">
                        <button
                            onClick={handleZoomOut}
                            className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors"
                            title="Thu nhỏ"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                            </svg>
                        </button>
                        <span className="px-3 py-1.5 text-sm font-medium text-slate-700 min-w-[60px] text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors"
                            title="Phóng to"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                        </button>
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button
                            onClick={handleResetZoom}
                            className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors"
                            title="Đặt lại"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div
                    className="absolute origin-top-left zoomable-content"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: 'top left',
                        pointerEvents: isDragging ? 'none' : 'auto',
                    }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center py-20" style={{ minWidth: '800px' }}>
                            <div className="text-slate-500">Đang tải...</div>
                        </div>
                    ) : (
                        <div className="space-y-12 p-8" style={{ minWidth: '800px', width: 'max-content', margin: '0 auto' }}>
                            {renderTreeBranches()}
                            {!loading && treeData.company?.length === 0 && treeData.departments?.length === 0 && (
                                <div className="text-center py-20 text-slate-500">
                                    Chưa có OKR nào trong quý này.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ToastNotification toast={toast} />

            {/* Detail Modal */}
            {showDetailModal && selectedObjective && (
                <ObjectiveDetailModal
                    objective={selectedObjective}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedObjective(null);
                    }}
                />
            )}
        </div>
    );
}
