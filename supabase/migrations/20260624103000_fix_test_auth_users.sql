-- GoTrue는 auth.users의 토큰 컬럼이 NULL이면 로그인 시 스캔 오류를 냅니다.
-- SQL로 직접 삽입된 테스트 계정(@taxflow.test)의 NULL 문자열 필드를 빈 문자열로 정규화합니다.

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  phone_change = COALESCE(phone_change, '')
WHERE email LIKE '%@taxflow.test'
  AND (
    confirmation_token IS NULL
    OR recovery_token IS NULL
    OR email_change_token_new IS NULL
    OR email_change IS NULL
    OR email_change_token_current IS NULL
    OR phone_change_token IS NULL
    OR reauthentication_token IS NULL
    OR phone_change IS NULL
  );
