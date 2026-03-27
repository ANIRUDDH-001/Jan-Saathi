# Jan Saathi — Complete UI Specification
### Team Algomind | Build4Bharat 9.0 | CSIHACK05
**Version:** 1.0 | **For:** Figma handoff + frontend integration  
**Default language:** English | **Secondary language:** Hindi (full parity)  
**Auth:** Google OAuth (optional) | **Session:** Anonymous UUID (always)

---

## 0. Conventions Used in This Document

- Every copy entry is written as `EN: "..."` / `HI: "..."` — both strings must exist in i18n config before Figma hand-off.
- Every component is written as `[ComponentName]` — these become Figma component names exactly.
- States are written as `STATE: default | loading | error | empty | success`.
- API calls are written as `→ POST /api/...` — these are contracts, not suggestions.
- `*` beside a field = only visible when user is logged in.
- `†` beside a field = only visible to admin role.

---

## 1. Model Fallback Strategy

The frontend never knows which model is active. All fallback logic lives in the backend. Documented here so the frontend team understands why response tone may vary slightly.

| Priority | Model ID | TPM | Daily Ceiling | Trigger |
|---|---|---|---|---|
| 1 — Primary | `meta-llama/llama-4-scout-17b-16e-instruct` | 30K | 500K | Default |
| 2 — Reasoning fallback | `llama-3.3-70b-versatile` | 12K | 100K | 429 on primary |
| 3 — Rate relief | `moonshotai/kimi-k2-instruct` | 10K | 300K | 429 on fallback 1 |
| 4 — Last resort | `qwen/qwen3-32b` | 6K | 500K | 429 on fallback 2 |

**Tone shift rule (important for UX):** When a fallback is active, the system prompt instructs the model to respond slightly more conversationally — shorter sentences, warmer phrasing. The citizen never sees an error. No spinner, no degradation notice. A session locks to the model it starts on; fallback only triggers on new requests, never mid-conversation.

---

## 2. Auth Flow

```
ANONYMOUS PATH (default for all users)
──────────────────────────────────────
User arrives at any route
  → Backend generates anonymous session UUID
  → UUID stored in localStorage as `js_session_id`
  → All queries tagged with this UUID
  → Queries stored in anonymous_queries table for RAG training
  → No login required to use any citizen feature

OPTIONAL LOGIN PATH
───────────────────
User clicks [LoginButton] (top-right, always visible)
  → Google OAuth popup opens
  → On success: Google returns id_token to /auth/callback
  → Backend upserts user row (email, name, avatar) in users table
  → Anonymous session UUID is merged with user row (session_id → user_id)
  → JWT stored in localStorage as `js_auth_token`
  → Profile data (if any saved previously) auto-loaded
  → [LoginButton] becomes [UserAvatarButton] (shows Google avatar)

PROFILE SAVE PROMPT (post-match, shown once per anonymous session)
───────────────────────────────────────────────────────────────────
After first successful scheme match:
  → [SaveProfilePrompt] banner appears at bottom of chat screen
  → EN: "Save your profile to skip these questions next time"
  → HI: "अगली बार सवाल छोड़ने के लिए अपना प्रोफाइल सेव करें"
  → Two CTAs: [LoginWithGoogle] and [NotNow]
  → If NotNow: banner dismissed, never shown again in this session
  → If login: profile saved, banner dismissed permanently for this user

RETURNING LOGGED-IN USER
─────────────────────────
User arrives → JWT found in localStorage → verified with Supabase
  → Profile loaded → chat pre-populated with saved fields
  → No profile questions asked for fields already saved
  → New or changed fields still asked if detected as different

ADMIN PATH
──────────────────────────────────────────────────────────────────
Admin user (role = 'admin' in users table) logs in via Google OAuth
  → Same Google OAuth flow as citizen
  → On callback: backend checks role field in users table
  → If role = 'admin': redirect to /admin/dashboard
  → If role = 'citizen' (or null): redirect to / (no admin access)
  → Admin routes guarded by AdminRouteGuard component
  → Default admin seeded: aniruddhvijay2k7@gmail.com (role = 'admin')
```

---

## 3. Routing Map

```
PUBLIC ROUTES (accessible to everyone, anonymous or logged-in)
/                     → Landing page
/chat                 → Main chat + voice interface
/schemes              → Scheme results (requires active session with match state)
/schemes/:schemeSlug  → Individual scheme detail + guided application
/track                → Application status tracker
/auth/callback        → Google OAuth return handler (no UI, redirect only)
/profile*             → User profile page (redirect to / if not logged in)
/404                  → Not found page

ADMIN ROUTES (role = 'admin' required, else redirect to /)
/admin                → Redirect to /admin/dashboard
/admin/dashboard      → Stats overview
/admin/pipeline       → Data pipeline monitor + quality review queue
/admin/schemes        → All schemes table (filter, search, approve/reject)
/admin/schemes/:id    → Individual scheme detail + Groq verification panel
/admin/sessions       → Anonymous query analytics
/admin/users          → Admin user management
```

**Route guard logic:**
- `PublicRoute` — renders always, passes session UUID through context
- `PrivateRoute` — checks JWT; if absent, shows [SaveProfilePrompt] modal instead of redirecting
- `AdminRouteGuard` — checks JWT + role = 'admin'; if fails, hard redirect to /

---

## 4. Global Layout Shell

Every screen shares this shell. Figma: build as a master frame.

