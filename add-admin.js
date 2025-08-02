const bcrypt = require('bcryptjs');
const fs = require('fs').promises;

async function addAdmin() {
    try {
        // Read current users
        const usersData = await fs.readFile('users.json', 'utf8');
        const users = JSON.parse(usersData);
        
        // Check if admin already exists
        const adminExists = users.find(user => user.email === 'Iam@admin.com');
        if (adminExists) {
            console.log('Admin user already exists!');
            return;
        }
        
        // Hash admin password
        const hashedPassword = await bcrypt.hash('Admin17', 10);
        
        // Create admin user
        const adminUser = {
            id: users.length + 1,
            username: 'Admin',
            email: 'Iam@admin.com',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        
        // Add admin to users array
        users.push(adminUser);
        
        // Save back to file
        await fs.writeFile('users.json', JSON.stringify(users, null, 2));
        
        console.log('✅ Admin user created successfully!');
        console.log('Email: Iam@admin.com');
        console.log('Password: Admin17');
        console.log('Role: admin');
        
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

// Run the function
addAdmin(); 