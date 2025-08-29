# 🎤 Voice Notes AI

A modern, AI-powered voice notes application that transcribes audio recordings and generates intelligent summaries using Google's Gemini AI. Built with React, Node.js, and MongoDB.

![Voice Notes AI](https://img.shields.io/badge/React-18.2.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-orange)

## ✨ Features

- **🎙️ Voice Recording**: High-quality audio recording with real-time transcription
- **🤖 AI Summarization**: Intelligent summaries using Google Gemini AI
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **🎨 Modern UI**: Clean, intuitive interface with smooth animations
- **💾 Real-time Saving**: Auto-save functionality with cloud storage
- **🔍 Smart Search**: Easy note organization and retrieval
- **📊 Progress Tracking**: Visual indicators for recording and processing status
- **🌐 Cross-platform**: Works on all modern browsers and devices

## 🏗️ Project Structure

```
Voice-Notes-AI/
├── frontend/                 # React frontend application
│   └── vite-project/
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── App.jsx       # Main application component
│       │   ├── api.js        # API configuration
│       │   └── index.css     # Global styles
│       ├── package.json      # Frontend dependencies
│       └── vite.config.js    # Vite configuration
├── server/                   # Node.js backend server
│   ├── src/
│   │   ├── controllers/      # API controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── app.js           # Express server setup
│   │   └── db.js            # Database connection
│   └── package.json         # Backend dependencies
├── .gitignore               # Git ignore file
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **MongoDB** (version 6.0 or higher)
- **Git** (for cloning the repository)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/shkhfzn9/VoiceNotesAi.git
cd VoiceNotesAi
```

#### 2. Set Up Backend (Server)

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Configure Environment Variables:**

Create a `.env` file in the `server` directory with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/voice-notes-ai

# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here



# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**Get Google Gemini API Key:**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and paste it in your `.env` file

#### 3. Set Up Frontend

```bash
# Navigate to frontend directory
cd ../frontend/vite-project

# Install dependencies
npm install
```

#### 4. Start MongoDB

**Option A: Local MongoDB Installation**

```bash
# Start MongoDB service
mongod

# Or on Windows (if installed as a service)
net start MongoDB
```

**Option B: MongoDB Atlas (Cloud)**

1. Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `MONGODB_URI` in your `.env` file

#### 5. Start the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend/vite-project
npm run dev
```

#### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🛠️ Development Setup

### Backend Development

```bash
cd server

# Install development dependencies
npm install --save-dev nodemon

# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Check code quality
npm run lint
```

### Frontend Development

```bash
cd frontend/vite-project

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

## 📱 Usage Guide

### Recording Voice Notes

1. **Start Recording**: Click the "Start Recording" button
2. **Speak Clearly**: Ensure good microphone quality and clear speech
3. **Stop Recording**: Click "Stop Recording" when finished
4. **Review Transcript**: Check the auto-generated transcript
5. **Edit if Needed**: Modify the transcript text as required
6. **Save Note**: Click "Save Transcript" to store your note

### Managing Notes

- **View All Notes**: See all your notes in the left panel
- **Edit Notes**: Click the "Edit" button to modify transcripts
- **Generate Summary**: Use "Generate Summary" to create AI-powered summaries
- **Delete Notes**: Remove unwanted notes with the "Delete" button
- **Search & Filter**: Organize notes by date, title, or content

### AI Summarization

1. **Select a Note**: Choose a note with sufficient transcript content
2. **Generate Summary**: Click "Generate Summary" button
3. **AI Processing**: Wait for Gemini AI to process your content
4. **Review Summary**: Check the generated summary
5. **Save Changes**: The summary is automatically saved

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | 5000 | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | - | Yes |
| `CORS_ORIGIN` | Allowed frontend origin | - | Yes |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notes` | Get all notes |
| `POST` | `/api/notes` | Create new note |
| `GET` | `/api/notes/:id` | Get specific note |
| `PUT` | `/api/notes/:id` | Update note |
| `DELETE` | `/api/notes/:id` | Delete note |
| `POST` | `/api/notes/:id/summarize` | Generate AI summary |

## 🚀 Deployment

### Backend Deployment (Heroku)

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set GEMINI_API_KEY=your_gemini_api_key
heroku config:set JWT_SECRET=your_jwt_secret

# Deploy
git push heroku main
```

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=process.env.PORT
MONGODB_URI=your_production_mongodb_uri
GEMINI_API_KEY=your_production_gemini_api_key
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error

```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
- Ensure MongoDB is running: `mongod`
- Check if MongoDB service is started
- Verify connection string in `.env` file

#### 2. Gemini API Key Error

```bash
Error: Invalid API key
```

**Solution:**
- Verify your API key in the `.env` file
- Check if the key has proper permissions
- Ensure the key is not expired

#### 3. Port Already in Use

```bash
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
- Change port in `.env` file
- Kill process using the port: `npx kill-port 5000`
- Use different port: `PORT=5001`

#### 4. Frontend Build Errors

```bash
Error: Module not found
```

**Solution:**
- Clear node_modules: `rm -rf node_modules`
- Reinstall dependencies: `npm install`
- Check import paths in components

### Performance Optimization

- **Enable Gzip compression** on your server
- **Use CDN** for static assets
- **Implement caching** for API responses
- **Optimize images** and media files
- **Enable browser caching**

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent summarization
- **React Team** for the amazing frontend framework
- **Node.js Community** for the robust backend runtime
- **MongoDB** for the flexible database solution
- **Vite** for the fast build tool

## 📞 Support

If you encounter any issues or have questions:

- **Create an issue** on GitHub
- **Check the documentation** above
- **Review troubleshooting** section
- **Contact the maintainers**

## 🔮 Future Features

- [ ] **Voice Commands**: Control the app with voice
- [ ] **Multi-language Support**: Transcribe in multiple languages
- [ ] **Collaborative Notes**: Share notes with team members
- [ ] **Advanced Analytics**: Note insights and patterns
- [ ] **Mobile App**: Native iOS and Android applications
- [ ] **Offline Support**: Work without internet connection
- [ ] **Export Options**: PDF, Word, and other formats
- [ ] **Integration**: Connect with other productivity tools

---

**Made with ❤️ by the Voice Notes AI Team**

*Last updated: January 2025*
