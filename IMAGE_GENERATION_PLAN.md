# Blog Image Generation Plan

> Using Glif API to generate missing blog images with topic-based approach

## Current Situation

### Image Stats (as of Jan 31, 2026)
- **Total articles:** 13,363
- **Existing image files:** 1,201 in `/blog/public/blog/`
- **Articles with image field set:** 7,900
- **Articles where image file exists:** 3,281
- **Articles with missing image file:** 4,619 (2,221 unique missing)
- **Articles with NULL image field:** 5,463

### Key Insight
Many articles share the same topic across different target languages. Instead of generating 10,000+ unique images, we can generate **~25-30 topic images** and reuse them.

## Topic Distribution

| Topic | Articles | Notes |
|-------|----------|-------|
| meeting-family/in-laws | 1,148 | Highest volume |
| pet-names | 638 | Terms of endearment |
| romantic-phrases | 471 | Love expressions |
| pronunciation | 461 | How to pronounce |
| grammar | 456 | Grammar guides |
| greetings | 435 | Hello/goodbye |
| i-love-you | 364 | Saying "I love you" |
| compliments | 347 | Flattery/compliments |
| date-night | 323 | Date vocabulary |
| hard-to-learn | 319 | Language difficulty |
| common-words | 307 | 100 common words |
| support | 307 | Emotional support |
| argue | 306 | Arguments/disagreements |
| love-letter | 306 | Love letter writing |
| makeup | 306 | Making up after fight |
| miss-you | 306 | "I miss you" phrases |
| first-date | 306 | First date phrases |
| flirting | 303 | Flirting phrases |
| apology | 303 | Saying sorry |
| essential-phrases | 299 | 25/50/100 phrases |
| other | 5,352 | Various/uncategorized |

## Proposed Approach

### Strategy: Topic-Based Images
Generate **1 high-quality image per topic** and assign to all articles of that topic. This:
- ✅ Reduces cost dramatically (25-30 images vs 10,000+)
- ✅ Maintains visual consistency
- ✅ Fast to implement
- ✅ Still provides OG/social images

### Image Prompts (Couples/Romance Themed)

| Topic | Prompt Concept |
|-------|----------------|
| pet-names | Couple cuddling with speech bubbles showing heart emojis |
| i-love-you | Couple holding hands, romantic sunset, hearts |
| romantic-phrases | Couple whispering to each other, romantic setting |
| meeting-family | Couple meeting parents, warm family scene |
| greetings | Couple waving hello, friendly atmosphere |
| date-night | Couple at romantic dinner, candles |
| grammar | Open book with language symbols, study scene |
| pronunciation | Person speaking with sound waves visualized |
| compliments | Partner blushing from compliment, hearts |
| common-words | Vocabulary cards floating, study aesthetic |
| flirting | Playful couple, flirtatious body language |
| miss-you | Long-distance couple, video call or hearts |
| love-letter | Handwritten letter with pen, romantic |
| argue | Couple turned away, storm clouds (recoverable) |
| makeup | Couple hugging after argument, rainbow/sunshine |
| apology | Person offering flowers/gift apologetically |
| support | Couple embracing supportively, comfort scene |
| first-date | Couple meeting for first time, nervous excitement |
| hard-to-learn | Mountain to climb, learning journey metaphor |
| essential-phrases | Phrasebook/flashcards, travel/couple scene |

### Image Style Guide
- **Style:** Warm, inviting illustration (not photorealistic)
- **Colors:** Soft pastels, romantic palette
- **Mood:** Positive, supportive, loving
- **Format:** 1200x630 (OG image standard), JPG/WebP
- **No text:** Keep images clean for any language

## Glif API Setup

### 1. Get API Token
1. Go to https://glif.app/settings/api-tokens
2. Create new token
3. Add to `/lovelanguages-multilang/.env.local`:
   ```
   GLIF_API_KEY=your_token_here
   ```

### 2. Choose Workflow
Options (cheapest first):
- **FLUX Schnell** (~1 credit) - Fast, good quality
- **FLUX Dev** (~3 credits) - Better quality
- **FLUX Pro** (~10 credits) - Best quality

Recommendation: **FLUX Schnell** for batch generation, then upgrade select hero images if needed.

### 3. API Call Format
```javascript
const response = await fetch('https://simple-api.glif.app', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GLIF_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'WORKFLOW_ID',  // FLUX Schnell workflow ID
    inputs: ['romantic couple learning language, warm illustration, no text']
  })
});
const result = await response.json();
// result.output = image URL
```

## Implementation Plan

### Phase 1: Setup (Day 1)
- [ ] Create Glif account and get API token
- [ ] Add token to .env.local
- [ ] Find/create FLUX Schnell workflow ID
- [ ] Create `scripts/generate-topic-images.mjs`

### Phase 2: Generate Images (Day 1-2)
- [ ] Generate 25-30 topic images
- [ ] Download to `/blog/public/blog/topics/`
- [ ] Review quality, regenerate any bad ones

### Phase 3: Database Update (Day 2)
- [ ] Create `scripts/assign-topic-images.mjs`
- [ ] Match articles to topics by slug patterns
- [ ] Update image field in Supabase for all articles
- [ ] For uncategorized ("other"), use a generic "couples learning" image

### Phase 4: Verify (Day 2-3)
- [ ] Re-run 404 check for all images
- [ ] Test OG images render correctly
- [ ] Deploy to production

## Cost Estimate

### Glif Credits
- 30 images × 1 credit (FLUX Schnell) = **30 credits**
- With buffer for retries: **50 credits**
- Cost: ~$0.50 (part of $1.99 200-credit bundle)

### Time Estimate
- Setup: 1 hour
- Image generation: 30 min
- Database update script: 1 hour
- Testing: 30 min
- **Total: ~3 hours**

## Scripts to Create

### 1. `scripts/generate-topic-images.mjs`
```javascript
// Generate images for each topic using Glif API
// Save to /blog/public/blog/topics/{topic}.jpg
```

### 2. `scripts/assign-topic-images.mjs`
```javascript
// Match articles to topics by slug patterns
// Update image field in Supabase
// Handle edge cases and "other" category
```

### 3. `scripts/verify-images.mjs`
```javascript
// Check all articles have valid image paths
// Verify image files exist
// Report any gaps
```

## Alternative: If Glif Doesn't Work

1. **OpenAI DALL-E 3** - More expensive but reliable
2. **Replicate API** - SDXL or FLUX models
3. **Manual Canva/Figma** - Create template, generate variations

## Notes

- Richard prefers topic-based images (same per target language)
- Focus on cheapest option (FLUX Schnell / "z image turbo")
- No Glif API key currently set up - needs Richard's account
- Can reuse same image for multiple topics if needed to reduce cost further

---

*Created: Jan 31, 2026*
*Status: Planning*
