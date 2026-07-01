# 대가 예약 Android

홈 화면 **월별 위젯** + **WebView PWA** 앱입니다.

## 구성

| 구성 | 설명 |
|------|------|
| **위젯** | 월별 달력, 오늘 강조, 점심/저녁 팀 수 |
| **날짜 탭** | `MainActivity` → PWA `?date=YYYY-MM-DD&view=day` |
| **앱** | WebView로 기존 `web/` PWA 로드 (예약 추가/수정/삭제) |

## 설정

```bash
cd android
cp secrets.properties.example secrets.properties
```

`secrets.properties` (web/.env와 동일한 Supabase + 매장별 PWA URL):

```properties
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
PWA_BASE_URL=https://your-main-app.vercel.app
PWA_BASE_URL_BRANCH=https://your-branch-app.vercel.app
```

`secrets.properties.example` 참고.

### PWA_BASE_URL 예시

| 환경 | URL |
|------|-----|
| 에뮬레이터 + PC `npm run dev` | `http://10.0.2.2:5173` |
| 실제 기기 + PC dev (`--host`) | `http://192.168.x.x:5173` |
| 배포 (Vercel 등) | `https://your-app.vercel.app` |

HTTPS 배포 URL을 쓰는 것을 권장합니다.

## 빌드

Android Studio에서 `android/` 폴더를 열거나:

```bash
cd android
./gradlew :app:assembleSuncheonDebug      # 1호점 개발용
./gradlew :app:assembleSuncheonRelease    # 1호점 배포용
./gradlew :app:assembleBranchDebug    # 2호점 개발용
./gradlew :app:assembleBranchRelease  # 2호점 배포용
```

| APK | 경로 |
|-----|------|
| 1호 Debug | `app/build/outputs/apk/suncheon/debug/app-suncheon-debug.apk` |
| 1호 Release | `app/build/outputs/apk/suncheon/release/app-suncheon-release.apk` |
| 2호 Debug | `app/build/outputs/apk/branch/debug/app-branch-debug.apk` |
| 2호 Release | `app/build/outputs/apk/branch/release/app-branch-release.apk` |

**Release APK**는 빌드 시 `secrets.properties`의 Supabase 키가 APK 안에 포함됩니다.  
다른 PC에서 받은 APK이거나 `secrets.properties` 없이 빌드한 APK는 위젯에 일정이 안 보일 수 있습니다.

## 위젯 추가

1. APK 설치 후 **앱을 한 번 실행** (직접 설치 시 네트워크·위젯 갱신에 필요)
2. 홈 화면 길게 누르기 → **위젯** → **대가 예약 달력** 선택
3. debug ↔ release 전환 시 기존 위젯을 지우고 다시 추가
4. 날짜 탭 → 해당 일 **일별 타임라인** 앱 열림

## 월 이동

위젯 헤더: `‹` 이전 달 · `오늘` · `›` 다음 달

데이터는 Supabase에서 가져오며, 약 30분마다 자동 갱신됩니다.
