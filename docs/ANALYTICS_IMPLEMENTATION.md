# Analytics Implementation Plan

**Goal:** Comprehensive user journey tracking to understand acquisition, activation, retention, and monetization.

---

## Event Taxonomy

### 1. Acquisition (How they find us)

| Event | Parameters | Trigger |
|-------|------------|---------|
| `page_view` | `page_path`, `page_title`, `source`, `medium`, `campaign` | Every page load (auto) |
| `blog_article_view` | `article_slug`, `language_pair`, `category` | Blog article loaded |
| `cta_click` | `cta_location`, `cta_text`, `destination` | Any CTA button clicked |
| `app_store_click` | `platform` (ios/android) | App store link clicked |

### 2. Activation (First value moment)

| Event | Parameters | Trigger |
|-------|------------|---------|
| `signup_started` | `method` (email/google/apple) | Signup form opened |
| `signup_completed` | `method`, `referral_source` | Account created |
| `onboarding_step` | `step_number`, `step_name`, `time_spent_ms` | Each onboarding step |
| `onboarding_completed` | `total_time_ms`, `steps_completed`, `native_lang`, `target_lang` | Onboarding finished |
| `first_word_added` | `word`, `target_lang` | First vocabulary word |
| `first_chat_message` | `mode` (ask/learn/coach), `target_lang` | First AI interaction |
| `first_game_played` | `game_type`, `score` | First game completed |

### 3. Monetization (Paywall & Conversion)

| Event | Parameters | Trigger |
|-------|------------|---------|
| `paywall_view` | `trigger_reason`, `page_context`, `usage_count` | Paywall modal shown |
| `paywall_dismissed` | `trigger_reason`, `time_viewed_ms` | Paywall closed without action |
| `plan_selected` | `plan` (standard/unlimited), `billing_period` | Plan clicked |
| `checkout_started` | `plan`, `billing_period`, `price` | Stripe checkout opened |
| `subscription_completed` | `plan`, `billing_period`, `price`, `currency` | Payment successful |
| `subscription_failed` | `plan`, `error_type` | Payment failed |
| `trial_started` | `plan`, `trial_days` | Free trial begins (future) |
| `trial_converted` | `plan`, `days_used` | Trial → Paid (future) |
| `trial_expired` | `plan`, `engagement_score` | Trial ended without conversion |

### 4. Engagement (Feature Usage)

| Event | Parameters | Trigger |
|-------|------------|---------|
| `chat_message_sent` | `mode`, `message_length`, `session_message_count` | User sends message |
| `chat_response_received` | `mode`, `response_time_ms`, `response_length` | AI responds |
| `word_added` | `target_lang`, `word_count_total`, `source` (chat/manual) | Word added to log |
| `word_practiced` | `game_type`, `correct`, `streak` | Word practiced in game |
| `game_started` | `game_type`, `word_count`, `difficulty` | Game session starts |
| `game_completed` | `game_type`, `score`, `duration_ms`, `accuracy` | Game session ends |
| `challenge_created` | `challenge_type`, `word_count` | Partner challenge sent |
| `challenge_completed` | `challenge_type`, `score`, `time_to_complete_ms` | Challenge finished |
| `level_test_started` | `target_lang` | Level test begins |
| `level_test_completed` | `target_lang`, `level_result`, `score` | Level test finished |
| `voice_session_started` | `mode` (voice/listen) | Voice feature used |
| `voice_session_ended` | `mode`, `duration_ms` | Voice session finished |
| `tts_played` | `target_lang`, `word_or_phrase` | Text-to-speech used |

### 5. Retention (Coming Back)

| Event | Parameters | Trigger |
|-------|------------|---------|
| `session_start` | `days_since_last`, `session_count_total` | App opened (auto) |
| `streak_maintained` | `streak_days`, `activity_type` | Daily streak continues |
| `streak_broken` | `previous_streak_days` | Streak lost |
| `partner_invited` | `invite_method` | Partner invite sent |
| `partner_joined` | `inviter_user_id` | Partner accepted invite |
| `notification_clicked` | `notification_type` | Push notification opened (future) |

### 6. Churn Signals (Warning Signs)

| Event | Parameters | Trigger |
|-------|------------|---------|
| `error_encountered` | `error_type`, `error_message`, `page_context` | User-facing error |
| `rage_click` | `element`, `click_count` | Rapid repeated clicks |
| `feature_abandoned` | `feature`, `time_spent_ms`, `completion_percent` | Started but didn't finish |
| `account_deleted` | `reason` (if provided), `days_active`, `subscription_status` | Account deletion |

