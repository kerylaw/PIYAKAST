# StreamHub - Ubuntu Installation Guide

## 시스템 개요

StreamHub는 한국 콘텐츠에 특화된 라이브 스트리밍 및 VOD 플랫폼입니다. Twitch와 YouTube의 기능을 결합하여 실시간 방송, 동영상 업로드, 댓글 시스템, 슈퍼챗, 소셜 인증 등을 제공합니다.

### 주요 기술 스택
- **프론트엔드**: React 18 + TypeScript + Tailwind CSS
- **백엔드**: Node.js + Express.js + TypeScript
- **데이터베이스**: PostgreSQL + Drizzle ORM
- **실시간 통신**: WebSocket
- **인증**: Passport.js (Google, Kakao, Naver OAuth)
- **동영상 처리**: PeerTube 통합 (선택사항)
- **파일 업로드**: Multer
- **세션 관리**: PostgreSQL 기반 세션 스토어

## 시스템 요구사항

### 하드웨어 요구사항
- **최소**: CPU 2코어, RAM 4GB, 디스크 20GB
- **권장**: CPU 4코어, RAM 8GB, 디스크 50GB
- **네트워크**: 안정적인 인터넷 연결

### 소프트웨어 요구사항
- Ubuntu 20.04 LTS 이상 (권장: 22.04 LTS)
- Node.js 18+ (권장: 20.x)
- PostgreSQL 13+
- Git

## 1. 기본 시스템 준비

### 시스템 업데이트
```bash
sudo apt update && sudo apt upgrade -y
```

### 필수 패키지 설치
```bash
sudo apt install -y curl wget git build-essential python3-pip
```

## 2. Node.js 설치

### Node.js 20.x 설치 (권장)
```bash
# NodeSource repository 추가
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js 설치
sudo apt-get install -y nodejs

# 설치 확인
node --version  # v20.x.x 확인
npm --version   # 10.x.x 확인
```

## 3. PostgreSQL 설치 및 설정

### PostgreSQL 설치
```bash
sudo apt install -y postgresql postgresql-contrib
```

### PostgreSQL 서비스 시작
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 데이터베이스 및 사용자 생성
```bash
# PostgreSQL 사용자로 전환
sudo -u postgres psql

-- PostgreSQL 콘솔에서 실행:
CREATE USER streamhub_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE streamhub_db OWNER streamhub_user;
GRANT ALL PRIVILEGES ON DATABASE streamhub_db TO streamhub_user;

-- 확장 기능 활성화 (UUID 생성용)
\c streamhub_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 종료
\q
```

### PostgreSQL 원격 접속 설정 (필요시)
```bash
# PostgreSQL 설정 파일 편집
sudo nano /etc/postgresql/14/main/postgresql.conf

# 다음 라인 수정:
listen_addresses = '*'

# 클라이언트 인증 설정
sudo nano /etc/postgresql/14/main/pg_hba.conf

# 다음 라인 추가:
host    all             all             0.0.0.0/0               md5

# 서비스 재시작
sudo systemctl restart postgresql
```

## 4. 프로젝트 설치

### 저장소 클론
```bash
cd /opt
sudo git clone https://github.com/your-username/streamhub.git
cd streamhub

# 소유권 변경 (선택사항)
sudo chown -R $USER:$USER /opt/streamhub
cd /opt/streamhub
```

### 의존성 설치
```bash
npm install
```

## 5. 환경 변수 설정

### .env 파일 생성
```bash
cp .env.example .env
nano .env
```

### 환경 변수 설정 (.env 파일)
```bash
# 데이터베이스 연결
DATABASE_URL="postgresql://streamhub_user:your_secure_password@localhost:5432/streamhub_db"

# PostgreSQL 개별 설정
PGHOST=localhost
PGPORT=5432
PGUSER=streamhub_user
PGPASSWORD=your_secure_password
PGDATABASE=streamhub_db

# 세션 보안
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# OAuth 설정 (선택사항)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

KAKAO_CLIENT_ID=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret

NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# PeerTube 설정 (선택사항)
PEERTUBE_URL=http://localhost:9000
PEERTUBE_USERNAME=your_peertube_username
PEERTUBE_PASSWORD=your_peertube_password

# 서버 설정
NODE_ENV=production
PORT=5000
```

## 6. 데이터베이스 스키마 생성

### 스키마 Push
```bash
npm run db:push
```

### 연결 테스트
```bash
# PostgreSQL 연결 테스트
psql -h localhost -U streamhub_user -d streamhub_db -c "SELECT version();"
```

## 7. OAuth 인증 설정 (선택사항)

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "APIs & Services" > "Credentials" 이동
4. "Create Credentials" > "OAuth 2.0 Client IDs" 선택
5. 승인된 리디렉션 URI 추가: `http://your-domain.com/auth/google/callback`

