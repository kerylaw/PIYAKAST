# PIYAKAST 프로젝트 분석 보고서

## 1. 프로젝트 개요 (Project Overview)

이 프로젝트는 **PIYAKAST**라는 이름의 실시간 동영상 및 라이브 스트리밍 플랫폼입니다. 사용자들은 자신의 채널을 통해 VOD(주문형 비디오)를 업로드하거나, 실시간으로 라이브 방송을 진행할 수 있습니다. 유튜브와 유사한 기능을 목표로 하며, 채널 구독, 멤버십, 슈퍼챗, 광고 등 다양한 소셜 및 수익화 기능을 포함하고 있습니다.

- **주요 기능**: VOD 업로드 및 스트리밍, 실시간 라이브 스트리밍, 사용자 인증, 채널 관리, 댓글, 좋아요, 구독, 멤버십, 슈퍼챗, 광고, 플레이리스트, 저작권 관리
- **타겟 사용자**: 콘텐츠 크리에이터, 일반 시청자, 광고주, 플랫폼 관리자

## 2. 기술 스택 (Technology Stack)

프로젝트는 모던 웹 기술을 기반으로 한 풀스택 애플리케이션으로 구성되어 있습니다.

- **공통 (Common)**
  - **Build Tool**: Vite
  - **Language**: TypeScript
  - **Package Manager**: npm

