### 권장 방식

**빌키 발급(인증) → 빌키 저장 → 매월 빌링 승인**

즉, 실제 구조는 다음입니다.

```text
회원가입
→ 요금제 선택
→ 나이스페이 인증창에서 카드 등록
→ BID(빌키) 발급
→ 최초 결제
→ 매월 결제일에 billing_approve.jsp 호출
→ 성공 시 구독 유지
→ 실패 시 재시도/결제수단 변경 요청
```

빌키 발급(인증) 방식은 카드정보 입력과 인증을 나이스페이 결제창에서 처리하고, 가맹점 서버는 인증 결과를 받아 빌키 발급 API를 호출해 BID를 받는 구조입니다. 즉, 당신의 서비스가 카드번호를 직접 다루지 않아도 됩니다. ([Nicepay 개발자 센터][2])

---

## 3. 구독 결제에 필요한 나이스페이 API 구성

### A. 빌키 발급

1인 SaaS 운영이라면 카드정보를 직접 받는 비인증 방식보다, **나이스페이 인증창을 통한 빌키 발급(인증)** 이 훨씬 안전합니다. 인증 방식은 결제자가 나이스페이 인증창에서 카드정보와 인증을 진행하고, 성공 후 AuthToken과 TxTid를 받아 서버에서 빌키 발급 API를 호출합니다. ([Nicepay 개발자 센터][2])

### B. 빌링 승인

매월 결제일에 서버에서 다음 API를 호출합니다.

```text
https://webapi.nicepay.co.kr/webapi/billing/billing_approve.jsp
```

나이스페이 문서상 빌링 승인은 발급된 BID로 결제를 진행하는 서비스이고, `billing_approve.jsp`를 호출하면 결제 승인 처리가 완료됩니다. ([Nicepay 개발자 센터][1])

필수로 관리해야 하는 값:

```text
BID
MID
TID
Moid
Amt
GoodsName
EdiDate
SignData
```

주의할 점은 **빌키 발급 시 받은 TID를 그대로 쓰면 안 되고, 승인 결제마다 새 TID를 생성해야 한다는 점**입니다. 나이스페이 문서도 승인 TID 중복 오류를 피하기 위해 반드시 새로 생성하라고 명시합니다. ([Nicepay 개발자 센터][1])

### C. 빌키 삭제

사용자가 구독을 해지하거나 결제수단을 삭제하면 다음 API를 호출합니다.

```text
https://webapi.nicepay.co.kr/webapi/billing/billkey_remove.jsp
```

문서상 빌키 삭제는 BID, MID, EdiDate, Moid, SignData를 구성해 `billkey_remove.jsp`로 요청하는 구조입니다. ([Nicepay 개발자 센터][1])

---

## 4. 추천 결제 메뉴 구조

세무사 AI 비서 SaaS라면 결제 메뉴는 너무 복잡하면 안 됩니다. 다음 정도가 적절합니다.

```text
상단 메뉴
├── 요금제
├── 무료 체험
└── 로그인

로그인 후 사이드 메뉴
├── 대시보드
├── 자료 요청문 생성
├── 상담 요약
├── 신고 설명문
├── 사용 내역
└── 결제 및 구독
```

`결제 및 구독` 안에는 다음 하위 메뉴를 둡니다.

```text
결제 및 구독
├── 현재 요금제
├── 결제수단 관리
├── 결제내역
├── 요금제 변경
└── 구독 해지
```

---

## 5. 화면 구성

### 1) 요금제 화면 `/pricing`

목적은 **무료 체험 또는 Pro 가입 전환**입니다.

구성:

```text
Starter      49,000원/월
Pro          99,000원/월  ← 추천
Team        249,000원/월
```

버튼:

```text
무료 체험 시작
Pro 시작하기
Team 문의하기
```

Pro 카드에는 다음 배지를 붙입니다.

```text
개인 세무사 추천
가장 많이 선택
```

---

### 2) 구독 시작 화면 `/billing/checkout`

요금제 선택 후 들어오는 화면입니다.

표시 내용:

```text
선택 요금제: Pro
월 결제금액: 99,000원
무료 체험: 14일
체험 종료 후 매월 자동 결제
결제수단: 신용/체크카드
```

필수 동의 체크박스:

```text
[ ] 매월 정기결제에 동의합니다.
[ ] 무료 체험 종료 후 선택한 요금제로 자동 결제되는 것에 동의합니다.
[ ] 서비스 이용약관 및 개인정보처리방침에 동의합니다.
```

