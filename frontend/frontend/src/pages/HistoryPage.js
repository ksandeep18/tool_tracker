// src/pages/HistoryPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function HistoryPage() {
    const { hasRole } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.getHistory();
            setHistory(response.data);
        } catch (err) {
            console.error('Error fetching history:', err.response?.data?.message || err.message);
            setError('Failed to fetch history. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (hasRole(['tool_admin', 'super_admin'])) {
            fetchHistory();
        } else {
            setLoading(false);
        }
    }, [fetchHistory, hasRole]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <p className="h5 text-muted">Loading history...</p>
            </div>
        );
    }

    if (!hasRole(['tool_admin', 'super_admin'])) {
        return (
            <div className="container py-5 d-flex flex-column align-items-center justify-content-center">
                <div className="card p-4 shadow text-center">
                    <h2 className="text-danger mb-3">Access Denied</h2>
                    <p className="text-muted">You do not have the necessary permissions to view this page.</p>
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
        <div className="bg-light min-vh-100 py-4">
            <div className="container">
                <div className="card shadow-lg p-4">
                    <h2 className="text-center mb-4 text-primary">Tool Checkout/Return History</h2>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {history.length === 0 ? (
                        <p className="text-center text-muted">No history records found.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover align-middle">
                                <thead className="table-light text-center">
                                    <tr>
                                        <th>Tool Name</th>
                                        <th>User Name</th>
                                        <th>Checkout Date</th>
                                        <th>Return Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((record) => (
                                        <tr key={record.id}>
                                            <td>{record.tool_name}</td>
                                            <td>{record.user_name}</td>
                                            <td>{new Date(record.checkout_date).toLocaleString()}</td>
                                            <td>
                                                {record.return_date
                                                    ? new Date(record.return_date).toLocaleString()
                                                    : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HistoryPage;