```
┌─────────────────────────────────────────────────────────────┐
│ [TopNav]                                                     │
│  Left:  [Logo] "Jan Saathi"                                  │
│  Centre: (empty on citizen screens, breadcrumb on admin)     │
│  Right:  [LanguageToggle]  [LoginButton] OR [UserAvatarMenu] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [PageContent]  (each screen fills this area)               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Footer] — minimal: tagline + GitHub link + hackathon credit │
└─────────────────────────────────────────────────────────────┘
```

### [TopNav] Component Spec

| Element | EN | HI |
|---|---|---|
| Logo wordmark | Jan Saathi | जन साथी |
| Logo subtext | Government schemes, spoken simply | सरकारी योजनाएं, आसान भाषा में |
| Language toggle label (when EN active) | हिंदी | — |
| Language toggle label (when HI active) | English | — |
| Login button (logged out) | Log in with Google | Google से लॉगिन करें |
| User menu item: Profile | My Profile | मेरा प्रोफाइल |
| User menu item: Logout | Log out | लॉग आउट |
| Admin badge (admin users only) | Admin | एडमिन |

**[LanguageToggle]:** Single button, top-right of nav. Clicking it fires `setLanguage(lang)` in global i18n context. Every string across every screen updates instantly. No page reload. Persisted in localStorage as `js_lang`.

### [Footer] Component Spec

| Element | EN | HI |
|---|---|---|
| Tagline | The citizen does not need to know a scheme exists. Jan Saathi finds it for them. | नागरिक को योजना का नाम जानने की जरूरत नहीं। जन साथी खुद ढूंढता है। |
| Hackathon credit | Built at Build4Bharat Hackathon 9.0 | Build4Bharat Hackathon 9.0 में बनाया गया |

---

## 5. Screen Specifications

---

### SCREEN 1 — Landing Page
**Route:** `/`  
**Access:** Public  
**Purpose:** Single-focus entry point. One action: start speaking or typing. Zero clutter.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ [TopNav]                                             │
├──────────────────────────────────────────────────────┤
│                                                      │
│         [HeroSection]                                │
│           [HeroHeadline]                             │
│           [HeroSubtext]                              │
│           [VoiceButton] ← primary CTA                │
│           [TextInputBar] ← secondary CTA             │
│           [ExampleQueries]                           │
│                                                      │
│         [StatStrip]                                  │
│           57% unclaimed | 600M Hindi speakers        │
│           500+ schemes matched                       │
│                                                      │
│         [HowItWorksSection]  (3 steps, icons)        │
│                                                      │
├──────────────────────────────────────────────────────┤
│ [Footer]                                             │
└──────────────────────────────────────────────────────┘
```

**Components:**

**[HeroHeadline]**
- EN: "Your government schemes. Found in 8 seconds."
- HI: "आपकी सरकारी योजनाएं। 8 सेकंड में मिलती हैं।"
- Font: Largest on the page. Two lines max.

**[HeroSubtext]**
- EN: "Speak in Hindi or English. Jan Saathi matches you to every scheme you qualify for — and tells you exactly how much you can claim."
- HI: "हिंदी या अंग्रेज़ी में बोलें। जन साथी आपके लिए सभी योजनाएं ढूंढता है — और बताता है कि आप कितना पा सकते हैं।"

**[VoiceButton]**  
STATE: default | listening | processing  
- default — large circular mic icon button
  - EN label below: "Tap to speak"
  - HI label below: "बोलने के लिए दबाएं"
- listening — button pulses with animated ring
  - EN: "Listening..."
  - HI: "सुन रहा हूं..."
- processing — spinner
  - EN: "Thinking..."
  - HI: "सोच रहा हूं..."
- On tap: requests mic permission → if granted, starts MediaRecorder → navigates to /chat with audio stream active → if denied, shows [MicPermissionError] toast

**[TextInputBar]**
- Placeholder EN: "Or type here — your state, occupation, income..."
- Placeholder HI: "या यहाँ टाइप करें — राज्य, काम, आमदनी..."
- Submit button EN: "Find my schemes"
- Submit button HI: "मेरी योजनाएं ढूंढें"
- On submit: navigates to /chat with text pre-loaded

**[ExampleQueries]** — 3 clickable chip buttons, clicking loads that text into the chat
| # | EN | HI |
|---|---|---|
| 1 | "I am a farmer in UP, earning ₹80,000/year" | "मैं UP का किसान हूं, ₹80,000 सालाना कमाता हूं" |
| 2 | "Pregnant woman, BPL card, Rajasthan" | "गर्भवती महिला, BPL कार्ड, राजस्थान" |
| 3 | "Daily wage worker, 55 years old, no pension" | "दिहाड़ी मज़दूर, 55 साल, कोई पेंशन नहीं" |

**[StatStrip]** — 3 stats, horizontal row
| Stat | EN | HI |
|---|---|---|
| 1 | 57% of eligible citizens never claim their benefits | 57% पात्र नागरिक अपना हक नहीं ले पाते |
| 2 | 600M Indians speak Hindi as first language | 60 करोड़ भारतीय हिंदी में बात करते हैं |
| 3 | 500+ central government schemes matched | 500+ केंद्र सरकार की योजनाएं खोजी जाती हैं |

**[HowItWorksSection]**
Heading EN: "Three steps. No forms. No English required."
Heading HI: "तीन कदम। कोई फॉर्म नहीं। अंग्रेज़ी की ज़रूरत नहीं।"

| Step | EN Title | EN Body | HI Title | HI Body |
|---|---|---|---|---|
| 1 | Speak naturally | Tell us your state, occupation, age, and income in your own words | बस बोलिए | अपनी भाषा में राज्य, काम, उम्र और आमदनी बताएं |
| 2 | We find your schemes | AI matches your profile against 500+ schemes in under 8 seconds | हम योजनाएं ढूंढते हैं | AI 8 सेकंड में 500+ योजनाओं में से आपके लिए सही योजना चुनता है |
| 3 | Get guided step by step | Every document, every form, every office — spoken to you | हर कदम पर मार्गदर्शन | हर दस्तावेज़, हर फॉर्म, हर दफ्तर — आवाज़ में बताया जाता है |

---

### SCREEN 2 — Chat Interface
**Route:** `/chat`  
**Access:** Public (anonymous UUID session created on entry)  
**Purpose:** Core product. Voice + text conversation that builds citizen profile and returns matched schemes.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ [TopNav]                                                     │
├────────────────────────────────┬─────────────────────────────┤
│                                │                             │
│  [ChatColumn]                  │  [ProfileSidebar]           │
│                                │                             │
│  [ChatBubbleList]              │  [ProfileCard]              │
│    - [BotBubble]               │    State: —                 │
│    - [UserBubble]              │    Occupation: —            │
│    - [BotBubble]               │    Age: —                   │
│    - [TypingIndicator]         │    Income: —                │
│                                │    Category: —              │
│  [ChatInputBar]                │    BPL Card: —              │
│    [VoiceButton]               │    Gender: —                │
│    [TextInput]                 │                             │
│    [SendButton]                │  Fields fill live after     │
│                                │  each extraction turn       │
│                                │                             │
│                                │  [GapCard] (hidden until    │
│                                │   match state reached)      │
│                                │                             │
└────────────────────────────────┴─────────────────────────────┘
```

