// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api'; // Import your API service

// Create the Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    // State to hold user information and authentication status
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true); // To indicate if authentication state is being loaded

    // --- Authentication Functions ---

    // Function to handle user login
    const login = useCallback(async (name, password) => {
        try {
            const response = await api.login({ name, password });
            const { token: receivedToken, user: userData } = response.data;

            // Store token in localStorage for persistence
            localStorage.setItem('token', receivedToken);
            localStorage.setItem('user', JSON.stringify(userData));

            // Update state
            setToken(receivedToken);
            setUser(userData);

            return { success: true, user: userData };
        } catch (error) {
            console.error('Login error:', error.response?.data?.message || error.message);
            return { success: false, error: error.response?.data?.message || 'Login failed' };
        }
    }, []);

    // Function to handle user registration
    const register = useCallback(async (name, team, password) => {
        try {
            const response = await api.register({ name, team, password });
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error('Registration error:', error.response?.data?.message || error.message);
            return { success: false, error: error.response?.data?.message || 'Registration failed' };
        }
    }, []);


    // Function to handle user logout
    const logout = useCallback(() => {
        // Clear token and user data from localStorage and state
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        // Redirect to login or home page after logout (handled by router in App.js)
    }, []);

    // --- Initial Load Effect ---
    useEffect(() => {
        const loadUserFromStorage = () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                // You might want to verify the token with your backend here
                // For simplicity, we'll assume it's valid if present
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
            setLoading(false); // Mark loading as complete
        };

        loadUserFromStorage();
    }, []); // Run only once on component mount

    // Function to check if a user has a required role
    const hasRole = useCallback((requiredRoles) => {
        if (!user || !user.role) {
            return false;
        }
        // Ensure requiredRoles is always an array
        const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        return rolesArray.includes(user.role);
    }, [user]);

    // Value provided by the context
    const contextValue = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        hasRole,
        isAuthenticated: !!user, // Convenience boolean
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children} {/* Only render children once loading is complete */}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
