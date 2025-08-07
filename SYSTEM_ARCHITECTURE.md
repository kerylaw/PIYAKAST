# PIYAKast - 시스템 아키텍처 문서

## 개요

PIYAKast는 한국 콘텐츠에 특화된 실시간 스트리밍 및 VOD 플랫폼으로, 현대적인 웹 기술을 사용하여 확장 가능하고 안정적인 서비스를 제공합니다.

## 전체 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   클라이언트     │    │      서버       │    │   데이터베이스   │
│   (React SPA)   │◄──►│  (Node.js API)  │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   WebSocket     │              │
         └──────────────►│   (실시간)      │◄─────────────┘
                        └─────────────────┘

                        ┌─────────────────┐
                        │    PeerTube     │
                        │  (동영상 호스팅) │
                        └─────────────────┘
                                │
                        ┌─────────────────┐
                        │   파일 스토리지  │
                        │   (로컬/클라우드) │
                        └─────────────────┘
```

## 기술 스택 세부 구성

### 프론트엔드 (클라이언트)
- **React 18**: 컴포넌트 기반 UI 라이브러리
- **TypeScript**: 타입 안전성 및 개발 생산성
- **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크
- **shadcn/ui**: 접근 가능한 UI 컴포넌트 라이브러리
- **TanStack Query**: 서버 상태 관리 및 캐싱
- **Wouter**: 경량 클라이언트 라우팅
- **Vite**: 빠른 빌드 도구 및 개발 서버

#### 주요 디렉토리 구조
```
client/
├── src/
│   ├── components/        # 재사용 가능한 UI 컴포넌트
│   │   ├── ui/           # shadcn/ui 컴포넌트
│   │   ├── Header.tsx    # 네비게이션 헤더
│   │   ├── Sidebar.tsx   # 사이드바 메뉴
│   │   └── LiveStreamViewer.tsx
│   ├── pages/            # 페이지 컴포넌트
│   │   ├── Home.tsx      # 홈 페이지
│   │   ├── LiveStream.tsx # 라이브 방송 페이지
│   │   ├── VideoWatch.tsx # 동영상 시청 페이지
│   │   └── Category.tsx   # 카테고리별 콘텐츠
│   ├── hooks/            # 커스텀 React 훅
│   │   ├── useAuth.tsx   # 인증 상태 관리
│   │   └── use-toast.ts  # 토스트 알림
│   ├── contexts/         # React Context
│   │   └── ThemeContext.tsx
│   └── lib/              # 유틸리티 라이브러리
│       ├── queryClient.ts # API 클라이언트 설정
│       └── utils.ts      # 공통 유틸리티
```

### 백엔드 (서버)
- **Node.js**: JavaScript 런타임 환경
- **Express.js**: 웹 애플리케이션 프레임워크
- **TypeScript**: 타입 안전성
- **WebSocket (ws)**: 실시간 양방향 통신
- **Passport.js**: 인증 미들웨어
- **Multer**: 파일 업로드 처리
- **Drizzle ORM**: 타입 안전한 SQL 쿼리 빌더

#### 주요 디렉토리 구조
```
server/
├── index.ts              # 서버 엔트리 포인트
├── routes.ts             # API 라우트 정의
├── auth.ts               # 인증 로직
├── storage.ts            # 데이터 접근 계층
├── db.ts                 # 데이터베이스 연결
├── vite.ts               # 개발 서버 설정
├── peertube.ts           # PeerTube 통합
└── streamMonitor.ts      # 스트림 모니터링
```

### 데이터베이스
- **PostgreSQL**: 관계형 데이터베이스
- **Drizzle ORM**: 타입 안전한 ORM
- **세션 스토어**: PostgreSQL 기반 세션 관리

#### 데이터베이스 스키마
```sql
-- 사용자 테이블
users (
  id: UUID PRIMARY KEY,
  email: VARCHAR UNIQUE,
  username: VARCHAR UNIQUE,
  password: VARCHAR,
  profile_image_url: VARCHAR,
  provider: VARCHAR,
  created_at: TIMESTAMP
)

-- 동영상 테이블
videos (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  title: TEXT,
  description: TEXT,
  video_url: VARCHAR,
  peertube_uuid: VARCHAR,
  view_count: INTEGER,
  category: VARCHAR,
  created_at: TIMESTAMP
)

