import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ProgressOverTimeChart({ chartData }) {
    if (!chartData || chartData.length === 0) {
        return <div className="text-center py-10 text-gray-500">Không có dữ liệu xu hướng.</div>;
    }

    const data = {
        labels: chartData.map(d => d.bucket.replace('-', '/W')), // Format to "2025/W34"
        datasets: [
            {
                label: 'Tiến độ Thực tế (%)',
                data: chartData.map(d => d.avg_progress),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.1,
            },
            {
                label: 'Tiến độ Lý tưởng (%)',
                data: chartData.map(d => d.ideal_progress),
                borderColor: 'rgb(203, 213, 225)',
                backgroundColor: 'rgba(203, 213, 225, 0.5)',
                borderDash: [5, 5],
                tension: 0.1,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Tiến độ O Cấp Công ty Theo Thời gian',
                font: {
                    size: 16,
                }
            },
        },
        scales: {
            y: {
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
            <Line options={options} data={data} />
        </div>
    );
}
