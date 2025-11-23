# PDRM Meeting Minutes Assistant - React Frontend

This is the React version of the PDRM Meeting Minutes Assistant application, converted from the original HTML/JavaScript implementation.

## Features

- **Authentication**: Login and registration with form validation
- **Audio Transcription**: Upload and transcribe audio/video files
- **AI Processing**: Convert transcripts into structured meeting minutes
- **Multiple Downloads**: Export as PDF, DOCX, or TXT formats
- **PDRM Format**: Special PDF format for official PDRM documents
- **System Prompts**: Customizable AI instructions
- **Auto-save**: Automatic saving of transcriptions and settings
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Progress**: Live progress updates during processing

## Tech Stack

- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Vite** - Build tool and development server
- **Marked** - Markdown processing
- **CSS Variables** - Theming and styling

## Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable React components
│   │   ├── Header.jsx      # Navigation header
│   │   ├── StatusNotification.jsx  # Toast notifications
│   │   └── FileUpload.jsx  # File upload dropzone
│   ├── pages/             # Page components
│   │   ├── Dashboard.jsx   # Main dashboard page
│   │   ├── Login.jsx      # Login page
│   │   └── Register.jsx   # Registration page
│   ├── utils/             # Utility functions
│   │   ├── api.js         # API communication
│   │   └── localStorage.js # Local storage management
│   ├── assets/            # Static assets
│   │   └── logo.png       # PDRM logo
│   ├── App.jsx            # Main app component with routing
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles
├── public/                # Public assets
├── package.json           # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── index.html            # HTML template
```

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The application communicates with the backend Flask server through the following endpoints:

- `POST /transcribe` - Upload and transcribe audio files
- `POST /completion` - Process transcripts with AI
- `POST /token` - User authentication
- `POST /register` - User registration
- `POST /logout` - User logout
- `GET /progress/{request_id}` - SSE for real-time progress
- `POST /process_text` - Generate documents (PDF/DOCX/TXT)
- `POST /minutes/render` - Generate PDRM format documents

## Key Features Converted

### From index.html:
- ✅ Complete dashboard layout with header and sidebar
- ✅ File upload with drag & drop functionality
- ✅ Audio transcription with progress tracking
- ✅ AI-powered minutes processing
- ✅ System prompt management
- ✅ Multiple download formats
- ✅ Auto-save functionality
- ✅ Real-time status notifications
- ✅ Theme support (light/dark)
- ✅ Responsive design

### From login.html:
- ✅ User authentication form
- ✅ Password visibility toggle
- ✅ Form validation
- ✅ Remember me functionality
- ✅ Navigation to registration
- ✅ Error handling

### From register.html:
- ✅ User registration form
- ✅ Comprehensive form validation
- ✅ Password strength requirements
- ✅ Confirm password matching
- ✅ Real-time error feedback
- ✅ Success notifications

## Styling

The application uses CSS variables for consistent theming and supports both light and dark modes. All original styles have been preserved and converted to be React-compatible.

## State Management

The application uses React's built-in state management with hooks:
- `useState` for component state
- `useEffect` for side effects and lifecycle
- `useRef` for DOM references
- Custom hooks for API calls and data persistence

## Data Persistence

- **LocalStorage**: Used for saving transcriptions, system prompts, and user preferences
- **Session Storage**: For temporary authentication state
- **Auto-save**: Automatic saving of user input and progress

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Development Notes

- All HTML has been converted to JSX syntax
- Event handlers converted to React event system
- DOM manipulation replaced with React state updates
- CSS classes updated for React (className instead of class)
- Form handling uses controlled components
- API calls use modern fetch API with async/await

## Production Build

To build for production:

```bash
npm run build
```

This creates an optimized build in the `dist` folder ready for deployment.

## Configuration

The Vite configuration includes:
- React plugin for JSX support
- Development server with API proxy to backend
- Hot module replacement for fast development

## Troubleshooting

### Common Issues:

1. **Module not found errors**: Clear node_modules and reinstall
2. **Build errors**: Check for TypeScript-style syntax in JSX files
3. **API connection issues**: Ensure backend server is running on port 8000
4. **Styling issues**: Check CSS variable names and class conversions

### Debug Mode:

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## Contributing

When making changes:
1. Follow React best practices
2. Use functional components with hooks
3. Maintain TypeScript-compatible prop types
4. Keep components small and focused
5. Test on multiple browsers
6. Update documentation as needed