On mobile: [ProfileSidebar] collapses into a bottom drawer triggered by a pill button.

**Components:**

**[ChatBubbleList]**  
Scrollable. Auto-scrolls to latest. Overflow hidden above.

**[BotBubble]** — left-aligned, Jan Saathi avatar dot  
STATE: default | speaking (TTS playing, subtle pulse on avatar)  
- On TTS response arrival: audio auto-plays, avatar pulses, [SpeakerIcon] shows in bubble
- [SpeakerIcon] click: replay TTS audio
- EN: bot replies in English when language = EN
- HI: bot replies in Hindi when language = HI (Bulbul v3 voice)

**First bot message (opening, shown before user speaks):**
- EN: "Namaste! I'm Jan Saathi. Tell me about yourself — your state, what work you do, your age, and roughly how much you earn in a year. You can speak or type."
- HI: "नमस्ते! मैं जन साथी हूं। मुझे अपने बारे में बताइए — आप कहाँ रहते हैं, क्या काम करते हैं, उम्र क्या है, और साल में कितना कमाते हैं। बोल सकते हैं या टाइप कर सकते हैं।"

**[UserBubble]** — right-aligned  
- Text messages: shown as typed
- Voice messages: shown as transcript text + [MicIcon] indicator

**[TypingIndicator]** — 3-dot animation, shown while awaiting bot response

**[ChatInputBar]**

[VoiceButton] — same spec as Landing but compact
- default: mic icon, no label
- listening: red pulsing ring
- processing: spinner
- EN tooltip: "Hold to speak"
- HI tooltip: "बोलने के लिए दबाएं"

[TextInput]
- Placeholder EN: "Type your message..."
- Placeholder HI: "यहाँ लिखें..."

[SendButton]
- EN aria-label: "Send"
- HI aria-label: "भेजें"

**[ProfileSidebar]**

[ProfileCard] — fills live as profile fields extracted by backend
Each row: field label (EN/HI) + value or "—" if not yet extracted + a ✓ tick when confirmed

| Field | EN Label | HI Label |
|---|---|---|
| State | State | राज्य |
| Occupation | Occupation | पेशा |
| Age | Age | उम्र |
| Annual income | Annual income | सालाना आमदनी |
| Category | Category (SC/ST/OBC/General) | वर्ग |
| BPL card | BPL card | BPL कार्ड |
| Gender | Gender | लिंग |

Sidebar header EN: "Your profile"
Sidebar header HI: "आपका प्रोफाइल"

**[GapCard]** — hidden until backend returns `state: match`  
Appears in sidebar below ProfileCard. Bold. Cannot be missed.  
- EN: "You can claim up to ₹{gap_value} per year"
- HI: "आपको हर साल ₹{gap_value} मिल सकते हैं"
- Sub-line EN: "Across {scheme_count} schemes you qualify for"
- Sub-line HI: "{scheme_count} योजनाओं में आप पात्र हैं"
- CTA button EN: "See my schemes →"
- CTA button HI: "मेरी योजनाएं देखें →"
- Clicking CTA navigates to /schemes

**[SaveProfilePrompt]** — bottom banner, shown once after first match if user is not logged in
- EN: "Save your profile to skip these questions next time"
- HI: "अगली बार सवाल छोड़ने के लिए प्रोफाइल सेव करें"
- Button 1 EN: "Save with Google"  |  HI: "Google से सेव करें"
- Button 2 EN: "Not now"  |  HI: "अभी नहीं"

**Chat States:**

