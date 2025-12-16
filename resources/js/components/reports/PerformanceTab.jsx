import React from 'react';
import Select from 'react-select';
import { FiBarChart2, FiTrendingDown } from 'react-icons/fi';

import StatCard from './StatCard';
import ProgressOverTimeChart from './ProgressOverTimeChart';
import DepartmentPerformanceChart from './DepartmentPerformanceChart';
import PerformanceTable from './PerformanceTable';
import EmptyState from './EmptyState';

export default function PerformanceTab({ data, filters, setFilters, allDepartments }) {
    if (!data) {
        return <div className="text-center p-8">Không có dữ liệu để hiển thị.</div>;
    }

    const { statCards, charts, table } = data;

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    
    const departmentOptions = [
        { value: '', label: 'Tất cả Phòng ban' },
        ...allDepartments.map(dept => ({
            value: dept.department_id,
            label: dept.d_name
        }))
    ];

    const customSelectStyles = {
        control: (provided) => ({
            ...provided,
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            minHeight: '38px',
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#2563eb' : (state.isFocused ? '#eff6ff' : 'white'),
            color: state.isSelected ? 'white' : 'black',
        }),
    };

    return (
        <div className="space-y-6">
            {/* Filters Row */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="objective-level-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Cấp độ Mục tiêu
                        </label>
                        <select
                            id="objective-level-filter"
                            value={filters.objectiveLevel}
                            onChange={(e) => handleFilterChange('objectiveLevel', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                        >
                            <option value="all">Toàn Công ty</option>
                            <option value="department">Phòng ban</option>
                            <option value="individual">Cá nhân</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Phòng ban
                        </label>
                        <Select
                            id="department-filter"
                            options={departmentOptions}
                            value={departmentOptions.find(opt => opt.value === filters.departmentId) || departmentOptions[0]}
                            onChange={(selected) => handleFilterChange('departmentId', selected.value)}
                            styles={customSelectStyles}
                            placeholder="Tìm kiếm phòng ban..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Từ ngày
                            </label>
                            <input
                                type="date"
                                id="start-date-filter"
                                value={filters.dateRange.start || ''}
                                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                                className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Đến ngày
                            </label>
                            <input
                                type="date"
                                id="end-date-filter"
                                value={filters.dateRange.end || ''}
                                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                                className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <StatCard
                    label="Tiến độ TB các O Cấp Công ty"
                    value={`${statCards.avg_company_progress || 0}%`}
                />
                <StatCard
                    label="Tỷ lệ O Hoàn thành (Dự kiến)"
                    value={`${statCards.completed_company_rate || 0}%`}
                    details="Score >= 0.7"
                />
                <StatCard
                    label="Tổng Điểm Tự tin TB"
                    value={statCards.avg_confidence_score || 'N/A'}
                    details="Của lãnh đạo"
                />
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {charts.progress_over_time?.length > 0 ? (
                    <ProgressOverTimeChart chartData={charts.progress_over_time} />
                ) : (
                    <div className="bg-white p-4 rounded-lg shadow-sm h-96 flex items-center justify-center">
                        <EmptyState 
                            icon={FiTrendingDown}
                            title="Không có dữ liệu xu hướng"
                            message="Chưa có đủ dữ liệu check-in trong khoảng thời gian này để vẽ biểu đồ."
                        />
                    </div>
                )}
                {charts.performance_by_department?.length > 0 ? (
                    <DepartmentPerformanceChart chartData={charts.performance_by_department} />
                ) : (
                     <div className="bg-white p-4 rounded-lg shadow-sm h-96 flex items-center justify-center">
                        <EmptyState 
                            icon={FiBarChart2}
                            title="Không có dữ liệu phòng ban"
                            message="Chưa có mục tiêu nào được gán cho các phòng ban trong chu kỳ này."
                        />
                    </div>
                )}
            </div>
            
            {/* Detailed Table */}
            <PerformanceTable tableData={table} />
        </div>
    );
}
