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
        <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm sticky-top">
            <div className="container-fluid">
                <Link className="navbar-brand fw-bold text-primary" to="/home">ToolTracker</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        {navItems.map((item) => (
                            hasRole(item.roles) && (
                                <li className="nav-item" key={item.path}>
                                    <Link className="nav-link" to={item.path}>{item.name}</Link>
                                </li>
                            )
                        ))}
                    </ul>
                    {user && (
                        <div className="d-flex align-items-center gap-3">
                            <span className="text-muted">
                                Welcome, <strong>{user.name}</strong> ({user.role.replace('_', ' ')})
                            </span>
                            <button className="btn btn-outline-danger btn-sm" onClick={logout}>Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

// --- Footer Component ---
const Footer = () => (
    <footer className="bg-light text-center py-3 mt-auto border-top">
        <div className="container">
            <span className="text-muted small">© 2025 ToolTracker | Made by Sandeep | Team Spardhak | ATV Vehicle Club, NIT Warangal</span>
        </div>
    </footer>
);

// --- Protected Route Component ---
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, loading, hasRole } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && !hasRole(allowedRoles)) {
        return (
            <div className="container mt-5 text-center">
                <h2 className="text-danger mb-3">Access Denied</h2>
                <p>You do not have the necessary permissions to view this page.</p>
                <button className="btn btn-primary" onClick={() => window.history.back()}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-fill">
                {children}
            </main>
            <Footer />
        </div>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    <Route path="/home" element={
                        <ProtectedRoute>
                            <HomePage />
                        </ProtectedRoute>
                    } />
                    <Route path="/tools" element={
                        <ProtectedRoute allowedRoles={["user", "tool_admin", "super_admin"]}>
                            <ToolsListPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/tools" element={
                        <ProtectedRoute allowedRoles={["tool_admin", "super_admin"]}>
                            <ToolManagementPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                        <ProtectedRoute allowedRoles={["super_admin"]}>
                            <UserManagementPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/history" element={
                        <ProtectedRoute allowedRoles={["tool_admin", "super_admin"]}>
                            <HistoryPage />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={
                        <div className="container text-center mt-5">
                            <h1 className="display-4 text-danger">404 - Page Not Found</h1>
                            <p className="lead">The page you're looking for does not exist.</p>
                            <button className="btn btn-primary" onClick={() => window.history.back()}>Go Back</button>
                        </div>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;