# 로컬 환경 설정 가이드

## 1. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env
```

.env 파일을 열어서 다음과 같이 수정하세요:

```bash
# 최소 필수 설정
DATABASE_URL=postgresql://username:password@localhost:5432/piyakast_db
SESSION_SECRET=your-super-secret-session-key-at-least-32-characters-long
NODE_ENV=development
PORT=5000
```

## 2. PostgreSQL 데이터베이스 설정

로컬에 PostgreSQL을 설치하고 데이터베이스를 생성하세요:

```bash
# PostgreSQL 설치 (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL 서비스 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 데이터베이스 생성
sudo -u postgres psql
CREATE DATABASE piyakast_db;
CREATE USER piyakast_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE piyakast_db TO piyakast_user;
\q
```

## 3. 의존성 설치 및 실행

```bash
# 의존성 설치
npm install

# 데이터베이스 스키마 생성
npm run db:push

# 개발 서버 실행
npm run dev
```

## 4. Replit 환경에서 실행하는 경우

Replit에서는 환경 변수가 자동으로 설정되므로 .env 파일이 필요 없습니다.
단순히 다음 명령어만 실행하면 됩니다:

```bash
npm run dev
```

## 문제 해결

### Path 에러가 발생하는 경우

1. .env 파일이 제대로 생성되었는지 확인
2. DATABASE_URL이 올바른 형식으로 설정되었는지 확인
3. PostgreSQL 서버가 실행 중인지 확인

### 연결 에러가 발생하는 경우

1. PostgreSQL 서비스 상태 확인: `sudo systemctl status postgresql`
2. 데이터베이스 연결 정보 확인
3. 방화벽 설정 확인

## 추가 옵션 설정

소셜 로그인을 사용하려면 .env 파일에 다음을 추가하세요:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Kakao OAuth  
KAKAO_CLIENT_ID=your-kakao-client-id

# Naver OAuth
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
```

## 주의사항

- .env 파일은 Git에 커밋하지 마세요
- SESSION_SECRET은 반드시 32자 이상의 강력한 키를 사용하세요
- 프로덕션 환경에서는 더 강력한 보안 설정을 적용하세요