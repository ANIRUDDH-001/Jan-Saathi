import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4Fallback } from '../utils/uuid';
import type { SchemeResult } from '../services/api';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'aniruddhvijay2k7@gmail.com';

export interface ChatMessage {
  id: string; role: 'user'|'bot'; text: string; audioB64?: string; isVoice?: boolean;
}

interface AppState {
  sessionId: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: { id:string; email:string; name:string; role:string; isAdmin?: boolean } | null;
  messages: ChatMessage[];
  chatState: 'intake'|'match'|'guide'|'form_fill'|'goodbye';
  profile: Record<string, unknown>;
  schemes: SchemeResult[];
  gapValue: number;
  currentLanguage: string;
  isVoicePlaying: boolean;
  lastInputTime: number;
  applications: Record<string, unknown>;
  activeSchemeId: string | null;
  addMessage: (m: ChatMessage) => void;
  setProfile: (p: Record<string, unknown>) => void;
  mergeProfile: (p: Record<string, unknown>) => void;
  setSchemes: (s: SchemeResult[]) => void;
  setGapValue: (v: number) => void;
  setChatState: (s: AppState['chatState']) => void;
  setLanguage: (l: string) => void;
  setVoicePlaying: (b: boolean) => void;
  updateLastInputTime: () => void;
  setActiveScheme: (id: string|null) => void;
  login: (userData: { name: string; email: string; token: string }) => void;
  loginWithToken: (token: string, user: AppState['user']) => void;
  logout: () => void;
  addApplication: (ref: string, data: unknown) => void;
}

const Ctx = createContext<AppState>({} as AppState);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessionId] = useState(() => {
    const e = localStorage.getItem('js_session_id');
    if (e) return e;
    const n = v4Fallback();
    localStorage.setItem('js_session_id', n);
    return n;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AppState['user']>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatState, setChatState] = useState<AppState['chatState']>('intake');
  const [profile, setProfileState] = useState<Record<string,unknown>>({});
  const [schemes, setSchemes] = useState<SchemeResult[]>([]);
  const [gapValue, setGapValue] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState('hi');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [lastInputTime, setLastInputTime] = useState(Date.now());
  const [applications, setApplications] = useState<Record<string,unknown>>({});
  const [activeSchemeId, setActiveSchemeId] = useState<string|null>(null);

  const toUserRecord = useCallback((raw: unknown) => {
    if (!raw || typeof raw !== 'object') return null;
    const src = raw as Record<string, unknown>;
    const email = typeof src.email === 'string' ? src.email : '';
    const name = typeof src.name === 'string' ? src.name : '';
    if (!email || !name) return null;

    const explicitIsAdmin = typeof src.isAdmin === 'boolean' ? src.isAdmin : undefined;
    const role = typeof src.role === 'string' ? src.role : explicitIsAdmin ? 'admin' : 'citizen';
    const id = typeof src.id === 'string' ? src.id : email;
    const isAdmin = explicitIsAdmin ?? email === ADMIN_EMAIL;

    return { id, email, name, role, isAdmin };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('js_user');
    const token = localStorage.getItem('js_auth_token');
    if (stored && token) {
      try {
        const parsed = JSON.parse(stored);
        const hydratedUser = toUserRecord(parsed);
        if (hydratedUser) {
          setIsLoggedIn(true);
          setUser(hydratedUser);
        }
      } catch {}
    }
    const a = localStorage.getItem('js_applications');
    if (a) try { setApplications(JSON.parse(a)); } catch {}
  }, [toUserRecord]);

  const addMessage    = useCallback((m: ChatMessage) => setMessages(p => [...p, m]), []);
  const setProfile    = useCallback((p: Record<string,unknown>) => setProfileState(p), []);
  const mergeProfile  = useCallback((p: Record<string,unknown>) => setProfileState(prev => ({...prev,...p})), []);
  const setLanguage   = useCallback((l: string) => setCurrentLanguage(l), []);
  const updateLastInputTime = useCallback(() => setLastInputTime(Date.now()), []);
  const setActiveScheme = useCallback((id: string|null) => setActiveSchemeId(id), []);

  const login = useCallback((userData: { name: string; email: string; token: string }) => {
    const isAdmin = userData.email === ADMIN_EMAIL;
    const nextUser = {
      id: userData.email,
      name: userData.name,
      email: userData.email,
      role: isAdmin ? 'admin' : 'citizen',
      isAdmin,
    };

    setIsLoggedIn(true);
    setUser(nextUser);
    localStorage.setItem('js_auth_token', userData.token);
    localStorage.setItem('js_user', JSON.stringify({
      name: userData.name,
      email: userData.email,
      isAdmin,
    }));
  }, []);

  const loginWithToken = useCallback((token: string, u: AppState['user']) => {
    if (!u) return;
    login({
      name: u.name,
      email: u.email,
      token,
    });
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('js_auth_token');
    localStorage.removeItem('js_user');
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const addApplication = useCallback((ref: string, data: unknown) => {
    setApplications(prev => {
      const updated = {...prev, [ref]: data};
      localStorage.setItem('js_applications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <Ctx.Provider value={{
      sessionId, isLoggedIn, isAdmin: !!user?.isAdmin, user, messages, chatState, profile, schemes, gapValue,
      currentLanguage, isVoicePlaying, lastInputTime, applications, activeSchemeId,
      addMessage, setProfile, mergeProfile, setSchemes, setGapValue, setChatState,
      setLanguage, setVoicePlaying: setIsVoicePlaying, updateLastInputTime,
      setActiveScheme, login, loginWithToken, logout, addApplication,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
