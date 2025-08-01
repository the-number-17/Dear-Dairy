# Personal Diary - Full Stack Web Application

A beautiful and modern personal diary application built with HTML, CSS, JavaScript, and Node.js. Organize your thoughts and memories into different categories with a clean, responsive interface.

## Features

### 🎯 Core Features
- **Category Management**: Pre-configured categories (Education, Friends, Future, Wishes, Clothes, Love)
- **Add Custom Categories**: Create new categories with custom colors
- **Entry Management**: Add, view, and delete diary entries
- **Persistent Storage**: All data is saved locally in JSON format
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

### 🎨 User Interface
- **Modern Design**: Clean, gradient-based design with smooth animations
- **Card-based Layout**: Easy-to-navigate category and entry cards
- **Modal Dialogs**: Intuitive forms for adding content
- **Real-time Updates**: Instant feedback and notifications
- **Beautiful Icons**: Font Awesome icons for each category

### 🔒 Privacy & Security
- **Local Storage**: All data is stored locally on your machine
- **No External Dependencies**: No cloud storage or external services
- **Personal Use**: Designed for individual use with no user accounts

## Technology Stack

### Frontend
- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with Flexbox and Grid
- **JavaScript (ES6+)**: Vanilla JavaScript with async/await
- **Font Awesome**: Beautiful icons
- **Google Fonts**: Poppins font family

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **CORS**: Cross-origin resource sharing
- **Body Parser**: Request body parsing

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Step 1: Clone or Download
```bash
# If using git
git clone <repository-url>
cd personal-diary

# Or simply download and extract the files
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Application
```bash
# Start the server
npm start

# Or for development with auto-restart
npm run dev
```

### Step 4: Access the Application
Open your web browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
personal-diary/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   └── script.js          # JavaScript functionality
├── data/                  # Data storage (created automatically)
│   └── diary.json        # JSON file storing all data
├── server.js             # Express server
├── package.json          # Node.js dependencies
└── README.md            # This file
```

## How to Use

### 1. View Categories
- The main page shows all available categories
- Each category displays the number of entries
- Click on any category to view its entries

### 2. Add New Categories
- Click the "Add Category" button
- Enter a category name
- Choose a color (optional)
- Click "Add Category"

### 3. Add Diary Entries
- Navigate to a category
- Click "Add Entry"
- Enter a title and content
- Click "Add Entry"

### 4. View Entries
- Click on any entry card to view the full content
- View creation date and time
- Delete entries if needed

### 5. Navigation
- Use "Back to Categories" to return to the main view
- All changes are automatically saved

## API Endpoints

The application provides a RESTful API for managing data:

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a new category

### Entries
- `GET /api/entries` - Get all entries
- `GET /api/entries/category/:categoryId` - Get entries by category
- `POST /api/entries` - Create a new entry
- `PUT /api/entries/:id` - Update an entry
- `DELETE /api/entries/:id` - Delete an entry

## Data Storage

All data is stored in `data/diary.json` with the following structure:

```json
{
  "categories": [
    {
      "id": 1,
      "name": "Education",
      "color": "#4CAF50"
    }
  ],
  "entries": [
    {
      "id": 1234567890,
      "title": "My First Entry",
      "content": "This is my first diary entry...",
      "categoryId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Customization

### Adding New Categories
The application comes with 6 pre-configured categories. You can:
- Add new categories through the UI
- Modify the default categories in `server.js` (lines 25-32)

### Styling
- Modify `public/styles.css` to change the appearance
- Update colors, fonts, and layout as needed

### Icons
- Add new category icons in `public/script.js` (getCategoryIcon function)
- Use Font Awesome icon classes

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Change the port in server.js
   const PORT = 3001; // or any available port
   ```

2. **CORS errors**
   - The application includes CORS middleware
   - Ensure you're accessing via `http://localhost:3000`

3. **Data not persisting**
   - Check that the `data` directory exists
   - Ensure write permissions for the application

### Development Mode
For development with auto-restart:
```bash
npm run dev
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to fork this project and submit pull requests for improvements!

---

**Enjoy your personal diary! 📖✨** 