---

## User Properties (Persistent Attributes)

Set once, updated as needed:

| Property | Description |
|----------|-------------|
| `user_id` | Supabase auth ID (hashed for privacy) |
| `signup_date` | When they created account |
| `native_language` | Their native language |
| `target_language` | Language they're learning |
| `subscription_plan` | free/standard/unlimited |
| `subscription_status` | active/trial/expired/none |
| `partner_status` | solo/paired |
| `total_words` | Vocabulary size |
| `total_xp` | Experience points |
| `current_streak` | Active streak days |
| `lifetime_value` | Total $ spent |

---

## Implementation Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Analytics     │     │   GA4 / Data    │
│   Components    │────▶│   Service       │────▶│   Warehouse     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Supabase      │
                        │   events table  │
                        └─────────────────┘
```

### Analytics Service (`services/analytics.ts`)

Centralized service that:
1. Validates event data
2. Enriches with user properties
3. Sends to GA4
4. Optionally stores in Supabase for our own analysis

```typescript
// Example usage
import { analytics } from '../services/analytics';

// Track event
analytics.track('game_completed', {
  game_type: 'flashcard',
  score: 85,
  duration_ms: 45000,
  accuracy: 0.85
});

// Set user property
analytics.setUserProperty('subscription_plan', 'standard');

// Identify user (after login)
analytics.identify(userId, {
  native_language: 'en',
  target_language: 'pl'
});
```

---

## Agent Assignments

### Felix (Frontend) 🎨
- Create `services/analytics.ts` with typed event interface
- Add event triggers to all components
- Ensure consistent event naming
- Add debug mode for testing

### Bruno (Backend) 🔧
- Create Supabase `analytics_events` table for raw event storage
- Add server-side event validation
- Create API endpoint for events that should be server-validated
- Set up event aggregation for dashboards

### Diana (Infra) 🚀
- Configure GA4 custom dimensions/metrics
- Set up BigQuery export (if needed for complex analysis)
- Create monitoring for event pipeline health
- Document event schema in GA4

### Sofia (Content) ✍️
- Define blog-specific events (article engagement, CTA performance)
- Create content performance dashboard requirements
- Document which events matter for SEO strategy

### Cupid (COO) 💘
- Orchestrate implementation across agents
- Define KPIs and success metrics
- Create weekly analytics review process
- Brief team on insights

---

## Dashboards & Reports

### Daily Standup Metrics
- New signups (with source breakdown)
- Paywall views vs conversions
- Feature engagement (chat, games, vocab)
- Errors encountered

### Weekly Business Review
- Funnel: Visit → Signup → Onboarding → Paywall → Convert
- Retention cohorts (Day 1, Day 7, Day 30)
- Feature adoption rates
- Revenue metrics (MRR, conversion rate, ARPU)

### Content Performance (Sofia)
- Blog → App conversion by article
- Top performing language pairs
- CTA click-through rates
- Time on page vs bounce rate

---

## Privacy Considerations

- Hash user IDs before sending to GA4
- No PII in event parameters
- Respect DNT (Do Not Track) header
- GDPR-compliant: add to Privacy Policy
- Allow users to opt out of analytics

---

## Implementation Phases

### Phase 1: Foundation (Day 1)
- [ ] Create `services/analytics.ts`
- [ ] Add GA4 gtag with custom events support
- [ ] Implement core funnel events (signup, paywall, subscription)
- [ ] Update Privacy Policy

### Phase 2: Engagement (Day 2-3)
- [ ] Add feature usage events (chat, games, vocab)
- [ ] Add learning progress events
- [ ] Create Supabase events table
- [ ] Test all event flows

### Phase 3: Analysis (Day 4-5)
- [ ] Configure GA4 custom dimensions
- [ ] Create Explorations/Funnels in GA4
- [ ] Build first dashboard
- [ ] Document insights process

### Phase 4: Optimization (Ongoing)
- [ ] A/B test based on data
- [ ] Refine events based on questions
- [ ] Automate weekly reports
- [ ] Train Sofia on content insights

---

## Success Metrics

After implementation, we should be able to answer:

1. **Where do users come from?** (Source attribution)
2. **Where do they drop off?** (Funnel analysis)
3. **What features drive retention?** (Engagement correlation)
4. **What content converts best?** (Blog → Signup attribution)
5. **Why do people churn?** (Churn signal analysis)
6. **What's our CAC and LTV?** (Unit economics)

---

*This is a living document. Update as we learn what questions matter most.*
