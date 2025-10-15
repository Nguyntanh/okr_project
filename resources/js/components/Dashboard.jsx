import React from 'react';
import Layout from './components/Layout';

const Dashboard = () => {
    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Dashboard Content
                </h1>
                <p className="text-gray-600 text-lg">
                    Đây là nội dung của dashboard.
                </p>
                
                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Objectives</h3>
                        <p className="text-3xl font-bold text-blue-600">24</p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Completed</h3>
                        <p className="text-3xl font-bold text-green-600">18</p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">In Progress</h3>
                        <p className="text-3xl font-bold text-yellow-600">6</p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Teams</h3>
                        <p className="text-3xl font-bold text-purple-600">5</p>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700">Objective "Increase Sales" completed</span>
                                <span className="text-gray-500 text-sm">2 hours ago</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-700">New key result added to "Customer Satisfaction"</span>
                                <span className="text-gray-500 text-sm">4 hours ago</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-gray-700">Team meeting scheduled for tomorrow</span>
                                <span className="text-gray-500 text-sm">6 hours ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
