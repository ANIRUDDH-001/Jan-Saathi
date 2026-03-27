Jan Saathi — Complete Figma UI Upgrade Prompt
Context for Designer
Jan Saathi is a voice-first Hindi AI assistant for rural Indian farmers. The existing Figma-to-React codebase has a working visual shell (Landing, Chat, Schemes, Admin pages) but uses mock data and has no voice-first entry, no avatar, and no form-filling screens. This prompt covers every upgrade needed — from the dark audio-first entry screen to the 11-language switcher to the admin APISetu panel.
Do not break the existing design system. Extend it.

Design System — Keep Unchanged

Saffron #FF9933 — primary action, CTAs, highlights
Navy #000080 — headers, avatar, secondary
Green #138808 — success states, confirmation, income/benefit display
Background: #FAFAF8 warm off-white
Font: Lora (serif) for rupee amounts and numbers. Manrope (sans-serif) for all body text
Border radius: 16px cards, 999px pills/buttons, 12px inputs
Shadows: 0 4px 24px rgba(0,0,0,0.08) card shadow
Animation library: Framer Motion — spring physics, no abrupt cuts


Screen 1 — Audio-First Dark Entry (NEW — replaces Landing.tsx as default route)
This is the first thing any user sees. It must work on a ₹5000 Android with a cracked screen.

Full viewport. Background: #0A0A0A near-black, not pure black
Subtle animated grain texture overlay at 4% opacity — gives warmth, not coldness
Very subtle radial gradient breathing behind the avatar: saffron #FF9933 at 8% opacity, radius 280px, pulses slowly (4s ease in/out infinite)

Ved Avatar — center of screen, 220×220px:

2D flat illustration style. NOT cartoon, NOT 3D. Think Duolingo-level character warmth but Indian
Appearance: Brown warm skin tone, simple white kurta with thin saffron collar detail, clean haircut, friendly but not childlike
Face: Large expressive eyes with subtle shine dot. Gentle smile. No beard
Two mouth states: mouth_closed (resting) and mouth_open (speaking — lips slightly parted, teeth barely visible). Transition between them: 80ms ease
Eye blink: Both eyes close (8 frames) then open. Trigger every 3–5 seconds at random
The avatar sits on a very subtle circular platform — a 240px circle at 6% white opacity, like a soft spotlight
Avatar label below: "वेद" in Lora serif, 18px, white, 80% opacity. Underneath in smaller Manrope 12px white 50%: "Jan Saathi"

Bottom of dark screen:

Single floating pill button (not a full-width bar): "📱 Screen dekhna chahte hain?" — Manrope 14px, white text, background white 10% with blur, border white 20%, pill shape 999px radius, centered, 48px height
This pill appears 2.5 seconds after the greeting TTS starts playing (fade in, slide up 8px)
On tap: Full chat UI slides up from bottom — sheet animation, 400ms spring. Dark screen fades out simultaneously

Microphone state indicator:

Small pulsing ring around the avatar base when actively listening: saffron #FF9933 at 30% opacity, 260px diameter, pulse scale 1.0→1.06 at 1.5s interval
When TTS is playing: ring turns green #138808 30% and pulses faster (0.8s)
When processing (API call): ring becomes a thin spinner arc, same saffron color


Screen 2 — Chat Page Upgrades (extends existing Chat.tsx)
The chat UI slides up from the dark screen as a bottom sheet that becomes fullscreen.
3-Step Progress Bar — NEW component, top of chat area:

Horizontal pill-shaped stepper, full width, 44px height, saffron-to-green gradient fill
Three segments: Profile → Schemes → Form Ready
Active segment: filled with gradient, label in white bold Manrope 13px
Inactive: white 15% fill, label white 50%
Between segments: chevron › icon, white 40%
The bar is sticky at the top of the chat scroll area — never scrolls away
Segment 1 fills progressively as profile fields are confirmed (3 sub-fills: state, occupation, age)
Segment 2 lights up when RAG returns results
Segment 3 lights up when form_fill state begins
Micro-animation when a segment completes: brief saffron shimmer sweep left-to-right, 300ms

Ved avatar in chat — small persistent version:

40×40px circular avatar thumbnail next to bot messages (replaces the current "JS" initials circle)
Same 2D illustration but simplified for small size — just face, no body detail
Mouth open/closed state still animates even at this size
When TTS is playing for a message: thin saffron ring animates around the thumbnail

Message bubbles — keep existing but add:

Bot bubble: add a tiny speaker icon (Volume2 from lucide) at the top right of each bot message that, when tapped, replays that message's TTS audio
User bubble: no changes

Occupation Sub-type Selection — NEW voice + visual moment:

