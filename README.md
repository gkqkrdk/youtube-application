# 국내주식 스윙 플래너

PC가 꺼져도 모바일에서 열 수 있도록 정리한 배포용 Next.js 앱입니다.

현재 배포 화면은 `public/data/app-data.json` 스냅샷을 읽습니다. 그래서 Cloudflare Tunnel, `localhost`, `127.0.0.1` 없이도 Vercel에서 항상 열립니다.

## 현재 구조

- 프레임워크: Next.js App Router
- 메인 화면: `/`
- 모바일 요약: `/mobile-summary`
- 배포 데이터: `public/data/app-data.json`
- 로컬 실시간 서버 원본: `planner_v2.py`

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## Vercel 배포

1. 이 폴더를 GitHub 저장소에 올립니다.
2. Vercel에서 `Add New Project`를 누릅니다.
3. GitHub 저장소를 Import합니다.
4. Framework Preset은 `Next.js`로 둡니다.
5. Build Command는 `npm run build`입니다.
6. Output Directory는 비워둡니다.
7. Deploy를 누릅니다.

배포가 끝나면 Vercel URL이 생성됩니다. 그 주소는 PC가 꺼져도 모바일에서 접속됩니다.

## 환경변수

현재 정적 스냅샷 화면은 필수 환경변수가 없습니다.

나중에 Vercel 서버리스 API에서 DART나 외부 API를 직접 호출하게 바꾸면 Vercel 환경변수에 아래 값을 넣습니다.

```env
DART_API_KEY=발급받은_DART_키
NEXT_PUBLIC_APP_NAME=국내주식 스윙 플래너
```

로컬 개발용 값은 `.env.local`에 넣고, Vercel 운영 값은 Vercel Dashboard의 `Settings > Environment Variables`에 넣습니다.

## Cloudflare Tunnel과 차이

Cloudflare Tunnel은 로컬 PC의 `http://127.0.0.1:8787`을 외부에 임시로 열어주는 방식입니다. PC가 꺼지면 접속도 끊깁니다.

Vercel 배포는 파일과 앱이 Vercel 서버에 올라가기 때문에 PC가 꺼져도 접속됩니다.

## 데이터 갱신 방식

지금은 `public/data/app-data.json`을 갱신한 뒤 GitHub에 push하면 Vercel이 다시 배포합니다.

실시간 자동 갱신까지 하려면 다음 단계가 필요합니다.

- Python `planner_v2.py`의 주요 API를 Next.js Route Handler로 포팅
- 또는 별도 무료/저가 백엔드에 Python API 상시 배포
- Vercel Cron 또는 GitHub Actions로 `app-data.json` 자동 생성

## Cloudflare Pages 정적 배포

현재 Vercel 우선 구조입니다. Cloudflare Pages에 정적 사이트로만 올리려면 API 라우트 없이 `public/data/app-data.json`을 읽는 화면만 export하는 구성이 필요합니다.

이 경우 별도 브랜치에서 `output: "export"` 설정을 추가하고, 서버 API 기능은 모두 정적 스냅샷으로 대체해야 합니다.
