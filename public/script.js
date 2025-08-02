// Global variables
let currentCategoryId = null;
let currentEntryId = null;
let categories = [];
let entries = [];
let allEntries = []; // Store all entries for counting
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let currentTheme = localStorage.getItem('theme') || 'elegant-blue';

// API Base URL - handles both development and production
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : `${window.location.protocol}//${window.location.host}/api`;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthStatus();
    initializeTheme();
});

// Setup event listeners
function setupEventListeners() {
    // Authentication forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Add category form
    document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
    
    // Add entry form
    document.getElementById('addEntryForm').addEventListener('submit', handleAddEntry);
    
    // Word count functionality
    document.getElementById('entryContent').addEventListener('input', updateWordCount);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Check authentication status
function checkAuthStatus() {
    if (authToken) {
        // Verify token and get user profile
        fetchUserProfile();
    } else {
        showAuthSection();
    }
}

// Show authentication section
function showAuthSection() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
}

// Show main content
function showMainContent() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    loadCategories();
    initializeTheme(); // Initialize theme when user logs in
}

// Authentication functions
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            showMainContent();
            updateUserInfo();
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            showMainContent();
            updateUserInfo();
            showNotification('Registration successful!', 'success');
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Registration failed. Please try again.', 'error');
    }
}

async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            currentUser = userData;
            showMainContent();
            updateUserInfo();
        } else {
            // Token is invalid, clear it
            logout();
        }
    } catch (error) {
        logout();
    }
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userUsername').textContent = currentUser.username;
        document.getElementById('userEmail').textContent = currentUser.email;
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    showAuthSection();
    showNotification('Logged out successfully', 'info');
}

// Profile functions
function showProfileModal() {
    if (currentUser) {
        document.getElementById('profileUsername').textContent = currentUser.username;
        document.getElementById('profileEmail').textContent = currentUser.email;
        
        // Robust date formatting
        let dateStr = 'N/A';
        if (currentUser.createdAt) {
            const date = new Date(currentUser.createdAt);
            if (!isNaN(date.getTime())) {
                dateStr = date.toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }
        }
        document.getElementById('profileCreatedAt').textContent = dateStr;
        document.getElementById('profileModal').style.display = 'block';
    }
}

// Theme management
function initializeTheme() {
    document.body.setAttribute('data-theme', currentTheme);
    const themeSelect = document.getElementById('themeColor');
    if (themeSelect) themeSelect.value = currentTheme;
}

function changeTheme() {
    const themeSelect = document.getElementById('themeColor');
    const newTheme = themeSelect.value;
    
    currentTheme = newTheme;
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    showNotification(`Theme changed to ${newTheme}!`, 'success');
}

// API Functions with authentication
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                ...options.headers
            },
            ...options
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Error: ' + error.message, 'error');
        throw error;
    }
}

// Load categories
async function loadCategories() {
    try {
        showLoading('categoriesGrid');
        categories = await fetchAPI('/categories');
        // Load all entries for counting
        allEntries = await fetchAPI('/entries');
        renderCategories();
    } catch (error) {
        showEmptyState('categoriesGrid', 'Failed to load categories', 'fas fa-exclamation-triangle');
    }
}

// Load entries for a category
async function loadEntries(categoryId) {
    try {
        showLoading('entriesGrid');
        entries = await fetchAPI(`/entries/category/${categoryId}`);
        renderEntries();
    } catch (error) {
        showEmptyState('entriesGrid', 'Failed to load entries', 'fas fa-exclamation-triangle');
    }
}

