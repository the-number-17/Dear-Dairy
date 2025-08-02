const bcrypt = require('bcryptjs');
const fs = require('fs').promises;

async function resetPassword(username, newPassword) {
    try {
        // Read current users
        const usersData = await fs.readFile('users.json', 'utf8');
        const users = JSON.parse(usersData);
        
        // Find user by username
        const userIndex = users.findIndex(user => user.username === username);
        
        if (userIndex === -1) {
            console.log(`User '${username}' not found!`);
            return;
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        users[userIndex].password = hashedPassword;
        
        // Save back to file
        await fs.writeFile('users.json', JSON.stringify(users, null, 2));
        
        console.log(`✅ Password for user '${username}' has been reset successfully!`);
        console.log(`New password: ${newPassword}`);
        
    } catch (error) {
        console.error('Error resetting password:', error);
    }
}

// Usage example:
// resetPassword('Aviral', 'newpassword123');

// Uncomment the line below and modify to reset a password:
// resetPassword('Aviral', 'your-new-password-here');

console.log('Password reset utility loaded.');
console.log('To reset a password, uncomment and modify the last line in this file.'); 