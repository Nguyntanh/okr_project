import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
    const [isProfileVisible, setIsProfileVisible] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-blue-600 text-white flex flex-col min-h-screen">
                    {/* User Profile Section */}
                    <div className="p-6 border-b border-blue-700">
                        <div className="flex items-center space-x-3 mb-4">
                            <img 
                                src="/images/default.png" 
                                alt="Avatar" 
                                className="w-12 h-12 rounded-full object-cover cursor-pointer"
                                onClick={() => setIsProfileVisible(!isProfileVisible)}
                            />
                            <span className="font-semibold">Avatar Admin</span>
                        </div>
                        
                        {/* Profile Dropdown */}
                        {isProfileVisible && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-blue-700 rounded-lg p-3 space-y-2"
                            >
                                <a href="/profile" className="block text-sm hover:text-blue-200">
                                    Hồ sơ / Trang của tôi
                                </a>
                                <button className="block text-sm hover:text-blue-200 text-left">
                                    Đăng xuất
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4">
                        <div className="space-y-2">
                            <a 
                                href="/dashboard" 
                                className="flex items-center px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <span>Home</span>
                            </a>
                            <a 
                                href="#" 
                                className="flex items-center px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <span>Team</span>
                            </a>
                            <a 
                                href="/cycles" 
                                className="flex items-center px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <span>Cycles</span>
                            </a>
                            <a 
                                href="/objectives" 
                                className="flex items-center px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <span>Objectives</span>
                            </a>
                            <a 
                                href="/departments" 
                                className="flex items-center px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <span>Departments</span>
                            </a>
                        </div>
                    </nav>
                </div>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
