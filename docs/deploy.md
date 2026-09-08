# 배포

이 사이트는 **정적 페이지 + 작은 서버**로 이루어져 있습니다.

| 부분 | 내용 | 서버 필요 |
| --- | --- | --- |
| 사이트 전체 | `index.html`, `assets/` (입장 필름, 시공사진, 스크립트) | 없음 |
| AI 공간 상담 | `POST /api/chat` → `server/worker.mjs` → Gemini API | 필요 |

그래서 배포 경로가 두 가지입니다. **AI 상담까지 살리려면 A**, 화면만 빨리 보여주면 되면 B.

---

## A. Cloudflare Workers — 전체 기능 (권장)

`server/worker.mjs`는 Cloudflare Worker 형식입니다 (`export default { fetch }`, 정적 파일은
`env.ASSETS`, 요청 IP는 `cf-connecting-ip`). 설정은 `wrangler.toml`에 있습니다.

### 가장 빠른 방법 — 계정 없이 (미리보기용)

```bash
npm install
npx wrangler deploy --temporary
```

Cloudflare 임시 계정으로 올리고 **접속 주소와 claim URL**을 출력합니다.
claim URL을 열면 그 배포를 본인 Cloudflare 계정으로 가져올 수 있습니다.
임시 배포에는 시크릿을 넣을 수 없어 AI 상담은 "AI 상담을 준비 중입니다"로 안내됩니다.
나머지 화면은 전부 정상 동작하므로 업체에 보여주기용으로 충분합니다.

### 최초 1회 — 본인 계정으로 (AI 상담 포함)

```bash
npm install
npx wrangler login            # 브라우저가 열리고 Cloudflare 계정으로 로그인
npx wrangler secret put GEMINI_API_KEY   # 값을 붙여넣기 (소스에 넣지 말 것)
```

`GEMINI_MODEL`은 선택입니다. 등록하지 않으면 `gemini-3.5-flash-lite`를 씁니다.

### 그 뒤로 배포할 때마다

```bash
git pull origin main
npm run deploy       # = npm run build && wrangler deploy
```

끝나면 `https://all-interior-home.<계정>.workers.dev` 형태의 주소가 출력됩니다.
직접 도메인을 붙이려면 Cloudflare 대시보드 → Workers & Pages → 해당 Worker → Custom Domains.

### 확인

```bash
npx wrangler tail                     # 실시간 로그
npx wrangler secret list              # 시크릿 등록 여부 (값은 안 보임)
```

---

## B. GitHub Pages — 예비 경로, 화면만 (AI 상담 제외)

기본 배포는 A입니다. B는 Cloudflare를 쓸 수 없을 때의 예비 경로라
자동으로 돌지 않습니다 — **Actions 탭 → "Deploy to GitHub Pages (수동)" → Run workflow**
로 직접 실행할 때만 배포됩니다. 계정 설정이나 토큰은 필요 없습니다.

주소: `https://jamaica8612.github.io/interior-site/`

워크플로가 Pages를 자동으로 켜도록(`enablement: true`) 되어 있어 별도 설정 없이 첫 실행에서 배포됩니다.
혹시 권한 때문에 실패하면 **Settings → Pages → Source를 "GitHub Actions"로** 한 번만 지정해주세요.

Pages에는 서버가 없어서 `/api/chat`이 없습니다. AI 상담창은 열리지만 질문을 보내면
"AI 상담은 이 주소에서 준비 중입니다"라고 안내합니다. 나머지 기능(입장 필름, 시공사례
미리보기, 견적 상담 다이얼로그)은 모두 정상 동작합니다.

---

## 배포 전 확인

```bash
npm run build     # HTML/스크립트 파싱, 중복 id, 에셋 경로 검증 후 dist/ 생성
npm run check     # 채팅 · 필름 시퀀스 검증
```

`dist/` 구조

```
dist/
  index.html          client/index.html 과 동일 (편의용)
  assets/
  client/             ← 정적 배포 대상 (Pages, Worker assets)
  server/index.js     ← Worker 엔트리 (server/worker.mjs 복사본)
  .openai/hosting.json
```

## 배포 후 눈으로 확인할 것

- 히어로 입장 필름 재생과 재생/진행 컨트롤
- 시공사례 5장, 확대 버튼 → 미리보기 팝업
- "무료 견적 상담" → 다이얼로그 → 내용 복사
- 우하단 "AI 공간 상담" (A 경로에서만 실제 응답)
- 모바일 폭 390px에서 하단 고정 상담 바

## 참고

`.openai/hosting.json`의 `project_id`는 예전 OpenAI 앱 호스팅에서 쓰던 값입니다.
그 경로로 배포하려면 해당 호스팅 도구가 필요하며, 이 저장소에는 그 명령이 없습니다.
위의 A 또는 B를 쓰면 저장소 안에서 배포가 끝납니다.
