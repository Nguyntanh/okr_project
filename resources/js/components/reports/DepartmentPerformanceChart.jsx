import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DepartmentPerformanceChart({ chartData }) {
    if (!chartData || chartData.length === 0) {
        return <div className="text-center py-10 text-gray-500">Không có dữ liệu phòng ban.</div>;
    }

    const data = {
        labels: chartData.map(d => d.department_name),
        datasets: [
            {
                label: 'Tiến độ TB (%)',
                data: chartData.map(d => d.average_progress),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
            },
        ]
    };

    const options = {
        indexAxis: 'y', // Horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Đóng góp Hiệu suất theo Phòng ban',
                font: {
                    size: 16,
                }
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    }
                }
            }
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm h-96">
            <Bar options={options} data={data} />
        </div>
    );
}
