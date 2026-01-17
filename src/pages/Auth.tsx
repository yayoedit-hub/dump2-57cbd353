import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  
  const [isSignUp, setIsSignUp] = useState(mode === "creator");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"subscriber" | "creator" | "both">(
    mode === "creator" ? "creator" : "subscriber"
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateForm = (includePassword = true) => {
    try {
      if (includePassword) {
        authSchema.parse({ email, password });
      } else {
        z.string().email("Please enter a valid email").parse(email);
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email") fieldErrors.email = err.message;
          if (err.path[0] === "password") fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(false)) return;
    
    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      setResetEmailSent(true);
      toast.success("Password reset email sent!");
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Check terms agreement for signup
    if (isSignUp && !agreedToTerms) {
      setTermsError(true);
      toast.error("You must agree to the content policy to create an account.");
      return;
    }
    setTermsError(false);
    
    setLoading(true);
    
    if (isSignUp) {
      const { error } = await signUp(email, password, role, displayName);
      if (error) {
        // Parse common error messages for better UX
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes("already registered") || errorMessage.includes("user already exists")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else if (errorMessage.includes("invalid email")) {
          toast.error("Please enter a valid email address.");
        } else if (errorMessage.includes("weak password") || errorMessage.includes("password")) {
          toast.error("Password must be at least 6 characters long.");
        } else if (errorMessage.includes("rate limit")) {
          toast.error("Too many attempts. Please wait a moment and try again.");
        } else {
          // Show the actual error for debugging
          toast.error(`Signup failed: ${error.message}`);
        }
      } else {
        // Check if email confirmation is required
        setSignupSuccess(true);
        toast.success("Account created! Check your email if confirmation is required.");
        // After a short delay, navigate if auto-confirm is enabled
        setTimeout(() => {
          if (role === "creator" || role === "both") {
            navigate("/creator/dashboard");
          } else {
            navigate("/explore");
          }
        }, 1500);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes("invalid login credentials") || errorMessage.includes("invalid credentials")) {
          toast.error("Invalid email or password. Please try again.");
        } else if (errorMessage.includes("email not confirmed")) {
          toast.error("Please confirm your email before signing in. Check your inbox.");
        } else if (errorMessage.includes("rate limit")) {
          toast.error("Too many login attempts. Please wait a moment and try again.");
        } else {
          toast.error(`Login failed: ${error.message}`);
        }
      } else {
        navigate("/");
      }
    }
    
    setLoading(false);
  };

  // Forgot password view
  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="p-4">
          <button 
            onClick={() => setIsForgotPassword(false)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md animate-fade-in">
            <div className="text-center mb-8">
              <Link to="/" className="text-3xl font-bold tracking-tight">
                Dump
              </Link>
              <h1 className="mt-6 text-2xl font-semibold">Reset your password</h1>
              <p className="mt-2 text-muted-foreground">
                Enter your email and we'll send you a reset link
              </p>
            </div>
            
            {resetEmailSent ? (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  Check your email for the password reset link. It may take a few minutes to arrive.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-12 ${errors.email ? "border-destructive" : ""}`}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12"
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send reset link
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-bold tracking-tight">
              Dump
            </Link>
            <h1 className="mt-6 text-2xl font-semibold">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isSignUp 
                ? "Start subscribing to producers or share your own dumps" 
                : "Sign in to access your subscriptions"}
            </p>
          </div>
          
          {signupSuccess && (
            <Alert className="mb-6 border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Account created successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-12 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-12 ${errors.password ? "border-destructive" : ""}`}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            
            {isSignUp && (
              <div className="space-y-3">
                <Label>I'm here to:</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) => setRole(value as typeof role)}
                  className="grid gap-3"
                >
                  <label className="flex items-center gap-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-secondary">
                    <RadioGroupItem value="subscriber" id="subscriber" />
                    <div>
                      <span className="font-medium">Subscribe</span>
                      <p className="text-sm text-muted-foreground">Access dumps from producers I love</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-secondary">
                    <RadioGroupItem value="creator" id="creator" />
                    <div>
                      <span className="font-medium">Upload as creator</span>
                      <p className="text-sm text-muted-foreground">Share my dumps and earn monthly</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-secondary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-secondary">
                    <RadioGroupItem value="both" id="both" />
                    <div>
                      <span className="font-medium">Both</span>
                      <p className="text-sm text-muted-foreground">Subscribe and share my own dumps</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            )}
            
            {isSignUp && (
              <div className="space-y-3">
                <div className={`flex items-start gap-3 p-4 rounded-lg border ${termsError ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => {
                      setAgreedToTerms(checked === true);
                      if (checked) setTermsError(false);
                    }}
                    className="mt-0.5"
                  />
                  <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    I agree not to upload any copyrighted material that I do not have rights to share. I understand that I am solely responsible for any content I upload, and Dump is not liable for any copyright infringement claims arising from my uploads. By checking this box, I also agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline" target="_blank">
                      Terms of Service
                    </Link>
                    .
                  </label>
                </div>
                {termsError && (
                  <p className="text-sm text-destructive">You must agree to continue.</p>
                )}
              </div>
            )}
            
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setSignupSuccess(false);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Dev Debug Panel - only visible in development */}
          {import.meta.env.DEV && <AuthDebugPanel />}
        </div>
      </div>
    </div>
  );
}

// Debug panel component for development only
function AuthDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<{
    clientInitialized: boolean;
    supabaseUrl: string;
    sessionUser: { id: string; email: string } | null;
    error: string | null;
  }>({
    clientInitialized: false,
    supabaseUrl: '',
    sessionUser: null,
    error: null,
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check if client is initialized
        const url = import.meta.env.VITE_SUPABASE_URL || 'Not set';
        const maskedUrl = url ? url.replace(/https:\/\/([^.]+)\./, 'https://*****.') : 'Not set';
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        setDebugInfo({
          clientInitialized: !!supabase,
          supabaseUrl: maskedUrl,
          sessionUser: session?.user ? { id: session.user.id.slice(0, 8) + '...', email: session.user.email || 'N/A' } : null,
          error: error?.message || null,
        });
      } catch (e) {
        setDebugInfo(prev => ({ ...prev, error: e instanceof Error ? e.message : 'Unknown error' }));
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="mt-8 p-4 rounded-lg border border-dashed border-border bg-secondary/30">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
        <Info className="h-4 w-4" />
        Dev Debug Panel
      </div>
      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Client initialized:</span>
          <span className={debugInfo.clientInitialized ? "text-green-500" : "text-destructive"}>
            {debugInfo.clientInitialized ? "✓ Yes" : "✗ No"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Supabase URL:</span>
          <span className="text-foreground">{debugInfo.supabaseUrl}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Session user:</span>
          <span className="text-foreground">
            {debugInfo.sessionUser ? debugInfo.sessionUser.email : "None"}
          </span>
        </div>
        {debugInfo.error && (
          <div className="flex justify-between text-destructive">
            <span>Error:</span>
            <span>{debugInfo.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}