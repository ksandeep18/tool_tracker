// src/pages/ToolsListPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ToolsListPage() {
    const { user, hasRole } = useAuth();
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Function to fetch tools from the backend
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

    // Effect to fetch tools on component mount
    useEffect(() => {
        fetchTools();
    }, [fetchTools]);

    // Function to handle tool checkout
    const handleCheckout = async (tool_id) => {
        setMessage('');
        setError('');
        try {
            const response = await api.checkoutTool(tool_id);
            setMessage(response.data.message);
            fetchTools(); // Refresh the tool list
        } catch (err) {
            console.error('Error checking out tool:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to check out tool.');
        }
    };

    // Function to handle tool return
    const handleReturn = async (tool_id) => {
        setMessage('');
        setError('');
        try {
            const response = await api.returnTool(tool_id);
            setMessage(response.data.message);
            fetchTools(); // Refresh the tool list
        } catch (err) {
            console.error('Error returning tool:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to return tool.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl font-semibold text-gray-700">Loading tools...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Available Tools</h2>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
                {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}

                {tools.length === 0 ? (
                    <p className="text-center text-gray-600">No tools found.</p>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tr-lg">
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
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            {tool.status === 'available' && (
                                                <button
                                                    onClick={() => handleCheckout(tool.id)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-200 text-sm"
                                                >
                                                    Checkout
                                                </button>
                                            )}
                                            {tool.status === 'checked_out' && tool.assigned_to === user.id && (
                                                <button
                                                    onClick={() => handleReturn(tool.id)}
                                                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-200 text-sm"
                                                >
                                                    Return
                                                </button>
                                            )}
                                            {tool.status === 'checked_out' && tool.assigned_to !== user.id && hasRole(['tool_admin', 'super_admin']) && (
                                                <button
                                                    onClick={() => handleReturn(tool.id)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-200 text-sm"
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
