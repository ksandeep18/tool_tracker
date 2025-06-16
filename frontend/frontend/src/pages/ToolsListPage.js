import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ToolsListPage() {
    const { user, hasRole } = useAuth();
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const fetchTools = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.getTools();
            setTools(response.data);
        } catch (err) {
            console.error('Error fetching tools:', err.response?.data?.message || err.message);
            setError('Failed to fetch tools. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTools();
    }, [fetchTools]);

    const handleCheckout = async (tool_id) => {
        setMessage('');
        setError('');
        try {
            const response = await api.checkoutTool(tool_id);
            setMessage(response.data.message);
            fetchTools();
        } catch (err) {
            console.error('Error checking out tool:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to check out tool.');
        }
    };

    const handleReturn = async (tool_id) => {
        setMessage('');
        setError('');
        try {
            const response = await api.returnTool(tool_id);
            setMessage(response.data.message);
            fetchTools();
        } catch (err) {
            console.error('Error returning tool:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to return tool.');
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <p className="fs-4 text-muted">Loading tools...</p>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="card shadow p-4">
                <h2 className="text-center text-success mb-4">Available Tools</h2>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="alert alert-success" role="alert">
                        {message}
                    </div>
                )}

                {tools.length === 0 ? (
                    <p className="text-center text-muted">No tools found.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle text-center">
                            <thead className="table-light">
                                <tr>
                                    <th>Tool Name</th>
                                    <th>Status</th>
                                    <th>Assigned To</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tools.map((tool) => (
                                    <tr key={tool.id}>
                                        <td>{tool.name}</td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    tool.status === 'available'
                                                        ? 'bg-success'
                                                        : 'bg-danger'
                                                }`}
                                            >
                                                {tool.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{tool.assigned_to_user_name || 'N/A'}</td>
                                        <td>
                                            {tool.status === 'available' && (
                                                <button
                                                    className="btn btn-sm btn-primary me-2"
                                                    onClick={() => handleCheckout(tool.id)}
                                                >
                                                    Checkout
                                                </button>
                                            )}
                                            {tool.status === 'checked_out' && tool.assigned_to === user.id && (
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleReturn(tool.id)}
                                                >
                                                    Return
                                                </button>
                                            )}
                                            {tool.status === 'checked_out' &&
                                                tool.assigned_to !== user.id &&
                                                hasRole(['tool_admin', 'super_admin']) && (
                                                    <button
                                                        className="btn btn-sm btn-warning text-white"
                                                        onClick={() => handleReturn(tool.id)}
                                                    >
                                                        Return (Admin)
                                                    </button>
                                                )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ToolsListPage;
