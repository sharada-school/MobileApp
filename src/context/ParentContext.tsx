import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, Student, setAuthToken, getStoredAuth } from '../services/api';

interface ParentUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  email?: string;
}

interface ParentContextType {
  parent: ParentUser | null;
  kids: Student[];
  activeKid: Student | null;
  setActiveKid: (kid: Student) => void;
  setActiveKidById: (id: string) => void;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, name?: string) => Promise<boolean>;
  logout: () => void;
  refreshKids: () => Promise<void>;
  clearError: () => void;
}

const ParentContext = createContext<ParentContextType | undefined>(undefined);

export const ParentProvider = ({ children }: { children: ReactNode }) => {
  const [parent, setParent] = useState<ParentUser | null>(null);
  const [kids, setKids] = useState<Student[]>([]);
  const [activeKid, setActiveKid] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore stored session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const { token, phone } = getStoredAuth();
        if (token && phone) {
          const fetchedKids = await api.getKids();
          setKids(fetchedKids);
          if (fetchedKids.length > 0) {
            setActiveKid(fetchedKids[0]);
          }
          const profile = await api.getProfile().catch(() => null);
          if (profile?.user) {
            setParent(profile.user);
          } else {
            setParent({
              id: 'restored',
              name: fetchedKids[0]?.parentName || `Account (${phone.slice(-4)})`,
              phone,
              role: 'parent'
            });
          }
        }
      } catch (err: any) {
        console.warn('Session restoration failed:', err.message);
        setAuthToken(null, null);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const login = async (phone: string, name?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(phone, name);
      const fetchedKids = await api.getKids();

      // If no students are registered with this phone number, treat as wrong/unregistered number
      if (!fetchedKids || fetchedKids.length === 0) {
        api.logout();
        setParent(null);
        setKids([]);
        setActiveKid(null);
        setError(
          `Mobile number (+91 ${phone}) is not registered with any student in Sharada English Medium School records. Please check for typos or contact the school office (Ph: 8867026358).`
        );
        return false;
      }

      setParent(res.user);
      setKids(fetchedKids);
      setActiveKid(fetchedKids[0]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your mobile number.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setParent(null);
    setKids([]);
    setActiveKid(null);
    setError(null);
  };

  const refreshKids = async () => {
    try {
      const fetchedKids = await api.getKids();
      setKids(fetchedKids);
      if (activeKid) {
        const stillExists = fetchedKids.find(k => (k.id || k._id) === (activeKid.id || activeKid._id));
        if (stillExists) setActiveKid(stillExists);
        else if (fetchedKids.length > 0) setActiveKid(fetchedKids[0]);
      } else if (fetchedKids.length > 0) {
        setActiveKid(fetchedKids[0]);
      }
    } catch (err: any) {
      console.error('Failed to refresh kids:', err);
    }
  };

  const setActiveKidById = (id: string) => {
    const found = kids.find(k => (k.id || k._id) === id);
    if (found) setActiveKid(found);
  };

  const clearError = () => setError(null);

  return (
    <ParentContext.Provider
      value={{
        parent,
        kids,
        activeKid,
        setActiveKid,
        setActiveKidById,
        isLoggedIn: !!parent,
        isLoading,
        error,
        login,
        logout,
        refreshKids,
        clearError
      }}
    >
      {children}
    </ParentContext.Provider>
  );
};

export const useParent = () => {
  const context = useContext(ParentContext);
  if (!context) {
    throw new Error('useParent must be used within a ParentProvider');
  }
  return context;
};
