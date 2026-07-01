# daega-calendar

한우대가 예약 웹/PWA — 구글 캘린더 스타일 달력 + 날짜별 예약 관리

## 기능

- 이번 달 달력이 기본 화면
- 오늘 날짜 파란 동그라미 표시
- 예약이 있는 날짜에 점(dot) 표시
- 날짜 클릭 시 해당 일 예약 목록
- `7:00 5명 김다민 r3` 형식 한 줄 입력 → 시간/인원/이름/좌석/메모로 파싱해 Supabase 저장
- Realtime으로 여러 기기에서 즉시 반영
- PWA 설치 가능 (홈 화면 추가)

## 시작하기

### 1. Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 아래 migration 파일을 순서대로 실행
   - `supabase/migrations/001_reservations.sql`
   - `supabase/migrations/002_visual_position.sql`
   - `supabase/migrations/003_reservation_color.sql`
   - … (004~008 순서대로)
   - `supabase/migrations/009_store_id.sql`
3. Project Settings → API에서 URL과 `anon` key 복사

### 2. 웹 앱 실행

```bash
cd web
cp .env.example .env
# .env에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 입력

npm install
npm run dev
```

코드를 업데이트했는데 화면이 안 바뀌면 캐시를 지우고 다시 실행하세요:

```bash
npm run dev:clean
```

브라우저에서 `http://localhost:5173` 접속

**하얀 화면이 보이면** (달력이 잠깐 보였다 사라지는 경우):

1. 실행 중인 dev 서버를 모두 종료 (`Ctrl+C`)
2. Chrome 개발자도구 → Application → Service Workers → `localhost` 항목 **Unregister**
3. 다시 `npm run dev` 실행 후 **강력 새로고침** (Cmd+Shift+R)

### 3. 빌드 / 배포

```bash
cd web
npm run build
npm run preview
```

`web/dist`를 Vercel, Netlify 등에 배포하면 됩니다.

## 예약 입력 형식

```
시간 인원 이름 [좌석] [메모]
```

예시:

- `7:00 5명 김다민 r3`
- `19:30 2명 이영희 t1 창가 요청`
- `7시 4명 박철수`

## 프로젝트 구조

```
daega-calendar/
├── android/               # Android 위젯 + WebView 앱
├── supabase/migrations/   # DB 스키마
└── web/                   # React PWA
    └── src/
        ├── components/    # 달력, 예약 UI
        ├── hooks/         # 데이터 fetching
        └── lib/           # Supabase, 파싱, 포맷
```

## 매장 구분 (1호점 / 2호점)

| | 1호점 (기존) | 2호점 |
|--|-------------|--------|
| DB `store_id` | `main` (기본값) | `branch` |
| 웹 env | `VITE_STORE_ID` **설정 안 함** | `VITE_STORE_ID=branch` |
| URL | **지금 그대로** (`/`, `/?view=board`, `/today`) | 별도 Vercel 프로젝트 |
| APK | `com.daega.calendar` (기존) | `com.daega.calendar.branch` |

1. Supabase SQL Editor에서 `009_store_id.sql` 실행 (기존 예약은 자동으로 `main`)
2. **1호점** 웹만 배포 → URL·화면 동일, 내부적으로 `main`만 조회
3. **2호점** Vercel 프로젝트 추가 + env에 `VITE_STORE_ID=branch`
4. 2호점 오픈 **직전** 1호 APK 업데이트 (위젯용, 재설치 불필요)

## Android 위젯 + 앱

- 홈 화면 **월별 위젯** (점심/저녁 팀 수, 오늘 강조)
- 날짜 탭 → WebView로 PWA **일별뷰** 열기
- 설정·빌드: [android/README.md](android/README.md)

## 다음 단계

- 위젯 디자인 고도화 (스티커, 음력 등)
