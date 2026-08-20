import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase from '../lib/supabase';

interface User {
  id: string;
  email: string | null;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'teacher' | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: async () => ({ error: 'Not initialized' }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'teacher' | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? null, name: session.user.user_metadata?.name ?? null });
        checkRole(session.user.id);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? null, name: session.user.user_metadata?.name ?? null });
        checkRole(session.user.id);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRole = async (userId: string) => {
    try {
      const [adminRes, teacherRes] = await Promise.all([
        supabase.from('admin_users').select('user_id').eq('user_id', userId).single(),
        supabase.from('teachers').select('id, active').eq('user_id', userId).single(),
      ]);

      if (adminRes.data) {
        setRole('admin');
      } else if (teacherRes.data?.active) {
        setRole('teacher');
      } else {
        setRole(null);
      }
    } catch {
      setRole(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? null, name: data.user.user_metadata?.name ?? null });
        await checkRole(data.user.id);

        if (!role) {
          // Not authorized — sign out
          await supabase.auth.signOut();
          setUser(null);
          setRole(null);
          return { error: 'Not authorized' };
        }

        return {};
      }
      return { error: 'Login failed: no user returned' };
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
