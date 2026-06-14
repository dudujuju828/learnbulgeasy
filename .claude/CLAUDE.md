# LearnBulgEasy — CLAUDE.md

## Vision

A gamified Bulgarian vocabulary learning app built around **heaps** (focused 5-word vocab sets) arranged on a **linear pirate-ship map**. Players complete heaps by getting all 5 words correct twice (two loops), unlocking adjacent heaps and growing their personal dictionary. Persistent backend, scalable to thousands of words.

**Critical constraints:**
- **Vertical mobile only:** Designed exclusively for portrait-orientation mobile devices (375w). No landscape, no tablet, no desktop.
- **EN→BG uses Cyrillic:** When learning English-to-Bulgarian, players must type answers in Cyrillic (e.g., "bread" → "хляб"), not Latin transliteration.

## Architecture

### Tech Stack
- **Frontend:** Next.js 16+ App Router, React 19, TypeScript
- **UI Component Library:** shadcn/ui (primary)
- **Additional Libraries:** Claude's choice (prioritize lightweight, proven, community-backed)
- **Styling:** Tailwind CSS (via shadcn)
- **State Management:** React hooks + Context (frontend); server state via backend
- **Backend:** Next.js API routes (serverless functions)
- **Database:** Vercel Postgres (serverless PostgreSQL, managed by Vercel)
- **Auth:** Simple email/password via Vercel Postgres (no external auth service)
- **Deployment:** Vercel (frontend + backend + database all integrated)

### Scaling Approach
- **Content:** Heaps stored in Vercel Postgres; load dynamically on demand
- **Users:** Full persistence via Vercel Postgres; integrated with Vercel deployment
- **Performance:** Lazy-load map; preload adjacent heaps; optimize for mobile
- **Concurrency:** Vercel Postgres scales automatically for concurrent users
- **Setup:** On Vercel deployment, enable "Vercel Postgres" addon in project dashboard (one-click)

## Heap Mechanics

### Definition
A **heap** = 5 Bulgarian words with English translations, focused on a single theme or category.

### Two Learning Modes
1. **EN→BG:** English prompt → type Bulgarian answer **in Cyrillic**
2. **BG→EN:** Bulgarian prompt (Cyrillic) → type English answer

Player chooses mode when starting a heap.

### Completion Flow
1. Player selects a locked heap adjacent to a completed heap
2. Heap unlocks, presenting 5 prompts in chosen mode
3. **EN→BG mode:** Player sees English word and must type the Cyrillic Bulgarian answer (e.g., "bread" → must type "хляб")
4. **BG→EN mode:** Player sees Cyrillic Bulgarian word and must type English answer (e.g., "хляб" → must type "bread")
5. **First Loop:** Get all 5 correct in sequence (one mistake resets to 0)
6. **Second Loop:** Get all 5 correct again in sequence (same rule)
7. On completion of 2nd loop: heap marked as **complete**, adjacent heaps unlock
8. Player's dictionary grows by 5 words (unlock entry in Dictionary screen)

### Answer Matching
- Reuse bulgpop's normalize/matches logic:
  - Trim whitespace, lowercase, drop punctuation
  - Handle `/` alternatives (e.g., `hand / arm` accepts either)
  - Support Cyrillic and Latin spelling variants
- Strict matching (no partial credit)

### Replay & Practice
- Completed heaps are **always replayable** (for review/practice)
- Replayed heaps count toward stats but don't unlock new heaps or dictionary entries
- No penalty for failures on replayed heaps
- Stats per heap: total attempts, best streak, date completed, last played

## Map & Progression

### Visual Design
- **Pirate-ship map** aesthetic: compass, treasure markers, water, nautical theme, cartoonish/playful style
- **Linear layout:** Heaps arranged in a single line (left-to-right or top-to-bottom scrollable)
- **Visual hierarchy:** Completed heaps (treasure found), locked heaps (locked chests), current heap (highlighted)
- **Scrollable:** Backtrack by scrolling up/down to replay earlier heaps or review progress
- **Visual cues:** Next available heap highlighted; completed heaps with checkmarks; current position marked

### Progression
- **Linear path:** Heaps follow a single sequence (no branching)
- **Backtracking:** Always allowed — replay any completed heap or scroll through map
- **No blocking:** Completed heaps don't prevent forward movement
- **Unlocking:** Complete a heap twice → adjacent heaps unlock, new words added to Dictionary

