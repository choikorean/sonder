# PRD.md

# TaxFlow

세무사 고객 커뮤니케이션 자동화 SaaS

Version: MVP v1

---

# Product Vision

세무사가 신고 시즌에 수행하는 반복적인 고객 커뮤니케이션 업무를 자동화한다.

본 서비스는 세법 판단을 제공하지 않는다.

본 서비스는 다음 업무를 지원한다.

1. 자료 요청문 생성
2. 상담 내용 요약
3. 신고 결과 설명문 생성

---

# Problem

세무사는 다음 업무에 과도한 시간을 사용한다.

* 거래처 자료 요청
* 누락 자료 재요청
* 상담 내용 정리
* 신고 결과 설명

이 업무들은 반복적이며 문서 생성 중심이다.

AI로 자동화 가능하다.

---

# Success Metrics

90일 목표

* 가입 세무사 50명
* 유료 고객 20명
* MRR 200만원

12개월 목표

* 유료 고객 50명
* MRR 500만원

---

# Target User

## Primary

개인 세무사 사무소 대표

특징

* 거래처 50~300개
* 직원 1~5명
* 카카오톡 중심 업무

---

## Secondary

소규모 세무법인 파트너

---

# User Stories

## Story 1

세무사로서

거래처에게 자료 요청을 빠르게 보내고 싶다.

그래서

반복 작성 시간을 줄이고 싶다.

---

## Story 2

세무사로서

상담 내용을 자동 정리하고 싶다.

그래서

후속 업무를 놓치지 않고 고객에게 전달하고 싶다.

---

## Story 3

세무사로서

신고 결과를 쉽게 설명하고 싶다.

그래서

고객 문의를 줄이고 싶다.

---

# MVP Scope

포함

* 회원가입
* 로그인
* 자료 요청 생성
* 상담 요약
* 설명문 생성
* 사용 기록
* Stripe 결제

제외

* 홈택스 연동
* 더존 연동
* CRM
* OCR
* 팀 기능
* 세법 QA
* 자동 신고

---

# Functional Requirements

## Feature A

자료 요청 생성

### Input

taxType

enum

* VAT
* INCOME_TAX
* CORPORATE_TAX

businessType

enum

* SOLE
* CORPORATION

memo

string

### Output

고객 발송용 자료 요청문

### Constraints

생성 시간

5초 이하

---

## Feature B

상담 요약

### Input

audio file

or

plain text

### Process

1. Whisper
2. GPT Summary

### Output

summary

client_summary

required_documents

next_actions

---

## Feature C

신고 결과 설명문

### Input

current_tax

previous_tax

change_reason

memo

### Output

고객 설명문

---

# Non Functional Requirements

응답시간

5초 이하

가용성

99%

모바일 지원

필수

반응형

필수

---

# Roles

## Guest

가능

* 랜딩페이지

불가

* 생성 기능

---

## User

가능

* 생성
* 조회
* 삭제

본인 데이터만 접근

---

## Admin

가능

* 사용자 조회
* 구독 조회

---

# Database Schema

## profiles

id uuid pk

email text

name text

created_at timestamp

---

## subscriptions

id uuid pk

user_id uuid

plan text

status text

stripe_customer_id text

created_at timestamp

---

## request_generations

id uuid pk

user_id uuid

tax_type text

business_type text

memo text

result text

created_at timestamp

---

## consultation_summaries

id uuid pk

user_id uuid

audio_url text

transcript text

summary text

client_summary text

required_documents text

next_actions text

created_at timestamp

---

## report_explanations

id uuid pk

user_id uuid

current_tax numeric

previous_tax numeric

change_reason text

memo text

result text

created_at timestamp

---

# Row Level Security

모든 테이블

user_id = auth.uid()

조건

읽기 가능

쓰기 가능

삭제 가능

본인 데이터만

---

# API Design

## POST

/api/request-generate

### Request

{
"taxType":"VAT",
"businessType":"SOLE",
"memo":"온라인 쇼핑몰"
}

### Response

{
"result":"..."
}

---

## POST

/api/consultation-summary

multipart/form-data

audio

### Response

{
"summary":"...",
"clientSummary":"...",
"requiredDocuments":"...",
"nextActions":"..."
}

---

## POST

/api/report-explanation

### Request

{
"currentTax":4500000,
"previousTax":2100000,
"changeReason":"매출 증가"
}

### Response

{
"result":"..."
}

---

## GET

/api/history

생성 기록 조회

---

# Pages

## /

Landing

---

## /login

로그인

---

## /dashboard

기능 선택

최근 생성 내역

---

## /requests

자료 요청 생성

---

## /consultations

상담 요약

---

## /reports

설명문 생성

---

## /history

생성 내역

---

## /settings

설정

구독 관리

---

# OpenAI Integration

Model

GPT

Temperature

0.3

목표

일관성

---

Whisper

음성 인식

---

# Prompt Templates

## 자료 요청

세무사 사무소가 고객에게 보내는
자료 요청문을 작성하라.

명확하고 친절하게 작성하라.

---

## 상담 요약

다음 상담 내용을 분석하라.

출력

1. 요약
2. 고객용 요약
3. 필요자료
4. 후속조치

---

## 설명문

세무사가 고객에게 보내는
세금 설명문을 작성하라.

전문용어를 최소화하라.

---

# Billing

Stripe

Plan

Starter

월 99,000원

사용량

* 자료 요청 500회
* 상담 요약 100회
* 설명문 500회

---

# Tech Stack

Frontend

Next.js 15

TypeScript

Tailwind

shadcn/ui

---

Backend

Route Handlers

---

Database

Supabase PostgreSQL

---

Auth

Supabase Auth

---

Storage

Supabase Storage

---

AI

OpenAI

Whisper

---

Payments

Stripe

---

Hosting

Vercel

---

# Development Order

Phase 1

Auth

Dashboard

Database

---

Phase 2

자료 요청 생성

---

Phase 3

상담 요약

---

Phase 4

설명문 생성

---

Phase 5

Stripe

---

# Out Of Scope

* 홈택스 API
* 세무사랑 연동
* 더존 연동
* CRM
* 팀 기능
* 모바일 앱
* 세법 판단 AI
* 자동 신고
