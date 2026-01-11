# Test Accounts

**For ML-6.10 Testing and Development**

---

## Test Accounts (Premium Access)

| Email | Password | Role | Native Language | Target Language |
|-------|----------|------|-----------------|-----------------|
| testaccount1@gmail.com | tester1 | Student | English | Spanish |
| testaccount2@gmail.com | tester2 | Student | German | Polish |
| testaccount3@gmail.com | tester3 | Tutor | Russian | English |

---

## Grant Premium Access (Supabase SQL)

Run this in Supabase SQL Editor after creating accounts:

```sql
UPDATE profiles
SET
  subscription_plan = 'unlimited',
  subscription_status = 'active',
  subscription_period = 'yearly',
  subscription_started_at = NOW(),
  subscription_ends_at = NOW() + INTERVAL '1 year'
WHERE email IN (
  'testaccount1@gmail.com',
  'testaccount2@gmail.com',
  'testaccount3@gmail.com'
);
```

---

## Testing Checklist

- [ ] Account 1: Test Spanish UI (native=en, target=es)
- [ ] Account 2: Test German UI (native=de, target=pl)
- [ ] Account 3: Test Russian UI (native=ru, target=en)

---

## Notes

- These accounts have unlimited plan (no usage limits)
- Password for account 3 has a space: "tester 3" (may want to change to "tester3")
- After testing, these accounts can be deleted or kept for future QA
