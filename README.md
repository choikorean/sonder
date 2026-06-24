# TaxFlo

세무사를 위한 고객 커뮤니케이션 자동화 SaaS. 자료 요청문, 누락자료 재요청문, 상담 정리, 신고 결과 설명문을 AI 초안으로 생성합니다. 모든 결과물은 초안이며, 발송 전 세무사가 반드시 검토합니다.

## 기술 스택

- **Next.js 16 (App Router)** + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Supabase** — Auth, PostgreSQL(RLS), Storage(상담 오디오)
- **OpenAI** — 텍스트 생성(GPT), 음성 인식(Whisper)
- **결제** — 국내 PG 추상화 레이어(`lib/billing/`), PG 선정 후 연동

## 로컬 실행

Node 24 사용을 권장합니다(`.nvmrc`).

```bash
nvm use
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

## 환경 변수

`.env.example` 참고. 주요 항목:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 공개 키(클라이언트 노출 OK)
- `SUPABASE_SERVICE_ROLE_KEY` — 서버 전용. 결제 웹훅 등 RLS 우회용. 절대 클라이언트 노출 금지
- `OPENAI_API_KEY` — 서버 전용
- `OPENAI_MODEL`, `OPENAI_TRANSCRIBE_MODEL`
- `NEXT_PUBLIC_APP_URL`
- `BILLING_PROVIDER` — 미설정 시 `manual`(주문만 생성, 결제 보류). 국내 PG 연동 시 지정

## 주요 명령어

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드 + 타입체크
npm run lint    # ESLint
```

## 배포 체크리스트 (Vercel)

출시 전 확인 사항:

- [ ] Vercel 프로젝트에 환경 변수 설정 (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` 등 서버 시크릿 포함)
- [ ] Supabase Auth Redirect URL에 운영 도메인 등록
- [ ] (국내 PG 연동 시) PG 웹훅 엔드포인트 등록 및 시크릿 설정
- [ ] RLS 정책 확인 — 모든 테이블 본인 데이터만 접근(`subscriptions`, `payment_orders`, `usage_events`, 생성물 테이블)
- [ ] 클라이언트 번들에 시크릿 미포함 확인 — 서버 전용 모듈은 `server-only` 가드 적용(`lib/openai.ts`, `lib/supabase/service.ts`, `lib/billing/index.ts`)
- [ ] `npm run build` (타입체크) 통과
- [ ] `npm run lint` 통과

## Vercel 배포 (Preview / Production)

브랜치 전략:

- `main` → **Production** 배포 (운영 도메인)
- `dev` 및 기타 브랜치/PR → **Preview** 배포 (임시 URL, 검증용)

`vercel.json`에서 기본 리전을 서울(`icn1`)로 지정했습니다. Vercel에 Git 연동 시 `main`은 Production, 그 외 모든 브랜치(`dev` 포함)는 자동으로 Preview 배포됩니다.

### 1) Git 연동 방식 (권장)

1. 원격 저장소(GitHub 등)에 푸시
   ```bash
   git remote add origin <repo-url>
   git push -u origin main
   git push -u origin dev
   ```
2. [vercel.com](https://vercel.com) → New Project → 저장소 import
3. Project Settings → Git → **Production Branch = `main`** 확인 (그 외 브랜치는 자동 Preview)
4. 아래 환경 변수를 **Production / Preview** 환경에 등록
5. 이후 `main` 푸시 → Production, `dev`/PR 푸시 → Preview 자동 배포

### 2) Vercel CLI 방식

```bash
npx vercel login
npx vercel link            # 프로젝트 연결
npx vercel env pull .env.local   # 등록된 환경 변수 내려받기

npm run deploy:preview     # Preview 배포 (vercel deploy)
npm run deploy:prod        # Production 배포 (vercel deploy --prod)
```

### 환경 변수 매트릭스

| 변수 | Production | Preview | 비고 |
|---|:---:|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | 공개 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | 공개 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | 서버 시크릿(암호화) |
| `OPENAI_API_KEY` | ✅ | ✅ | 서버 시크릿(암호화) |
| `OPENAI_MODEL`, `OPENAI_TRANSCRIBE_MODEL` | ✅ | ✅ | |
| `NEXT_PUBLIC_APP_URL` | ✅ `https://taxflo.vercel.app` | ⛔(미설정 권장) | Preview는 동적 URL → 요청 origin으로 자동 대체 |
| `BILLING_PROVIDER` | ✅ `nicepay` | 선택 | 미설정 시 `manual` |
| `NICEPAY_MID`, `NICEPAY_MERCHANT_KEY` | ✅ | ⛔ | 서버 시크릿(암호화). Production 키만 사용 |

> Preview/Production이 같은 Supabase 프로젝트를 공유해도 되지만, 데이터 격리가 필요하면 Preview용 Supabase 프로젝트를 별도로 만들어 Preview 환경 변수에만 그 값을 넣으세요.

### Supabase 설정

- Authentication → URL Configuration → **Site URL**: `https://taxflo.vercel.app`
- **Redirect URLs**: `https://taxflo.vercel.app/**`, Preview 패턴 `https://*-<project>.vercel.app/**`

### 나이스페이 설정

- 빌키 인증 **Return URL**: `https://taxflo.vercel.app/api/billing/auth-callback`
- 로컬 개발 시(선택): `http://localhost:3000/api/billing/auth-callback`

## 보안 메모

- 서버 전용 모듈은 `import "server-only"`로 보호되어 클라이언트에서 import 시 빌드 에러가 발생합니다.
- 구독 활성화/결제 확정은 서버(서비스 롤·웹훅)에서만 수행합니다. 사용자는 `payment_orders`에 `pending` 주문만 생성할 수 있습니다.
- 무료 체험은 `start_free_trial()` SECURITY DEFINER 함수로 본인(`auth.uid()`) 한정 활성화됩니다.
