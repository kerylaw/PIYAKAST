# PeerTube 설정 분석 및 PIYAKast 연동 가이드

## 현재 PeerTube 설정 분석

### 🔍 주요 설정 내용

#### 웹서버 설정
```yaml
webserver:
  https: true
  hostname: 'cast.piyak.kr'
  port: 443
  http_port: 80
```
- **HTTPS 활성화**: SSL/TLS 보안 연결 사용
- **도메인**: cast.piyak.kr
- **포트**: HTTPS 443, HTTP 80

#### 데이터베이스 설정
```yaml
database:
  hostname: '127.0.0.1'
  port: 5432
  suffix: '_piyakast'
  username: 'kery73'
  password: 'Yoyeom75!'
  dbname: 'peertube'
```
- **로컬 PostgreSQL** 연결
- **데이터베이스명**: peertube_piyakast
- **사용자**: kery73

#### 관리자 계정
```yaml
admin:
  username: 'root'
  password: 'Yoyeom75!'
  email: 'admin@piyak.kr'
```

#### 라이브 스트리밍 설정
```yaml
live:
  enabled: false  # ⚠️ 문제점 1: 라이브 비활성화됨
  rtmp:
    enabled: true
    port: 1935
```

## 🚨 발견된 문제점들

### 1. 라이브 스트리밍 비활성화
```yaml
live:
  enabled: false  # 라이브 기능이 꺼져 있음
```
**해결책**: `enabled: true`로 변경 필요

### 2. PIYAKast 설정 수정됨
PIYAKast 설정 (수정됨):
```typescript
url: 'http://127.0.0.1:9000'  // 로컬 PeerTube 서버
username: 'root'              // 관리자 계정
```

참고: cast.piyak.kr는 PIYAKast 웹앱의 도메인이며, PeerTube는 로컬에서 실행됩니다.

### 3. RTMP URL 설정 오류
PIYAKast에서 RTMP URL을 잘못 생성하고 있음

## ✅ 수정된 PIYAKast 설정

### 1. PeerTube 연결 설정 수정
```typescript
// server/peertube-config.ts
export const peertubeConfig: PeerTubeConfig = {
  url: 'https://cast.piyak.kr',  // 올바른 HTTPS URL
  username: 'root',              // 올바른 관리자 계정
  password: 'Yoyeom75!'
};
```

### 2. RTMP URL 수정
```typescript
// server/peertube.ts
rtmpUrl: live.rtmpUrl || `rtmp://cast.piyak.kr:1935/live`
```

## 🔧 PeerTube 설정 수정 필요사항

### production.yaml 수정 필요
```yaml
live:
  enabled: true  # false -> true로 변경
  rtmp:
    enabled: true
    hostname: 'cast.piyak.kr'  # null -> hostname 지정
    port: 1935
    public_hostname: 'cast.piyak.kr'  # null -> hostname 지정
```

### 권장 추가 설정
```yaml
# 업로드 제한
upload:
  max_file_size: 2GB
  max_video_file_size: 2GB

# 트랜스코딩 설정 
transcoding:
  enabled: true
  allow_additional_extensions: true
  threads: 2
  resolutions:
    '480p': true
    '720p': true
    '1080p': true

# 사용자 등록 설정
signup:
  enabled: true
  requires_approval: false
```

## 🌐 네트워크 및 방화벽 설정

### 필요한 포트
- **443**: HTTPS 웹 인터페이스
- **80**: HTTP 리다이렉트
- **1935**: RTMP 라이브 스트리밍
- **5432**: PostgreSQL (내부)

### 방화벽 규칙
```bash
# HTTPS 웹 접근
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# HTTP 리다이렉트
iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# RTMP 스트리밍
iptables -A INPUT -p tcp --dport 1935 -j ACCEPT
```

## 🔄 연동 테스트 단계

### 1. PeerTube 서버 재시작
```bash
sudo systemctl restart peertube
sudo systemctl status peertube
```

### 2. PIYAKast 연결 테스트
```bash
# PeerTube API 접근 테스트
curl -k https://cast.piyak.kr/api/v1/config

# 관리자 계정 로그인 테스트
curl -k -X POST https://cast.piyak.kr/api/v1/oauth-clients/local
```

### 3. 라이브 스트리밍 테스트
1. PIYAKast에서 라이브 스트림 생성
2. OBS Studio 설정:
   - 서버: `rtmp://cast.piyak.kr:1935/live`
   - 스트림 키: PIYAKast에서 생성된 키

## 🛠️ 예상되는 추가 문제점들

### SSL 인증서 문제
PeerTube가 HTTPS를 사용하므로 유효한 SSL 인증서가 필요합니다.
```bash
# Let's Encrypt 설정 예시
certbot certonly --nginx -d cast.piyak.kr
```

### 데이터베이스 권한 문제
`kery73` 사용자가 PeerTube 데이터베이스에 적절한 권한이 있는지 확인:
```sql
GRANT ALL PRIVILEGES ON DATABASE peertube_piyakast TO kery73;
```

### 스토리지 권한 문제
PeerTube 스토리지 디렉토리 권한 설정:
```bash
sudo chown -R peertube:peertube /var/www/peertube/storage/
sudo chmod -R 755 /var/www/peertube/storage/
```

## 📋 완전한 연동을 위한 체크리스트

### PeerTube 서버 측
- [ ] `live.enabled: true` 설정
- [ ] RTMP hostname 설정
- [ ] SSL 인증서 설정 확인
- [ ] 방화벽 포트 개방 (80, 443, 1935)
- [ ] 데이터베이스 권한 확인
- [ ] 스토리지 권한 설정
- [ ] 서버 재시작

### PIYAKast 클라이언트 측
- [x] PeerTube URL 수정 (https://cast.piyak.kr)
- [x] 관리자 계정 설정 (root)
- [x] RTMP URL 수정
- [x] 에러 처리 강화
- [x] 백업 시스템 유지

### 테스트 항목
- [ ] PeerTube 웹 인터페이스 접근 (https://cast.piyak.kr)
- [ ] PIYAKast에서 PeerTube API 연결
- [ ] 비디오 업로드 테스트
- [ ] 라이브 스트림 생성 테스트
- [ ] OBS Studio 연동 테스트
- [ ] 임베드 플레이어 테스트

## 🚀 성능 최적화 권장사항

### PeerTube 설정
```yaml
# 성능 최적화
cache:
  previews:
    size: 500
  captions:
    size: 500

# 로그 레벨 조정
log:
  level: 'info'  # 'debug'에서 'info'로 변경

# 워커 프로세스 수 조정
transcoding:
  threads: 4  # CPU 코어 수에 맞게 조정
```

### PIYAKast 최적화
- PeerTube API 응답 캐싱
- 연결 풀링 설정
- 재시도 메커니즘 구현
- 모니터링 및 로깅 강화

이 분석을 바탕으로 PeerTube 설정을 수정하고 PIYAKast를 재시작하면 완전한 연동이 가능할 것입니다.