// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ToolsListPage from './pages/ToolsListPage';
import ToolManagementPage from './pages/ToolManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import HistoryPage from './pages/HistoryPage';

// --- Navbar Component ---
const Navbar = () => {
    const { user, logout, hasRole } = useAuth();
    const navItems = [
        { path: '/home', name: 'Home', roles: ['user', 'tool_admin', 'super_admin'] },
        { path: '/tools', name: 'All Tools', roles: ['user', 'tool_admin', 'super_admin'] },
        { path: '/admin/tools', name: 'Manage Tools', roles: ['tool_admin', 'super_admin'] },
        { path: '/admin/users', name: 'Manage Users', roles: ['super_admin'] },
        { path: '/admin/history', name: 'History', roles: ['tool_admin', 'super_admin'] },
    ];

    return (
        <nav className="bg-gray-800 text-white p-4 shadow-md">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                <Link to="/home" className="text-2xl font-bold text-blue-300 hover:text-blue-200 transition duration-200">
                    Tool Tracker
                </Link>
                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-x-6 md:space-y-0">
                    <ul className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6">
                        {navItems.map((item) => (
                            hasRole(item.roles) && (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className="text-gray-300 hover:text-white px-3 py-2 rounded-md transition duration-200 text-lg font-medium"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            )
                        ))}
                    </ul>
                    {user && (
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-300">
                                Logged in as: <span className="font-semibold capitalize">{user.name}</span> (<span className="capitalize">{user.role.replace('_', ' ')}</span>)
                            </span>
                            <button
                                onClick={logout}
                                className="bg-red-500 hover:bg-red-600 text-white py-1.5 px-4 rounded-md shadow-sm transition duration-200 text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

// --- Protected Route Component ---
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, loading, hasRole } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-inter">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">Loading application...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !hasRole(allowedRoles)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-inter p-4">
                <Navbar /> {/* Display navbar even on access denied */}
                <div className="bg-white p-8 rounded-lg shadow-lg text-center mt-8">
                    <h2 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="text-gray-700">You do not have the necessary permissions to view this page.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="mt-6 bg-blue-600 text-white py-2 px-5 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Render Navbar above the protected content
    return (
        <div className="min-h-screen flex flex-col font-inter">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
        </div>
    );
};


function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Default redirect to login */}
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    {/* Protected Routes (requires authentication and potentially roles) */}
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        }
                    />
                     <Route
                        path="/tools"
                        element={
                            <ProtectedRoute allowedRoles={['user', 'tool_admin', 'super_admin']}>
                                <ToolsListPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/tools"
                        element={
                            <ProtectedRoute allowedRoles={['tool_admin', 'super_admin']}>
                                <ToolManagementPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute allowedRoles={['super_admin']}>
                                <UserManagementPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/history"
                        element={
                            <ProtectedRoute allowedRoles={['tool_admin', 'super_admin']}>
                                <HistoryPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback for unknown routes */}
                    <Route path="*" element={
                        <div className="min-h-screen flex flex-col font-inter bg-gray-100">
                             <Navbar /> {/* Display navbar even on 404 */}
                            <div className="flex flex-col items-center justify-center flex-grow p-4">
                                <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
                                <p className="text-lg text-gray-600">The page you're looking for does not exist.</p>
                                <button
                                    onClick={() => window.history.back()}
                                    className="mt-6 bg-blue-600 text-white py-2 px-5 rounded-md hover:bg-blue-700 transition duration-200"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
