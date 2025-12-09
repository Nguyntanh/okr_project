import React from 'react';
import GroupedBarChart from '../GroupedBarChart';

/**
 * Hiển thị chi tiết một snapshot (báo cáo đã lưu)
 */
export default function SnapshotDetailView({
    snapshot,
    onBack,
    onExport,
}) {
    if (!snapshot) return null;

    const data = snapshot.data_snapshot || {};

    return (
        <div>
            <div className="flex items-center justify-between mb-4 gap-3">
                <button 
                    onClick={onBack} 
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Quay lại danh sách
                </button>

                <button
                    onClick={() => onExport?.(snapshot)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 transition-colors"
                    title="Xuất báo cáo"
                >
                    <svg 
                        className="h-4 w-4 text-slate-600" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Xuất file
                </button>
            </div>

            <h4 className="text-lg font-bold text-slate-900 mb-2">{snapshot.title}</h4>

            {/* Thông tin snapshot */}
            <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200 shadow-sm">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-600">Chu kỳ:</span>
                        <span className="ml-2 font-semibold text-slate-900">{snapshot.cycle_name}</span>
                    </div>
                    <div>
                        <span className="text-slate-600">Ngày chốt:</span>
                        <span className="ml-2 font-semibold text-slate-900">
                            {new Date(snapshot.snapshotted_at).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-600">Tạo bởi:</span>
                        <span className="ml-2 font-semibold text-slate-900">
                            {snapshot.creator?.full_name || 'N/A'}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-600">Thời gian:</span>
                        <span className="ml-2 font-semibold text-slate-900">
                            {new Date(snapshot.created_at).toLocaleTimeString('vi-VN')}
                        </span>
                    </div>
                </div>
            </div>

            {data && (
                <div className="space-y-8">
                    {/* Tổng quan */}
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Tổng quan</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { label: "Tổng OKR", value: data.overall?.totalObjectives || 0, color: "gray" },
                                { label: "Tiến độ TB", value: `${(data.overall?.averageProgress ?? 0).toFixed(1)}%`, color: "blue" },
                                { label: "Đúng tiến độ", value: data.overall?.statusCounts?.onTrack || 0, percent: data.overall?.statusDistribution?.onTrack || 0, color: "emerald" },
                                { label: "Có nguy cơ", value: data.overall?.statusCounts?.atRisk || 0, percent: data.overall?.statusDistribution?.atRisk || 0, color: "amber" },
                                { label: "Chậm tiến độ", value: data.overall?.statusCounts?.offTrack || 0, percent: data.overall?.statusDistribution?.offTrack || 0, color: "red" },
                            ].map((item, i) => (
                                <div 
                                    key={i} 
                                    className={`
                                        rounded-xl p-5 shadow-sm bg-white border
                                        ${i <= 1 ? 'border-gray-200' : 
                                            item.color === 'emerald' ? 'border-emerald-200' :
                                            item.color === 'amber' ? 'border-amber-200' :
                                            'border-red-200'}
                                    `}
                                >
                                    <div className={`
                                        text-sm font-medium
                                        ${i <= 1 ? 'text-gray-600' : 
                                            item.color === 'emerald' ? 'text-emerald-600' :
                                            item.color === 'amber' ? 'text-amber-600' :
                                            'text-red-600'}
                                    `}>
                                        {item.label}
                                    </div>
                                    <div className={`
                                        text-xl font-bold mt-1
                                        ${i <= 1 ? 'text-gray-900' : 
                                            item.color === 'emerald' ? 'text-emerald-700' :
                                            item.color === 'amber' ? 'text-amber-700' :
                                            'text-red-700'}
                                    `}>
                                        {item.value}
                                        {item.percent !== undefined && (
                                            <span className="ml-2 text-sm font-normal text-gray-600">
                                                ({item.percent}%)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Biểu đồ phân bổ trạng thái */}
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Phân bổ trạng thái</h4>
                        {(() => {
                            const snapshotLevel = data.level || 'departments';
                            let chartData;
                            if (snapshotLevel === 'company') {
                                const ov = data.overall || { statusCounts: {} };
                                chartData = {
                                    categories: ['Công ty'],
                                    series: [
                                        { name: 'Đúng tiến độ', color: '#22c55e', data: [ov.statusCounts?.onTrack || 0] },
                                        { name: 'Có nguy cơ', color: '#f59e0b', data: [ov.statusCounts?.atRisk || 0] },
                                        { name: 'Chậm tiến độ', color: '#ef4444', data: [ov.statusCounts?.offTrack || 0] },
                                    ],
                                };
                            } else {
                                const list = (data.departments || [])
                                    .filter(d => d.departmentId && (d.departmentName || '').toLowerCase() !== 'công ty');
                                chartData = {
                                    categories: list.map(d => d.departmentName),
                                    series: [
                                        { name: 'Đúng tiến độ', color: '#22c55e', data: list.map(d => d.onTrack || 0) },
                                        { name: 'Có nguy cơ', color: '#f59e0b', data: list.map(d => d.atRisk || 0) },
                                        { name: 'Chậm tiến độ', color: '#ef4444', data: list.map(d => d.offTrack || 0) },
                                    ],
                                };
                            }
                            return (
                                <GroupedBarChart
                                    categories={chartData.categories}
                                    series={chartData.series}
                                    label={`Phân bổ trạng thái theo ${data.level === 'company' ? 'công ty' : 'phòng ban'}`}
                                />
                            );
                        })()}
                    </div>

                    {/* Bảng chi tiết theo cấp độ */}
                    <div className="rounded-xl border border-slate-200 bg-white">
                        <div className="bg-blue-50 border-b-2 border-blue-200 px-6 py-4 text-sm font-bold text-slate-800">
                            {data.level === 'company' ? 'Chi tiết công ty' : 'Chi tiết theo đơn vị'}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white text-slate-700 font-semibold border-b-2 border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Đơn vị</th>
                                        <th className="px-6 py-3 text-center">Số OKR</th>
                                        <th className="px-6 py-3 text-center">Tiến độ TB</th>
                                        <th className="px-6 py-3 text-center">Đúng tiến độ</th>
                                        <th className="px-6 py-3 text-center">Có nguy cơ</th>
                                        <th className="px-6 py-3 text-center">Chậm tiến độ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.level === 'company'
                                        ? [{
                                            departmentName: 'Công ty',
                                            count: data.overall?.totalObjectives || 0,
                                            averageProgress: data.overall?.averageProgress || 0,
                                            onTrack: data.overall?.statusCounts?.onTrack || 0,
                                            atRisk: data.overall?.statusCounts?.atRisk || 0,
                                            offTrack: data.overall?.statusCounts?.offTrack || 0,
                                            onTrackPct: data.overall?.statusDistribution?.onTrack || 0,
                                            atRiskPct: data.overall?.statusDistribution?.atRisk || 0,
                                            offTrackPct: data.overall?.statusDistribution?.offTrack || 0,
                                        }]
                                        : (data.departments || []).filter(
                                            (d) => d.departmentId &&
                                                (d.departmentName || '').toLowerCase() !== 'công ty'
                                        )
                                    ).map((d, i) => (
                                        <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                            <td className="px-6 py-3 font-medium text-slate-900">
                                                {d.departmentName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-3 text-center font-semibold text-slate-900">
                                                {d.count ?? d.totalObjectives ?? 0}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex items-center justify-center gap-3" style={{ width: '180px', margin: '0 auto' }}>
                                                    <div className="w-32 bg-slate-200 rounded-full h-2 flex-shrink-0">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                                (d.averageProgress ?? 0) >= 80
                                                                    ? 'bg-emerald-500'
                                                                    : (d.averageProgress ?? 0) >= 50
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${Math.min(d.averageProgress ?? 0, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-semibold tabular-nums whitespace-nowrap w-12 text-right">
                                                        {(d.averageProgress ?? 0).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <div className="font-semibold text-emerald-700">
                                                    {d.onTrack ?? 0}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    ({d.onTrackPct ?? d.onTrackPercent ?? 0}%)
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <div className="font-semibold text-amber-700">
                                                    {d.atRisk ?? 0}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    ({d.atRiskPct ?? d.atRiskPercent ?? 0}%)
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <div className="font-semibold text-red-700">
                                                    {d.offTrack ?? 0}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    ({d.offTrackPct ?? d.offTrackPercent ?? 0}%)
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Chi tiết Objectives */}
                    {data.detailedData?.objectives && data.detailedData.objectives.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white">
                            <div className="bg-blue-50 border-b-2 border-blue-200 px-6 py-4 text-sm font-bold text-slate-800">Chi tiết Objectives</div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white text-slate-700 font-semibold border-b-2 border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">Tên Objective</th>
                                            <th className="px-6 py-3">Cấp độ</th>
                                            {data.level !== 'company' && <th className="px-6 py-3">Phòng ban</th>}
                                            <th className="px-6 py-3 text-center">Số KR</th>
                                            <th className="px-6 py-3 text-center">Tiến độ</th>
                                            <th className="px-6 py-3 text-center">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.detailedData.objectives.map((obj, i) => {
                                            const krs = obj.keyResults || obj.key_results || [];
                                            let progress = 0;
                                            if (krs.length > 0) {
                                                const totalProgress = krs.reduce((sum, kr) => {
                                                    const krProgress = parseFloat(kr.progress_percent) || 0;
                                                    return sum + krProgress;
                                                }, 0);
                                                progress = totalProgress / krs.length;
                                            } else {
                                                progress = parseFloat(obj.progress_percent) || 0;
                                            }
                                            const status = progress >= 70 ? 'on_track' : (progress >= 40 ? 'at_risk' : 'off_track');
                                            const levelText = obj.level === 'company' ? 'Công ty' : obj.level === 'unit' ? 'Phòng ban' : obj.level === 'person' ? 'Cá nhân' : 'N/A';
                                            return (
                                                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                                    <td className="px-6 py-3 font-semibold text-slate-900">{obj.obj_title || 'N/A'}</td>
                                                    <td className="px-6 py-3">
                                                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                                            {levelText}
                                                        </span>
                                                    </td>
                                                    {data.level !== 'company' && (
                                                        <td className="px-6 py-3">{obj.department?.d_name || obj.department?.departmentName || '—'}</td>
                                                    )}
                                                    <td className="px-6 py-3 text-center font-semibold">{obj.key_results?.length || krs.length || 0}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-3" style={{ width: '180px', margin: '0 auto' }}>
                                                            <div className="w-32 bg-slate-200 rounded-full h-2 flex-shrink-0">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all ${
                                                                        progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                                    }`}
                                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-semibold tabular-nums whitespace-nowrap w-12 text-right">{progress.toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        {status === 'on_track' && (
                                                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                                Đúng tiến độ
                                                            </span>
                                                        )}
                                                        {status === 'at_risk' && (
                                                            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                                                Có nguy cơ
                                                            </span>
                                                        )}
                                                        {status === 'off_track' && (
                                                            <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                                                Chậm tiến độ
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Chi tiết Key Results */}
                    {data.detailedData?.keyResults && data.detailedData.keyResults.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white">
                            <div className="bg-blue-50 border-b-2 border-blue-200 px-6 py-4 text-sm font-bold text-slate-800">Chi tiết Key Results</div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white text-slate-700 font-semibold border-b-2 border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">Tên Key Result</th>
                                            <th className="px-6 py-3">Objective</th>
                                            <th className="px-6 py-3">Người được giao</th>
                                            <th className="px-6 py-3 text-center">Tiến độ</th>
                                            <th className="px-6 py-3 text-center">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.detailedData.keyResults.map((kr, i) => {
                                            const progress = kr.progress_percent || 0;
                                            const status = progress >= 70 ? 'on_track' : (progress >= 40 ? 'at_risk' : 'off_track');
                                            return (
                                                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                                    <td className="px-6 py-3 font-medium text-slate-900">{kr.kr_title || 'N/A'}</td>
                                                    <td className="px-6 py-3 text-slate-600">{kr.objective_title || 'N/A'}</td>
                                                    <td className="px-6 py-3">
                                                        {(() => {
                                                            const assigneeName = kr.assignedUser?.full_name;
                                                            if (assigneeName) return assigneeName;
                                                            const ownerName = kr.objective_owner?.full_name || kr.objective_owner?.name;
                                                            return ownerName || 'Chưa gán';
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-3" style={{ width: '180px', margin: '0 auto' }}>
                                                            <div className="w-32 bg-slate-200 rounded-full h-2 flex-shrink-0">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all ${
                                                                        progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                                    }`}
                                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-semibold tabular-nums whitespace-nowrap w-12 text-right">{progress.toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        {status === 'on_track' && (
                                                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                                Đúng tiến độ
                                                            </span>
                                                        )}
                                                        {status === 'at_risk' && (
                                                            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                                                Có nguy cơ
                                                            </span>
                                                        )}
                                                        {status === 'off_track' && (
                                                            <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                                                Chậm tiến độ
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Phân tích theo Người chịu trách nhiệm */}
                    {data.detailedData?.owners && data.detailedData.owners.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white">
                            <div className="bg-blue-50 border-b-2 border-blue-200 px-6 py-4 text-sm font-bold text-slate-800">Phân tích theo Người chịu trách nhiệm</div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white text-slate-700 font-semibold border-b-2 border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">Người chịu trách nhiệm</th>
                                            <th className="px-6 py-3 text-center">Số Key Results</th>
                                            <th className="px-6 py-3 text-center">Tiến độ TB</th>
                                            <th className="px-6 py-3 text-center">Đúng tiến độ</th>
                                            <th className="px-6 py-3 text-center">Có nguy cơ</th>
                                            <th className="px-6 py-3 text-center">Chậm tiến độ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.detailedData.owners.map((owner, i) => (
                                            <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                                <td className="px-6 py-3 font-semibold text-slate-900">{owner.owner_name || 'Chưa gán'}</td>
                                                <td className="px-6 py-3 text-center font-semibold">{owner.keyResults?.length || 0}</td>
                                                <td className="px-6 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-3" style={{ width: '180px', margin: '0 auto' }}>
                                                        <div className="w-32 bg-slate-200 rounded-full h-2 flex-shrink-0">
                                                            <div
                                                                className={`h-2 rounded-full transition-all ${
                                                                    owner.averageProgress >= 80 ? 'bg-emerald-500' : owner.averageProgress >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${Math.min(owner.averageProgress, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-semibold tabular-nums whitespace-nowrap w-12 text-right">{owner.averageProgress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className="font-semibold text-emerald-700">{owner.onTrack || 0}</span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className="font-semibold text-amber-700">{owner.atRisk || 0}</span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className="font-semibold text-red-700">{owner.offTrack || 0}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Lịch sử Check-in */}
                    {data.detailedData?.checkIns && (
                        <div className="rounded-xl border border-slate-200 bg-white">
                            <div className="bg-blue-50 border-b-2 border-blue-200 px-6 py-4 text-sm font-bold text-slate-800">Lịch sử Check-in</div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Tổng số Check-in</div>
                                        <div className="text-2xl font-bold text-slate-900">{data.detailedData.checkIns.length || 0}</div>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Check-in trung bình/Objective</div>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {data.detailedData.objectives?.length > 0 
                                                ? (data.detailedData.checkIns.length / data.detailedData.objectives.length).toFixed(1)
                                                : 0}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Check-in gần nhất</div>
                                        <div className="text-sm font-semibold text-slate-900">
                                            {data.detailedData.checkIns.length > 0 
                                                ? new Date(Math.max(...data.detailedData.checkIns.map(ci => new Date(ci.created_at || ci.createdAt).getTime()))).toLocaleDateString('vi-VN')
                                                : 'Chưa có'}
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white text-slate-700 font-semibold border-b-2 border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3">Key Result</th>
                                                <th className="px-6 py-3">Objective</th>
                                                <th className="px-6 py-3">Người check-in</th>
                                                <th className="px-6 py-3 text-center">Tiến độ</th>
                                                <th className="px-6 py-3 text-center">Ngày check-in</th>
                                                <th className="px-6 py-3">Ghi chú</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.detailedData.checkIns.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                                        Chưa có check-in nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                data.detailedData.checkIns.slice(0, 20).map((checkIn, i) => (
                                                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                                        <td className="px-6 py-3 font-medium text-slate-900">
                                                            {checkIn.key_result?.kr_title || checkIn.kr_title || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-3 text-slate-600">
                                                            {checkIn.objective?.obj_title || checkIn.objective_title || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-3">{checkIn.user?.full_name || checkIn.user_name || 'N/A'}</td>
                                                        <td className="px-6 py-3 text-center">
                                                            <span className="font-semibold">{checkIn.progress_percent || 0}%</span>
                                                        </td>
                                                            <td className="px-6 py-3 text-center text-slate-600">
                                                                {checkIn.created_at 
                                                                    ? new Date(checkIn.created_at).toLocaleDateString('vi-VN')
                                                                    : 'N/A'}
                                                            </td>
                                                        <td className="px-6 py-3 text-slate-600 max-w-xs truncate">
                                                            {checkIn.notes || checkIn.note || '—'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

