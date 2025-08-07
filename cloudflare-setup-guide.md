# Cloudflare Stream 설정 가이드

## 현재 상황
- OBS Studio에서 RTMP 서버 연결이 실패하고 있습니다
- Cloudflare Stream 서비스가 계정에서 활성화되지 않았습니다

## 해결 방법

### 1단계: Cloudflare Stream 서비스 활성화
1. https://dash.cloudflare.com 로그인
2. 왼쪽 메뉴에서 "Stream" 클릭
3. Stream 서비스 활성화 (유료 서비스입니다)
4. 결제 정보 등록 필요

### 2단계: API 토큰 권한 확인
1. Cloudflare 대시보드 → "My Profile" → "API Tokens"
2. 기존 토큰 편집 또는 새 토큰 생성
3. 권한 설정:
   - Zone:Zone:Read
   - Zone:Stream:Edit
   - Account:Cloudflare Stream:Edit

### 3단계: 계정 ID 확인
- 대시보드 오른쪽 사이드바에서 Account ID 복사
- 이메일 주소가 아닌 32자리 문자열이어야 합니다

### 4단계: 비용 안내
- Cloudflare Stream 비용:
  - 스토리지: $5/1000분
  - 대역폭: $1/1000분 시청
  - Live Input: 무료 (최대 1000개)

### 5단계: 테스트
- Stream 서비스 활성화 후 "Go Live" 버튼으로 실제 RTMP 엔드포인트 생성
- OBS Studio에서 제공된 URL과 키로 스트리밍 시작

## 참고사항
- Stream 서비스가 활성화되지 않으면 OBS에서 연결 실패
- 활성화 후에는 실제 RTMP URL이 제공되어 정상 작동합니다