STATE `intake` — bot asking profile questions, [ProfileSidebar] filling  
STATE `match` — schemes returned, [GapCard] revealed, [SaveProfilePrompt] shown  
STATE `guide` — user asked about specific scheme, bot giving step-by-step  
STATE `error_rate_limit` — DO NOT show error; bot responds with slightly warmer tone using fallback model  
STATE `error_stt` — voice transcription failed  
  - EN: "I couldn't catch that — could you type it instead?"  
  - HI: "सुन नहीं पाया — क्या आप टाइप करके बता सकते हैं?"  
STATE `error_network` — API unreachable  
  - EN: "Something went wrong on our end. Please try again."  
  - HI: "कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।"

→ API: `POST /api/chat` on every message  
→ API: `GET /api/session/{session_id}` on page load (hydrate profile)

---

### SCREEN 3 — Scheme Results
**Route:** `/schemes`  
**Access:** Public (redirects to /chat if no active matched session)  
**Purpose:** Show all matched schemes, gap value, and entry points to guided application.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ [TopNav]                                             │
├──────────────────────────────────────────────────────┤
│  [GapBanner] — full-width, bold rupee figure         │
├──────────────────────────────────────────────────────┤
│  [FilterBar]                                         │
│    [DomainFilter] [SortDropdown]                     │
├──────────────────────────────────────────────────────┤
│  [SchemeCardList]                                    │
│    [SchemeCard] × N                                  │
│                                                      │
│  [BackToChatButton]                                  │
└──────────────────────────────────────────────────────┘
```

**Components:**

**[GapBanner]**
- EN: "You qualify for ₹{gap_value} per year across {count} schemes"
- HI: "आप {count} योजनाओं में ₹{gap_value} प्रति वर्ष के पात्र हैं"
- Sub-line EN: "Based on your profile: {state} · {occupation} · Age {age} · ₹{income}/yr"
- Sub-line HI: "आपके प्रोफाइल के अनुसार: {state} · {occupation} · उम्र {age} · ₹{income}/वर्ष"

**[FilterBar]**

[DomainFilter] — pill buttons, multi-select
| Domain | EN | HI |
|---|---|---|
| All | All | सभी |
| Agriculture | Agriculture | कृषि |
| Health | Health | स्वास्थ्य |
| Education | Education | शिक्षा |
| Employment | Employment | रोज़गार |
| Social welfare | Social welfare | सामाजिक कल्याण |

[SortDropdown]
- EN option 1: "Highest benefit first" / HI: "सबसे ज़्यादा लाभ पहले"
- EN option 2: "Easiest to apply" / HI: "आसानी से मिलने वाला पहले"
- EN option 3: "Best match" / HI: "सबसे सटीक मिलान"

**[SchemeCard]**  
STATE: collapsed (default) | expanded  

Collapsed view:
- Scheme name (bold)
- Ministry (small, muted)
- Domain badge (coloured pill)
- Annual benefit value — EN: "₹{value}/year" | HI: "₹{value}/वर्ष"
- Match confidence bar (visual only, no percentage shown to citizen)
- CTA EN: "How to apply" | HI: "कैसे करें आवेदन"
- Secondary CTA EN: "Ask Jan Saathi" | HI: "जन साथी से पूछें"

Expanded view (click "How to apply"):
- Full scheme description
- Eligibility summary (highlights which of citizen's fields matched)
- Documents needed (numbered list)
- Application steps (numbered list)
- Offline office EN: "Visit: {office_type}" | HI: "जाएं: {office_type}"
- Apply link (if exists): EN: "Apply online →" | HI: "ऑनलाइन आवेदन करें →"
- [ApplyButton] EN: "Start application" | HI: "आवेदन शुरू करें" → navigates to /schemes/:slug
- [AskJanSaathiButton] EN: "Guide me through this" | HI: "इसमें मार्गदर्शन करें" → opens /chat with scheme context loaded

**[BackToChatButton]**
- EN: "← Back to chat"
- HI: "← चैट पर वापस जाएं"

**Empty state** (no schemes matched):
- EN: "We didn't find any schemes matching your current profile. Try updating your details."
- HI: "आपके प्रोफाइल के अनुसार कोई योजना नहीं मिली। अपनी जानकारी अपडेट करके देखें।"
- CTA EN: "Update my profile" | HI: "प्रोफाइल अपडेट करें"

→ API: `GET /api/session/{session_id}` for schemes list

---

### SCREEN 4 — Scheme Detail & Guided Application
**Route:** `/schemes/:schemeSlug`  
**Access:** Public  
**Purpose:** Deep dive into one scheme. Voice-guided walkthrough. Application submission.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ [TopNav]                                             │
├──────────────────────────────────────────────────────┤
│  [SchemeBreadcrumb]                                  │
│  Schemes > {Scheme Name}                             │
├──────────────────────────────────────────────────────┤
│  [SchemeHeader]                                      │
│    Name | Ministry | Domain badge | Benefit value    │
├──────────────────────────────────────────────────────┤
│  [SchemeTabBar]                                      │
│    Overview | Eligibility | Documents | How to Apply │
├──────────────────────────────────────────────────────┤
│  [TabContent]                                        │
├──────────────────────────────────────────────────────┤
│  [ApplicationPanel]                                  │
│    [PlayGuideButton] (TTS reads all steps aloud)     │
│    [ApplyNowButton]                                  │
└──────────────────────────────────────────────────────┘
```

**[SchemeTabBar] — Tab Content:**