- **프론트엔드 (Client)**
  - **Framework**: React
  - **UI Library**: [shadcn/ui](https://ui.shadcn.com/), Tailwind CSS
  - **Routing**: wouter
  - **State Management/Data Fetching**: TanStack Query
  - **Form Management**: React Hook Form with Zod resolver

- **백엔드 (Server)**
  - **Framework**: Express.js
  - **Database ORM**: Drizzle ORM
  - **Authentication**: Passport.js (Local, Google, Naver, Kakao)
  - **Real-time Communication**: WebSockets (`ws` library)
  - **Session Management**: `express-session` with `connect-pg-simple` (Production) or `memorystore` (Development)

- **데이터베이스 (Database)**
  - **Type**: PostgreSQL
  - **Provider**: Neon (Serverless Postgres)

- **인프라 및 외부 서비스 (Infrastructure & Services)**
  - **Video/File Storage**: Google Cloud Storage (GCS), PeerTube
  - **Live Streaming**: RTMP 서버 (예: `nginx-rtmp`) 연동을 가정하고 설계됨.

## 3. 프로젝트 구조 (Project Structure)

프로젝트는 `client`, `server`, `shared` 세 개의 주요 디렉토리로 구성된 모노레포 스타일의 구조를 가집니다.

- **/client**: 프론트엔드 React 애플리케이션
  - `src/components`: 헤더, 사이드바, 비디오 카드 등 재사용 가능한 UI 컴포넌트.
    - `ui/`: shadcn/ui를 통해 생성된 기본 UI 컴포넌트 (Button, Card, Dialog 등).
  - `src/pages`: 라우팅에 따라 렌더링되는 페이지 컴포넌트 (Home, Studio, AdminPage, VideoWatch 등).
  - `src/hooks`: `useAuth` 등 인증 및 공통 로직을 처리하는 커스텀 훅.
  - `src/lib`: TanStack Query 클라이언트 설정, `cn` 유틸리티 함수 등.
  - `App.tsx`: `wouter`를 사용한 메인 라우팅 설정.
  - `main.tsx`: React 애플리케이션의 진입점.

- **/server**: 백엔드 Express.js API 서버
  - `index.ts`: 서버의 메인 진입점. Express 앱 설정, 세션, Passport 미들웨어 초기화 및 Vite 연동.
  - `routes.ts`: API 엔드포인트를 정의하는 메인 라우터. (예: `/api/videos`, `/api/upload`, `/auth/google`).
  - `auth.ts`: Passport.js를 사용한 로컬 및 소셜(Google, Naver, Kakao) 인증 전략 설정.
  - `db.ts`: Drizzle ORM과 Neon 데이터베이스 연결을 설정.
  - `storage.ts`: Google Cloud Storage 파일 업로드 및 서명된 URL 생성 로직.
  - `peertube.ts`: PeerTube 인스턴스와의 연동(업로드, 조회) 로직.
  - `streamMonitor.ts`: WebSocket 서버를 설정하고 스트림의 시작/종료 상태를 관리.

- **/shared**: 클라이언트와 서버 간에 공유되는 코드
  - `schema.ts`: Drizzle ORM을 사용하여 전체 데이터베이스 테이블(users, videos, comments 등)의 스키마를 정의. 타입 안정성을 위해 프론트엔드와 백엔드에서 모두 참조.

## 4. 주요 기능 분석 (Key Feature Analysis)

- **사용자 인증**: `server/auth.ts`에서 Passport.js를 통해 다양한 인증 방식을 제공합니다. `users` 테이블의 `provider` 컬럼으로 어떤 방식으로 가입했는지 구분합니다.
- **VOD 업로드**: `server/routes.ts`의 `/api/upload` 엔드포인트에서 처리합니다. `multer`로 파일을 메모리에 받은 후, `usePeerTube` 요청 값에 따라 `server/storage.ts` (GCS) 또는 `server/peertube.ts`를 호출하여 비디오를 저장합니다.
- **라이브 스트리밍**:
  - `/api/livestreams`에서 방송 정보를 생성하고 RTMP 주소와 스트림 키를 발급합니다.
  - `server/streamMonitor.ts`는 RTMP 서버로부터의 웹훅(예: on_publish, on_publish_done)을 수신하여 `live_streams` 테이블의 상태(`pending`, `live`, `ended`)를 업데이트하는 역할을 가정합니다. (현재는 웹훅 로직이 모의(mock) 형태로 구현되어 있습니다.)
  - 클라이언트는 WebSocket에 연결하여 실시간 채팅이나 스트림 상태 변경을 수신합니다.
- **데이터베이스 스키마**: `shared/schema.ts`에 프로젝트의 모든 데이터 모델이 상세하게 정의되어 있습니다. 사용자, 비디오, 라이브 스트림뿐만 아니라 광고, 저작권, 멤버십 등 확장성 높은 기능들을 위한 테이블들이 준비되어 있습니다.

## 5. 결론 및 제언 (Conclusion & Recommendations)

- **강점**:
  - **현대적인 기술 스택**: React, TypeScript, Drizzle, Serverless DB 등 최신 기술을 사용하여 유지보수성과 개발 효율성이 높습니다.
  - **잘 구조화된 스키마**: `shared/schema.ts`에 정의된 데이터베이스 스키마는 플랫폼의 다양한 기능을 체계적으로 지원하도록 설계되었습니다.
  - **높은 확장성**: PeerTube, GCS 등 여러 스토리지 옵션을 제공하고, 광고 및 멤버십과 같은 수익 모델을 초기부터 고려하여 설계되었습니다.

- **개선 제안**:
  - **PeerTube 채널 ID 동적 할당**: `server/routes.ts`의 업로드 로직에서 PeerTube 채널 ID가 하드코딩되어 있습니다. 이를 사용자별로 동적으로 할당하는 로직이 필요합니다.
  - **RTMP 서버 웹훅 연동**: `server/streamMonitor.ts`의 스트림 상태 변경 로직은 현재 시뮬레이션으로 되어 있습니다. 실제 `nginx-rtmp` 같은 RTMP 서버의 `on_publish`, `on_publish_done` 웹훅과 연동하여 자동으로 스트림 상태를 업데이트하는 기능 구현이 필요합니다.
  - **API 테스트 코드**: 중요 API 엔드포인트에 대한 테스트 코드를 작성하여 코드 변경 시 안정성을 확보하는 것을 권장합니다.
  - **환경 변수 관리**: `.env.example` 파일에 명시된 모든 환경 변수(특히 외부 서비스 API 키)가 올바르게 설정되었는지 확인하는 시작 스크립트를 추가하면 배포 시 실수를 줄일 수 있습니다.