After Ved asks "Aap kya ughate hain?", THREE visual choice cards slide up from bottom as a row
Cards: 🌾 Fasal / 🐄 Pashu-Dairy / 🐟 Machli
Each card: 100px wide, 80px tall, rounded 16px, white background, emoji 28px centered, label below in Hindi Manrope 12px bold, navy color
Active/selected card: saffron border 2px, saffron label, slight scale 1.04
Cards appear with staggered spring animation (0ms, 80ms, 160ms delay)
Selecting a card sends it as a voice-equivalent input — the card text becomes the user's chat bubble
These disappear after selection

Language Detection Banner — NEW, appears once:

Thin 36px banner slides down from top of chat after first STT response
Shows detected language flag + name: e.g., 🇮🇳 Hindi detected — Shubh is now speaking in Hindi
Background: navy 90%, white text, Manrope 12px
Auto-dismisses after 3 seconds with slide-up animation
For non-Hindi: 🇮🇳 Bengali detected — वेद अब বাংলায় बोलेगा

Silence Timer Indicator — subtle:

When no input for 20 seconds: a thin progress bar appears at the very bottom of the chat input area, below the mic button
Saffron color, animates from full-width to 0 over 10 seconds (the last 10 of the 30-second window)
At 0: goodbye summary triggers. Bar disappears
Label above bar in 11px Manrope muted: "10 सेकेंड में सारांश देंगे..."


Screen 3 — Scheme Match Results (upgrade to existing Schemes/SchemeDetail)
GapCard upgrade:

Add a spoken announcement animation: when GapCard appears, the rupee number counts up from 0 with a typewriter effect (Lora font, large, green)
Below the total, add three scheme pills in a horizontal scroll: PM-KISAN ₹6,000 | KCC ₹3L credit | PM-KMY ₹3,000/माह — each pill saffron background, white Manrope 12px
"Yeh schemes sunna chahte hain?" — a voice-play button next to the card header

Scheme cards — add state-specific badge:

Top-right corner badge: राष्ट्रीय (green) or state name in Hindi (navy) — pill shaped, 10px Manrope
If scheme is in form_fill scope (PM-KISAN/KCC/PM-KMY): a "Form Bharen" CTA button at bottom of card, saffron, full-width within card


Screen 4 — Form Fill Flow (NEW — AgriFormFill component)
Triggered when farmer says yes to "Kya form bharna hai?"
Layout: The chat panel slides LEFT (60%) and a new right panel slides IN (40%) — this is the form fill companion panel. On mobile: full-screen takeover.
Step A — Summary Readback:

Large card appears in the form panel with a microphone animation at top
Title: "वेद आपकी जानकारी पढ़ रहा है..." in Manrope 16px bold navy
Below: each confirmed field appears one by one as a row (name: value) as TTS reads it
Row animation: fade in + slide right, 60ms stagger
Rows: full name, state, district, Aadhaar (masked: XXXX-XXXX-1234), bank account (masked), IFSC, mobile
At bottom: Two large buttons — "हाँ, सब सही है ✓" (green gradient) and "कुछ बदलना है ✗" (white border, navy text)

Step B — Correction Mode (if farmer says changes needed):

Each field becomes an editable row with a microphone icon next to it
Farmer speaks the correction → field value updates live with a flash animation (saffron flash → settle)
"Theek hai?" appears after each correction as a mini confirmation chip

Step C — Final Confirmation:

Single screen: "Kya main form bhar doon?" — large centered text, Lora serif 22px
Subtext: scheme name + PDF icon
Two buttons: "Haan, bhar do" (large, full-width, saffron gradient) and "Baad mein" (text-only link, muted)

Step D — PDF Generation Loading:

Ved avatar (large, 120px) in center of panel
Animated pencil drawing a form line — simple CSS animation, not heavy
Progress text cycles: "Naam likh raha hoon..." → "Bank details daal raha hoon..." → "Form tayar ho raha hai..."
Each text line fades in/out, 1.2s interval

Step E — Success & Download:

Green checkmark animates in (scale 0→1, spring)
"Form tayar hai!" — Lora 24px green
THREE action buttons stacked:

📥 PDF Download karein — saffron gradient, full width
👁 Screen par dekhen — white border, navy
🔗 [Scheme Portal] par bhejein — green outline with a small "APISetu se jud jaega" badge in gray 10px below (this is the integration hook)



PDF Preview Modal (inline):

Bottom sheet slides up to 85% viewport height
Shows the filled PDF as an image (rendered server-side, returned as base64 PNG)
Top bar: "PM-KISAN Form" title + Download icon + Close X
Background behind sheet: blur 8px overlay

Portal Submission Placeholder:

