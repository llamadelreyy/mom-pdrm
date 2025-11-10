# PDRM Meeting Transcription System - React Frontend

This project includes both the original HTML frontend and a new React frontend that connects to the same Flask backend.

## 🚀 Quick Start

### Backend (Flask - Python)
```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Start Flask backend
python app.py
```
Backend will run on: **http://localhost:5000**

### Frontend Options

#### Option 1: Original HTML (Working)
Simply open: **http://localhost:5000** (uses static/index.html)

#### Option 2: React Frontend (New)
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Start React development server
npm run dev
```
React frontend will run on: **http://localhost:3000**

## 📁 Project Structure

```
minute_meeting/
├── app.py                    # Flask backend server
├── requirements.txt          # Python dependencies
├── static/
│   ├── index.html           # Original working HTML frontend
│   ├── pdrm.html           # PDRM template (maintain as-is)
│   └── asset/logo.png      # PDRM logo
└── frontend/                # New React frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx          # Main React component
        └── index.css        # All styles
```

## 🔧 Features (Both Frontends)

### ✅ Complete Feature Parity
- **File Upload**: Drag & drop or click to select audio/video files
- **Transcription**: Whisper and Malaysia Whisper model support
- **AI Processing**: Convert transcripts to structured meeting minutes
- **System Prompts**: Add, edit, delete custom AI instructions
- **Meeting Metadata**: Rujukan, Bil., Tarikh, Masa, Tempat fields
- **Downloads**: 
  - Raw transcription: DOCX, PDF, TXT
  - Processed minutes: DOCX, PDF, TXT
  - **PDRM Format PDF**: Exact same as original ✅
- **Data Persistence**: localStorage auto-save
- **Dark/Light Theme**: Toggle with persistence
- **Copy to Clipboard**: All text areas
- **Professional UI**: Inter font, PDRM branding, sidebar layout

### 🎯 PDRM PDF Format Maintained
The React frontend preserves the exact same PDRM PDF generation:
- `/minutes/render?output_format=pdf` endpoint
- Same footer, logo, and formatting
- Identical to original HTML version

## 🔗 API Endpoints

The React frontend connects to these Flask backend endpoints:
- `POST /transcribe` - Audio file transcription
- `POST /completion` - AI processing for meeting minutes
- `POST /process_text` - Generate DOCX/PDF/TXT downloads
- `POST /minutes/render` - Generate PDRM format PDF
- `GET /logout` - User logout

## 📋 Setup Instructions

### Prerequisites
- **Python 3.8+** (for backend)
- **Node.js 16+** (for React frontend)
- **npm or yarn** (for package management)

### Step-by-Step Setup

1. **Start Backend**:
   ```bash
   # In project root (/home/aiserver/Developer/minute_meeting)
   python app.py
   ```

2. **Start React Frontend**:
   ```bash
   # In new terminal
   cd frontend
   npm install
   npm run dev
   ```

3. **Access Applications**:
   - **Original HTML**: http://localhost:5000
   - **React Version**: http://localhost:3000

### Development

- **Backend changes**: Restart `python app.py`
- **Frontend changes**: Auto-reload in React dev server
- **Production build**: `cd frontend && npm run build`

## 🔒 Security & Authentication

Both frontends maintain the same authentication system:
- Flask session-based auth
- User context passed to templates
- Secure file uploads and processing
- Internal PDRM application security

## ⚡ Performance

- **React benefits**: Component-based architecture, state management, faster UI updates
- **Original benefits**: Simple deployment, no build step required
- **Both**: Same backend performance and processing capabilities

## 🐛 Troubleshooting

### Backend Issues
- Ensure all Python dependencies installed: `pip install -r requirements.txt`
- Check Flask app runs without errors
- Verify uploads/ and transcriptions/ directories exist

### React Frontend Issues
- Ensure Node.js 16+ installed
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Vite proxy configuration in vite.config.js

### File Upload Issues
- Check file permissions on uploads/ directory
- Verify audio/video file formats supported
- Test with smaller files first

## 📝 Notes

- **PDRM template format is maintained exactly as original**
- **All functionality from HTML version is preserved**
- **React version offers modern development experience**
- **Backend remains unchanged - same Flask app.py**