Tab 1: Overview
- Full description text
- EN header: "What is this scheme?" | HI: "यह योजना क्या है?"
- Benefit value highlighted: EN: "Annual benefit: ₹{value}" | HI: "सालाना लाभ: ₹{value}"

Tab 2: Eligibility
- EN header: "Do you qualify?" | HI: "क्या आप पात्र हैं?"
- Each criterion shown as a row with ✓ (citizen matches) or ○ (not verified)
- Criteria: Income limit, Age range, Occupation, BPL status, Gender, State

Tab 3: Documents needed
- EN header: "What you'll need" | HI: "आपको क्या चाहिए"
- Numbered list of documents
- Each document: name + where to get it
- EN note: "Carry originals + one photocopy of each" | HI: "हर दस्तावेज़ की असली और एक फोटोकॉपी साथ रखें"

Tab 4: How to apply
- EN header: "Step-by-step guide" | HI: "कदम-दर-कदम मार्गदर्शन"
- Numbered steps (from application_steps array)
- Offline office: EN: "Where to go: {office_type}" | HI: "कहाँ जाएं: {office_type}"
- Apply URL (if available): EN: "Official website →" | HI: "आधिकारिक वेबसाइट →"

**[PlayGuideButton]**
- EN: "▶ Listen to full guide" | HI: "▶ पूरी जानकारी सुनें"
- On click: calls TTS for all steps text, plays sequentially
- While playing: button becomes "⏸ Pause" | HI: "⏸ रोकें"

**[ApplyNowButton]**  
STATE: default | submitting | submitted  
- default EN: "Submit application" | HI: "आवेदन जमा करें"
- submitting EN: "Submitting..." | HI: "जमा हो रहा है..."
- submitted: navigates to /track with reference number

**Post-submit [SuccessPanel]:**
- EN: "Application submitted! Your reference number is {ref_number}"
- HI: "आवेदन जमा हो गया! आपका संदर्भ नंबर है {ref_number}"
- EN sub-line: "Expected processing time: 15 working days"
- HI sub-line: "अनुमानित समय: 15 कार्य दिवस"
- CTA EN: "Track my application →" | HI: "आवेदन ट्रैक करें →"

→ API: `GET /api/schemes/{slug}`  
→ API: `POST /api/apply` on submit  
→ API: `POST /api/chat` for [AskJanSaathiButton] context

---

### SCREEN 5 — Application Tracker
**Route:** `/track`  
**Access:** Public  
**Purpose:** Check status of a submitted (mock) application.

**Layout:**
```
┌──────────────────────────────────────────────┐
│ [TopNav]                                     │
├──────────────────────────────────────────────┤
│  [TrackerHeader]                             │
│  [ReferenceInputPanel]                       │
│  [StatusTimeline] (shown after lookup)       │
└──────────────────────────────────────────────┘
```

**[TrackerHeader]**
- EN: "Track your application"
- HI: "आवेदन की स्थिति जांचें"
- Sub EN: "Enter the reference number you received after submitting"
- Sub HI: "आवेदन के बाद मिला संदर्भ नंबर डालें"

**[ReferenceInputPanel]**
- Input placeholder EN: "e.g. JAN-2024-00341"
- Input placeholder HI: "जैसे JAN-2024-00341"
- Button EN: "Track" | HI: "ट्रैक करें"

**[StatusTimeline]** — shown after lookup  
Three stages always shown, active stage highlighted:

| Stage | EN | HI |
|---|---|---|
| 1 | Application submitted | आवेदन जमा हुआ |
| 2 | Under review | समीक्षाधीन |
| 3 | Approved | स्वीकृत |

- Scheme name shown above timeline
- Date of submission shown under stage 1
- Expected completion EN: "Expected by: {date}" | HI: "अपेक्षित: {date}"
- If status = rejected: show stage 3 as "Rejected" | HI: "अस्वीकृत" (red)

**Empty state** (reference not found):
- EN: "No application found with this reference number. Please check and try again."
- HI: "इस नंबर से कोई आवेदन नहीं मिला। कृपया जाँचकर दोबारा कोशिश करें।"

→ API: `GET /api/track/{ref_number}`

---

### SCREEN 6 — User Profile
**Route:** `/profile`  
**Access:** Login required (redirect to / with [SaveProfilePrompt] if not logged in)  
**Purpose:** View and edit saved profile, see past sessions, saved schemes.

**Layout:**
```
┌──────────────────────────────────────────────┐
│ [TopNav]                                     │
├──────────────────────────────────────────────┤
│  [ProfileHeader]                             │
│    Google avatar | Name | Email              │
├──────────────────────────────────────────────┤
│  [SavedProfileCard]  (editable)              │
│  [SavedSchemesSection]                       │
│  [PastSessionsSection]                       │
└──────────────────────────────────────────────┘
```

**[ProfileHeader]**
- EN sub-label: "Your saved profile" | HI: "आपका सेव किया गया प्रोफाइल"

**[SavedProfileCard]**  
Each field: label + value + [EditIcon]  
Fields: State, Occupation, Age, Annual income, Category, BPL Card, Gender  
[SaveButton] EN: "Save changes" | HI: "बदलाव सेव करें"  
[ClearProfileButton] EN: "Clear profile" | HI: "प्रोफाइल हटाएं"

**[SavedSchemesSection]**
- EN header: "Schemes you've looked at" | HI: "आपकी देखी गई योजनाएं"
- List of scheme cards (compact, no expand — link to /schemes/:slug)
- Empty state EN: "No saved schemes yet" | HI: "अभी कोई योजना सेव नहीं की"

