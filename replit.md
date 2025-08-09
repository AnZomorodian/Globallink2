# Overview

Globalink is a comprehensive professional communication platform built with React frontend and Express backend. Users register with a username and receive a unique Voice ID to make calls to other users. The application features real-time WebSocket communication for call signaling, WebRTC for high-quality voice/video transmission, comprehensive messaging system with inbox management, customizable ringtones with preview, professional video calling interface with webcam controls, quick actions for favorite contacts, user presence indicators, and a modern UI with shadcn/ui components. All user data persists in localStorage with in-memory storage for development.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: React hooks with @tanstack/react-query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: Custom WebSocket hook for bidirectional communication with the server

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful endpoints for user management and call operations
- **Real-time Features**: WebSocket server for live call signaling and user presence
- **Build System**: ESBuild for production bundling with development hot-reload via Vite middleware

## Data Storage
- **Database**: PostgreSQL with connection via Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema**: Two main tables - users (with username, displayName, voiceId) and calls (with caller/recipient relationships and call status)
- **Development Storage**: In-memory storage fallback for development environments

## Authentication & Session Management
- **User Registration**: Simple username/display name registration without passwords
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Identification**: Unique Voice IDs generated for each user (format: VC-XXXX)

## Call Management System
- **Call States**: Multi-state call flow (calling, ringing, connected, ended, missed)
- **Real-time Signaling**: WebSocket messages for call initiation, acceptance, and termination
- **WebRTC Voice Calls**: Peer-to-peer voice communication with echo cancellation and noise suppression
- **Call Controls**: Mute/unmute functionality, call duration tracking, and call termination
- **Call History**: Persistent storage of all call attempts with timestamps and duration tracking
- **User Presence**: Real-time online/offline status tracking

## User Management & Settings
- **Data Persistence**: User information stored in browser localStorage for session continuity
- **Settings Panel**: User settings dialog with account information and logout functionality
- **Voice ID Management**: Easy copying of Voice ID with visual feedback
- **User Avatar System**: Dynamic gradient avatars based on user initials

# External Dependencies

- **WebRTC**: Browser WebRTC APIs for peer-to-peer voice communication
- **STUN Servers**: Google STUN servers for NAT traversal in voice calls
- **UI Components**: Radix UI primitives for accessible, unstyled components
- **Styling**: Tailwind CSS for utility-first styling approach
- **Icons**: Lucide React for consistent iconography
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Development Tools**: Replit-specific plugins for development environment integration
- **Build Tools**: PostCSS and Autoprefixer for CSS processing

# Recent Updates (August 2025)

## Major Bug Fixes and Simplifications
- ✅ **Fixed Authentication Crashes**: Resolved white page issues after signup by fixing TypeScript errors and simplifying auth flow
- ✅ **Streamlined Registration**: Default to signup mode and simplified login/signup toggling for better user experience  
- ✅ **Fixed QuickActions Component**: Resolved PresenceService crashes by adding missing methods and removing broken dependencies
- ✅ **Enhanced Form Validation**: Fixed form input issues and improved error handling across all authentication flows
- ✅ **Improved Error Handling**: Added comprehensive error boundaries and graceful fallbacks for better stability
- ✅ **Country Restrictions**: Limited phone number support to Iran, Italy, China, and Turkey only as requested
- ✅ **Code Language**: Ensured all code, comments, and variables are in English language only
- ✅ **Documentation Update**: Created comprehensive README.md with installation, usage, and architecture details

## Latest Features (August 2025)
- ✅ **Removed Quick Actions**: Completely removed Quick Actions section per user request
- ✅ **Real-time Activity Feed**: Activity feed now shows real user activities without sample data, refreshes every 30 seconds
- ✅ **Real User Statistics**: Online user counts and statistics now pull from actual user data via API
- ✅ **Messenger-style Direct Messaging**: Added Facebook Messenger-style chat interface with real-time messaging
- ✅ **Enhanced WebRTC Permissions**: Added comprehensive webcam and microphone permission handling for Chrome browsers
- ✅ **Professional Video Calling**: Improved video call interface with proper media device permission requests

# Previous Updates (January 2025)

- ✅ **WebRTC Voice Calling**: Added real peer-to-peer voice communication with echo cancellation and noise suppression
- ✅ **User Data Persistence**: Implemented localStorage-based user session management
- ✅ **Advanced Settings Panel**: Full user profile management with profile images, email, phone, company info, and job title
- ✅ **Enhanced Audio Controls**: Mute/unmute microphone and deafen/undeafen remote audio functionality
- ✅ **Call Ringtones**: Generated audio ringtones for incoming/outgoing calls with connection/disconnection sounds
- ✅ **Improved Call History**: Shows contact information and avatars for all participants in call history
- ✅ **Professional Footer**: Added team branding with social media links (Discord, Telegram, GitHub)
- ✅ **Multi-country Phone Support**: Country code selector with flags for international phone numbers
- ✅ **Profile Image Upload**: Users can upload and manage profile pictures with avatar fallbacks
- ✅ **App Rebranding**: Changed from VoiceConnect to Globalink throughout the application
- ✅ **Auto-hide Notifications**: Toast notifications automatically disappear after 3 seconds
- ✅ **Profile Image Sync**: Profile picture changes in settings immediately reflect in main page header
- ✅ **Video Calling Foundation**: Added video call toggle functionality integrated with WebRTC service
- ✅ **Real-time Messaging**: Created comprehensive messaging panel for direct user communication
- ✅ **Modal Behavior Enhancement**: Call popup modal prevents accidental closure on background clicks
- ✅ **Customizable Ringtones**: Added 3 different ringtone options (Default, Modern, Soft) in user settings with preview functionality
- ✅ **Enhanced Call Controls**: Separate Voice/Video call buttons with messaging option for each contact
- ✅ **Comprehensive Inbox System**: Full message inbox with read/unread status, reply functionality, and message persistence
- ✅ **Video Call Interface**: Professional video calling interface with webcam controls, camera switching, and picture-in-picture
- ✅ **Professional Inbox System**: Complete message inbox with unread counters, reply functionality, and persistent message storage
- ✅ **Enhanced Settings Panel**: Advanced settings including language selection, theme customization, storage management, and comprehensive privacy controls
- ✅ **Real-time Notifications**: Smart notification badges with unread message counts and auto-refresh functionality