// Render categories
function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    
    if (categories.length === 0) {
        showEmptyState('categoriesGrid', 'No categories yet', 'fas fa-folder-open', 'Create your first category to get started!');
        return;
    }
    
    grid.innerHTML = categories.map(category => {
        const entryCount = allEntries.filter(entry => entry.categoryId === category.id).length;
        const icon = getCategoryIcon(category.name);
        const emoji = category.emoji || '';
        
        return `
            <div class="category-card" onclick="openCategory(${category.id})" style="--category-color: ${category.color}">
                <div class="category-actions">
                    <button class="delete-btn" onclick="deleteCategory(${category.id}, event)" title="Delete Category">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="category-icon" style="color: ${category.color}">
                    ${emoji ? `<span class="category-emoji">${emoji}</span>` : `<i class="${icon}"></i>`}
                </div>
                <h3>${category.name}</h3>
                <p>Organize your thoughts and memories in this category</p>
                <div class="category-stats">
                    <span>${entryCount} entries</span>
                    <span>Click to view</span>
                </div>
            </div>
        `;
    }).join('');
}

// Render entries
function renderEntries() {
    const grid = document.getElementById('entriesGrid');
    
    if (entries.length === 0) {
        showEmptyState('entriesGrid', 'No entries yet', 'fas fa-edit', 'Create your first entry in this category!');
        return;
    }
    
    grid.innerHTML = entries.map(entry => {
        const category = categories.find(cat => cat.id === entry.categoryId);
        const date = new Date(entry.createdAt).toLocaleDateString();
        
        return `
            <div class="entry-card" onclick="viewEntry(${entry.id})" style="--category-color: ${category ? category.color : '#607D8B'}">
                <div class="entry-actions">
                    <button class="delete-btn" onclick="deleteEntry(${entry.id}, event)" title="Delete Entry">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <h3>${entry.title}</h3>
                <p>${entry.content.substring(0, 150)}${entry.content.length > 150 ? '...' : ''}</p>
                <div class="entry-meta">
                    <span>${date}</span>
                    <span>Click to read</span>
                </div>
            </div>
        `;
    }).join('');
}

// Get category icon based on name
function getCategoryIcon(categoryName) {
    const iconMap = {
        'Education': 'fas fa-graduation-cap',
        'Friends': 'fas fa-users',
        'Future': 'fas fa-rocket',
        'Wishes': 'fas fa-star',
        'Clothes': 'fas fa-tshirt',
        'Love': 'fas fa-heart'
    };
    
    return iconMap[categoryName] || 'fas fa-folder';
}

// Open category and show entries
async function openCategory(categoryId) {
    currentCategoryId = categoryId;
    const category = categories.find(cat => cat.id === categoryId);
    
    document.getElementById('currentCategoryName').textContent = category.name;
    document.getElementById('categoriesSection').style.display = 'none';
    document.getElementById('entriesSection').style.display = 'block';
    
    await loadEntries(categoryId);
}

// Show categories view
function showCategories() {
    currentCategoryId = null;
    document.getElementById('entriesSection').style.display = 'none';
    document.getElementById('categoriesSection').style.display = 'block';
}

// Modal functions
function showAddCategoryModal() {
    document.getElementById('addCategoryModal').style.display = 'block';
    document.getElementById('categoryName').focus();
}

function showAddEntryModal() {
    document.getElementById('addEntryModal').style.display = 'block';
    document.getElementById('entryTitle').focus();
    updateWordCount(); // Initialize word count
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // Reset forms
    if (modalId === 'addCategoryModal') {
        document.getElementById('addCategoryForm').reset();
    } else if (modalId === 'addEntryModal') {
        document.getElementById('addEntryForm').reset();
        document.getElementById('wordCount').textContent = '0';
    }
}

// Add category
async function handleAddCategory(event) {
    event.preventDefault();
    
    const name = document.getElementById('categoryName').value;
    const emoji = document.getElementById('categoryEmoji').value;
    const color = document.getElementById('categoryColor').value;
    
    try {
        const newCategory = await fetchAPI('/categories', {
            method: 'POST',
            body: JSON.stringify({ name, emoji, color })
        });
        
        categories.push(newCategory);
        renderCategories();
        closeModal('addCategoryModal');
        showNotification('Category added successfully!', 'success');
    } catch (error) {
        showNotification('Failed to add category', 'error');
    }
}

