// src/pages/UserManagementPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl font-semibold text-gray-700">Loading user data...</p>
            </div>
        );
    }

    if (!hasRole('super_admin')) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
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

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">User Management</h2>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
                {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}

                <div className="mb-6 text-right">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
                    >
                        Add New User
                    </button>
                </div>

                {users.length === 0 ? (
                    <p className="text-center text-gray-600">No users found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tl-lg">
                                        Username
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Team
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tr-lg">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {user.team || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'tool_admin' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-md shadow-sm transition duration-200 text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-md shadow-sm transition duration-200 text-xs"
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
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add New User</h3>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="newUserName">
                                    Username:
                                </label>
                                <input
                                    type="text"
                                    id="newUserName"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="newUserTeam">
                                    Team (Optional):
                                </label>
                                <input
                                    type="text"
                                    id="newUserTeam"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newUserTeam}
                                    onChange={(e) => setNewUserTeam(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="newUserPassword">
                                    Password:
                                </label>
                                <input
                                    type="password"
                                    id="newUserPassword"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="newUserRole">
                                    Role:
                                </label>
                                <select
                                    id="newUserRole"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value)}
                                    required
                                >
                                    {allowedRolesOptions.map(role => (
                                        <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
                                >
                                    Add User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Edit User: {editingUser.name}</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="editUserName">
                                    Username:
                                </label>
                                <input
                                    type="text"
                                    id="editUserName"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    value={editUserName}
                                    onChange={(e) => setEditUserName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="editUserTeam">
                                    Team:
                                </label>
                                <input
                                    type="text"
                                    id="editUserTeam"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    value={editUserTeam}
                                    onChange={(e) => setEditUserTeam(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="editUserRole">
                                    Role:
                                </label>
                                <select
                                    id="editUserRole"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    value={editUserRole}
                                    onChange={(e) => setEditUserRole(e.target.value)}
                                    required
                                >
                                    {allowedRolesOptions.map(role => (
                                        <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="editUserPassword">
                                    New Password (leave blank to keep current):
                                </label>
                                <input
                                    type="password"
                                    id="editUserPassword"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    value={editUserPassword}
                                    onChange={(e) => setEditUserPassword(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingUser(null);
                                    }}
                                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition duration-200"
                                >
                                    Update User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserManagementPage;
