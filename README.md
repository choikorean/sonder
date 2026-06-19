# TaxFlow

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

## 보안 메모

- 서버 전용 모듈은 `import "server-only"`로 보호되어 클라이언트에서 import 시 빌드 에러가 발생합니다.
- 구독 활성화/결제 확정은 서버(서비스 롤·웹훅)에서만 수행합니다. 사용자는 `payment_orders`에 `pending` 주문만 생성할 수 있습니다.
- 무료 체험은 `start_free_trial()` SECURITY DEFINER 함수로 본인(`auth.uid()`) 한정 활성화됩니다.