-- 라이브 스트림 테이블
streams (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  title: TEXT,
  is_live: BOOLEAN,
  viewer_count: INTEGER,
  category: VARCHAR,
  rtmp_url: VARCHAR,
  stream_key: VARCHAR,
  created_at: TIMESTAMP
)

-- 댓글 테이블
comments (
  id: UUID PRIMARY KEY,
  video_id: UUID REFERENCES videos(id),
  user_id: UUID REFERENCES users(id),
  content: TEXT,
  parent_id: UUID REFERENCES comments(id),
  created_at: TIMESTAMP
)

-- 채팅 메시지 테이블
chat_messages (
  id: UUID PRIMARY KEY,
  stream_id: UUID REFERENCES streams(id),
  user_id: UUID REFERENCES users(id),
  message: TEXT,
  message_type: VARCHAR,
  created_at: TIMESTAMP
)
```

## 핵심 기능 아키텍처

### 1. 인증 시스템

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│ 클라이언트   │    │   Express    │    │   OAuth 제공자  │
│            │    │   서버       │    │ (Google/Kakao)  │
└─────────────┘    └──────────────┘    └─────────────────┘
      │                   │                     │
      │  1. 로그인 요청    │                     │
      ├──────────────────►│                     │
      │                   │  2. OAuth 리다이렉트 │
      │                   ├────────────────────►│
      │  3. 콜백 처리      │                     │
      │◄──────────────────┤◄────────────────────┤
      │                   │                     │
      │  4. JWT/세션 설정  │                     │
      │◄──────────────────┤                     │
```

#### 지원 인증 방식:
- 이메일/비밀번호 로그인
- Google OAuth 2.0
- Kakao OAuth 2.0
- Naver OAuth 2.0

### 2. 실시간 스트리밍 시스템

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│  스트리머    │    │   PIYAKast   │    │    시청자       │
│            │    │   서버       │    │               │
└─────────────┘    └──────────────┘    └─────────────────┘
      │                   │                     │
      │  1. 스트림 생성    │                     │
      ├──────────────────►│                     │
      │                   │  2. WebSocket 연결  │
      │                   │◄───────────────────┤
      │  3. RTMP 스트림    │                     │
      ├──────────────────►│                     │
      │                   │  4. 실시간 채팅     │
      │                   │◄───────────────────►│
      │  5. 하트비트       │                     │
      ├──────────────────►│                     │
```

#### 스트리밍 흐름:
1. 스트리머가 OBS Studio로 RTMP 스트림 송출
2. 서버에서 PeerTube로 스트림 전달
3. 시청자는 PeerTube 임베드 플레이어로 시청
4. WebSocket으로 실시간 채팅 및 상호작용

### 3. 동영상 처리 시스템

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   업로더    │    │   PIYAKast   │    │    PeerTube     │
│            │    │   서버       │    │               │
└─────────────┘    └──────────────┘    └─────────────────┘
      │                   │                     │
      │  1. 파일 업로드    │                     │
      ├──────────────────►│                     │
      │                   │  2. PeerTube 업로드  │
      │                   ├────────────────────►│
      │                   │  3. 인코딩 처리      │
      │                   │◄────────────────────┤
      │  4. 업로드 완료    │                     │
      │◄──────────────────┤                     │
```

### 4. 실시간 채팅 시스템

```
WebSocket 메시지 구조:
{
  type: 'chat_message' | 'super_chat' | 'stream_heartbeat',
  streamId: string,
  userId: string,
  message?: string,
  amount?: number,
  timestamp: Date
}

채팅 메시지 흐름:
1. 클라이언트 → WebSocket → 서버
2. 서버에서 메시지 검증 및 저장
3. 서버 → 모든 연결된 클라이언트로 브로드캐스트
```

### 5. 슈퍼챗 시스템

```sql
super_chats (
  id: UUID PRIMARY KEY,
  stream_id: UUID,
  user_id: UUID,
  message: TEXT,
  amount: INTEGER,
  currency: VARCHAR DEFAULT 'KRW',
  highlight_duration: INTEGER,
  created_at: TIMESTAMP
)
```

