// src/pages/HomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import your AuthContext

function HomePage() {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome, {user ? user.name : 'Guest'}!</h1>
                <p className="text-gray-600 text-lg mb-8">
                    Your role: <span className="font-semibold capitalize">{user ? user.role.replace('_', ' ') : 'N/A'}</span>
                </p>

                <nav className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Link for all authenticated users */}
                    <button
                        onClick={() => navigate('/tools')}
                        className="bg-blue-600 text-white py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 text-lg font-semibold"
                    >
                        View All Tools
                    </button>

                    {/* Links for Tool Admins and Super Admins */}
                    {hasRole(['tool_admin', 'super_admin']) && (
                        <button
                            onClick={() => navigate('/admin/tools')}
                            className="bg-purple-600 text-white py-3 px-6 rounded-lg shadow-md hover:bg-purple-700 transition duration-200 text-lg font-semibold"
                        >
                            Manage Tools
                        </button>
                    )}

                    {/* Links for Super Admins only */}
                    {hasRole('super_admin') && (
                        <>
                            <button
                                onClick={() => navigate('/admin/users')}
                                className="bg-red-600 text-white py-3 px-6 rounded-lg shadow-md hover:bg-red-700 transition duration-200 text-lg font-semibold"
                            >
                                Manage Users
                            </button>
                            <button
                                onClick={() => navigate('/admin/history')}
                                className="bg-green-600 text-white py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition duration-200 text-lg font-semibold"
                            >
                                View History
                            </button>
                        </>
                    )}
                </nav>

                <button
                    onClick={logout}
                    className="bg-gray-700 text-white py-2 px-5 rounded-md hover:bg-gray-800 transition duration-200 text-base font-semibold mt-4"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

export default HomePage;
