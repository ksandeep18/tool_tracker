// src/pages/HistoryPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function HistoryPage() {
    const { hasRole } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Function to fetch tool history
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.getHistory();
            setHistory(response.data);
        } catch (err) {
            console.error('Error fetching history:', err.response?.data?.message || err.message);
            setError('Failed to fetch history. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only fetch history if the current user has the required role
        if (hasRole(['tool_admin', 'super_admin'])) {
            fetchHistory();
        } else {
            setLoading(false); // If not authorized, no need to load history
        }
    }, [fetchHistory, hasRole]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl font-semibold text-gray-700">Loading history...</p>
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
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Tool Checkout/Return History</h2>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

                {history.length === 0 ? (
                    <p className="text-center text-gray-600">No history records found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tl-lg">
                                        Tool Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        User Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Checkout Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tr-lg">
                                        Return Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {history.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {record.tool_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {record.user_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {new Date(record.checkout_date).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {record.return_date ? new Date(record.return_date).toLocaleString() : 'N/A'}
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

export default HistoryPage;
