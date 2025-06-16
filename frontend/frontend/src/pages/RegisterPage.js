import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
    const [name, setName] = useState('');
    const [team, setTeam] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!name || !password || !confirmPassword) {
            setError('All fields are required.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        const result = await register(name, team, password);

        if (result.success) {
            setSuccessMessage(result.message || 'Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } else {
            setError(result.error || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light p-3">
            <div className="card shadow p-4" style={{ maxWidth: '460px', width: '100%' }}>
                <h2 className="text-center text-success mb-4">Register</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">Username</label>
                        <input
                            type="text"
                            id="name"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="team" className="form-label">Team (Optional)</label>
                        <input
                            type="text"
                            id="team"
                            className="form-control"
                            value={team}
                            onChange={(e) => setTeam(e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="alert alert-danger text-center py-2">{error}</div>}
                    {successMessage && <div className="alert alert-success text-center py-2">{successMessage}</div>}

                    <button type="submit" className="btn btn-success w-100">Register</button>
                </form>

                <div className="text-center mt-4">
                    <small className="text-muted">
                        Already have an account?{' '}
                        <button onClick={() => navigate('/login')} className="btn btn-link p-0">
                            Login here
                        </button>
                    </small>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