// Add entry
async function handleAddEntry(event) {
    event.preventDefault();
    
    const title = document.getElementById('entryTitle').value;
    const content = document.getElementById('entryContent').value;
    
    try {
        const newEntry = await fetchAPI('/entries', {
            method: 'POST',
            body: JSON.stringify({
                title,
                content,
                categoryId: currentCategoryId
            })
        });
        
        entries.push(newEntry);
        allEntries.push(newEntry); // Add to all entries for counting
        renderEntries();
        renderCategories(); // Update category counts
        closeModal('addEntryModal');
        showNotification('Entry added successfully!', 'success');
    } catch (error) {
        showNotification('Failed to add entry', 'error');
    }
}

// View entry
async function viewEntry(entryId) {
    try {
        const entry = await fetchAPI(`/entries/${entryId}`);
        currentEntryId = entryId;
        
        document.getElementById('viewEntryTitle').textContent = entry.title;
        document.getElementById('viewEntryContent').textContent = entry.content;
        document.getElementById('viewEntryDate').textContent = new Date(entry.createdAt).toLocaleDateString();
        
        document.getElementById('viewEntryModal').style.display = 'block';
    } catch (error) {
        showNotification('Failed to load entry', 'error');
    }
}

// Delete category
async function deleteCategory(categoryId, event) {
    event.stopPropagation();
    
    const category = categories.find(cat => cat.id === categoryId);
    const entryCount = allEntries.filter(entry => entry.categoryId === categoryId).length;
    
    if (entryCount > 0) {
        showNotification(`Cannot delete category with ${entryCount} entries. Please delete the entries first.`, 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
        return;
    }
    
    try {
        await fetchAPI(`/categories/${categoryId}`, {
            method: 'DELETE'
        });
        
        categories = categories.filter(cat => cat.id !== categoryId);
        renderCategories();
        showNotification('Category deleted successfully!', 'success');
    } catch (error) {
        showNotification('Failed to delete category', 'error');
    }
}

// Delete entry
async function deleteEntry(entryId, event) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    try {
        await fetchAPI(`/entries/${entryId}`, {
            method: 'DELETE'
        });
        
        entries = entries.filter(entry => entry.id !== entryId);
        allEntries = allEntries.filter(entry => entry.id !== entryId);
        renderEntries();
        renderCategories(); // Update category counts
        showNotification('Entry deleted successfully!', 'success');
    } catch (error) {
        showNotification('Failed to delete entry', 'error');
    }
}

// Delete current entry (from view modal)
async function deleteCurrentEntry() {
    if (!currentEntryId) return;
    
    try {
        await fetchAPI(`/entries/${currentEntryId}`, {
            method: 'DELETE'
        });
        
        entries = entries.filter(entry => entry.id !== currentEntryId);
        allEntries = allEntries.filter(entry => entry.id !== currentEntryId);
        renderEntries();
        renderCategories(); // Update category counts
        closeModal('viewEntryModal');
        showNotification('Entry deleted successfully!', 'success');
        currentEntryId = null;
    } catch (error) {
        showNotification('Failed to delete entry', 'error');
    }
}

// Word count functionality
function updateWordCount() {
    const content = document.getElementById('entryContent').value;
    const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    document.getElementById('wordCount').textContent = wordCount;
}

// Utility functions
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.innerHTML = '<div class="loading">Loading...</div>';
}

function showEmptyState(elementId, title, icon, message = '') {
    const element = document.getElementById(elementId);
    element.innerHTML = `
        <div class="empty-state">
            <i class="${icon}"></i>
            <h3>${title}</h3>
            ${message ? `<p>${message}</p>` : ''}
        </div>
    `;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    return colors[type] || '#2196F3';
}

// Add notification styles to head
const notificationStyles = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 1.1rem;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);