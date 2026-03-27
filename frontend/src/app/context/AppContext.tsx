import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4Fallback } from '../utils/uuid';

export interface UserProfile {
  state: string;
  occupation: string;
  age: string;
  income: string;
  category: string;
  bpl: string;
  gender: string;
}

export interface Scheme {
  id: string;
  slug: string;
  name: string;
  nameHi: string;
  ministry: string;
  ministryHi: string;
  domain: string;
  benefit: number;
  matchConfidence: number;
  description: string;
  descriptionHi: string;
  eligibility: { criterion: string; criterionHi: string; matched: boolean }[];
  documents: { name: string; nameHi: string; source: string; sourceHi: string }[];
  steps: { step: string; stepHi: string }[];
  officeType: string;
  officeTypeHi: string;
  applyUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  isVoice?: boolean;
}

type ChatState = 'intake' | 'match' | 'guide';

interface AppContextType {
  sessionId: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: { name: string; email: string; avatar: string } | null;
  login: () => void;
  logout: () => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  chatState: ChatState;
  setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  schemes: Scheme[];
  setSchemes: React.Dispatch<React.SetStateAction<Scheme[]>>;
  gapValue: number;
  setGapValue: React.Dispatch<React.SetStateAction<number>>;
  applications: Record<string, { schemeName: string; status: 'submitted' | 'review' | 'approved' | 'rejected'; date: string; expected: string }>;
  submitApplication: (schemeId: string, schemeName: string) => string;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

const emptyProfile: UserProfile = { state: '', occupation: '', age: '', income: '', category: '', bpl: '', gender: '' };

export function AppProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState(() => localStorage.getItem('js_session_id') || (() => { const id = v4Fallback(); localStorage.setItem('js_session_id', id); return id; })());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [chatState, setChatState] = useState<ChatState>('intake');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [gapValue, setGapValue] = useState(0);
  const [applications, setApplications] = useState<Record<string, any>>({});

  const login = () => {
    setIsLoggedIn(true);
    setUser({ name: 'Aniruddh Vijay', email: 'aniruddhvijay2k7@gmail.com', avatar: '' });
    setIsAdmin(true);
  };
  const logout = () => { setIsLoggedIn(false); setUser(null); setIsAdmin(false); };
  const addMessage = (msg: ChatMessage) => setMessages(prev => [...prev, msg]);
  const submitApplication = (schemeId: string, schemeName: string) => {
    const ref = `JAN-2026-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
    setApplications(prev => ({ ...prev, [ref]: { schemeName, status: 'submitted', date: new Date().toLocaleDateString(), expected: '15 working days' } }));
    return ref;
  };

  return (
    <AppContext.Provider value={{ sessionId, isLoggedIn, isAdmin, user, login, logout, profile, setProfile, chatState, setChatState, messages, addMessage, schemes, setSchemes, gapValue, setGapValue, applications, submitApplication }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
