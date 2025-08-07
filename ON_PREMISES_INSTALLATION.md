# StreamHub - On-Premises 설치 가이드

## 프로젝트 개요

StreamHub는 Twitch와 YouTube의 기능을 결합한 실시간 스트리밍 및 VOD 플랫폼입니다. 한국 엔터테인먼트 테마(K-Beauty, K-Pop, K-Drama, K-Movie, K-Food)를 특징으로 하며, 실시간 채팅, 사용자 인증, 소셜 기능을 제공합니다.

## 기술 스택

### 프론트엔드
- **React 18** + TypeScript
- **Vite** (빌드 도구)
- **Tailwind CSS** + shadcn/ui (스타일링)
- **TanStack Query** (서버 상태 관리)
- **Wouter** (라우팅)
- **React Hook Form** + Zod (폼 처리)
- **WebSocket** (실시간 채팅)

### 백엔드
- **Node.js** + Express.js
- **TypeScript**
- **Drizzle ORM** (타입 안전 데이터베이스 ORM)
- **PostgreSQL** (데이터베이스)
- **WebSocket Server** (실시간 통신)
- **Multer** (파일 업로드)

### 인증 & 보안
- **OpenID Connect** (Replit Auth)
- **PostgreSQL 세션 스토리지**
- **Passport.js**

### 외부 서비스 통합
- **Cloudflare Stream** (라이브 스트리밍)
- **Agora.io** (백업 스트리밍 솔루션)

## 시스템 요구사항

### 서버 최소 사양
- **OS**: Ubuntu 20.04 LTS 이상, CentOS 8 이상, 또는 RHEL 8 이상
- **CPU**: 4코어 이상
- **RAM**: 8GB 이상 (16GB 권장)
- **저장공간**: 100GB 이상 (SSD 권장)
- **네트워크**: 100Mbps 이상 대역폭

### 소프트웨어 요구사항
- **Node.js**: 20.x 이상
- **PostgreSQL**: 14.x 이상
- **Nginx**: 1.18 이상 (프록시 및 정적 파일 서빙)
- **PM2**: 프로세스 관리 (선택사항)

## 설치 과정

### 1단계: 시스템 준비

#### Ubuntu/Debian 기반
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y curl wget git build-essential

# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL 설치
sudo apt install -y postgresql postgresql-contrib

# Nginx 설치
sudo apt install -y nginx

# PM2 설치 (선택사항)
sudo npm install -g pm2
```

#### CentOS/RHEL 기반
```bash
# 시스템 업데이트
sudo dnf update -y

# 필수 패키지 설치
sudo dnf install -y curl wget git gcc-c++ make

# Node.js 20.x 설치
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# PostgreSQL 설치
sudo dnf install -y postgresql postgresql-server postgresql-contrib

# PostgreSQL 초기화
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Nginx 설치
sudo dnf install -y nginx

# PM2 설치 (선택사항)
sudo npm install -g pm2
```

### 2단계: PostgreSQL 설정

```bash
# PostgreSQL 사용자 전환
sudo -u postgres psql

# 데이터베이스 및 사용자 생성
CREATE DATABASE streamhub;
CREATE USER streamhub_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE streamhub TO streamhub_user;
ALTER USER streamhub_user CREATEDB;
\q

# PostgreSQL 설정 (필요시)
sudo nano /etc/postgresql/14/main/postgresql.conf
# listen_addresses = 'localhost'
# port = 5432

sudo nano /etc/postgresql/14/main/pg_hba.conf
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5

# PostgreSQL 재시작
sudo systemctl restart postgresql
```

### 3단계: 애플리케이션 배포

```bash
# 애플리케이션 디렉토리 생성
sudo mkdir -p /opt/streamhub
sudo chown $USER:$USER /opt/streamhub
cd /opt/streamhub

# 소스 코드 복사 (Git 클론 또는 파일 복사)
# 예: git clone https://github.com/your-repo/streamhub.git .
# 또는 파일을 직접 복사

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
nano .env
```

### 4단계: 환경 변수 설정

`.env` 파일 생성:
```bash
# 데이터베이스 설정
DATABASE_URL="postgresql://streamhub_user:your_secure_password@localhost:5432/streamhub"
PGHOST=localhost
PGPORT=5432
PGUSER=streamhub_user
PGPASSWORD=your_secure_password
PGDATABASE=streamhub

# 세션 보안
SESSION_SECRET="your_very_long_random_session_secret_key_here"

# Replit 인증 (프로덕션에서는 다른 OpenID Connect 제공자 사용)
REPL_ID="your_repl_id"
ISSUER_URL="https://replit.com/oidc"
REPLIT_DOMAINS="your-domain.com"

# Cloudflare Stream (선택사항)
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"

# Agora.io (선택사항)
VITE_AGORA_APP_ID="your_agora_app_id"

# 애플리케이션 설정
NODE_ENV=production
PORT=5000
```

### 5단계: 데이터베이스 스키마 설정

#### 데이터베이스 스키마 생성
```bash
# Drizzle를 사용한 스키마 푸시
npm run db:push
```

#### 수동 SQL 스키마 (백업 방법)
```sql
-- PostgreSQL에 직접 연결
psql -h localhost -U streamhub_user -d streamhub

-- 세션 테이블 (인증 필수)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- 사용자 테이블 (인증 필수)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    username VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 비디오 테이블 (VOD 콘텐츠)
CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR,
    video_url VARCHAR,
    duration INTEGER,
    view_count INTEGER DEFAULT 0,
    category VARCHAR,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 스트림 테이블 (라이브 방송)
