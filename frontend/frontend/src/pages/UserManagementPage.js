// src/pages/UserManagementPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
// Import Bootstrap CSS (assuming you've added the CDN link to public/index.html)
// No direct import needed here if using CDN in public/index.html

function UserManagementPage() {
    const { hasRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // State for new user form
    const [newUserName, setNewUserName] = useState('');
    const [newUserTeam, setNewUserTeam] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user'); // Default role for new user

    // State for editing user form
    const [editingUser, setEditingUser] = useState(null); // User object being edited
    const [editUserName, setEditUserName] = useState('');
    const [editUserTeam, setEditUserTeam] = useState('');
    const [editUserRole, setEditUserRole] = useState('');
    const [editUserPassword, setEditUserPassword] = useState(''); // Optional password change

    const allowedRolesOptions = ['user', 'tool_admin', 'super_admin'];

    // Function to fetch all users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.getUsers();
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users for management:', err.response?.data?.message || err.message);
            setError('Failed to fetch users. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only fetch users if the current user has super_admin role
        if (hasRole('super_admin')) {
            fetchUsers();
        } else {
            setLoading(false); // If not super_admin, no need to load users
        }
    }, [fetchUsers, hasRole]);

    // --- Add User Handlers ---
    const handleAddUser = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!newUserName.trim() || !newUserPassword.trim() || !newUserRole.trim()) {
            setError('Username, password, and role are required.');
            return;
        }
        if (newUserPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        try {
            await api.addUser({ name: newUserName, team: newUserTeam, password: newUserPassword, role: newUserRole });
            setMessage('User added successfully!');
            // Clear form and close modal
            setNewUserName('');
            setNewUserTeam('');
            setNewUserPassword('');
            setNewUserRole('user');
            setShowAddModal(false);
            fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('Error adding user:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to add user.');
        }
    };

    // --- Edit User Handlers ---
    const openEditModal = (user) => {
        setEditingUser(user);
        setEditUserName(user.name);
        setEditUserTeam(user.team || '');
        setEditUserRole(user.role);
        setEditUserPassword(''); // Clear password field for security
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!editingUser) return;

        // Collect only changed fields
        const updateData = {};
        if (editUserName.trim() !== editingUser.name) {
            updateData.name = editUserName.trim();
        }
        if (editUserTeam.trim() !== (editingUser.team || '')) {
            updateData.team = editUserTeam.trim();
        }
        if (editUserRole !== editingUser.role) {
            updateData.role = editUserRole;
        }
        if (editUserPassword) { // Only update password if a new one is provided
            if (editUserPassword.length < 6) {
                setError('New password must be at least 6 characters long.');
                return;
            }
            updateData.password = editUserPassword;
        }

        if (Object.keys(updateData).length === 0) {
            setError('No changes to update.');
            return;
        }

        try {
            await api.updateUser(editingUser.id, updateData);
            setMessage('User updated successfully!');
            setShowEditModal(false);
            setEditingUser(null);
            fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('Error updating user:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to update user.');
        }
    };

    // --- Delete User Handler ---
    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            setError('');
            setMessage('');
            try {
                await api.deleteUser(userId);
                setMessage('User deleted successfully!');
                fetchUsers(); // Refresh the list
            } catch (err) {
                console.error('Error deleting user:', err.response?.data?.message || err.message);
                setError(err.response?.data?.message || 'Failed to delete user.');
            }
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="ms-3 text-secondary">Loading user data...</p>
            </div>
        );
    }

    if (!hasRole('super_admin')) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light p-4">
                <div className="card shadow-lg p-5 text-center">
                    <h2 className="card-title text-danger mb-4">Access Denied</h2>
                    <p className="card-text text-muted">You do not have the necessary permissions to view this page.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="btn btn-primary mt-4"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4 mb-5">
            <div className="card shadow-lg p-4">
                <h2 className="card-title text-center text-dark mb-4">User Management</h2>

                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                {message && <div className="alert alert-success" role="alert">{message}</div>}

                <div className="d-flex justify-content-end mb-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary"
                    >
                        <i className="fas fa-user-plus me-2"></i> Add New User
                    </button>
                </div>

                {users.length === 0 ? (
                    <p className="text-center text-muted">No users found.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover border">
                            <thead className="table-light">
                                <tr>
                                    <th scope="col">Username</th>
                                    <th scope="col">Team</th>
                                    <th scope="col">Role</th>
                                    <th scope="col" className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.team || 'N/A'}</td>
                                        <td>
                                            <span className={`badge ${
                                                user.role === 'super_admin' ? 'bg-danger' :
                                                user.role === 'tool_admin' ? 'bg-info' :
                                                'bg-secondary'
                                            }`}>
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="btn btn-sm btn-warning me-2"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="btn btn-sm btn-danger"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            <div className={`modal fade ${showAddModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ display: showAddModal ? 'block' : 'none' }}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Add New User</h5>
                            <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleAddUser}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="newUserName" className="form-label">Username:</label>
                                    <input
                                        type="text"
                                        id="newUserName"
                                        className="form-control"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="newUserTeam" className="form-label">Team (Optional):</label>
                                    <input
                                        type="text"
                                        id="newUserTeam"
                                        className="form-control"
                                        value={newUserTeam}
                                        onChange={(e) => setNewUserTeam(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="newUserPassword" className="form-label">Password:</label>
                                    <input
                                        type="password"
                                        id="newUserPassword"
                                        className="form-control"
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="newUserRole" className="form-label">Role:</label>
                                    <select
                                        id="newUserRole"
                                        className="form-select"
                                        value={newUserRole}
                                        onChange={(e) => setNewUserRole(e.target.value)}
                                        required
                                    >
                                        {allowedRolesOptions.map(role => (
                                            <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                {error && <div className="alert alert-danger mt-3">{error}</div>}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add User</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            <div className={`modal fade ${showEditModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ display: showEditModal ? 'block' : 'none' }}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Edit User: {editingUser?.name}</h5>
                            <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleUpdateUser}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="editUserName" className="form-label">Username:</label>
                                    <input
                                        type="text"
                                        id="editUserName"
                                        className="form-control"
                                        value={editUserName}
                                        onChange={(e) => setEditUserName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="editUserTeam" className="form-label">Team:</label>
                                    <input
                                        type="text"
                                        id="editUserTeam"
                                        className="form-control"
                                        value={editUserTeam}
                                        onChange={(e) => setEditUserTeam(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="editUserRole" className="form-label">Role:</label>
                                    <select
                                        id="editUserRole"
                                        className="form-select"
                                        value={editUserRole}
                                        onChange={(e) => setEditUserRole(e.target.value)}
                                        required
                                    >
                                        {allowedRolesOptions.map(role => (
                                            <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="editUserPassword" className="form-label">New Password (leave blank to keep current):</label>
                                    <input
                                        type="password"
                                        id="editUserPassword"
                                        className="form-control"
                                        value={editUserPassword}
                                        onChange={(e) => setEditUserPassword(e.target.value)}
                                    />
                                </div>
                                {error && <div className="alert alert-danger mt-3">{error}</div>}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-warning">Update User</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserManagementPage;