**[PastSessionsSection]**
- EN header: "Your recent searches" | HI: "आपकी हाल की खोजें"
- List of past session summaries: date + gap value found + scheme count
- Click → re-opens /schemes with that session's results
- Empty state EN: "No past searches" | HI: "कोई पुरानी खोज नहीं"

→ API: `GET /api/profile/{user_id}`  
→ API: `PUT /api/profile/{user_id}` on save

---

### SCREEN 7 — Auth Callback
**Route:** `/auth/callback`  
**Access:** Public (Google redirects here)  
**Purpose:** Handle OAuth token, create/update user, redirect. No visible UI beyond a centered spinner.

- Shows full-page spinner while processing
- EN: "Signing you in..." | HI: "लॉगिन हो रहा है..."
- On success (citizen): redirect to /chat
- On success (admin): redirect to /admin/dashboard
- On error: redirect to / with [Toast] EN: "Login failed. Please try again." | HI: "लॉगिन नहीं हो पाया। दोबारा कोशिश करें।"

---

## 6. Admin Screens

Admin screens share a separate shell: [AdminTopNav] + [AdminSidebar] + [AdminContent].

### [AdminShell]
```
┌─────────────────────────────────────────────────────────────┐
│ [AdminTopNav]                                               │
│  Left: [Logo] "Jan Saathi Admin"                            │
│  Right: [LanguageToggle] [UserAvatarMenu]                   │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│ [AdminSidebar]  │  [AdminContent]                           │
│                 │                                           │
│  Dashboard      │  (each admin screen fills this)           │
│  Pipeline       │                                           │
│  Schemes        │                                           │
│  Sessions       │                                           │
│  Users          │                                           │
│                 │                                           │
└─────────────────┴───────────────────────────────────────────┘
```

**[AdminSidebar] nav items:**
| EN Label | HI Label | Route |
|---|---|---|
| Dashboard | डैशबोर्ड | /admin/dashboard |
| Data pipeline | डेटा पाइपलाइन | /admin/pipeline |
| Schemes | योजनाएं | /admin/schemes |
| Sessions | सत्र | /admin/sessions |
| Users | उपयोगकर्ता | /admin/users |
| View live site | लाइव साइट देखें | / (new tab) |

---

### ADMIN SCREEN 1 — Dashboard
**Route:** `/admin/dashboard`

**Components:**

**[StatCardRow]** — 4 stat cards in a row
| Card | EN | HI |
|---|---|---|
| Sessions today | Sessions today | आज के सत्र |
| Total gap surfaced | Total gap surfaced | कुल लाभ खोजा |
| Schemes in DB | Schemes in DB | DB में योजनाएं |
| Pending review | Pending review | समीक्षा बाकी |

**[TopSchemesTable]**
- EN header: "Top 10 most matched schemes today"
- HI: "आज सबसे अधिक मिलान हुई 10 योजनाएं"
- Columns: Rank | Scheme name | Ministry | Match count | Avg benefit

**[RecentSessionsTable]**
- EN header: "Recent sessions (last 50)"
- HI: "हाल के सत्र (पिछले 50)"
- Columns: Session ID (truncated) | State | Profile fields count | Schemes matched | Timestamp
- Click row → opens session detail modal

**[GapTimeline]** — line chart, total rupee gap surfaced per day (last 7 days)
- EN: "Gap unlocked per day (₹)"
- HI: "प्रतिदिन खोला गया लाभ (₹)"

→ API: `GET /api/stats`

---

### ADMIN SCREEN 2 — Data Pipeline
**Route:** `/admin/pipeline`  
**Purpose:** Monitor ingestion runs. Review quality-failed schemes. Approve or reject manually.

**Components:**

**[PipelineStatusBar]**
- Last run: timestamp
- Total PDFs processed | Passed QA | Failed QA | Pending review
- [RunPipelineButton] EN: "Run pipeline now" | HI: "पाइपलाइन चलाएं"

**[QualityReviewQueue]**
- EN header: "Schemes pending manual review ({count})"
- HI: "मैन्युअल समीक्षा के लिए लंबित योजनाएं ({count})"

Each row:
- Scheme name (extracted) | Ministry | Fail reason(s) | Source PDF filename | [ReviewButton]

[ReviewButton] opens [SchemeReviewModal]:
- Shows raw extracted JSON
- Shows fail reason list
- Shows Groq verification output (auto-run on open)
- Groq prompt: "Verify this government scheme JSON for accuracy. Flag any wrong benefit values, missing eligibility criteria, or fabricated data. Return a JSON with fields: verified (bool), issues (array), corrected_json (object)."
- [ApproveButton] EN: "Approve and ingest" | HI: "स्वीकृत करें और जोड़ें"
- [RejectButton] EN: "Reject" | HI: "अस्वीकार करें"
- [EditAndApproveButton] EN: "Edit JSON and approve" | HI: "JSON संपादित करके स्वीकृत करें"

**[FailReasonBadge] types:**
| Code | EN | HI |
|---|---|---|
| `missing_ministry` | Missing ministry | मंत्रालय नहीं |
| `missing_eligibility` | No eligibility criteria | पात्रता मानदंड नहीं |
| `zero_benefit` | Benefit value is zero | लाभ राशि शून्य |
| `no_steps` | Fewer than 2 application steps | 2 से कम कदम |
| `low_confidence` | Groq extraction confidence < 0.8 | कम विश्वसनीयता |