#### 슈퍼챗 레벨:
- Bronze (₩1,000): 5초 하이라이트
- Silver (₩5,000): 10초 하이라이트
- Gold (₩10,000): 20초 하이라이트
- Diamond (₩20,000): 30초 하이라이트
- Premium (₩50,000): 60초 하이라이트

## 성능 최적화

### 1. 캐싱 전략
- **TanStack Query**: 클라이언트 사이드 캐싱
- **HTTP 캐시**: 정적 자산 캐싱
- **CDN**: 글로벌 콘텐츠 배포 (권장)

### 2. 데이터베이스 최적화
```sql
-- 인덱스 설정
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_streams_is_live ON streams(is_live);
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_chat_messages_stream_id ON chat_messages(stream_id);
```

### 3. 실시간 통신 최적화
- WebSocket 연결 풀링
- 메시지 버퍼링 및 배치 처리
- 하트비트를 통한 연결 상태 관리

## 보안 고려사항

### 1. 인증 및 권한
- JWT 토큰 기반 인증
- 역할 기반 접근 제어 (RBAC)
- CORS 정책 설정
- Rate Limiting

### 2. 데이터 보안
- 비밀번호 해싱 (bcrypt)
- SQL 인젝션 방지 (Prepared Statements)
- XSS 방지 (Content Security Policy)
- CSRF 토큰

### 3. 파일 업로드 보안
- 파일 형식 검증
- 파일 크기 제한 (2GB)
- 바이러스 스캔 (권장)

## 모니터링 및 로깅

### 1. 애플리케이션 로그
```typescript
// 구조화된 로깅
console.log('🟢 Stream started:', {
  streamId,
  userId,
  timestamp: new Date().toISOString()
});
```

### 2. 성능 모니터링
- WebSocket 연결 수
- 동시 스트림 수
- 데이터베이스 쿼리 성능
- 메모리 사용량

### 3. 에러 트래킹
- 클라이언트 에러 캐치
- 서버 예외 처리
- 데이터베이스 연결 오류

## 확장성 고려사항

### 1. 수평적 확장
- 로드 밸런서 설정
- 다중 서버 인스턴스
- 데이터베이스 읽기 복제본

### 2. 마이크로서비스 분리 (향후)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 사용자 서비스 │  │ 스트림 서비스 │  │ 채팅 서비스   │
└──────────────┘  └──────────────┘  └──────────────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
              ┌──────────────┐
              │ API Gateway  │
              └──────────────┘
```

### 3. 클라우드 배포
- Docker 컨테이너화
- Kubernetes 오케스트레이션
- AWS/GCP/Azure 클라우드 서비스

## 개발 워크플로우

### 1. 개발 환경
```bash
# 개발 서버 시작
npm run dev

# 데이터베이스 스키마 업데이트
npm run db:push

# 타입 체크
npm run check
```

### 2. 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

### 3. 테스팅 전략
- 단위 테스트 (Jest)
- 통합 테스트 (Supertest)
- E2E 테스트 (Playwright)
- API 테스트 (Postman)

## API 엔드포인트 구조

```
/api
├── /auth
│   ├── POST /login
│   ├── POST /register
│   ├── POST /logout
│   └── GET /user
├── /videos
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   └── PUT /:id
├── /streams
│   ├── GET /live
│   ├── POST /
│   ├── GET /:id
│   ├── POST /:id/start
│   └── POST /:id/stop
├── /comments
│   ├── GET /video/:videoId
│   ├── POST /
│   └── DELETE /:id
└── /chat
    ├── GET /stream/:streamId
    └── POST /super-chat
```

## 배포 아키텍처 (프로덕션)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      CDN        │    │   로드 밸런서    │    │   웹 서버       │
│   (Cloudflare)  │◄──►│     (Nginx)     │◄──►│  (Node.js x3)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   데이터베이스   │    │   Redis 캐시    │
                       │  (PostgreSQL)   │    │   (선택사항)    │
                       └─────────────────┘    └─────────────────┘
```

이 아키텍처를 통해 PIYAKast는 안정적이고 확장 가능한 실시간 스트리밍 플랫폼으로 운영될 수 있습니다.