When tapped: A modal slides in with the scheme's portal logo at top
"यह form [pmkisan.gov.in] पर submit होगा" — subtitle text
Below: animated dashed border box with text: "APISetu Integration — Registration Pending"
A status pill: orange dot + "Pending" label
Below that, a blue link: "APISetu par register karein →"
At bottom: "Abhi ke liye: CSC kendra par yeh PDF lekar jaayein" — actionable fallback in green


Screen 5 — Goodbye Summary Overlay (NEW)
Triggered by 30s silence or goodbye keyword. Slides up as a bottom sheet.

Background: navy gradient, 95% height
Top: Ved avatar (80px) with mouth closed, peaceful expression
"Aaj ka saarांsh" heading — Lora 20px white
Three cards stacked (white 10% background, rounded 12px):

Card 1: "Kya mila aaj" — scheme names + total gap value in large green Lora font
Card 2: "Aapko karna hai" — next action in plain Hindi, bold Manrope, saffron accent dot
Card 3: "Wapis aana" — "Main aapka intezaar karunga" — softer white italic Lora


Bottom: "Phir milenge" button — saffron, pill, saves session


Screen 6 — Return Greeting State (upgrade to existing dark entry)
When session UUID exists in localStorage with a saved summary:

Dark entry screen is identical BUT Ved speaks a personalized greeting immediately
Below the avatar (instead of generic subtitle): a warm card appears — white 12% background, rounded 16px

"Pichli baar:" label in saffron 11px
Action text: e.g., "CSC jaana tha PM-KISAN ke liye" — white Manrope 14px
Two micro-buttons: "Ho gaya ✓" (green) | "Nahin hua" (muted)


This card slides in after the greeting TTS starts, from bottom, 600ms spring


Screen 7 — Admin Dashboard Upgrades
APISetu Integration Panel — NEW section on Dashboard.tsx:

Full-width card below existing stats
Title: "Government API Integrations" — navy 18px bold
Three rows (PM-KISAN, MyScheme, DigiLocker), each with:

Left: API logo/name + description in 12px muted
Center: Status pill — orange "Pending Registration" or green "Live"
Right: "View Docs →" link


Below rows: a code block showing the API contract (mock response) — dark background, syntax highlighted, truncated with "Show full response" toggle
Banner at top of card: "Ek baar GSTIN se register karo → sab APIs live ho jaayenge" — saffron background, navy text, Manrope 13px

Track Page upgrade (existing Track.tsx):

Add a visual "application journey" timeline per reference number
4 nodes: Submitted → State Verified → Central Processed → Benefit Released
Each node: circle + label + date (mock for demo). Active node: saffron. Done: green. Pending: gray
Small Ved avatar icon at the current active node — like a position marker on a map


Screen 8 — Language Selector Panel (NEW component in TopNav)
Not a dropdown — a slide-in drawer from the right:

Width: 280px, height: 100vh, dark navy background
Title: "Bhasha chunein / भाषा चुनें" — white Lora 18px
11 language options as tall rows (56px each):

Language name in that language (e.g., "हिंदी", "বাংলা", "தமிழ்")
Below: language name in English in 11px muted
Left: flag-style colored dot (each language gets a unique color from the Indian flag palette)
Right: checkmark if currently active
On tap: checkmark animates in, drawer closes, UI and TTS switch


Footer note: "Saaras v3 automatically detects your language from speech" — 11px muted italic


Component-Level Details
VoiceButton upgrades:

Three states already exist. Add: form_fill state — button glows green, mic icon replaced with ✓ icon
Add haptic feedback hint: button has a subtle scale press animation (scale 0.96, 80ms)

ProfileCard upgrades:

Add occupation_subtype field with emoji: 🌾 / 🐄 / 🐟 displayed as a badge
Fields that came from IP geolocation (state): show a small 📍 indicator next to the value
Fields confirmed by farmer: checkmark icon (green) next to value
Fields inferred but unconfirmed: question mark icon (amber) — "Only if confirmed" caveat shown on hover/tap

LiveBenefitTicker upgrades:

Add language-specific ticker text. Currently English only. Ticker text must match current UI language
Add scheme-specific accent colors per ticker item (PM-KISAN: saffron, KCC: navy, PM-KMY: green)


Micro-interactions Checklist (every single one)

All buttons: scale 0.97 on press, 80ms spring release
All cards: hover state — shadow deepens + 2px translate Y-negative (desktop only)
All input focus states: border transitions from border-color to saffron, 150ms
Modal open: slide up + backdrop fade in, 300ms
Modal close: slide down + backdrop fade out, 250ms
Error states: input border flashes red for 400ms then returns to normal
Loading states: skeleton shimmer with the existing warm background color (not gray — use #FFF3E0 warm shimmer)
Language switch: entire UI fades 30% → content swaps → fades back in, 200ms total