**[IngestLog]**
- Scrollable log of last 200 pipeline events
- Each line: timestamp | event type | scheme name | status
- Color coded: green = ingested, amber = queued for review, red = rejected

→ API: `GET /api/admin/pipeline/status`  
→ API: `POST /api/admin/pipeline/run`  
→ API: `GET /api/admin/pipeline/queue`  
→ API: `POST /api/admin/pipeline/approve/{id}`  
→ API: `POST /api/admin/pipeline/reject/{id}`

---

### ADMIN SCREEN 3 — Schemes Table
**Route:** `/admin/schemes`  
**Purpose:** Browse, filter, and manage all schemes in the database.

**Components:**

**[SchemesFilterBar]**
- Search input EN: "Search schemes..." | HI: "योजना खोजें..."
- Domain filter | Ministry filter | Status filter (approved / pending / rejected)
- [ExportCSVButton] EN: "Export CSV" | HI: "CSV निर्यात करें"

**[SchemesTable]**  
Columns: Name | Ministry | Domain | Benefit (₹) | Status | Similarity score | Actions  
Actions per row: [ViewButton] [EditButton] [DeleteButton]

**Pagination:** 50 rows per page

→ API: `GET /api/admin/schemes?domain=&ministry=&status=&q=`  
→ API: `DELETE /api/admin/schemes/{id}`

---

### ADMIN SCREEN 4 — Scheme Detail (Admin)
**Route:** `/admin/schemes/:id`  
**Purpose:** Full scheme record, inline edit, Groq re-verification.

**Components:**

**[SchemeAdminHeader]**
- Scheme name + status badge + last updated timestamp

**[SchemeJSONEditor]**
- Editable JSON view of the scheme record
- Syntax highlighted
- [SaveButton] [RevertButton]

**[GroqVerificationPanel]**
- EN header: "AI quality check" | HI: "AI गुणवत्ता जांच"
- [RunVerificationButton] EN: "Run Groq verification" | HI: "Groq सत्यापन चलाएं"
- Output panel: verified status, issues list, suggested corrections
- [ApplySuggestionsButton] EN: "Apply suggested corrections" | HI: "सुझाए गए सुधार लागू करें"

**[EmbeddingStatusPanel]**
- Shows whether embedding is current or stale (stale if JSON was edited after last embed)
- [ReEmbedButton] EN: "Re-embed this scheme" | HI: "इस योजना को फिर से embed करें"

→ API: `GET /api/admin/schemes/{id}`  
→ API: `PUT /api/admin/schemes/{id}`  
→ API: `POST /api/admin/schemes/{id}/verify`  
→ API: `POST /api/admin/schemes/{id}/re-embed`

---

### ADMIN SCREEN 5 — Session Analytics
**Route:** `/admin/sessions`  
**Purpose:** View anonymous query patterns. Source data for RAG training.

**Components:**

**[SessionsFilterBar]**
- Date range picker | State filter | Has match (yes/no)

**[SessionsTable]**
Columns: Session ID | Date | Profile complete % | Gap value | Schemes matched | Saved (logged in?)  
Click row → [SessionDetailModal]: full profile JSON + conversation transcript + matched schemes

**[QueryPatternsSection]**
- EN header: "Most common query patterns" | HI: "सबसे सामान्य प्रश्न पैटर्न"
- Top 20 occupation + state combinations queried
- Top 5 schemes most asked about in guide state

**[ExportForRAGButton]**
- EN: "Export unanswered queries for RAG training" | HI: "RAG प्रशिक्षण के लिए निर्यात करें"
- Exports session rows where `matched_count = 0` as JSONL

→ API: `GET /api/admin/sessions`  
→ API: `GET /api/admin/sessions/{id}`

---

### ADMIN SCREEN 6 — User Management
**Route:** `/admin/users`  
**Purpose:** Manage admin accounts. View registered citizen accounts.

**Components:**

**[AdminUsersTable]**
- EN header: "Admin accounts" | HI: "एडमिन खाते"
- Columns: Email | Name | Role | Created at | Actions
- [PromoteToAdminButton] for citizen accounts
- [RevokeAdminButton] for admin accounts (cannot revoke own account)
- [SeedDefaultAdminNote] — static note: "Default admin: aniruddhvijay2k7@gmail.com (seeded)"

**[CitizenUsersTable]**  
- EN header: "Registered citizen accounts" | HI: "पंजीकृत नागरिक खाते"
- Columns: Email (masked) | Sessions count | Last active | Profile complete

→ API: `GET /api/admin/users`  
→ API: `PATCH /api/admin/users/{id}/role`

---

### SCREEN 8 — 404 Not Found
**Route:** `*` (catch-all)

- EN heading: "Page not found"
- HI: "पृष्ठ नहीं मिला"
- EN body: "The page you're looking for doesn't exist."
- HI: "आप जो पृष्ठ ढूंढ रहे हैं वह मौजूद नहीं है।"
- CTA EN: "Go to home page" | HI: "होम पेज पर जाएं"

---

## 7. Shared / Reusable Components

