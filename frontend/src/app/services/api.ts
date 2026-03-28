const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function authHeader(): Record<string, string> {
  const t = localStorage.getItem('js_auth_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export async function sendChatMessage(
  message: string, sessionId: string, language = 'hi'
): Promise<ChatResponse> {
  const r = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ message, session_id: sessionId, language }),
  });
  if (!r.ok) throw new Error(`chat:${r.status}`);
  return r.json();
}

export async function detectLocation(): Promise<{ state: string|null; city: string|null; detected: boolean }> {
  try {
    const r = await fetch(`${BASE}/api/chat/ip-detect`, { method: 'POST' });
    if (!r.ok) return { state: null, city: null, detected: false };
    return await r.json();
  } catch (e) {
    return { state: null, city: null, detected: false };
  }
}

// ── Voice ─────────────────────────────────────────────────────────────────────
export async function transcribeAudio(
  blob: Blob, sessionId: string, langHint = 'hi-IN'
): Promise<{ transcript: string; language_code: string; language_short: string; error?: string }> {
  const form = new FormData();
  form.append('audio', blob, 'rec.webm');
  form.append('session_id', sessionId);
  form.append('language_hint', langHint);
  const r = await fetch(`${BASE}/api/voice/transcribe`, { method: 'POST', body: form });
  if (!r.ok) throw new Error(`stt:${r.status}`);
  return r.json();
}

export async function synthesizeSpeech(text: string, language = 'hi'): Promise<string> {
  const r = await fetch(
    `${BASE}/api/voice/speak?text=${encodeURIComponent(text)}&language=${language}`,
    { method: 'POST' }
  );
  if (!r.ok) return '';
  const d = await r.json();
  return d.audio_b64 || '';
}

// ── Applications ──────────────────────────────────────────────────────────────
export async function submitApplication(payload: {
  session_id: string; scheme_id: string;
  form_data: Record<string, unknown>; confirmed: boolean;
}): Promise<ApplicationSubmitResponse> {
  const r = await fetch(`${BASE}/api/applications/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`submit:${r.status}`);
  return r.json();
}

export async function trackApplication(ref: string) {
  const r = await fetch(`${BASE}/api/applications/track/${encodeURIComponent(ref)}`);
  if (r.status === 404) return null;
  return r.json();
}

export async function getSessionApplications(sessionId: string) {
  const r = await fetch(`${BASE}/api/applications/session/${sessionId}`);
  if (!r.ok) return [];
  return r.json();
}

// ── Schemes ───────────────────────────────────────────────────────────────────
export async function listSchemes(state?: string) {
  const url = state ? `${BASE}/api/schemes?state=${encodeURIComponent(state)}` : `${BASE}/api/schemes`;
  return (await fetch(url)).json();
}

export async function getScheme(schemeId: string) {
  return (await fetch(`${BASE}/api/schemes/${schemeId}`)).json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function getGoogleAuthUrl(): Promise<string> {
  const d = await (await fetch(`${BASE}/auth/google`)).json();
  return d.url;
}

export async function handleGoogleCallback(code: string) {
  return (await fetch(`${BASE}/auth/google/callback?code=${encodeURIComponent(code)}`)).json();
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function getAdminStats() {
  return (await fetch(`${BASE}/api/admin/stats`, { headers: authHeader() })).json();
}
export async function getAdminSessions(limit = 50) {
  return (await fetch(`${BASE}/api/admin/sessions?limit=${limit}`, { headers: authHeader() })).json();
}
export async function getAdminUsers(limit = 50) {
  return (await fetch(`${BASE}/api/admin/users?limit=${limit}`, { headers: authHeader() })).json();
}
export async function getAdminIntegrations() {
  return (await fetch(`${BASE}/api/admin/integrations`, { headers: authHeader() })).json();
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ChatResponse {
  reply: string; audio_b64?: string;
  state: 'intake'|'match'|'guide'|'form_fill'|'goodbye';
  profile: Record<string, unknown>; schemes: SchemeResult[];
  gap_value: number; session_id: string; language: string; silence_reset: boolean;
}
export interface SchemeResult {
  scheme_id: string; name_english: string; name_hindi?: string;
  acronym?: string; level: string; state: string; ministry?: string;
  has_monetary_benefit: boolean; benefit_annual_inr: number;
  eligibility_summary?: string; spoken_content: Record<string, Record<string,string>>;
  form_field_mapping: Record<string, unknown>;
  portal_url?: string; form_pdf_url?: string; helpline_number?: string;
  similarity: number; demo_ready: boolean;
}
export interface ApplicationSubmitResponse {
  reference_number: string; scheme_name: string; scheme_acronym: string;
  status: string; submitted_at: string;
  expected_state_verify_date?: string; expected_central_date?: string; expected_benefit_date?: string;
  pdf_b64?: string; portal_url?: string; apisetu_note?: string;
}
