import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const initAuth = async () => {
      await supabase.auth.signOut();
      
      const token = searchParams.get('token');
      if (token) {
        setIsSignUp(true);
        try {
          const tokenData = JSON.parse(atob(token));
          if (tokenData.email) {
            setEmail(tokenData.email);
          }
        } catch (error: any) {
          console.error('Error processing token:', error);
          toast({
            title: "Error",
            description: "Invalid invitation link. Please contact support.",
            variant: "destructive",
          });
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          handleRedirect(session.user.id);
        }
      }
    };

    initAuth();
  }, [navigate, searchParams, toast]);

  const handleRedirect = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role === 'tenant') {
        navigate("/tenant-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      navigate("/dashboard"); // Default to dashboard if role fetch fails
    }
  };

  const validateForm = () => {
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return false;
    }
    if (password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              full_name: email.split('@')[0],
              role: 'tenant'
            }
          }
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
            setIsSignUp(false);
          } else {
            throw error;
          }
          return;
        }

        if (data.session) {
          handleRedirect(data.session.user.id);
        } else {
          toast({
            title: "Check your email",
            description: "We sent you a confirmation link to complete your registration.",
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else if (error.message.includes('Email not confirmed')) {
            toast({
              title: "Email Not Verified",
              description: "Please check your email and verify your account before signing in.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        if (data.session) {
          handleRedirect(data.session.user.id);
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <Link 
        to="/landing" 
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? "Create Account" : "Welcome Back"}</CardTitle>
          <CardDescription>
            {isSignUp
              ? "Set up your tenant account to get started"
              : "Sign in to your account to continue"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={searchParams.get('token') !== null}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
            {!searchParams.get('token') && (
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Sign Up"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Auth;