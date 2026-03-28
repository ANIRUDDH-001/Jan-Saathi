import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4Fallback } from '../utils/uuid';
import type { SchemeResult } from '../services/api';

export interface ChatMessage {
  id: string; role: 'user'|'bot'; text: string; audioB64?: string; isVoice?: boolean;
}

interface AppState {
  sessionId: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: { id:string; email:string; name:string; role:string } | null;
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

  useEffect(() => {
    const t = localStorage.getItem('js_auth_token');
    const u = localStorage.getItem('js_user');
    if (t && u) try { 
      const parsedUser = JSON.parse(u);
      setIsLoggedIn(true); 
      setUser(parsedUser); 
    } catch {}
    const a = localStorage.getItem('js_applications');
    if (a) try { setApplications(JSON.parse(a)); } catch {}
  }, []);

  const addMessage    = useCallback((m: ChatMessage) => setMessages(p => [...p, m]), []);
  const setProfile    = useCallback((p: Record<string,unknown>) => setProfileState(p), []);
  const mergeProfile  = useCallback((p: Record<string,unknown>) => setProfileState(prev => ({...prev,...p})), []);
  const setLanguage   = useCallback((l: string) => setCurrentLanguage(l), []);
  const updateLastInputTime = useCallback(() => setLastInputTime(Date.now()), []);
  const setActiveScheme = useCallback((id: string|null) => setActiveSchemeId(id), []);

  const loginWithToken = useCallback((token: string, u: AppState['user']) => {
    localStorage.setItem('js_auth_token', token);
    localStorage.setItem('js_user', JSON.stringify(u));
    setIsLoggedIn(true); setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('js_auth_token');
    localStorage.removeItem('js_user');
    setIsLoggedIn(false); setUser(null);
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
      sessionId, isLoggedIn, isAdmin: user?.role === 'admin', user, messages, chatState, profile, schemes, gapValue,
      currentLanguage, isVoicePlaying, lastInputTime, applications, activeSchemeId,
      addMessage, setProfile, mergeProfile, setSchemes, setGapValue, setChatState,
      setLanguage, setVoicePlaying: setIsVoicePlaying, updateLastInputTime,
      setActiveScheme, loginWithToken, logout, addApplication,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