### Statistics & History
- **Per-heap stats:** Attempts, best run (in sequence), completion date, last played
- **Overall stats:** Total heaps completed, total words learned, days played, current streak (optional)

## Dictionary & Rewards

### Dictionary System
- **Reward Loop:** Complete a heap → unlock 5 new words in your personal Dictionary
- **Dictionary View:** Searchable, browsable list of all unlocked words
- **Per entry:** EN word, BG word (Cyrillic + Latin), pronunciation (TTS replay button)
- **Progress:** Shows which words are in your dictionary; heaps completed that added them

### No Social Features
- No leaderboards, no user-to-user comparison, no achievements tied to other players
- Pure single-player, progress-focused experience

## Content & Scaling

### Heap Count & Themes
- **Starting content:** 10 heaps (50 words total)
- **Future scaling:** Expand to 100+ heaps (500+ words) over time
- **Thematic organization:** Each heap has a theme (Food, Verbs, Travel, Body, Emotions, Objects, Places, Time, Greetings, Numbers, etc.)
- **Category subtitles:** For large categories, split into themed sub-heaps:
  - "Food 1: Kitchen Basics" (bread, water, salt, cheese, butter)
  - "Food 2: Fruits & Vegetables" (apple, carrot, tomato, banana, grape)
  - Labeled clearly in heap name and description

### Vocab Structure
```typescript
Heap {
  id: "h_001",
  name: "Food 1: Kitchen Basics",
  description: "Essential kitchen words and staples",
  theme: "Food",
  order: 1,  // position on linear map
  words: [
    { en: "bread", bg: "хляб", cyr: "hlyab" },
    { en: "water", bg: "вода", cyr: "voda" },
    { en: "salt", bg: "сол", cyr: "sol" },
    { en: "cheese", bg: "сирене", cyr: "sirene" },
    { en: "butter", bg: "масло", cyr: "maslo" }
  ]
}
```

### Claude's Vocab Generation
- **Claude writes the initial 10 heaps** with curated, thematic vocab
- **Quality criteria:**
  - Real, useful Bulgarian words (Cyrillic + Latin transcription)
  - Beginner-friendly (no obscure terms)
  - Phonetically diverse (vowels, consonants, stress patterns)
  - Thematically coherent per heap
- **Future expansion:** Claude can generate additional heaps on demand; you approve vocab

### TTS & Pronunciation
- Reuse bulgpop's browser TTS for Bulgarian words
- Option to auto-speak words on heap load (toggleable in settings)
- Manual replay button per word in feedback
- Pronunciation available in Dictionary view

## UI/UX Philosophy

### Design Principles
- **Cartoonish/playful:** Bright colors, rounded corners, fun fonts, nautical theme
- **Clarity over decoration:** shadcn components for clean, readable UI; custom styling for pirate theme
- **Mobile-first (VERTICAL):** Designed exclusively for vertical mobile devices (375w iPhone, portrait orientation). All screens stack vertically. No landscape support needed.
- **Feedback loops:** Show results immediately (correct/incorrect, sequence progress, loop counter)
- **Low friction:** Minimize clicks to start; answer input always visible and focused
- **No complexity:** Single-player focus; no settings overload

### Key Screens
1. **Map view:** Linear pirate-ship map, scrollable, showing heaps (locked/completed/current), progress
2. **Heap screen:** Heap title, mode selector (EN→BG or BG→EN), 5 words, answer input, loop counter (1/2 or 2/2)
3. **Results screen:** Feedback per word (correct/incorrect), loop progress, option to retry or move on
4. **Dictionary:** All unlocked words, searchable, with TTS replay and source heap info
5. **Profile/Stats:** Total heaps completed, words in dictionary, days active, streak (optional)

## Database Schema (Vercel Postgres)

### Core Tables
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Heaps (content)
CREATE TABLE heaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  words JSONB NOT NULL,  -- array of {en, bg}
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Progress
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  heap_id UUID NOT NULL REFERENCES heaps(id),
  completed BOOLEAN DEFAULT false,
  loops_completed INTEGER DEFAULT 0,  -- 0, 1, or 2
  last_played TIMESTAMP,
  total_attempts INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, heap_id)
);

