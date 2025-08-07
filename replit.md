# StreamHub - Live Streaming and VOD Platform

## Overview

StreamHub is a comprehensive video streaming platform that combines live streaming capabilities with Video on Demand (VOD) features, similar to Twitch and YouTube. The platform enables content creators to broadcast live streams, upload videos, and build communities through real-time chat interactions. Users can discover content, follow creators, engage through comments and likes, and participate in live chat sessions.

The application is built as a full-stack web platform with modern technologies, focusing on real-time interactions, scalable video delivery, and user engagement features including authentication, content management, and social interactions.

## Recent Changes (January 2025)

✓ **PeerTube 통합 시스템 구현 및 네트워크 이슈 해결 (2025-01-07)**:
  - PeerTube API 클라이언트 완전 구현 (OAuth 2.0 인증, 비디오 업로드, 라이브 스트리밍)
  - 하이브리드 비디오 시스템: PeerTube 우선, 로컬 백업
  - 데이터베이스 스키마 확장: PeerTube 메타데이터 필드 추가
  - PeerTubeEmbed 컴포넌트: 임베드 비디오 플레이어
  - LiveStreamSetup 컴포넌트: OBS Studio 통합 가이드
  - 기존 코드 완전 백업 및 보존
  - Replit 환경 네트워크 제한으로 인한 PeerTube 연결 이슈: 백그라운드 재시도 시스템 구현

✓ **완전한 인증 시스템 구현 (2025-01-07)**:
  - Replit 인증 완전 제거 및 독립적인 인증 시스템 구축
  - 이메일/비밀번호 로그인 및 회원가입 기능
  - Google, Kakao, Naver 소셜 로그인 통합 (OAuth 2.0)
  - PostgreSQL 세션 저장소와 보안 강화된 사용자 관리
  - 사용자 친화적인 한국어 인증 페이지 구현

✓ **YouTube 스타일 상호작용 기능**:
  - 댓글 시스템: 좋아요/싫어요, 답글, 모더레이터 기능, 댓글 고정/하트
  - 실시간 라이브 채팅: WebSocket 기반 실시간 메시징
  - 슈퍼챗 후원 시스템: 5단계 금액별 하이라이트 메시지 (1,000원~50,000원)
  - 모더레이터 도구: 채팅 관리 및 댓글 관리 기능

✓ **데이터베이스 스키마 확장**:
  - 댓글, 채팅 메시지, 슈퍼챗, 구독, 좋아요 테이블 추가
  - 사용자 테이블 확장 (소셜 로그인 지원, 프로필 정보)
  - 세션 관리 테이블 및 인덱스 최적화

✓ **이전 콘텐츠 발견 기능**:
  - Trending page: Shows trending videos and live streams sorted by popularity
  - Live Now page: Displays all current live streams with real-time viewer counts
  - Videos page: Browse all videos with search, filtering, and sorting options
  - Category pages: Dedicated pages for K-Beauty, K-Pop, K-Drama, K-Movie, and K-Food content

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
**Hybrid PeerTube + Local file storage**:

- **PeerTube Integration**: Primary video hosting with OAuth 2.0 authentication
- **Video Uploads**: PeerTube API upload with local fallback for reliability
- **Live Streaming**: PeerTube RTMP with OBS Studio integration
- **Thumbnails**: PeerTube automatic thumbnail generation
- **Embed System**: PeerTube iframe embed with JavaScript API
- **File Management**: Automatic cleanup of local files after successful PeerTube upload

## External Dependencies

### Database Services
- **PostgreSQL**: Primary database for all application data
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling

### Video Services
- **PeerTube**: Self-hosted decentralized video platform for upload and streaming
- **PeerTube API**: OAuth 2.0 authenticated video management and live streaming
- **PeerTube Embed**: JavaScript API for embedded video players

### Authentication Services
- **Local Authentication**: Email/password with bcrypt hashing
- **OAuth Providers**: Google, Kakao, Naver social login integration
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