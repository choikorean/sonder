# CLAUDE.md

# TaxFlow Development Rules

You are building TaxFlow, a Korean B2B SaaS for tax accountants. The product helps tax accountants reduce repetitive client communication work.

The app does not provide legal tax judgment, tax filing automation, or final professional advice. It generates drafts that the tax accountant must review before sending to clients.

---

## 1. Product Context

TaxFlow MVP has three core features:

1. Client document request generation
2. Consultation summary generation
3. Tax result explanation generation

The primary user is a Korean tax accountant or small tax office owner.

The application must be simple, reliable, mobile-friendly, and inexpensive to operate.

---

## 2. Tech Stack

Use the following stack unless explicitly instructed otherwise.

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Row Level Security
- OpenAI API
- Stripe Checkout and Billing Portal
- Vercel deployment

---

## 3. Coding Principles

Prioritize simplicity over abstraction.

Do not over-engineer.

Do not introduce unnecessary dependencies.

Write production-quality code.

Use TypeScript strictly.

Avoid `any` unless there is no reasonable alternative.

All server-side secrets must be accessed only on the server.

Never expose the Supabase service role key to the browser.

Never expose OpenAI API keys to the browser.

Never expose Stripe secret keys to the browser.

---

## 4. Project Structure

Use this structure:

```txt
app/
  page.tsx
  login/page.tsx
  dashboard/page.tsx
  requests/page.tsx
  consultations/page.tsx
  reports/page.tsx
  history/page.tsx
  settings/page.tsx
  api/
    request-generate/route.ts
    consultation-summary/route.ts
    report-explanation/route.ts
    history/route.ts
    stripe/create-checkout-session/route.ts
    stripe/create-portal-session/route.ts
    stripe/webhook/route.ts
components/
  ui/
  layout/
  forms/
  generated-output.tsx
lib/
  supabase/
    client.ts
    server.ts
    middleware.ts
  openai.ts
  stripe.ts
  prompts.ts
  auth.ts
  validators.ts
  constants.ts
types/
  database.ts
  app.ts
middleware.ts
```

---

## 5. UI Rules

The UI must be clean, professional, and suitable for Korean tax accountants.

Use Korean copy by default.

Avoid flashy startup-style copy.

Use practical labels such as:

- 자료 요청 생성
- 상담 요약
- 신고 결과 설명문
- 생성 내역
- 구독 관리

All main pages must be responsive.

Primary user flow should work well on desktop and mobile.

Use shadcn/ui components where appropriate.

---

## 6. Authentication Rules

Use Supabase Auth.

Authenticated users can access:

- /dashboard
- /requests
- /consultations
- /reports
- /history
- /settings

Unauthenticated users must be redirected to /login.

Use middleware to protect authenticated routes.

Each user can only access their own data.

---

## 7. Database Rules

Use the schema defined in `database.sql`.

All user-owned tables must include:

- id
- user_id
- created_at
- updated_at where appropriate

Enable Row Level Security on every user-owned table.

Policies must restrict access to `auth.uid() = user_id`.

Do not bypass RLS from client-side code.

---

## 8. AI Rules

All AI calls must happen server-side.

Use low temperature for consistency.

Default temperature: 0.3.

The system prompt must include:

- The output is a draft.
- The tax accountant must review before sending.
- Do not invent facts not provided by the user.
- Do not provide final tax/legal judgment.

All generated outputs must include a review disclaimer in the UI, not necessarily inside the generated customer text.

Do not store raw audio longer than necessary unless the user chooses to save it.

---

## 9. Prompt Rules

Place all prompts in `lib/prompts.ts`.

Do not hardcode prompts inside API routes.

Prompt templates must be deterministic and structured.

The output format should be easy to display and copy.

---

## 10. API Rules

Use Next.js Route Handlers.

Validate all request bodies with Zod.

Return consistent JSON responses.

Success response:

```json
{
  "success": true,
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "error": "Human-readable Korean error message"
}
```

Use proper HTTP status codes.

Never return raw stack traces to the client.

---

## 11. Feature Requirements

### 11.1 Document Request Generator

Route:

`POST /api/request-generate`

Inputs:

- taxType: VAT | INCOME_TAX | CORPORATE_TAX | WITHHOLDING_TAX | YEAR_END_SETTLEMENT
- businessType: SOLE | CORPORATION | FREELANCER | ECOMMERCE | RESTAURANT | SERVICE | ETC
- memo: optional string

Output:

- result: Korean client-facing document request message

Save result to `request_generations`.

---

### 11.2 Consultation Summary

Route:

`POST /api/consultation-summary`

Inputs:

- text: optional string
- audio: optional file

At least one of text or audio must exist.

If audio exists:

1. Upload to Supabase Storage
2. Transcribe with OpenAI audio transcription
3. Summarize transcript

Output:

- transcript
- summary
- client_summary
- required_documents
- next_actions

Save result to `consultation_summaries`.

---

### 11.3 Tax Result Explanation

Route:

`POST /api/report-explanation`

Inputs:

- taxType
- currentTax
- previousTax optional
- changeReason optional
- memo optional

Output:

- result: Korean client-facing explanation draft

Save result to `report_explanations`.

---

## 12. Billing Rules

Use Stripe Checkout for subscription signup.

Use Stripe Billing Portal for subscription management.

Starter plan:

- 99,000 KRW / month
- 500 document requests / month
- 100 consultation summaries / month
- 500 tax explanations / month

For MVP, implement usage tracking in database even if hard enforcement is basic.

Store Stripe customer ID and subscription status in `subscriptions`.

Use Stripe webhooks to update subscription status.

---

## 13. Error Handling

Handle these cases gracefully:

- User not logged in
- Invalid input
- OpenAI API failure
- Supabase failure
- Stripe failure
- File too large
- Unsupported audio format
- Usage limit exceeded

All error messages must be in Korean.

---

## 14. Security Rules

Do not store sensitive tax documents in MVP.

Do not ask users to upload tax returns or full client documents in MVP.

Do not build HomeTax integration in MVP.

Do not build tax filing automation in MVP.

Add visible disclaimer:

"AI가 생성한 초안입니다. 고객 발송 전 세무사가 반드시 검토해야 합니다."

---

## 15. Testing Rules

Write tests for:

- Validators
- Prompt builders
- API success paths
- API validation failures

Use simple unit tests first.

Do not block MVP progress with excessive test infrastructure.

---

## 16. Development Workflow

For each task:

1. Read `PRD.md`, `CLAUDE.md`, and `tasks.md`.
2. Implement only the requested task.
3. Avoid unrelated refactors.
4. Show changed files.
5. Run type check.
6. Fix errors before moving on.

---

## 17. Definition of Done

A task is done when:

- The feature works locally
- TypeScript has no errors
- User-owned data is protected by RLS
- UI is responsive
- Error states are handled
- No secret is exposed to the client

