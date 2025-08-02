const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Helper functions
async function readUsers() {
    try {
        const data = await fs.readFile('users.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeUsers(users) {
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));
}

function getUserDataFile(userId) {
    return `diary_${userId}.json`;
}

async function readUserData(userId) {
    try {
        const data = await fs.readFile(getUserDataFile(userId), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Return default structure for new users
        return {
            categories: [
                { id: 1, name: 'Education', color: '#607D8B', emoji: '🎓' },
                { id: 2, name: 'Friends', color: '#4CAF50', emoji: '👥' },
                { id: 3, name: 'Future', color: '#2196F3', emoji: '🚀' },
                { id: 4, name: 'Wishes', color: '#FF9800', emoji: '⭐' },
                { id: 5, name: 'Clothes', color: '#E91E63', emoji: '👕' },
                { id: 6, name: 'Love', color: '#9C27B0', emoji: '💖' }
            ],
            entries: [],
            nextCategoryId: 7,
            nextEntryId: 1
        };
    }
}

async function writeUserData(userId, userData) {
    await fs.writeFile(getUserDataFile(userId), JSON.stringify(userData, null, 2));
}

// Authentication middleware
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

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const users = await readUsers();

        // Check if email or username already exists
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        if (users.find(user => user.username === username)) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: users.length + 1,
            username,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeUsers(users);

        // Create token
        const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const users = await readUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const users = await readUsers();
        const user = users.find(u => u.id === req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Categories routes
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const userData = await readUserData(req.user.userId);
        res.json(userData.categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        const { name, emoji, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const userData = await readUserData(req.user.userId);

        // Check if category name already exists
        if (userData.categories.find(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }

        const newCategory = {
            id: userData.nextCategoryId++,
            name,
            emoji: emoji || '',
            color: color || '#607D8B'
        };

        userData.categories.push(newCategory);
        await writeUserData(req.user.userId, userData);

        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const userData = await readUserData(req.user.userId);

        // Check if category exists
        const category = userData.categories.find(cat => cat.id === categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if category has entries
        const entriesInCategory = userData.entries.filter(entry => entry.categoryId === categoryId);
        if (entriesInCategory.length > 0) {
            return res.status(400).json({ 
                error: `Cannot delete category with ${entriesInCategory.length} entries. Please delete the entries first.` 
            });
        }

        // Remove category
        userData.categories = userData.categories.filter(cat => cat.id !== categoryId);
        await writeUserData(req.user.userId, userData);

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Entries routes
app.get('/api/entries', authenticateToken, async (req, res) => {
    try {
        const userData = await readUserData(req.user.userId);
        res.json(userData.entries);
    } catch (error) {
        console.error('Get entries error:', error);
        res.status(500).json({ error: 'Failed to get entries' });
    }
});

app.get('/api/entries/category/:categoryId', authenticateToken, async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        const userData = await readUserData(req.user.userId);

        // Check if category exists
        const category = userData.categories.find(cat => cat.id === categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const entries = userData.entries.filter(entry => entry.categoryId === categoryId);
        res.json(entries);
    } catch (error) {
        console.error('Get category entries error:', error);
        res.status(500).json({ error: 'Failed to get category entries' });
    }
});

app.get('/api/entries/:id', authenticateToken, async (req, res) => {
    try {
        const entryId = parseInt(req.params.id);
        const userData = await readUserData(req.user.userId);

        const entry = userData.entries.find(entry => entry.id === entryId);
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        res.json(entry);
    } catch (error) {
        console.error('Get entry error:', error);
        res.status(500).json({ error: 'Failed to get entry' });
    }
});

app.post('/api/entries', authenticateToken, async (req, res) => {
    try {
        const { title, content, categoryId } = req.body;

        if (!title || !content || !categoryId) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }

        const userData = await readUserData(req.user.userId);

        // Check if category exists
        const category = userData.categories.find(cat => cat.id === categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const newEntry = {
            id: userData.nextEntryId++,
            title,
            content,
            categoryId,
            createdAt: new Date().toISOString()
        };

        userData.entries.push(newEntry);
        await writeUserData(req.user.userId, userData);

        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Create entry error:', error);
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

app.put('/api/entries/:id', authenticateToken, async (req, res) => {
    try {
        const entryId = parseInt(req.params.id);
        const { title, content, categoryId } = req.body;

        if (!title || !content || !categoryId) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }

        const userData = await readUserData(req.user.userId);

        // Check if entry exists
        const entryIndex = userData.entries.findIndex(entry => entry.id === entryId);
        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Check if category exists
        const category = userData.categories.find(cat => cat.id === categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Update entry
        userData.entries[entryIndex] = {
            ...userData.entries[entryIndex],
            title,
            content,
            categoryId,
            updatedAt: new Date().toISOString()
        };

        await writeUserData(req.user.userId, userData);

        res.json(userData.entries[entryIndex]);
    } catch (error) {
        console.error('Update entry error:', error);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

app.delete('/api/entries/:id', authenticateToken, async (req, res) => {
    try {
        const entryId = parseInt(req.params.id);
        const userData = await readUserData(req.user.userId);

        // Check if entry exists
        const entryIndex = userData.entries.findIndex(entry => entry.id === entryId);
        if (entryIndex === -1) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Remove entry
        userData.entries.splice(entryIndex, 1);
        await writeUserData(req.user.userId, userData);

        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Delete entry error:', error);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 