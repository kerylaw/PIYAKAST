
# PIYAKast 소스 코드 분석

## 1. 프로젝트 개요

PIYAKast는 실시간 스트리밍과 VOD(주문형 비디오) 서비스를 제공하는 웹 애플리케이션입니다. 사용자는 동영상을 업로드하고, 실시간 방송을 진행하며, 다른 사용자와 소통할 수 있습니다. PeerTube와의 연동을 통해 분산형 비디오 플랫폼의 이점을 활용하며, Stripe를 통한 SuperChat 및 채널 멤버십 기능으로 수익 창출 모델을 갖추고 있습니다.

## 2. 기술 스택

### 2.1. 프론트엔드

- **언어:** TypeScript
- **프레임워크:** React
- **UI 라이브러리:** Shadcn/ui (Radix UI 기반), Tailwind CSS
- **상태 관리:** React Query (`@tanstack/react-query`)
- **라우팅:** wouter
- **폼 관리:** React Hook Form
- **차트:** Recharts
- **기타:** Axios, date-fns, lucide-react

### 2.2. 백엔드

- **언어:** TypeScript
- **프레임워크:** Express.js
- **데이터베이스:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **인증:** Passport.js (Local, Google, Kakao, Naver OAuth)
- **실시간 통신:** WebSocket (ws)
- **결제:** Stripe
- **파일 업로드:** Multer
- **비디오 처리:** PeerTube

### 2.3. 주요 의존성 (`package.json`)

- **`react`, `react-dom`**: 핵심 React 라이브러리
- **`express`**: 백엔드 서버 프레임워크
- **`drizzle-orm`, `@neondatabase/serverless`**: 데이터베이스 ORM 및 드라이버
- **`passport`**: 다양한 인증 전략을 위한 미들웨어
- **`stripe`**: 결제 처리 라이브러리
- **`@tanstack/react-query`**: 서버 상태 관리 및 캐싱
- **`tailwindcss`, `shadcn-ui`**: UI 스타일링 및 컴포넌트
- **`axios`**: HTTP 클라이언트
- **`ws`**: WebSocket 서버 구현
- **`peertube` 관련 (내부 구현)**: PeerTube API와 통신

## 3. 시스템 아키텍처

### 3.1. 디렉토리 구조

```
/
├── client/         # 프론트엔드 (React)
│   ├── src/
│   │   ├── components/ # 재사용 가능한 UI 컴포넌트
│   │   ├── contexts/   # React Context (테마 등)
│   │   ├── hooks/      # 커스텀 훅 (인증 등)
│   │   ├── lib/        # 유틸리티 및 라이브러리 설정
│   │   └── pages/      # 페이지별 컴포넌트
├── server/         # 백엔드 (Express)
│   ├── auth.ts       # 인증 (Passport.js) 설정
│   ├── db.ts         # 데이터베이스 (Drizzle) 설정
│   ├── index.ts      # Express 서버 진입점
│   ├── routes.ts     # API 라우트 정의
│   ├── peertube.ts   # PeerTube 클라이언트
│   └── streamMonitor.ts # 스트림 상태 모니터링
├── shared/         # 클라이언트/서버 공유 코드
│   └── schema.ts     # Drizzle 스키마 및 Zod 유효성 검사
└── public/         # 정적 파일
```

### 3.2. 데이터베이스 스키마 (`shared/schema.ts`)

Drizzle ORM을 사용하여 PostgreSQL 데이터베이스 스키마를 정의합니다. 주요 테이블은 다음과 같습니다.

- **`users`**: 사용자 정보, 역할(user, admin, creator), 인증 제공자(email, google 등) 정보 저장
- **`videos`**: VOD 동영상 정보, PeerTube 연동 정보(ID, UUID, URL) 저장
- **`streams`**: 실시간 스트림 정보, PeerTube 연동 정보, 스트림 키, RTMP URL 저장
- **`comments`**: 동영상 댓글 (계층 구조 지원)
- **`chatMessages`**: 실시간 스트림 채팅 메시지
- **`videoLikes`**: 동영상 좋아요/싫어요
- **`follows`**: 사용자 간 팔로우 관계
- **`payments`**: Stripe 결제 트랜잭션 (SuperChat 등)
- **`superchats`**: SuperChat 정보
- **`membershipTiers`, `subscriptions`**: 채널 멤버십 등급 및 구독 정보
- **`advertisers`, `adCampaigns`, `adCreatives`**: 광고 시스템 관련 테이블

Zod를 사용하여 각 테이블에 대한 삽입(insert) 스키마와 유효성 검사 규칙을 정의하여 데이터 무결성을 보장합니다.

### 3.3. 인증 흐름 (`server/auth.ts`)

- **Passport.js**를 사용하여 다양한 인증 전략을 구현합니다.
  - **Local Strategy**: 이메일과 비밀번호 기반 인증
  - **OAuth Strategies**: Google, Kakao, Naver를 통한 소셜 로그인
