# tasks.md

# TaxFlow MVP Development Tasks

This file is optimized for Cursor + Claude Code execution. Complete tasks in order. Do not skip phases.

---

## Phase 0 - Project Setup

### Task 0.1 Create Next.js Project

Create a Next.js 15 project with:

- App Router
- TypeScript
- Tailwind CSS
- ESLint
- src directory optional, but if used, use it consistently

Install dependencies:

```bash
npm install @supabase/supabase-js @supabase/ssr zod openai stripe lucide-react clsx tailwind-merge
npx shadcn@latest init
```

Acceptance criteria:

- App runs locally
- Tailwind works
- shadcn/ui initialized

---

### Task 0.2 Environment Variables

Create `.env.example` with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Acceptance criteria:

- No real secrets committed
- App reads env vars safely

---

### Task 0.3 Base Layout

Create base layout with:

- Korean metadata
- responsive container
- navigation shell for authenticated pages

Acceptance criteria:

- `/` loads
- Layout is mobile-friendly

---

## Phase 1 - Supabase Auth and DB

### Task 1.1 Supabase Client Setup

Create:

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `middleware.ts`

Use Supabase SSR helpers.

Acceptance criteria:

- Browser client works
- Server client works
- Session is available server-side

---

### Task 1.2 Apply Database Schema

Apply `database.sql` to Supabase SQL editor.

Acceptance criteria:

- Tables created
- RLS enabled
- Policies active
- Storage bucket created

---

### Task 1.3 Login and Signup Page

Create `/login` page with:

- email/password signup
- email/password login
- error message
- loading state

Acceptance criteria:

- User can sign up
- User can log in
- Profile row is created automatically

---

### Task 1.4 Protected Routes

Protect:

- `/dashboard`
- `/requests`
- `/consultations`
- `/reports`
- `/history`
- `/settings`

Acceptance criteria:

- Unauthenticated users are redirected to `/login`
- Authenticated users can access dashboard

---

## Phase 2 - Core UI

### Task 2.1 Landing Page

Create `/` landing page in Korean.

Sections:

- Hero
- Problem
- Solution
- 3 Features
- Pricing
- CTA
- Disclaimer

Acceptance criteria:

- Clear CTA to login/signup
- Copy targets Korean tax accountants

---

### Task 2.2 Dashboard

Create `/dashboard`.

Show cards:

- 자료 요청 생성
- 상담 요약
- 신고 결과 설명문
- 생성 내역

Show recent 5 generations across all types if easy; otherwise show empty state.

Acceptance criteria:

- Cards link to feature pages
- Works on mobile

---

### Task 2.3 Shared Components

Create reusable components:

- `GeneratedOutput`
- `CopyButton`
- `LoadingButton`
- `ReviewDisclaimer`
- `EmptyState`

Acceptance criteria:

- Copy to clipboard works
- Disclaimer visible under AI outputs

---

## Phase 3 - AI Infrastructure

### Task 3.1 OpenAI Client

Create `lib/openai.ts`.

Server-only OpenAI client.

Acceptance criteria:

- Client never imported by client components
- Throws clear error if env key missing

---

### Task 3.2 Prompt Templates

Create `lib/prompts.ts`.

Export functions:

- `buildDocumentRequestPrompt(input)`
- `buildConsultationSummaryPrompt(input)`
- `buildTaxExplanationPrompt(input)`

Acceptance criteria:

- Prompts are Korean
- Prompts instruct model not to invent facts
- Prompts state output is draft

---

### Task 3.3 Validators

Create `lib/validators.ts` using Zod.

Schemas:

- requestGenerateSchema
- consultationSummarySchema
- reportExplanationSchema

Acceptance criteria:

- Invalid input returns Korean error message

---

## Phase 4 - Document Request Generator

### Task 4.1 API Route

Create `POST /api/request-generate`.

Flow:

1. Require auth
2. Validate input
3. Call OpenAI
4. Save to `request_generations`
5. Return result

Acceptance criteria:

- Works with valid input
- Rejects unauthenticated request
- Saves history

---

### Task 4.2 UI Page

Create `/requests` page.

Fields:

- 세목
- 사업 유형
- 특이사항

Buttons:

- 생성하기
- 복사하기

Acceptance criteria:

- User can generate request message
- Output is easy to copy into KakaoTalk/email

---

## Phase 5 - Tax Result Explanation Generator

### Task 5.1 API Route

Create `POST /api/report-explanation`.

