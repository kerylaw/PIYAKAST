# PIYAKast 데이터베이스 분석 및 최적화 보고서

## 📊 데이터베이스 구조 개요

PIYAKast 플랫폼은 **40개의 핵심 테이블**로 구성된 고도로 정규화된 PostgreSQL 데이터베이스를 사용합니다.

### 🎯 핵심 도메인 영역

1. **사용자 관리**: users, sessions, channelSettings
2. **콘텐츠 관리**: videos, streams, comments, playlists
3. **소셜 기능**: follows, videoLikes, commentLikes, subscriptions
4. **수익화**: payments, superchats, membershipTiers, creatorSettings
5. **광고 시스템**: advertisers, adCampaigns, adCreatives, adPlacements
6. **분석**: channelAnalytics, viewSessions, contentPerformance
7. **저작권**: copyrightReports

---

## ✅ 데이터 무결성 검사

### 강점 (잘 구현된 부분)

1. **참조 무결성**: 모든 외래 키가 적절히 정의됨
2. **제약 조건**: 비즈니스 로직에 맞는 CHECK 제약 포괄적 적용
3. **유니크 제약**: 중복 방지를 위한 unique 제약 적절히 설정
4. **기본값**: 모든 테이블에 적절한 기본값 설정

### 🔍 발견된 이슈

#### 1. 순환 참조 잠재 위험
```sql
-- comments 테이블의 self-reference
parentId: varchar("parent_id").references((): any => comments.id)
```
**권장사항**: 최대 댓글 깊이 제한 (5단계) 추가

#### 2. 누락된 인덱스
```sql
-- 자주 검색되는 필드에 인덱스 추가 필요
users.email         -- 로그인 시 사용
users.username      -- 프로필 검색 시 사용
```

#### 3. 캐스케이드 삭제 정책 미정의
대부분의 외래 키에 ON DELETE 정책이 명시되지 않음

---

## 🚀 성능 최적화 권장사항

### 1. 인덱스 추가 권장

#### A. 복합 인덱스 추가
```sql
-- 동영상 검색 최적화
CREATE INDEX IDX_videos_category_public_created 
ON videos(category, is_public, created_at DESC);

-- 스트림 검색 최적화
CREATE INDEX IDX_streams_category_live_viewer_count 
ON streams(category, is_live, viewer_count DESC);

-- 광고 경매 최적화
CREATE INDEX IDX_ad_auction_bids_placement_timestamp 
ON ad_auction_bids(placement_id, bid_timestamp DESC);
```

#### B. 부분 인덱스 추가
```sql
-- 활성 캠페인만 인덱싱
CREATE INDEX IDX_ad_campaigns_active_status 
ON ad_campaigns(status) 
WHERE is_active = true;

-- 공개 동영상만 인덱싱
CREATE INDEX IDX_videos_public_view_count 
ON videos(view_count DESC) 
WHERE is_public = true;
```

### 2. 테이블 파티셔닝 권장

#### A. 시계열 데이터 파티셔닝
```sql
-- 월별 파티셔닝: view_sessions, ad_impressions
CREATE TABLE view_sessions_y2025m01 PARTITION OF view_sessions
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

#### B. 해시 파티셔닝
```sql
-- 사용자 기반 파티셔닝: chat_messages
CREATE TABLE chat_messages_p0 PARTITION OF chat_messages
FOR VALUES WITH (modulus 4, remainder 0);
```

### 3. 데이터 타입 최적화

#### A. 정수형 최적화
```sql
-- view_count: integer → bigint (오버플로우 방지)
-- daily_budget: integer → bigint (대규모 광고 예산 지원)
```

#### B. 텍스트 필드 최적화
```sql
-- username: varchar → varchar(30) (명시적 길이 제한)
-- email: varchar → varchar(255)
```

---

## 🔧 데이터베이스 설정 최적화

### 1. PostgreSQL 설정 권장

```postgresql
# postgresql.conf 권장 설정

# 메모리 설정
shared_buffers = '256MB'          # 시스템 RAM의 25%
effective_cache_size = '1GB'      # 시스템 RAM의 75%
work_mem = '4MB'                  # 복잡한 쿼리용
maintenance_work_mem = '64MB'     # 인덱스 생성용

# 연결 설정
max_connections = 200             # 동시 연결 수
shared_preload_libraries = 'pg_stat_statements'

# 로깅 설정
log_statement = 'mod'             # 수정 쿼리만 로깅
log_min_duration_statement = 1000 # 1초 이상 쿼리 로깅
```

### 2. 연결 풀링 설정 (PgBouncer)

```ini
# pgbouncer.ini
[databases]
piyakast = host=localhost dbname=piyakast user=app

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

---

## 📈 모니터링 및 유지보수

### 1. 성능 모니터링 쿼리

```sql
-- 인덱스 사용률 확인
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;

-- 테이블 크기 모니터링
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. 정기 유지보수 작업

```sql
-- 주간 VACUUM ANALYZE (매주 일요일 02:00)
VACUUM ANALYZE;

-- 월간 REINDEX (매월 첫째 일요일 03:00)
REINDEX DATABASE piyakast;

-- 통계 업데이트 (매일 04:00)
ANALYZE;
```

---

## 🛡️ 백업 및 복구 전략

### 1. 백업 정책

```bash
#!/bin/bash
# 일일 백업 스크립트

# 풀 백업 (매일 02:00)
pg_dump -Fc piyakast > backup_$(date +%Y%m%d).dump

# WAL 아카이빙 (실시간)
archive_command = 'cp %p /backup/wal/%f'
```

### 2. 복구 시나리오

```bash
# 포인트-인-타임 복구
pg_restore -d piyakast_restored backup_20250107.dump
```

---

## 🎯 우선순위별 개선 계획

### 즉시 적용 (P0)
1. 누락된 인덱스 추가
2. 순환 참조 깊이 제한
3. 캐스케이드 삭제 정책 정의

### 단기 계획 (P1 - 1개월)
1. 테이블 파티셔닝 구현
2. 연결 풀링 설정
3. 모니터링 시스템 구축

### 중기 계획 (P2 - 3개월)
1. 읽기 전용 복제본 구성
2. 샤딩 전략 검토
3. 캐시 레이어 구현

### 장기 계획 (P3 - 6개월)
1. 멀티 리전 배포
2. 데이터 웨어하우스 구축
3. 실시간 분석 파이프라인

---

## 📊 예상 성능 개선 효과

| 최적화 항목 | 예상 개선 효과 |
|------------|---------------|
| 인덱스 추가 | 쿼리 속도 60-80% 향상 |
| 파티셔닝 | 대용량 테이블 조회 40-60% 향상 |
| 연결 풀링 | 동시 사용자 처리 3-5배 향상 |
| 설정 최적화 | 전체 처리량 20-30% 향상 |

**총 예상 개선 효과**: 전체 데이터베이스 성능 **2-3배 향상**

---

## 🔚 결론

PIYAKast 데이터베이스는 견고한 구조를 가지고 있으나, 제안된 최적화를 통해 대규모 트래픽에도 안정적으로 대응할 수 있는 엔터프라이즈급 시스템으로 발전할 수 있습니다.

**다음 단계**: 우선순위별 개선 사항을 단계적으로 적용하고 성능 모니터링을 통해 효과를 검증하는 것을 권장합니다.