-- Dictionary (unlocked words per user)
CREATE TABLE dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  heap_id UUID NOT NULL REFERENCES heaps(id),
  words JSONB NOT NULL,  -- 5 words unlocked from heap
  unlocked_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_heap_id ON user_progress(heap_id);
CREATE INDEX idx_dictionary_user_id ON dictionary(user_id);
CREATE INDEX idx_heaps_order ON heaps("order");
```

### Setup
- Schema is auto-created on first deployment via migration script
- Initial 10 heaps are seeded into `heaps` table by Claude
- No manual database setup needed — Vercel Postgres connection string is provided by Vercel

## Development Workflow

### Code Style
- TypeScript strict mode
- shadcn components for UI (buttons, inputs, cards, modals)
- Tailwind classes for layout; custom CSS for pirate theme
- Reusable hooks for heap logic, progression state, TTS, API calls
- API routes in Next.js (e.g., `/api/heaps`, `/api/progress`) for backend interaction

### Data Layer
- Vercel Postgres client for real-time syncing (optional; can start with REST)
- LocalStorage for UI state only (e.g., selected mode, scroll position)
- All persistent data (progress, dictionary) lives in Vercel Postgres

### Testing
- **Build verification only** (no unit/integration tests)
- Real-world testing on deployed main branch
- Mobile testing required before shipping UI changes

### Deployment Workflow
- **Commit & push to main after each major milestone**
- Major milestones:
  - Auth system complete (signup/login working)
  - Heap component + gameplay loop complete
  - Map layout + progression complete
  - Dictionary system + rewards complete
  - Full pirate theme + final polish
  - 10 heaps seeded into DB
- **Auto-redeploy to Vercel** on every push to main
- Each milestone is a shippable, testable version
- Use `git commit -m "Milestone: <description>"` for clarity

## Deployment & Operations

- **Main branch** = production (always deployable)
- **Auto-deploy to Vercel** on every push to main (no manual steps)
- **Milestone commits** trigger new deployments — each is a working, tested version
- **Vercel Postgres** automatically provisioned and connected (no extra setup after first link)
- Roll back via `git revert` if needed
- Monitor deployed versions for mobile UX issues (primary user base is mobile)

## MVP Checklist

- [ ] Next.js app with shadcn integration
- [ ] Vercel Postgres setup (link repo to Vercel, enable Postgres addon)
- [ ] Database schema creation script (migrations)
- [ ] Next.js API routes for heap logic (`/api/heaps`, `/api/progress`, `/api/dictionary`)
- [ ] Auth system (simple email/password login via Vercel Postgres)
- [ ] Heap component (5-word vocab display, answer input, mode toggle)
- [ ] Map layout (linear scrollable, pirate-ship aesthetic)
- [ ] Progression tracking (DB queries, state management)
- [ ] Two-loop completion logic (get all 5 correct twice)
- [ ] Dictionary system (unlock words on completion)
- [ ] Results screen (feedback, loop counter, next steps)
- [ ] TTS integration (Bulgarian speech)
- [ ] Pirate-ship visual theme (colors, fonts, icons)
- [ ] Mobile responsive (375w+ vertical only)
- [ ] 10 initial heaps with vocab (Claude-written, seeded into DB)
- [ ] Deploy to Vercel with Postgres addon
- [ ] Test end-to-end (signup, play heap, unlock words)

## Nice-to-Haves (Post-MVP)

- Daily challenges (daily heap, bonus rewards)
- Achievements (50 heaps completed, etc.)
- Custom vocab upload (user-generated)
- Spaced repetition mode (review heaps at intervals)
- Multiple languages (French, Spanish, etc.)
- Offline mode (download heaps for offline play)
- Family/classroom mode (track multiple learners)

## Aesthetic Direction

- **Color palette:** Ocean blues, treasure golds, nautical accents, playful contrasts
- **Typography:** Cartoonish, friendly fonts (e.g., Comic Sans alternative or playful serif)
- **Icons:** Pirate-themed (ship, compass, treasure chests, skull, waves)
- **Interactions:** Satisfying animations (word unlock, heap completion, dictionary entry)
- **Mobile UX:** Large touch targets, clear feedback, no scrolling jank

---

## Go Build

Ship the MVP. Get users. Iterate on feedback.

**Start date:** Today  
**Target launch:** 2–3 weeks  
**Scope:** 10 heaps, full loop logic, dictionary, pirate aesthetics
