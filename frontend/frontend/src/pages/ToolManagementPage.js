// src/pages/ToolManagementPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ToolManagementPage() {
    const { hasRole } = useAuth(); // Check roles for conditional rendering if needed
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newToolName, setNewToolName] = useState('');
    const [editingTool, setEditingTool] = useState(null); // Tool object being edited
    const [editToolName, setEditToolName] = useState('');
    const [editToolStatus, setEditToolStatus] = useState('');
    const [editAssignedTo, setEditAssignedTo] = useState(''); // Holds user ID
    const [users, setUsers] = useState([]); // List of users for assigning tools

    // Fetch all tools
    const fetchTools = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.getTools();
            setTools(response.data);
        } catch (err) {
            console.error('Error fetching tools for management:', err.response?.data?.message || err.message);
            setError('Failed to fetch tools for management. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch all users (for assigning tools) - only if user is tool_admin or super_admin
    const fetchUsers = useCallback(async () => {
        if (hasRole(['tool_admin', 'super_admin'])) {
            try {
                const response = await api.getUsers(); // This endpoint is for super_admin, but tool_admin can also assign.
                                                      // Assuming backend allows tool_admin to get users for dropdown
                setUsers(response.data);
            } catch (err) {
                console.error('Error fetching users:', err.response?.data?.message || err.message);
                // Not a critical error, just prevent user assignment dropdown from populating
            }
        }
    }, [hasRole]);

    useEffect(() => {
        fetchTools();
        fetchUsers();
    }, [fetchTools, fetchUsers]);

    // --- Add Tool Handlers ---
    const handleAddTool = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!newToolName.trim()) {
            setError('Tool name cannot be empty.');
            return;
        }
        try {
            await api.addTool({ name: newToolName });
            setMessage('Tool added successfully!');
            setNewToolName('');
            setShowAddModal(false);
            fetchTools(); // Refresh the list
        } catch (err) {
            console.error('Error adding tool:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to add tool.');
        }
    };

    // --- Edit Tool Handlers ---
    const openEditModal = (tool) => {
        setEditingTool(tool);
        setEditToolName(tool.name);
        setEditToolStatus(tool.status);
        setEditAssignedTo(tool.assigned_to || ''); // Set to empty string if null
        setShowEditModal(true);
    };

    const handleUpdateTool = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!editingTool) return;

        // Ensure at least one field is provided for update
        if (!editToolName.trim() && !editToolStatus.trim() && editAssignedTo === '') {
            setError('Please provide at least one field to update.');
            return;
        }

        const updateData = {};
        if (editToolName.trim() !== editingTool.name) {
            updateData.name = editToolName.trim();
        }
        if (editToolStatus !== editingTool.status) {
            updateData.status = editToolStatus;
        }
        // Handle assigned_to: null for 'available' status, actual ID otherwise
        if (editAssignedTo !== (editingTool.assigned_to || '')) {
             // If status is 'available', assigned_to should be null, regardless of selection
             if (editToolStatus === 'available') {
                updateData.assigned_to = null;
            } else {
                updateData.assigned_to = editAssignedTo === '' ? null : parseInt(editAssignedTo, 10);
            }
        } else if (editToolStatus === 'available' && editingTool.assigned_to !== null) {
            // Edge case: status changed to available, but assigned_to wasn't explicitly changed to null
            updateData.assigned_to = null;
        }


        try {
            await api.updateTool(editingTool.id, updateData);
            setMessage('Tool updated successfully!');
            setShowEditModal(false);
            setEditingTool(null);
            fetchTools(); // Refresh the list
        } catch (err) {
            console.error('Error updating tool:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to update tool.');
        }
    };

    // --- Delete Tool Handler ---
    const handleDeleteTool = async (tool_id) => {
        if (window.confirm('Are you sure you want to delete this tool? If it is checked out, you cannot delete it.')) {
            setError('');
            setMessage('');
            try {
                await api.deleteTool(tool_id);
                setMessage('Tool deleted successfully!');
                fetchTools(); // Refresh the list
            } catch (err) {
                console.error('Error deleting tool:', err.response?.data?.message || err.message);
                setError(err.response?.data?.message || 'Failed to delete tool. Is it checked out?');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl font-semibold text-gray-700">Loading tools for management...</p>
            </div>
        );
    }

    if (!hasRole(['tool_admin', 'super_admin'])) {
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
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Tool Management</h2>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
                {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}

                <div className="mb-6 text-right">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
                    >
                        Add New Tool
                    </button>
                </div>

                {tools.length === 0 ? (
                    <p className="text-center text-gray-600">No tools to manage.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tl-lg">
                                        Tool Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Assigned To
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tr-lg">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {tools.map((tool) => (
                                    <tr key={tool.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {tool.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                tool.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {tool.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {tool.assigned_to_user_name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => openEditModal(tool)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-md shadow-sm transition duration-200 text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTool(tool.id)}
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

            {/* Add Tool Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add New Tool</h3>
                        <form onSubmit={handleAddTool} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="newToolName">
                                    Tool Name:
                                </label>
                                <input
                                    type="text"
                                    id="newToolName"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newToolName}
                                    onChange={(e) => setNewToolName(e.target.value)}
                                    required
                                />
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
                                    Add Tool
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Tool Modal */}
            {showEditModal && editingTool && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Edit Tool: {editingTool.name}</h3>
                        <form onSubmit={handleUpdateTool} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="editToolName">
                                    Tool Name:
                                </label>
                                <input
                                    type="text"
                                    id="editToolName"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    value={editToolName}
                                    onChange={(e) => setEditToolName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="editToolStatus">
                                    Status:
                                </label>
                                <select
                                    id="editToolStatus"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    value={editToolStatus}
                                    onChange={(e) => {
                                        setEditToolStatus(e.target.value);
                                        // If setting to 'available', ensure assigned_to is cleared
                                        if (e.target.value === 'available') {
                                            setEditAssignedTo('');
                                        }
                                    }}
                                >
                                    <option value="available">Available</option>
                                    <option value="checked_out">Checked Out</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="editAssignedTo">
                                    Assigned To:
                                </label>
                                <select
                                    id="editAssignedTo"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    value={editAssignedTo}
                                    onChange={(e) => {
                                        setEditAssignedTo(e.target.value);
                                        // If assigning a user, set status to checked_out
                                        if (e.target.value !== '' && editToolStatus !== 'checked_out') {
                                            setEditToolStatus('checked_out');
                                        }
                                    }}
                                    disabled={editToolStatus === 'available'} // Disable if status is 'available'
                                >
                                    <option value="">Select User (N/A if Available)</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.team || 'No Team'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingTool(null);
                                    }}
                                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition duration-200"
                                >
                                    Update Tool
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ToolManagementPage;
