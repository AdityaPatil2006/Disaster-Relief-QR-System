const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, username, role }
        next();
    } catch (ex) {
        res.status(400).json({ error: 'Invalid token.' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user.role || req.user.role.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin required.' });
    }
    next();
}

module.exports = { authenticate, requireAdmin, JWT_SECRET };