### Kakao OAuth
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 등록
3. "제품 설정" > "카카오 로그인" 활성화
4. Redirect URI 설정: `http://your-domain.com/auth/kakao/callback`

### Naver OAuth
1. [Naver Developers](https://developers.naver.com/) 접속
2. 애플리케이션 등록
3. "API 설정" > "네이버 로그인" 설정
4. Callback URL 설정: `http://your-domain.com/auth/naver/callback`

## 8. PeerTube 설정 (선택사항)

StreamHub는 PeerTube와 통합하여 분산형 동영상 호스팅을 지원합니다.

### PeerTube 설치
```bash
# Docker로 PeerTube 설치
curl -sSL https://get.docker.com/ | sh
sudo usermod -aG docker $USER

# docker-compose 설치
sudo apt install -y docker-compose

# PeerTube 설치
git clone https://github.com/Chocobozzz/PeerTube.git
cd PeerTube
cp docker-compose.yml.example docker-compose.yml

# 설정 편집 후 실행
docker-compose up -d
```

## 9. 애플리케이션 빌드 및 실행

### 개발 모드
```bash
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
npm start
```

## 10. 시스템 서비스 설정

### systemd 서비스 파일 생성
```bash
sudo nano /etc/systemd/system/streamhub.service
```

### 서비스 파일 내용
```ini
[Unit]
Description=StreamHub - Live Streaming Platform
After=network.target postgresql.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/opt/streamhub
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 서비스 등록 및 시작
```bash
sudo systemctl daemon-reload
sudo systemctl enable streamhub
sudo systemctl start streamhub

# 상태 확인
sudo systemctl status streamhub
```

## 11. Nginx 웹 서버 설정 (선택사항)

### Nginx 설치
```bash
sudo apt install -y nginx
```

### 설정 파일 생성
```bash
sudo nano /etc/nginx/sites-available/streamhub
```

### Nginx 설정 내용
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
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

    # WebSocket 지원
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 정적 파일 캐싱
    location /assets {
        alias /opt/streamhub/dist/assets;
        expires 1y;
        add_header Cache-Control public;
    }
}
```

### Nginx 설정 활성화
```bash
sudo ln -s /etc/nginx/sites-available/streamhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 12. SSL/TLS 설정 (Certbot)

### Certbot 설치
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### SSL 인증서 발급
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 13. 방화벽 설정

### UFW 방화벽 설정
```bash
sudo ufw enable
sudo ufw allow 22        # SSH
sudo ufw allow 80        # HTTP
sudo ufw allow 443       # HTTPS
sudo ufw allow 5000      # Node.js (개발용)
sudo ufw allow 5432      # PostgreSQL (필요시)
```

## 14. 모니터링 및 로그

### 로그 확인
```bash
# StreamHub 애플리케이션 로그
sudo journalctl -u streamhub -f

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL 로그
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 시스템 모니터링
```bash
# 시스템 리소스 모니터링
htop

# 디스크 사용량
df -h

# 네트워크 연결
netstat -tulnp
```

## 15. 백업 및 복원

### 데이터베이스 백업
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U streamhub_user streamhub_db > $BACKUP_DIR/streamhub_backup_$DATE.sql
```

### 자동 백업 설정 (crontab)
```bash
crontab -e

# 매일 새벽 2시에 백업 실행
0 2 * * * /opt/streamhub/backup.sh
```

## 16. 트러블슈팅

### 일반적인 문제

**1. 데이터베이스 연결 실패**
```bash
# PostgreSQL 서비스 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -h localhost -U streamhub_user -d streamhub_db
```

**2. Node.js 애플리케이션 시작 실패**
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 권한 확인
ls -la /opt/streamhub
```

**3. WebSocket 연결 문제**
```bash
# 방화벽 설정 확인
sudo ufw status

# Nginx WebSocket 설정 확인
sudo nginx -t
```

**4. OAuth 로그인 실패**
- 환경 변수 설정 확인
- OAuth 제공자의 콘솔에서 설정 확인
- Redirect URI 정확성 확인

### 성능 최적화

**1. PostgreSQL 튜닝**
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf

# 권장 설정 (8GB RAM 기준)
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 32MB
maintenance_work_mem = 512MB
```

**2. Node.js 클러스터링**
- PM2 사용 권장
```bash
npm install -g pm2
pm2 start dist/index.js --name streamhub -i max
pm2 startup
pm2 save
```

## 17. 업데이트 및 유지보수

### 애플리케이션 업데이트
```bash
cd /opt/streamhub
git pull origin main
npm install
npm run build
sudo systemctl restart streamhub
```

### 보안 업데이트
```bash
sudo apt update && sudo apt upgrade -y
sudo systemctl restart nginx postgresql
```

## 지원 및 문의

- GitHub Issues: https://github.com/your-username/streamhub/issues
- 문서: https://github.com/your-username/streamhub/wiki
- 이메일: support@streamhub.com

## 라이선스

MIT License - 자세한 내용은 LICENSE 파일 참조