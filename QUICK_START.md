# PIYAKast - 빠른 시작 가이드

## 5분 만에 PIYAKast 실행하기

### 전제 조건
- Ubuntu 20.04+ 또는 유사한 Linux 배포판
- Node.js 18+
- PostgreSQL 13+
- Git

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-username/piyakast.git
cd piyakast
```

### 2. 환경 설정
```bash
# 환경 변수 파일 생성
cp .env.example .env

# 기본 설정으로 편집
nano .env
```

### 3. 데이터베이스 설정
```bash
# PostgreSQL 사용자 및 데이터베이스 생성
sudo -u postgres createuser piyakast_user --createdb --login
sudo -u postgres createdb piyakast_db --owner=piyakast_user
sudo -u postgres psql -c "ALTER USER piyakast_user PASSWORD 'your_password';"

# .env 파일에 데이터베이스 URL 설정
DATABASE_URL="postgresql://piyakast_user:your_password@localhost:5432/piyakast_db"
```

### 4. 애플리케이션 실행
```bash
# 의존성 설치
npm install

# 데이터베이스 스키마 생성
npm run db:push

# 개발 서버 시작
npm run dev
```

### 5. 접속 확인
브라우저에서 `http://localhost:5000` 접속

## 기본 사용법

### 회원가입 및 로그인
1. `/auth` 페이지에서 계정 생성
2. 이메일/비밀번호 또는 소셜 로그인 사용

### 라이브 방송 시작
1. 로그인 후 "Go Live" 버튼 클릭
2. 방송 제목, 설명, 카테고리 입력
3. "Start Stream" 버튼으로 방송 시작

### 동영상 업로드
1. "Videos" 페이지에서 업로드 버튼 클릭
2. 파일 선택 및 메타데이터 입력
3. 업로드 및 처리 완료 대기

## 다음 단계
- [전체 설치 가이드](UBUNTU_INSTALLATION_GUIDE.md) 참조
- [시스템 아키텍처](SYSTEM_ARCHITECTURE.md) 이해
- 프로덕션 배포 준비