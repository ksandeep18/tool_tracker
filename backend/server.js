// server.js

// Load environment variables from .env file
require('dotenv').config();

// Import necessary packages
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For JSON Web Tokens

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware Setup ---

// Enable CORS for all origins (for development)
app.use(cors());

// Enable JSON body parsing for Express
app.use(express.json());

// --- Database Connection ---

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test Database Connection
pool.connect()
    .then(client => {
        console.log('Connected to PostgreSQL database!');
        client.release();
    })
    .catch(err => {
        console.error('Error connecting to PostgreSQL database:', err.message);
        process.exit(1); // Exit if database connection fails at startup
    });

// --- JWT Authentication Middleware ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; // Attach the decoded user payload to the request object
        next();
    });
}

// --- Role-Based Authorization Middleware ---
function authorizeRole(requiredRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(500).json({ message: 'User role not found in request context.' });
        }

        if (!requiredRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions.' });
        }
        next();
    };
}

// --- Basic Route (for testing server) ---
app.get('/', (req, res) => {
    res.send('Tool Tracking System API is running!');
});

// --- User Authentication & Authorization Routes ---

// POST /register: User Registration
app.post('/register', async (req, res) => {
    const { name, team, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: 'Name and password are required.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO users (name, team, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, team, role',
            [name, team, password_hash, 'user'] // Default role is 'user'
        );

        res.status(201).json({
            message: 'User registered successfully!',
            user: result.rows[0]
        });

    } catch (err) {
        console.error('Error during registration:', err.message);
        if (err.code === '23505') {
            return res.status(409).json({ message: 'User with that name already exists.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST /login: User Login
app.post('/login', async (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: 'Name and password are required.' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE name = $1', [name]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const payload = {
            id: user.id,
            name: user.name,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Logged in successfully!',
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                team: user.team
            }
        });

    } catch (err) {
        console.error('Error during login:', err.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// --- Public/Authenticated General User Access Endpoints ---

// GET /tools: List all tools
app.get('/tools', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                t.id,
                t.name,
                t.status,
                t.assigned_to,
                u.name AS assigned_to_user_name
            FROM
                tools t
            LEFT JOIN
                users u ON t.assigned_to = u.id
            ORDER BY
                t.name;
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching tools:', err.message);
        res.status(500).json({ message: 'Server error fetching tools.' });
    }
});

// POST /checkout: Assign a tool to a user
app.post('/checkout', authenticateToken, authorizeRole(['user', 'tool_admin', 'super_admin']), async (req, res) => {
    const { tool_id } = req.body;
    const user_id = req.user.id;

    if (!tool_id) {
        return res.status(400).json({ message: 'Tool ID is required for checkout.' });
    }

    try {
        const toolResult = await pool.query('SELECT * FROM tools WHERE id = $1', [tool_id]);
        const tool = toolResult.rows[0];

        if (!tool) {
            return res.status(404).json({ message: 'Tool not found.' });
        }
        if (tool.status === 'checked_out') {
            return res.status(409).json({ message: 'Tool is already checked out.' });
        }

        await pool.query(
            'UPDATE tools SET status = $1, assigned_to = $2 WHERE id = $3',
            ['checked_out', user_id, tool_id]
        );

        await pool.query(
            'INSERT INTO history (tool_id, user_id, checkout_date) VALUES ($1, $2, CURRENT_TIMESTAMP)',
            [tool_id, user_id]
        );

        res.status(200).json({ message: 'Tool checked out successfully.' });

    } catch (err) {
        console.error('Error during tool checkout:', err.message);
        res.status(500).json({ message: 'Server error during tool checkout.' });
    }
});

// POST /return: Mark a tool as returned
app.post('/return', authenticateToken, authorizeRole(['user', 'tool_admin', 'super_admin']), async (req, res) => {
    const { tool_id } = req.body;
    const user_id = req.user.id; // Not strictly used for return logic below, but good to know who is returning

    if (!tool_id) {
        return res.status(400).json({ message: 'Tool ID is required for return.' });
    }

    try {
        const toolResult = await pool.query('SELECT * FROM tools WHERE id = $1', [tool_id]);
        const tool = toolResult.rows[0];

        if (!tool) {
            return res.status(404).json({ message: 'Tool not found.' });
        }
        if (tool.status === 'available') {
            return res.status(409).json({ message: 'Tool is already available.' });
        }

        await pool.query(
            'UPDATE tools SET status = $1, assigned_to = NULL WHERE id = $2',
            ['available', tool_id]
        );

        await pool.query(
            'UPDATE history SET return_date = CURRENT_TIMESTAMP WHERE tool_id = $1 AND return_date IS NULL ORDER BY checkout_date DESC LIMIT 1',
            [tool_id]
        );

        res.status(200).json({ message: 'Tool returned successfully.' });

    } catch (err) {
        console.error('Error during tool return:', err.message);
        res.status(500).json({ message: 'Server error during tool return.' });
    }
});

// GET /history: View all checkout/return history
app.get('/history', authenticateToken, authorizeRole(['tool_admin', 'super_admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                h.id,
                t.name AS tool_name,
                u.name AS user_name,
                h.checkout_date,
                h.return_date
            FROM
                history h
            JOIN
                tools t ON h.tool_id = t.id
            JOIN
                users u ON h.user_id = u.id
            ORDER BY
                h.checkout_date DESC;
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching history:', err.message);
        res.status(500).json({ message: 'Server error fetching history.' });
    }
});

// --- Tool Admin & Super Admin Access (for Tools CRUD) ---

// POST /tools: Add a new tool
app.post('/tools', authenticateToken, authorizeRole(['tool_admin', 'super_admin']), async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Tool name is required.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO tools (name, status) VALUES ($1, $2) RETURNING id, name, status',
            [name, 'available']
        );
        res.status(201).json({ message: 'Tool added successfully!', tool: result.rows[0] });
    } catch (err) {
        console.error('Error adding tool:', err.message);
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Tool with that name already exists.' });
        }
        res.status(500).json({ message: 'Server error adding tool.' });
    }
});

