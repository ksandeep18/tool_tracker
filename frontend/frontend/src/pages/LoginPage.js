import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name || !password) {
            setError('Please enter both username and password.');
            return;
        }

        const result = await login(name, password);

        if (result.success) {
            navigate('/home');
        } else {
            setError(result.error || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
            <div className="card shadow-lg p-4" style={{ width: '100%', maxWidth: '420px' }}>
                <h2 className="text-center text-primary mb-4">Sign In</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">
                            Username
                        </label>
                        <input
                            type="text"
                            id="name"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your username"
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && (
                        <div className="alert alert-danger text-center py-2" role="alert">
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary w-100">
                        Login
                    </button>
                </form>

                <div className="text-center mt-4">
                    <small className="text-muted">
                        Don’t have an account?{' '}
                        <button
                            onClick={() => navigate('/register')}
                            className="btn btn-link p-0"
                        >
                            Register here
                        </button>
                    </small>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
