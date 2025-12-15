import React, { useState } from 'react';
import PerformanceDataRow from './PerformanceDataRow';

const PerformanceTable = ({ tableData }) => {
    const [expandedRows, setExpandedRows] = useState([]);

    const toggleRow = (objectiveId) => {
        setExpandedRows(prev => 
            prev.includes(objectiveId) 
                ? prev.filter(id => id !== objectiveId)
                : [...prev, objectiveId]
        );
    };

    if (!tableData || tableData.length === 0) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-sm">Không có dữ liệu chi tiết.</div>;
    }

    const columns = [
        'Tên Mục tiêu (O/KR)',
        'Cấp độ',
        'Phòng ban/Đơn vị',
        'Tiến độ (%)',
        'Tình trạng (Health)',
        'Điểm Tự tin',
        'Liên kết với O Cấp trên',
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map(col => (
                            <th 
                                key={col}
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.map(objective => (
                        <PerformanceDataRow 
                            key={objective.objective_id}
                            objective={objective}
                            level={0}
                            expandedRows={expandedRows}
                            toggleRow={toggleRow}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PerformanceTable;