// PUT /tools/:id: Update a tool
app.put('/tools/:id', authenticateToken, authorizeRole(['tool_admin', 'super_admin']), async (req, res) => {
    const toolId = req.params.id;
    const { name, status, assigned_to } = req.body;

    if (!name && !status && assigned_to === undefined) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    try {
        let updateQuery = 'UPDATE tools SET ';
        const queryParams = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updateQuery += `name = $${paramIndex++}, `;
            queryParams.push(name);
        }
        if (status !== undefined) {
            updateQuery += `status = $${paramIndex++}, `;
            queryParams.push(status);
        }
        if (assigned_to !== undefined) {
            updateQuery += `assigned_to = $${paramIndex++}, `;
            queryParams.push(assigned_to);
        }

        updateQuery = updateQuery.slice(0, -2); // Remove trailing ', '
        updateQuery += ` WHERE id = $${paramIndex++} RETURNING id, name, status, assigned_to;`;
        queryParams.push(toolId);

        const result = await pool.query(updateQuery, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tool not found.' });
        }

        res.status(200).json({ message: 'Tool updated successfully!', tool: result.rows[0] });

    } catch (err) {
        console.error('Error updating tool:', err.message);
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Tool with that name already exists.' });
        }
        res.status(500).json({ message: 'Server error updating tool.' });
    }
});

// DELETE /tools/:id: Delete a tool (prevent if checked out)
app.delete('/tools/:id', authenticateToken, authorizeRole(['tool_admin', 'super_admin']), async (req, res) => {
    const toolId = req.params.id;

    try {
        const toolResult = await pool.query('SELECT status FROM tools WHERE id = $1', [toolId]);
        const tool = toolResult.rows[0];

        if (!tool) {
            return res.status(404).json({ message: 'Tool not found.' });
        }
        if (tool.status === 'checked_out') {
            return res.status(409).json({ message: 'Cannot delete a tool that is currently checked out. Please return it first.' });
        }

        await pool.query('DELETE FROM tools WHERE id = $1', [toolId]);

        res.status(200).json({ message: 'Tool deleted successfully.' });

    } catch (err) {
        console.error('Error deleting tool:', err.message);
        res.status(500).json({ message: 'Server error deleting tool.' });
    }
});

// --- Super Admin Only Access (for Users CRUD) ---

// GET /users: List all users (including roles)
app.get('/users', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, team, role FROM users ORDER BY name');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ message: 'Server error fetching users.' });
    }
});

// POST /users: Add a new user (Super Admin can assign any role)
app.post('/users', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
    const { name, team, password, role } = req.body;

    if (!name || !password || !role) {
        return res.status(400).json({ message: 'Name, password, and role are required.' });
    }
    const allowedRoles = ['super_admin', 'tool_admin', 'user'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: `Invalid role specified. Must be one of: ${allowedRoles.join(', ')}.` });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO users (name, team, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, team, role',
            [name, team, password_hash, role]
        );

        res.status(201).json({ message: 'User added successfully!', user: result.rows[0] });

    } catch (err) {
        console.error('Error adding user (Super Admin):', err.message);
        if (err.code === '23505') {
            return res.status(409).json({ message: 'User with that name already exists.' });
        }
        res.status(500).json({ message: 'Server error adding user.' });
    }
});

// PUT /users/:id: Update user details/role/password (Super Admin only)
app.put('/users/:id', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
    const userId = req.params.id;
    const { name, team, role, password } = req.body;

    if (!name && !team && !role && !password) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    try {
        let updateQuery = 'UPDATE users SET ';
        const queryParams = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updateQuery += `name = $${paramIndex++}, `;
            queryParams.push(name);
        }
        if (team !== undefined) {
            updateQuery += `team = $${paramIndex++}, `;
            queryParams.push(team);
        }
        if (role !== undefined) {
            const allowedRoles = ['super_admin', 'tool_admin', 'user'];
            if (!allowedRoles.includes(role)) {
                return res.status(400).json({ message: `Invalid role specified. Must be one of: ${allowedRoles.join(', ')}.` });
            }
            updateQuery += `role = $${paramIndex++}, `;
            queryParams.push(role);
        }
        if (password !== undefined) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            updateQuery += `password_hash = $${paramIndex++}, `;
            queryParams.push(password_hash);
        }

        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ` WHERE id = $${paramIndex++} RETURNING id, name, team, role;`;
        queryParams.push(userId);

        const result = await pool.query(updateQuery, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'User updated successfully!', user: result.rows[0] });

    } catch (err) {
        console.error('Error updating user (Super Admin):', err.message);
        if (err.code === '23505') {
            return res.status(409).json({ message: 'User with that name already exists.' });
        }
        res.status(500).json({ message: 'Server error updating user.' });
    }
});

// DELETE /users/:id: Delete a user
app.delete('/users/:id', authenticateToken, authorizeRole(['super_admin']), async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'User deleted successfully.' });

    } catch (err) {
        console.error('Error deleting user (Super Admin):', err.message);
        res.status(500).json({ message: 'Server error deleting user.' });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