버튼:

```text
카드 등록하고 무료 체험 시작
```

이 버튼을 누르면 당신의 서버에서 `Moid`, `EdiDate`, `SignData`를 생성한 뒤 나이스페이 빌키 발급 인증창을 호출합니다.

---

### 3) 나이스페이 카드 등록 인증창

이 화면은 직접 만들지 않고 나이스페이 인증창을 띄우는 구조가 좋습니다.

나이스페이 빌키 발급(인증)은 JS SDK를 추가하고 `goPay(form)`을 호출하면 레이어 팝업 인증창이 나타나며, 결제자는 인증창에서 본인인증 및 카드정보 입력을 진행합니다. 인증 성공 후에는 서버로 인증 결과가 전달됩니다. ([Nicepay 개발자 센터][2])

서비스 화면에서는 이렇게 안내합니다.

```text
안전한 카드 등록을 위해 나이스페이 결제창으로 이동합니다.
TaxFlo는 카드번호를 저장하지 않습니다.
```

---

### 4) 카드 등록 결과 화면 `/billing/complete`

성공 시:

```text
카드 등록이 완료되었습니다.

요금제: Pro
무료 체험 종료일: 2026-07-03
다음 결제 예정일: 2026-07-03
결제금액: 99,000원

[대시보드로 이동]
```

실패 시:

```text
카드 등록에 실패했습니다.

사유:
카드사 인증 실패 또는 사용 불가 카드입니다.

[다시 등록하기]
[다른 카드 사용하기]
```

---

### 5) 결제 및 구독 화면 `/settings/billing`

현재 구독 상태를 보여주는 핵심 관리 화면입니다.

표시 내용:

```text
현재 요금제: Pro
상태: 무료 체험 중 / 활성 / 결제 실패 / 해지 예정
월 결제금액: 99,000원
다음 결제일: 2026-07-03
등록 카드: 신한카드 1234-****-****-5678
```

버튼:

```text
결제수단 변경
요금제 변경
결제내역 보기
구독 해지
```

---

### 6) 결제수단 변경 화면 `/settings/billing/payment-method`

사용자가 카드를 바꾸는 화면입니다.

플로우:

```text
새 카드 등록
→ 나이스페이 빌키 발급 인증창
→ 새 BID 저장
→ 기존 BID 삭제
→ 결제수단 변경 완료
```

주의할 점은 기존 BID를 무조건 먼저 삭제하지 않는 것입니다. 새 카드 등록이 성공한 뒤 기존 빌키를 삭제해야 결제수단 공백이 생기지 않습니다.

---

### 7) 결제내역 화면 `/settings/billing/invoices`

표시 내용:

```text
결제일
요금제
금액
상태
승인번호
영수증
```

예시:

```text
2026-07-03 | Pro | 99,000원 | 결제완료 | 12345678 | 영수증 보기
2026-08-03 | Pro | 99,000원 | 결제완료 | 23456789 | 영수증 보기
```

---

### 8) 결제 실패 화면 `/billing/payment-failed`

결제 실패 시 이메일 링크나 앱 내 배너로 유도합니다.

문구:

```text
이번 달 구독 결제가 완료되지 않았습니다.

서비스 이용을 계속하려면 결제수단을 확인해 주세요.

[결제수단 변경]
[다시 결제하기]
```

운영 정책 추천:

```text
1차 실패: 즉시 알림
2차 재시도: 1일 후
3차 재시도: 3일 후
최종 실패: 구독 정지
```

---

### 9) 구독 해지 화면 `/settings/billing/cancel`

구성:

```text
구독을 해지하시겠습니까?

해지 후에도 현재 결제기간 종료일까지 사용할 수 있습니다.
다음 결제일부터 자동 결제되지 않습니다.
```

선택 질문:

```text
해지 사유를 알려주세요.
- 가격이 부담됨
- 사용 빈도가 낮음
- 기능이 부족함
- 다른 서비스를 사용함
- 기타
```

버튼:

```text
구독 유지하기
구독 해지하기
```

구독 해지 시 바로 BID를 삭제할지, 결제기간 종료 시 삭제할지는 정책을 정해야 합니다. 일반적으로는 `cancel_at_period_end = true` 상태로 두고, 종료일에 빌키 삭제를 실행하는 방식이 좋습니다.

---

## 6. Next.js API 라우트 구조

추천 API 구조는 다음입니다.

