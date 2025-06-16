// src/pages/HomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function HomePage() {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    const subsystems = ['Braking', 'Suspension & Steering', 'Powertrain', 'Design'];

    return (
        <div className="d-flex flex-column min-vh-100">
            {/* Header */}
            <header className="bg-primary text-white py-3 shadow-sm">
                <div className="container d-flex justify-content-between align-items-center">
                    <h1 className="h4 mb-0">ToolTracker</h1>
                    <p className="mb-0 d-none d-md-block small">
                        ATV Vehicle Club – Team Spardhak, NIT Warangal
                    </p>
                </div>
            </header>

            {/* Main Section */}
            <main className="flex-grow-1 py-5 bg-light">
                <div className="container">
                    <div className="card shadow-lg border-0 mb-4">
                        <div className="card-body text-center">
                            <h2 className="display-5 fw-bold text-primary mb-3">
                                Welcome{user ? `, ${user.name}` : ''}!
                            </h2>
                            <p className="lead text-secondary mb-4">
                                <strong>Role:</strong> {user ? user.role.replace('_', ' ') : 'N/A'}
                            </p>

                            <div className="row justify-content-center g-3 mb-4">
                                <div className="col-md-6 col-lg-4">
                                    <button onClick={() => navigate('/tools')} className="btn btn-primary w-100">
                                        View All Tools
                                    </button>
                                </div>
                                {hasRole(['tool_admin', 'super_admin']) && (
                                    <div className="col-md-6 col-lg-4">
                                        <button onClick={() => navigate('/admin/tools')} className="btn btn-secondary w-100">
                                            Manage Tools
                                        </button>
                                    </div>
                                )}
                                {hasRole('super_admin') && (
                                    <>
                                        <div className="col-md-6 col-lg-4">
                                            <button onClick={() => navigate('/admin/users')} className="btn btn-danger w-100">
                                                Manage Users
                                            </button>
                                        </div>
                                        <div className="col-md-6 col-lg-4">
                                            <button onClick={() => navigate('/admin/history')} className="btn btn-success w-100">
                                                View History
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button onClick={logout} className="btn btn-outline-dark">
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Subsystems */}
                    <section className="text-center mt-5">
                        <h3 className="h4 fw-bold mb-3">Subsystems We Manage</h3>
                        <div className="d-flex flex-wrap justify-content-center gap-3">
                            {subsystems.map((name, index) => (
                                <span key={index} className="badge bg-secondary fs-6 px-3 py-2">
                                    {name}
                                </span>
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-dark text-white text-center py-3 mt-auto">
                <small>
                    &copy; {new Date().getFullYear()} ToolTracker | Built by <strong>Sandeep</strong> | Team Spardhak, NIT Warangal
                </small>
            </footer>
        </div>
    );
}

export default HomePage;
