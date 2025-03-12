
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User, Provider } from "@supabase/supabase-js";
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
          .maybeSingle(); // Using maybeSingle instead of single to avoid errors if no role exists

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
          setIsLoading(false);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          // Clear state on sign out
          setSession(null);
          setUser(null);
          setUserRole(null);
          console.log("User signed out, state cleared");
        } else if (newSession) {
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
      
      // Clear state dopo il logout
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

  const value = {
    session,
    user,
    userRole,
    isLoading,
    isAdmin: userRole === "admin",
    signOut,
    signInWithGoogle,
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