```text
/api/billing/prepare
/api/billing/auth-callback
/api/billing/register-billkey
/api/billing/charge
/api/billing/retry
/api/billing/change-card
/api/billing/cancel
/api/billing/remove-billkey
/api/billing/history
/api/billing/webhook/nicepay
```

각 역할은 다음과 같습니다.

| API                             | 역할                                  |
| ------------------------------- | ----------------------------------- |
| `/api/billing/prepare`          | 요금제, 금액, Moid, EdiDate, SignData 생성 |
| `/api/billing/auth-callback`    | 나이스페이 인증창 결과 수신                     |
| `/api/billing/register-billkey` | `cardbill_regist.jsp` 호출 후 BID 저장   |
| `/api/billing/charge`           | `billing_approve.jsp` 호출            |
| `/api/billing/retry`            | 실패 결제 재시도                           |
| `/api/billing/change-card`      | 새 빌키 등록 후 기존 빌키 삭제                  |
| `/api/billing/cancel`           | 구독 해지 예약                            |
| `/api/billing/remove-billkey`   | `billkey_remove.jsp` 호출             |
| `/api/billing/history`          | 결제내역 조회                             |
| `/api/billing/webhook/nicepay`  | 결제통보 수신                             |

나이스페이 결제통보는 결제 완료 시 승인 결과 데이터를 가맹점 URL 또는 IP로 통보하는 서비스입니다. 통보받은 데이터는 반드시 server-side에서 처리해야 하고 민감 정보가 노출되지 않도록 해야 합니다. ([Nicepay 개발자 센터][4])

---

## 7. DB 테이블 설계

기존 `subscriptions` 테이블을 확장하고, 결제 관련 테이블을 추가하는 것을 추천합니다.

```sql
subscriptions
- id
- user_id
- plan
- status
- started_at
- trial_ends_at
- current_period_start
- current_period_end
- next_billing_at
- cancel_at_period_end
- canceled_at
- created_at
- updated_at
```

```sql
billing_keys
- id
- user_id
- nicepay_bid
- nicepay_mid
- card_name
- card_no_masked
- card_code
- card_cl
- is_active
- issued_at
- removed_at
- created_at
```

```sql
payments
- id
- user_id
- subscription_id
- nicepay_tid
- moid
- amount
- goods_name
- result_code
- result_msg
- auth_code
- auth_date
- status
- paid_at
- failed_at
- raw_response
- created_at
```

```sql
payment_attempts
- id
- payment_id
- user_id
- attempt_no
- result_code
- result_msg
- attempted_at
- raw_response
```

```sql
billing_events
- id
- user_id
- event_type
- payload
- created_at
```

절대 저장하면 안 되는 값:

```text
카드번호 원문
카드 비밀번호
CVC
생년월일/사업자번호 원문
```

저장 가능한 값:

```text
BID
마스킹 카드번호
카드사명
카드코드
승인번호
거래번호
결제금액
결제상태
```

---

## 8. 실제 구현 우선순위

1차 MVP에서는 아래까지만 붙이면 충분합니다.

```text
1. 요금제 화면
2. 카드 등록
3. 빌키 저장
4. 최초 결제 또는 무료 체험 시작
5. 결제 및 구독 화면
6. 매월 수동/스케줄 결제
7. 결제 실패 처리
8. 구독 해지
```

처음부터 너무 복잡하게 만들 필요는 없습니다.

특히 초기 고객 10~30명 수준에서는 매일 새벽 한 번 실행되는 서버 작업으로 `next_billing_at <= today`인 구독만 찾아 `billing_approve.jsp`를 호출하면 됩니다.

---

## 9. 최종 추천 구조

당신의 서비스에는 이렇게 적용하세요.

```text
회원 가입
→ 무료 체험 14일
→ 체험 종료일에 구독 상품 결제 유도
→ 첫 결제시 카드 등록
→ 빌키 발급
→ 자동 결제 진행
→ 성공 시 구독 active
→ 실패 시 past_due
→ 3회 실패 시 suspended
→ 이후 매월 같은 결제일 자동 결제
```

요금제별 상품명:

```text
TaxFlo Starter 월 구독
TaxFlo Pro 월 구독
TaxFlo Team 월 구독
```

결제금액:

```text
Starter: 49,000원
Pro: 99,000원
Team: 249,000원
```


[1]: https://developers.nicepay.co.kr/manual-card-billing.php "Manual"
[2]: https://developers.nicepay.co.kr/manual-card-billkey-auth-create.php "Manual"
[4]: https://developers.nicepay.co.kr/manual-noti.php "Manual"