| Component | Description | EN | HI |
|---|---|---|---|
| [Toast] | Top-right notification, auto-dismiss 4s | — | — |
| [LoadingSpinner] | Centered, full page | Loading... | लोड हो रहा है... |
| [ErrorBanner] | Inline, red-bordered | Something went wrong | कुछ गड़बड़ हुई |
| [DomainBadge] | Coloured pill per domain | Agriculture / Health / Education / Employment / Social | कृषि / स्वास्थ्य / शिक्षा / रोज़गार / सामाजिक |
| [BenefitTag] | ₹ value green tag | ₹{value}/year | ₹{value}/वर्ष |
| [ConfirmModal] | Generic confirm/cancel dialog | Confirm / Cancel | पुष्टि करें / रद्द करें |
| [MicPermissionError] | Toast shown if mic denied | Please allow microphone access to use voice. | आवाज़ सुविधा के लिए माइक्रोफ़ोन अनुमति दें। |

---

## 8. i18n Implementation Requirements

- i18n library: `react-i18next`
- Namespaces: `common`, `chat`, `schemes`, `track`, `profile`, `admin`
- `setLanguage('en' | 'hi')` stored in `localStorage` as `js_lang` and in i18n context
- All strings must exist in both `en.json` and `hi.json` before any screen goes to Figma
- No hardcoded strings anywhere in JSX — all text through `t('key')` function
- Language toggle must trigger instant re-render of entire app tree via context — no page reload

---

## 9. Frontend Folder Structure (for integration)

```
/frontend
  /src
    /components
      /shared          ← Toast, LoadingSpinner, ErrorBanner, etc.
      /chat            ← VoiceButton, ChatBubble, ProfileSidebar, GapCard
      /schemes         ← SchemeCard, FilterBar, GapBanner
      /admin           ← AdminSidebar, StatCard, PipelineQueue, SchemeJSONEditor
    /pages
      /citizen         ← Landing, Chat, Schemes, SchemeDetail, Track, Profile
      /admin           ← Dashboard, Pipeline, SchemesTable, SchemeAdminDetail, Sessions, Users
      /auth            ← Callback
      NotFound.jsx
    /routes
      PublicRoute.jsx
      PrivateRoute.jsx
      AdminRouteGuard.jsx
      AppRouter.jsx     ← all routes defined here
    /context
      AuthContext.jsx   ← JWT, user object, login/logout
      SessionContext.jsx ← anonymous UUID, profile state, chat state
      LanguageContext.jsx ← current lang, setLanguage
    /hooks
      useVoiceRecorder.js
      useSession.js
      useSchemes.js
    /services
      api.js           ← all fetch calls, base URL = VITE_API_URL
      auth.js          ← Google OAuth helpers
    /i18n
      en.json
      hi.json
      index.js
    /assets
  vercel.json
  .env.example         ← VITE_API_URL, VITE_GOOGLE_CLIENT_ID
```

---

## 10. API Contracts Summary (Frontend ↔ Backend)

All requests include header: `X-Session-ID: {uuid}` (always, logged in or not)  
Logged-in requests additionally include: `Authorization: Bearer {jwt}`

| Method | Endpoint | Request | Response |
|---|---|---|---|
| POST | /api/chat | `{message?, audio_base64?, session_id, lang}` | `{reply, audio_b64, state, profile, schemes, gap_value}` |
| GET | /api/session/{id} | — | `{profile, matched_schemes, state, language}` |
| GET | /api/schemes/{slug} | — | full scheme object |
| POST | /api/apply | `{session_id, scheme_id}` | `{reference_number, submitted_at}` |
| GET | /api/track/{ref} | — | `{scheme_name, status, submitted_at, expected_date}` |
| GET | /api/profile/{user_id} | — | `{profile, saved_schemes, past_sessions}` |
| PUT | /api/profile/{user_id} | profile fields | `{updated: true}` |
| GET | /api/stats | — | admin stats object |
| GET | /api/admin/* | — | admin-only, JWT + role=admin required |
| POST | /auth/google | `{code}` | `{jwt, user, role}` |

---

## 11. Supabase Schema Requirements (Phase 0 SQL)

Tables required (full DDL to be delivered in Phase 0 execution file):

1. `users` — id, email, name, avatar_url, role ('citizen'/'admin'), profile JSONB, created_at
2. `schemes` — full schema as per PLAN.md
3. `scheme_chunks` — full schema as per PLAN.md with HNSW index
4. `user_sessions` — full schema as per PLAN.md + user_id FK (nullable, for merge)
5. `anonymous_queries` — id, session_id, query_text, profile_snapshot JSONB, matched_count, created_at
6. `applications` — full schema as per PLAN.md
7. `pipeline_runs` — id, started_at, completed_at, pdfs_processed, passed, failed, pending
8. `pipeline_queue` — id, pdf_filename, extracted_json JSONB, fail_reasons TEXT[], status, created_at
9. `scheme_quality_log` — id, scheme_id, verified_by_groq BOOL, groq_issues JSONB, reviewed_at

RLS policies required:
- `users`: users can read/update own row; admin can read all
- `schemes`: public read; admin write
- `scheme_chunks`: public read; admin write
- `user_sessions`: insert/update own session only (by session_id); admin read all
- `anonymous_queries`: insert only (no read for citizens); admin read all
- `applications`: insert own; read own by session_id; admin read all
- `pipeline_queue`: admin only
- `pipeline_runs`: admin only
- `scheme_quality_log`: admin only

Seed data required:
- 1 row in `users`: email=aniruddhvijay2k7@gmail.com, role='admin'

---

*End of specification. This document is the single source of truth for Figma design, frontend build, and backend contract. No screen may be built without a matching route in AppRouter.jsx. No copy may be hardcoded. Every component labelled here becomes a named component in Figma and in /src/components.*