- `express-session`과 `connect-pg-simple`을 사용하여 세션을 PostgreSQL에 저장합니다.
- 비밀번호는 `crypto` 모듈의 `scrypt`를 사용하여 안전하게 해시 처리됩니다.
- `/api/register`, `/api/login`, `/api/logout` 등의 엔드포인트를 제공합니다.
- `requireAuth` 미들웨어를 통해 특정 라우트에 대한 접근을 제어합니다.

## 4. 주요 기능 및 구현

### 4.1. 실시간 스트리밍

- **스트림 생성**: 사용자가 스트림 정보를 입력하면 백엔드는 PeerTube API를 호출하여 라이브 스트림을 생성하고, RTMP URL과 스트림 키를 받아 데이터베이스에 저장합니다 (`/api/streams`).
- **스트림 상태 관리**:
  - `streamMonitor.ts`에서 주기적으로 스트림의 활성 상태를 확인합니다. WebSocket 하트비트 또는 HTTP 폴백을 통해 스트리머의 연결 상태를 감지하고, 일정 시간 응답이 없으면 스트림을 '종료' 상태로 변경합니다.
  - `LiveStreamViewer` 컴포넌트에서 WebSocket을 통해 실시간으로 시청자 수를 업데이트하고 채팅 메시지를 수신합니다.
- **실시간 채팅**:
  - `LiveChat.tsx` 컴포넌트에서 WebSocket을 사용하여 서버와 실시간으로 메시지를 주고받습니다.
  - 서버(`routes.ts`)는 WebSocket 연결을 관리하고, 특정 스트림 ID를 기준으로 메시지를 브로드캐스팅합니다.

### 4.2. VOD (동영상 업로드 및 시청)

- **동영상 업로드**:
  - `UploadModal.tsx` 컴포넌트에서 파일 업로드를 처리합니다.
  - 백엔드(`routes.ts`)는 `multer`를 사용하여 파일을 수신하고, `peertube.ts`의 `PeerTubeClient`를 통해 PeerTube 인스턴스에 업로드합니다.
  - PeerTube 업로드에 실패할 경우, 로컬 서버에 임시 저장하는 폴백 로직이 구현되어 있습니다.
- **동영상 시청**:
  - `VideoWatch.tsx` 페이지에서 동영상 정보를 불러오고, `VideoPlayer.tsx` 컴포넌트를 통해 재생합니다.
  - PeerTube에 업로드된 영상은 `embedUrl`을 통해 임베드 플레이어로 재생됩니다.
  - 조회수, 좋아요/싫어요, 댓글 등의 상호작용을 처리하는 API가 구현되어 있습니다.

### 4.3. 수익 창출 (SuperChat 및 멤버십)

- **SuperChat**:
  - `SuperChatModal.tsx`에서 사용자가 금액과 메시지를 입력하면, 백엔드에 Stripe `PaymentIntent` 생성을 요청합니다 (`/api/superchat/payment-intent`).
  - 클라이언트에서 결제가 완료되면, 백엔드는 해당 결제를 검증하고 SuperChat 메시지를 생성하여 WebSocket을 통해 실시간으로 모든 시청자에게 브로드캐스팅합니다.
- **채널 멤버십**:
  - `ChannelMembership.tsx` 페이지에서 채널의 멤버십 등급을 확인하고 가입할 수 있습니다.
  - `schema.ts`에 `membershipTiers`, `subscriptions` 등 멤버십 관련 테이블이 정의되어 있어, 등급별 혜택 및 구독자 관리가 가능합니다.

### 4.4. 프론트엔드 아키텍처

- **컴포넌트 기반 구조**: `components/` 디렉토리에는 `Header`, `Sidebar`, `VideoCard` 등 재사용 가능한 컴포넌트가 위치합니다. `pages/` 디렉토리에는 각 라우트에 해당하는 페이지 레벨 컴포넌트가 있습니다.
- **상태 관리**: React Query를 사용하여 서버 상태(API 데이터)를 효율적으로 관리합니다. API 요청, 캐싱, 재요청 등의 로직을 추상화하여 코드 복잡성을 줄입니다.
- **인증 상태**: `useAuth` 커스텀 훅을 통해 전역적으로 사용자의 인증 상태를 관리하고, 로그인된 사용자 정보를 쉽게 가져올 수 있습니다.
- **UI**: Tailwind CSS와 Shadcn/ui를 사용하여 일관되고 현대적인 UI를 구축합니다. `ThemeProvider`를 통해 다크/라이트 모드를 지원합니다.

## 5. 결론

PIYAKast는 TypeScript 기반의 풀스택 애플리케이션으로, React와 Express.js를 사용하여 견고하게 구축되었습니다. PeerTube와 Stripe 연동을 통해 핵심적인 비디오 스트리밍 및 수익화 기능을 구현했으며, Drizzle ORM과 Zod를 통한 강력한 타입 안정성 및 데이터 유효성 검증이 돋보입니다. WebSocket을 활용한 실시간 기능과 React Query를 통한 효율적인 상태 관리는 사용자 경험을 향상시키는 주요 요소입니다.
