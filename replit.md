# StreamHub - Live Streaming and VOD Platform

## Overview

StreamHub is a comprehensive video streaming platform that combines live streaming capabilities with Video on Demand (VOD) features, similar to Twitch and YouTube. The platform enables content creators to broadcast live streams, upload videos, and build communities through real-time chat interactions. Users can discover content, follow creators, engage through comments and likes, and participate in live chat sessions.

The application is built as a full-stack web platform with modern technologies, focusing on real-time interactions, scalable video delivery, and user engagement features including authentication, content management, and social interactions.

## Recent Changes (January 2025)

✓ Created detailed pages for content discovery:
  - Trending page: Shows trending videos and live streams sorted by popularity
  - Live Now page: Displays all current live streams with real-time viewer counts
  - Videos page: Browse all videos with search, filtering, and sorting options
  - Category pages: Dedicated pages for K-Beauty, K-Pop, K-Drama, K-Movie, and K-Food content

✓ Updated navigation:
  - Changed categories to Korean-themed: K-Beauty, K-Pop, K-Drama, K-Movie, K-Food
  - Added routing for all new detail pages with proper icons and colors
  - Implemented responsive category browsing with tabs for videos and live streams

✓ Enhanced content filtering:
  - Search functionality across video titles and creator names
  - Category-based filtering and sorting options
  - Real-time statistics for each category (video count, live streams, total views)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with **React 18** using **TypeScript** for type safety. The architecture follows a component-based approach with:

- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Tailwind CSS with shadcn/ui components for consistent, accessible design
- **Form Handling**: React Hook Form with Zod validation schemas
- **Real-time Communication**: Native WebSocket API for live chat functionality

The frontend uses a layered component structure with shared UI components, page-specific components, and custom hooks for authentication and data fetching.

### Backend Architecture
The server is built with **Node.js** and **Express.js** following RESTful API principles:

- **API Design**: RESTful endpoints for CRUD operations on users, videos, streams, comments, and chat messages
- **File Upload**: Multer middleware for handling video file uploads with type validation and size limits (2GB)
- **WebSocket Integration**: WebSocket server for real-time chat functionality during live streams
- **Middleware**: Custom logging, error handling, and request processing middleware

### Authentication & Authorization
The application uses **Replit's OpenID Connect (OIDC)** authentication system:

- **Session Management**: PostgreSQL-backed session storage with connect-pg-simple
- **User Management**: Automatic user creation and profile management through OIDC claims
- **Security**: HTTP-only cookies, secure session handling, and CSRF protection

### Database Design
**PostgreSQL** database with **Drizzle ORM** for type-safe database operations:

- **Users**: Profile information, authentication data, and metadata
- **Videos**: VOD content with metadata, view counts, and categorization
- **Streams**: Live streaming sessions with viewer counts and status tracking
- **Comments**: Video comments with user relationships and timestamps
- **Chat Messages**: Real-time chat messages linked to live streams
- **Social Features**: Video likes and user follow relationships
- **Sessions**: Secure session storage for authentication

The schema uses UUID primary keys, proper foreign key relationships, and includes indexes for performance optimization.

### Real-time Features
**WebSocket implementation** for live streaming interactions:

- **Live Chat**: Real-time messaging during streams with user authentication
- **Viewer Count**: Real-time updates of concurrent viewers
- **Stream Status**: Live updates of stream availability and metadata

### File Storage & Media Handling
**Local file storage** with plans for cloud integration:

- **Video Uploads**: Local storage with file type validation (MP4, AVI, MOV)
- **Thumbnails**: Image storage for video previews
- **File Management**: Organized directory structure with cleanup capabilities

## External Dependencies

### Database Services
- **PostgreSQL**: Primary database for all application data
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling

### Authentication Services
- **Replit OIDC**: OpenID Connect authentication provider for user management
- **Session Storage**: PostgreSQL-backed session management

### Frontend Libraries
- **React**: Core UI framework with TypeScript support
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components for accessibility
- **shadcn/ui**: Pre-built component library

### Development & Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast JavaScript bundler for production builds

### Styling & UI
- **PostCSS**: CSS processing with Tailwind CSS
- **Autoprefixer**: CSS vendor prefix management
- **Lucide React**: Icon library for consistent iconography

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional CSS class management
- **nanoid**: Unique ID generation
- **memoizee**: Function memoization for performance