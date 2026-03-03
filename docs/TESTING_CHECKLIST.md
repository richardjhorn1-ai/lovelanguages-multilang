# Testing Checklist — release/security-analytics

**Branch:** `release/security-analytics`
**Preview:** Check Vercel for latest deploy

---

## 🔒 Security Automation

- [ ] Pre-commit hooks installed (`pip install pre-commit && pre-commit install`)
- [ ] Gitleaks catches test secret (try committing a fake key)
- [ ] GitHub Actions run on PR (check Actions tab)

---

## 📊 Analytics (GA4)

Open GA4 Real-time while testing: https://analytics.google.com

- [ ] **Signup started** — Click Google OAuth on login → check `signup_started` event
- [ ] **Signup completed** — Complete signup → check `signup_completed` event
- [ ] **Paywall view** — Hit paywall as free user → check `paywall_view` event
- [ ] **Plan selected** — Click a plan → check `plan_selected` event
- [ ] **Checkout started** — Click Subscribe → check `checkout_started` event

---

## 🔑 Password Reset

### From Login Page
- [ ] "Forgot password?" link visible on login (not signup)
- [ ] Click it → enter email → click "Send reset link"
- [ ] Email arrives from Supabase
- [ ] Click link → lands on `/reset-password`
- [ ] Page shows 🔐 and password form (not error)
- [ ] Enter new password + confirm → click Update
- [ ] Success message shows ✅
- [ ] Redirects to home after ~2 seconds
- [ ] Can login with new password

### Styling Check
- [ ] Pink gradient background
- [ ] White rounded card
- [ ] Rose accent button
- [ ] Loading spinner while verifying link

---

## 📧 Email Change

- [ ] Profile → "Account Settings" section exists
- [ ] Click to expand → shows email + password options
- [ ] Click "Change" next to email
- [ ] Form appears with new email input
- [ ] Enter new email → click "Update Email"
- [ ] Success message: "Check your new email to confirm"
- [ ] Confirmation emails arrive at BOTH old and new address
- [ ] After confirming both → email is updated

---

## 🔐 Password Change (from Profile)

- [ ] Profile → Account Settings → "Reset Password" button
- [ ] Click → success message about email sent
- [ ] Email arrives → same flow as forgot password

---

## ✅ Final Checks

- [ ] Build passes (`npm run build`)
- [ ] No console errors on key pages
- [ ] Mobile responsive (check on phone)

---

**After all tests pass:** Merge `release/security-analytics` → `main`
