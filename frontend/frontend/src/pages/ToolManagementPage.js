// src/pages/ToolManagementPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
// Import Bootstrap CSS (assuming you've added the CDN link to public/index.html)
// No direct import needed here if using CDN in public/index.html

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
                const response = await api.getUsers();
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
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="ms-3 text-secondary">Loading tools for management...</p>
            </div>
        );
    }

    if (!hasRole(['tool_admin', 'super_admin'])) {
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
                <h2 className="card-title text-center text-dark mb-4">Tool Management</h2>

                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                {message && <div className="alert alert-success" role="alert">{message}</div>}

                <div className="d-flex justify-content-end mb-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary"
                    >
                        <i className="fas fa-plus me-2"></i> Add New Tool
                    </button>
                </div>

                {tools.length === 0 ? (
                    <p className="text-center text-muted">No tools to manage.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover border">
                            <thead className="table-light">
                                <tr>
                                    <th scope="col">Tool Name</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Assigned To</th>
                                    <th scope="col" className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tools.map((tool) => (
                                    <tr key={tool.id}>
                                        <td>{tool.name}</td>
                                        <td>
                                            <span className={`badge ${
                                                tool.status === 'available' ? 'bg-success' : 'bg-danger'
                                            }`}>
                                                {tool.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{tool.assigned_to_user_name || 'N/A'}</td>
                                        <td className="text-center">
                                            <button
                                                onClick={() => openEditModal(tool)}
                                                className="btn btn-sm btn-warning me-2"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTool(tool.id)}
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

            {/* Add Tool Modal */}
            <div className={`modal fade ${showAddModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ display: showAddModal ? 'block' : 'none' }}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Add New Tool</h5>
                            <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleAddTool}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="newToolName" className="form-label">Tool Name:</label>
                                    <input
                                        type="text"
                                        id="newToolName"
                                        className="form-control"
                                        value={newToolName}
                                        onChange={(e) => setNewToolName(e.target.value)}
                                        required
                                    />
                                </div>
                                {error && <div className="alert alert-danger mt-3">{error}</div>}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Tool</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Edit Tool Modal */}
            <div className={`modal fade ${showEditModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ display: showEditModal ? 'block' : 'none' }}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Edit Tool: {editingTool?.name}</h5>
                            <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleUpdateTool}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="editToolName" className="form-label">Tool Name:</label>
                                    <input
                                        type="text"
                                        id="editToolName"
                                        className="form-control"
                                        value={editToolName}
                                        onChange={(e) => setEditToolName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="editToolStatus" className="form-label">Status:</label>
                                    <select
                                        id="editToolStatus"
                                        className="form-select"
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
                                <div className="mb-3">
                                    <label htmlFor="editAssignedTo" className="form-label">Assigned To:</label>
                                    <select
                                        id="editAssignedTo"
                                        className="form-select"
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
                                {error && <div className="alert alert-danger mt-3">{error}</div>}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-warning">Update Tool</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ToolManagementPage;