Flow:

1. Require auth
2. Validate input
3. Call OpenAI
4. Save to `report_explanations`
5. Return result

Acceptance criteria:

- Works with current tax amount
- previous tax amount is optional
- Saves history

---

### Task 5.2 UI Page

Create `/reports` page.

Fields:

- 세목
- 이번 신고 세액
- 이전 신고 세액 optional
- 변동 사유 optional
- 특이사항 optional

Acceptance criteria:

- Generates client-friendly explanation
- Copy works

---

## Phase 6 - Consultation Summary

### Task 6.1 Text Summary API

Create first version of `POST /api/consultation-summary` using text input only.

Flow:

1. Require auth
2. Validate text
3. Call OpenAI
4. Save to `consultation_summaries`
5. Return structured output

Acceptance criteria:

- Text summary works
- Saves summary fields

---

### Task 6.2 Consultation UI

Create `/consultations` page.

Fields:

- 상담 메모 text area

Outputs:

- 내부 요약
- 고객 전달용 요약
- 필요자료
- 후속조치

Acceptance criteria:

- Works without audio upload
- Copy sections independently if possible

---

### Task 6.3 Audio Upload

Add optional audio upload.

Flow:

1. Validate file type and size
2. Upload audio to Supabase Storage
3. Transcribe via OpenAI
4. Summarize transcript
5. Save audio_url and transcript

Supported formats:

- mp3
- m4a
- wav
- webm

Max size:

- 25MB

Acceptance criteria:

- Audio upload works
- User sees transcript and summary
- Unsupported file rejected

---

## Phase 7 - History

### Task 7.1 History API

Create `GET /api/history`.

Return latest records from:

- request_generations
- consultation_summaries
- report_explanations

Acceptance criteria:

- Only own data returned
- Sorted by created_at desc

---

### Task 7.2 History UI

Create `/history` page.

Show tabs or list:

- 자료 요청
- 상담 요약
- 설명문

Acceptance criteria:

- User can view previous outputs
- User can copy previous outputs

---

## Phase 8 - Stripe Billing

### Task 8.1 Stripe Client

Create `lib/stripe.ts`.

Acceptance criteria:

- Server-only
- Uses secret key safely

---

### Task 8.2 Checkout Session

Create `POST /api/stripe/create-checkout-session`.

Flow:

1. Require auth
2. Create or reuse Stripe customer
3. Create checkout session for Starter plan
4. Return session URL

Acceptance criteria:

- User can start checkout

---

### Task 8.3 Billing Portal

Create `POST /api/stripe/create-portal-session`.

Acceptance criteria:

- Subscribed user can open billing portal

---

### Task 8.4 Stripe Webhook

Create `POST /api/stripe/webhook`.

Handle:

- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted

Update `subscriptions`.

Acceptance criteria:

- Subscription status updates in DB

---

### Task 8.5 Settings Page

Create `/settings`.

Show:

- email
- subscription status
- checkout button
- billing portal button

Acceptance criteria:

- User can subscribe
- User can manage billing

---

## Phase 9 - Usage Tracking

### Task 9.1 Usage Events

Record usage in `usage_events` whenever AI generation succeeds.

Fields:

- user_id
- feature
- tokens_estimated optional

Acceptance criteria:

- Each generation creates usage event

---

### Task 9.2 Basic Usage Limits

Implement basic monthly usage limits for Starter plan:

- request_generation: 500/month
- consultation_summary: 100/month
- report_explanation: 500/month

Acceptance criteria:

- Over-limit users receive Korean error
- Limit logic is server-side

---

## Phase 10 - Polish and Launch

### Task 10.1 Error States

Add user-friendly errors for:

- OpenAI failure
- Supabase failure
- Stripe failure
- invalid input
- unauthenticated access

Acceptance criteria:

- No raw technical errors shown to user

---

### Task 10.2 Loading States

Add loading states to all generation forms.

Acceptance criteria:

- Button disabled during generation
- User sees progress text

---

### Task 10.3 Mobile QA

Check all pages on mobile width.

Acceptance criteria:

- No horizontal scroll
- Buttons are tappable
- Output text is readable

---

### Task 10.4 Production Checklist

Before launch:

- Set env vars on Vercel
- Configure Supabase Auth redirect URLs
- Configure Stripe webhook endpoint
- Confirm RLS policies
- Confirm no secrets in client bundle
- Run type check
- Run lint

Acceptance criteria:

- MVP can be used by beta users

