
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

type UserRole = "admin" | "client" | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async (userId: string) => {
      try {
        console.log("Fetching user role for userId:", userId);
        
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          return null;
        }

        console.log("User role fetched:", data?.role);
        return data?.role as UserRole;
      } catch (error) {
        console.error("Exception in fetchUserRole:", error);
        return null;
      }
    };

    const fetchInitialSession = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching initial session...");
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setSession(null);
          setUser(null);
          setUserRole(null);
          return;
        }
        
        console.log("Initial session check:", data.session ? "Session exists" : "No session");
        
        if (data.session) {
          console.log("User authenticated:", data.session.user.email);
          console.log("User metadata:", data.session.user.user_metadata);
          
          setSession(data.session);
          setUser(data.session.user);
          
          const role = await fetchUserRole(data.session.user.id);
          console.log("User role:", role);
          setUserRole(role);
        } else {
          // Clear state when no session is found
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Exception fetching session:", error);
        // Ensure state is cleared on error
        setSession(null);
        setUser(null);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Ensure initial session is fetched
    fetchInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.email);
        
        if (event === 'SIGNED_OUT' || !newSession) {
          // Clear state on sign out or when session is null
          setSession(null);
          setUser(null);
          setUserRole(null);
          console.log("User signed out or no session, state cleared");
        } else if (newSession) {
          console.log("Setting new session:", newSession.user.email);
          setSession(newSession);
          setUser(newSession.user);
          
          const role = await fetchUserRole(newSession.user.id);
          setUserRole(role);
          console.log("Updated user role:", role);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("Attempting to sign out...");
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        toast.error(error.message || "Si è verificato un errore durante il logout");
        return;
      }
      
      // Explicitly clear state after logout
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      console.log("Sign out successful");
      toast.success("Logout effettuato con successo");
    } catch (error: any) {
      console.error("Exception during signOut:", error);
      toast.error(error.message || "Si è verificato un errore durante il logout");
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("Attempting to sign in with Google...");
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (error) {
        console.error("Error signing in with Google:", error);
        toast.error(error.message || "Si è verificato un errore durante l'accesso con Google");
        return;
      }
      
      console.log("Google sign in initiated");
    } catch (error: any) {
      console.error("Exception during Google sign in:", error);
      toast.error(error.message || "Si è verificato un errore durante l'accesso con Google");
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in with email/password:", email);
      setIsLoading(true);
      
      if (!email || !password) {
        console.error("Email or password missing");
        toast.error("Email e password sono obbligatori");
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });
      
      if (error) {
        console.error("Login error:", error);
        toast.error(error.message || "Credenziali non valide");
        return;
      }
      
      if (!data.user || !data.session) {
        console.error("Login successful but no user or session returned");
        toast.error("Errore durante l'autenticazione. Riprova.");
        return;
      }
      
      console.log("Login successful:", data.user?.email);
      toast.success("Login effettuato con successo!");
      
      // Session and user will be updated by the onAuthStateChange listener
    } catch (error: any) {
      console.error("Exception during login:", error);
      toast.error(error.message || "Si è verificato un errore durante il login");
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    session,
    user,
    userRole,
    isLoading,
    isAdmin: userRole === "admin",
    signOut,
    signInWithGoogle,
    signInWithPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
