const fs = require('fs').promises;
const path = require('path');

async function viewUsers() {
    try {
        // Read users
        const usersData = await fs.readFile('users.json', 'utf8');
        const users = JSON.parse(usersData);
        
        console.log('📊 REGISTERED USERS:');
        console.log('='.repeat(50));
        
        users.forEach((user, index) => {
            console.log(`\n👤 User ${index + 1}:`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
            console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
            
            // Check if diary file exists
            const diaryFile = `diary_${user.id}.json`;
            try {
                const diaryData = fs.readFileSync(diaryFile, 'utf8');
                const diary = JSON.parse(diaryData);
                console.log(`   📝 Diary Entries: ${diary.entries.length}`);
                console.log(`   📂 Categories: ${diary.categories.length}`);
            } catch (error) {
                console.log(`   📝 Diary: No entries yet`);
            }
        });
        
        console.log('\n' + '='.repeat(50));
        console.log(`Total Users: ${users.length}`);
        
    } catch (error) {
        console.error('Error reading users:', error);
    }
}

// Run the function
viewUsers(); 