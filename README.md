# Globalink - Professional Communication Platform

A comprehensive voice and video calling platform built with React and Express.js, featuring real-time WebRTC communication, instant messaging, and advanced user management.

## ✨ Features

### 🎯 Core Communication
- **WebRTC Voice & Video Calls** - High-quality peer-to-peer communication with echo cancellation
- **Real-time Messaging** - Instant messaging with inbox management and read receipts  
- **User Presence** - Live online/offline status tracking
- **Call History** - Comprehensive call logs with duration tracking

### 🎨 User Experience
- **Modern UI** - Built with shadcn/ui components and Tailwind CSS
- **Customizable Ringtones** - 3 ringtone options with preview functionality
- **Profile Management** - Full user profiles with images, contact info, and bio
- **Dark/Light Theme** - Responsive design with theme switching

### 🛡️ Authentication & Settings
- **Simple Registration** - Quick signup with username and display name
- **Voice ID System** - Unique identifiers for easy contact sharing (format: VC-XXXX)
- **Settings Panel** - Comprehensive user settings and privacy controls
- **International Support** - Phone number support for Iran, Italy, China, and Turkey

### 🔧 Technical Features
- **Real-time WebSocket** - Live communication and presence tracking
- **In-memory Storage** - Fast development with localStorage persistence
- **TypeScript** - Full type safety across frontend and backend
- **Hot Reload** - Development server with instant updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd globalink
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open http://localhost:5000 in your browser
   - Create an account with username and display name
   - Start making calls using Voice IDs!

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React with Vite build tooling
- **UI Library**: shadcn/ui components on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks + TanStack Query
- **Routing**: Wouter for lightweight client-side routing

### Backend (Express.js + TypeScript)
- **API**: RESTful endpoints for user and call management
- **Real-time**: WebSocket server for live communication
- **Storage**: In-memory storage with localStorage persistence
- **Build**: ESBuild for production bundling

### Communication Stack
- **WebRTC**: Peer-to-peer voice/video with STUN servers
- **WebSocket**: Real-time signaling and presence
- **Audio**: Echo cancellation and noise suppression
- **Video**: Camera controls and picture-in-picture

## 📱 Usage

### Creating an Account
1. Click "Quick Start" on the login page
2. Enter a unique username (3+ characters)
3. Add your display name (2+ characters)
4. Get your Voice ID (format: VC-XXXX)

### Making Calls
1. Enter a recipient's Voice ID in the call field
2. Choose Voice Call or Video Call
3. Wait for the recipient to accept
4. Enjoy high-quality communication!

### Messaging
1. Enter a Voice ID and click Message
2. Send real-time messages
3. Check your inbox for new messages
4. Reply directly from notifications

## 🛠️ Development

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility libraries
├── server/                # Express backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Data storage layer
│   └── vite.ts            # Development server setup
└── shared/                # Shared types and schemas
    └── schema.ts          # Database schema and types
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Built with ❤️ using modern web technologies
- WebRTC implementation for real-time communication
- shadcn/ui for beautiful, accessible components
- Tailwind CSS for responsive design
