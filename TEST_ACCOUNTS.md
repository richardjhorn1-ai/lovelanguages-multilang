# Test Accounts

**For ML-10 Multi-Language Testing and Development**

---

## Test Accounts (Premium Access)

| Email | Password | Role | Native Language | Target Language | Test Focus |
|-------|----------|------|-----------------|-----------------|------------|
| testaccount1@gmail.com | tester1 | Student | English (en) | Polish (pl) | Original flow (regression) |
| testaccount2@gmail.com | tester2 | Student | Spanish (es) | Polish (pl) | Non-English native speaker |
| testaccount3@gmail.com | tester3 | Student | English (en) | Spanish (es) | Non-Polish target |
| testaccount4@gmail.com | tester4 | Student | Spanish (es) | French (fr) | No English involved |
| testaccount5@gmail.com | tester5 | Student | English (en) | Russian (ru) | Cyrillic script |
| testaccount6@gmail.com | tester6 | Tutor | English (en) | Greek (el) | Greek script + Tutor role |

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
  'testaccount3@gmail.com',
  'testaccount4@gmail.com',
  'testaccount5@gmail.com',
  'testaccount6@gmail.com'
);
```

---

## Testing Checklist

### Per-Account Language Verification
- [ ] Account 1 (en→pl): Original Polish flow works
- [ ] Account 2 (es→pl): Spanish UI, Polish learning content
- [ ] Account 3 (en→es): English UI, Spanish learning content
- [ ] Account 4 (es→fr): Spanish UI, French learning content (no English)
- [ ] Account 5 (en→ru): English UI, Russian/Cyrillic content
- [ ] Account 6 (en→el): English UI, Greek content, Tutor features

### Core Features (Test on Each Account)
- [ ] Chat responds in native language
- [ ] Learn mode shows tables/drills
- [ ] Vocabulary filtered by target language
- [ ] Games load with correct language
- [ ] Progress tracked per language

---

## Notes

- All accounts have unlimited plan (no usage limits)
- Account 6 is a Tutor role for testing tutor-specific features
- Passwords are `tester[1-6]` matching account number

---

*Last updated: January 20, 2026*
