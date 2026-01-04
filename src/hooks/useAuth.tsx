import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "subscriber" | "creator" | "both";
  is_admin: boolean;
}

interface Creator {
  id: string;
  user_id: string;
  handle: string;
  bio: string | null;
  tags: string[];
  banner_url: string | null;
  price_usd: number;
  license_type: "personal_only" | "commercial_with_credit";
  back_catalog_access: boolean;
  is_active: boolean;
  soundcloud_url: string | null;
  spotify_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  creator: Creator | null;
  loading: boolean;
  signUp: (email: string, password: string, role: "subscriber" | "creator" | "both", displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (profileData) {
        setProfile(profileData as Profile);

        // Check if user is a creator - use explicit column selection to avoid exposing stripe data
        // Note: For the user's own creator profile, we only need display data, not payment info
        if (profileData.role === "creator" || profileData.role === "both") {
          const { data: creatorData } = await supabase
            .from("creators")
            .select(`
              id,
              user_id,
              handle,
              bio,
              tags,
              banner_url,
              price_usd,
              license_type,
              back_catalog_access,
              is_active,
              soundcloud_url,
              spotify_url,
              website_url,
              instagram_url,
              youtube_url
            `)
            .eq("user_id", userId)
            .maybeSingle();

          if (creatorData) {
            setCreator(creatorData as Creator);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setCreator(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    role: "subscriber" | "creator" | "both",
    displayName?: string
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role,
            display_name: displayName || email.split("@")[0],
          },
        },
      });

      if (error) throw error;
      
      toast.success("Account created! You can now sign in.");
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Welcome back!");
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCreator(null);
    toast.success("Signed out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        creator,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