CREATE TABLE IF NOT EXISTS streams (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR,
    is_live BOOLEAN DEFAULT false,
    viewer_count INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id VARCHAR NOT NULL REFERENCES videos(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id VARCHAR NOT NULL REFERENCES streams(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 비디오 좋아요/싫어요 테이블
CREATE TABLE IF NOT EXISTS video_likes (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id VARCHAR NOT NULL REFERENCES videos(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 팔로우 테이블
CREATE TABLE IF NOT EXISTS follows (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id VARCHAR NOT NULL REFERENCES users(id),
    following_id VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_is_live ON streams(is_live);
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_stream_id ON chat_messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
```

### 6단계: 애플리케이션 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 파일 확인
ls -la dist/
```

### 7단계: Nginx 설정

`/etc/nginx/sites-available/streamhub` 파일 생성:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 클라이언트 업로드 크기 제한 (비디오 업로드용)
    client_max_body_size 2G;

    # 정적 파일 서빙
    location / {
        root /opt/streamhub/dist/public;
        try_files $uri $uri/ @backend;
    }

    # API 및 WebSocket 백엔드
    location @backend {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 경로
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 업로드된 파일 서빙
    location /uploads/ {
        alias /opt/streamhub/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Nginx 설정 활성화:
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/streamhub /etc/nginx/sites-enabled/

# 기본 사이트 비활성화 (선택사항)
sudo rm /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 8단계: SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

### 9단계: 프로세스 관리 (PM2)

`ecosystem.config.js` 파일 생성:
```javascript
module.exports = {
  apps: [{
    name: 'streamhub',
    script: 'dist/index.js',
    cwd: '/opt/streamhub',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/streamhub/error.log',
    out_file: '/var/log/streamhub/out.log',
    log_file: '/var/log/streamhub/combined.log',
    time: true
  }]
};
```

PM2 시작:
```bash
# 로그 디렉토리 생성
sudo mkdir -p /var/log/streamhub
sudo chown $USER:$USER /var/log/streamhub

# PM2로 애플리케이션 시작
pm2 start ecosystem.config.js

# 시스템 부팅시 자동 시작 설정
pm2 startup
pm2 save
```

### 10단계: 방화벽 설정

```bash
# UFW 설정 (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# firewalld 설정 (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 추가 설정

### 파일 업로드 디렉토리 설정
```bash
# 업로드 디렉토리 생성
mkdir -p /opt/streamhub/uploads/videos
mkdir -p /opt/streamhub/uploads/thumbnails

# 권한 설정
chown -R $USER:$USER /opt/streamhub/uploads
chmod -R 755 /opt/streamhub/uploads
```

### 로그 로테이션 설정
`/etc/logrotate.d/streamhub` 파일 생성:
```
/var/log/streamhub/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 streamhub streamhub
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 백업 스크립트
`/opt/streamhub/scripts/backup.sh` 파일 생성:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/streamhub"
DATE=$(date +%Y%m%d_%H%M%S)

# 디렉토리 생성
mkdir -p $BACKUP_DIR

# 데이터베이스 백업
pg_dump -h localhost -U streamhub_user streamhub > $BACKUP_DIR/db_backup_$DATE.sql

# 파일 백업
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /opt/streamhub/uploads

# 7일 이상 된 백업 파일 삭제
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 모니터링 설정
```bash
# PM2 모니터링 대시보드
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# 시스템 모니터링
pm2 monit
```

## 외부 서비스 설정

### Cloudflare Stream 설정
1. Cloudflare 계정에서 Stream 서비스 활성화
2. API 토큰 생성 (Stream 편집 권한 포함)
3. `.env` 파일에 계정 ID와 API 토큰 추가

### 인증 시스템 변경
프로덕션에서는 Replit Auth 대신 다른 OpenID Connect 제공자 사용:
- Auth0
- Firebase Auth
- AWS Cognito
- Azure AD B2C

## 성능 최적화

### PostgreSQL 튜닝
`/etc/postgresql/14/main/postgresql.conf`:
```
# 메모리 설정 (16GB RAM 기준)
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 64MB

# 연결 설정
max_connections = 200

# 체크포인트 설정
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

### Node.js 최적화
- 클러스터 모드 사용 (PM2)
- 메모리 리미트 설정
- 가비지 컬렉션 튜닝

## 보안 강화

### 데이터베이스 보안
- 방화벽에서 PostgreSQL 포트 제한
- SSL 연결 강제
- 정기적인 보안 업데이트

### 애플리케이션 보안
- HTTPS 강제 사용
- CSP (Content Security Policy) 설정
- Rate limiting 구현
- 입력 검증 강화

## 문제 해결

### 일반적인 문제

1. **데이터베이스 연결 오류**
   - PostgreSQL 서비스 상태 확인
   - 환경 변수 확인
   - 방화벽 설정 확인

2. **파일 업로드 실패**
   - 디스크 공간 확인
   - 권한 확인
   - Nginx 업로드 크기 제한 확인

3. **WebSocket 연결 실패**
   - Nginx 프록시 설정 확인
   - 방화벽 설정 확인

### 로그 확인
```bash
# PM2 로그
pm2 logs streamhub

# Nginx 로그
sudo tail -f /var/log/nginx/error.log

# PostgreSQL 로그
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

## 업데이트 절차

1. 백업 생성
2. 소스 코드 업데이트
3. 의존성 업데이트: `npm install`
4. 빌드: `npm run build`
5. 데이터베이스 마이그레이션: `npm run db:push`
6. 애플리케이션 재시작: `pm2 restart streamhub`

## 라이선스 및 지원

- MIT 라이선스
- 커뮤니티 지원
- 상용 지원 문의

이 가이드는 기본적인 on-premises 설치를 다룹니다. 프로덕션 환경에서는 추가적인 보안, 모니터링, 백업 전략이 필요할 수 있습니다.