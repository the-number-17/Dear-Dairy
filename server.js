const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Data file paths
const usersFile = path.join(__dirname, 'data', 'users.json');
const dataDir = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize users file if it doesn't exist
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
}

// Helper function to read users
function readUsers() {
    try {
        const data = fs.readFileSync(usersFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
}

// Helper function to write users
function writeUsers(users) {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing users:', error);
        return false;
    }
}

// Helper function to get user data file path
function getUserDataFile(userId) {
    return path.join(__dirname, 'data', `diary_${userId}.json`);
}

// Helper function to read user data
function readUserData(userId) {
    const dataFile = getUserDataFile(userId);
    try {
        if (fs.existsSync(dataFile)) {
            const data = fs.readFileSync(dataFile, 'utf8');
            return JSON.parse(data);
        } else {
            // Initialize with default categories
            const initialData = {
                categories: [
                    { id: 1, name: 'Education', color: '#4CAF50', emoji: '📚' },
                    { id: 2, name: 'Friends', color: '#2196F3', emoji: '👥' },
                    { id: 3, name: 'Future', color: '#FF9800', emoji: '🚀' },
                    { id: 4, name: 'Wishes', color: '#E91E63', emoji: '⭐' },
                    { id: 5, name: 'Clothes', color: '#9C27B0', emoji: '👕' },
                    { id: 6, name: 'Love', color: '#F44336', emoji: '❤️' }
                ],
                entries: []
            };
            fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
            return initialData;
        }
    } catch (error) {
        console.error('Error reading user data:', error);
        return { categories: [], entries: [] };
    }
}

// Helper function to write user data
function writeUserData(userId, data) {
    try {
        const dataFile = getUserDataFile(userId);
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing user data:', error);
        return false;
    }
}

// JWT Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Authentication Routes

// Register user
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const users = readUsers();

    // Check if user already exists
    if (users.find(user => user.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    if (users.find(user => user.username === username)) {
        return res.status(400).json({ error: 'Username already taken' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now(),
            username,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        // Create user's diary data file
        const userData = {
            categories: [
                { id: 1, name: 'Education', color: '#4CAF50' },
                { id: 2, name: 'Friends', color: '#2196F3' },
                { id: 3, name: 'Future', color: '#FF9800' },
                { id: 4, name: 'Wishes', color: '#E91E63' },
                { id: 5, name: 'Clothes', color: '#9C27B0' },
                { id: 6, name: 'Love', color: '#F44336' }
            ],
            entries: []
        };
        writeUserData(newUser.id, userData);

        const token = jwt.sign({ userId: newUser.id, username: newUser.username }, JWT_SECRET);
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
    });
});

// API Routes (Protected)

// Get all categories for user
app.get('/api/categories', authenticateToken, (req, res) => {
    const userData = readUserData(req.user.userId);
    res.json(userData.categories);
});

// Get all entries for user
app.get('/api/entries', authenticateToken, (req, res) => {
    const userData = readUserData(req.user.userId);
    res.json(userData.entries);
});

// Get entries by category for user
app.get('/api/entries/category/:categoryId', authenticateToken, (req, res) => {
    const userData = readUserData(req.user.userId);
    const categoryId = parseInt(req.params.categoryId);
    const entries = userData.entries.filter(entry => entry.categoryId === categoryId);
    res.json(entries);
});

// Add new entry for user
app.post('/api/entries', authenticateToken, (req, res) => {
    const userData = readUserData(req.user.userId);
    const { title, content, categoryId } = req.body;
    
    if (!title || !content || !categoryId) {
        return res.status(400).json({ error: 'Title, content, and categoryId are required' });
    }
    
    const newEntry = {
        id: Date.now(),
        title,
        content,
        categoryId: parseInt(categoryId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    userData.entries.push(newEntry);
    
    if (writeUserData(req.user.userId, userData)) {
        res.status(201).json(newEntry);
    } else {
        res.status(500).json({ error: 'Failed to save entry' });
    }
});

// Update entry for user
app.put('/api/entries/:id', authenticateToken, (req, res) => {
    const userData = readUserData(req.user.userId);
    const entryId = parseInt(req.params.id);
    const { title, content } = req.body;
    
    const entryIndex = userData.entries.findIndex(entry => entry.id === entryId);
    
    if (entryIndex === -1) {
        return res.status(404).json({ error: 'Entry not found' });
    }
    
    userData.entries[entryIndex] = {
        ...userData.entries[entryIndex],
        title: title || userData.entries[entryIndex].title,
        content: content || userData.entries[entryIndex].content,
        updatedAt: new Date().toISOString()
    };
    
    if (writeUserData(req.user.userId, userData)) {
        res.json(userData.entries[entryIndex]);
    } else {
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

// Delete entry for user
app.delete('/api/entries/:id', authenticateToken, (req, res) => {
    const userData = readUserData(req.user.userId);
    const entryId = parseInt(req.params.id);
    
    const entryIndex = userData.entries.findIndex(entry => entry.id === entryId);
    
    if (entryIndex === -1) {
        return res.status(404).json({ error: 'Entry not found' });
    }
    
    userData.entries.splice(entryIndex, 1);
    
    if (writeUserData(req.user.userId, userData)) {
        res.json({ message: 'Entry deleted successfully' });
    } else {
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

// Add new category for user
app.post('/api/categories', authenticateToken, (req, res) => {
    const userData = readUserData(req.user.userId);
    const { name, color, emoji } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    
    const newCategory = {
        id: Date.now(),
        name,
        color: color || '#607D8B',
        emoji: emoji || ''
    };
    
    userData.categories.push(newCategory);
    
    if (writeUserData(req.user.userId, userData)) {
        res.status(201).json(newCategory);
    } else {
        res.status(500).json({ error: 'Failed to save category' });
    }
});

// Delete category for user
app.delete('/api/categories/:id', authenticateToken, (req, res) => {
    const userData = readUserData(req.user.userId);
    const categoryId = parseInt(req.params.id);
    
    const categoryIndex = userData.categories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
        return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if category has entries
    const hasEntries = userData.entries.some(entry => entry.categoryId === categoryId);
    if (hasEntries) {
        return res.status(400).json({ error: 'Cannot delete category with existing entries. Please delete all entries first.' });
    }
    
    userData.categories.splice(categoryIndex, 1);
    
    if (writeUserData(req.user.userId, userData)) {
        res.json({ message: 'Category deleted successfully' });
    } else {
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 