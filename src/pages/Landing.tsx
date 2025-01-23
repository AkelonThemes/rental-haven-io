import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      } else {
        // If not logged in, redirect to auth page (you'll need to create this)
        navigate("/auth");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check authentication status",
        variant: "destructive",
      });
    }
  };

  const handleGetStarted = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      } else {
        navigate("/auth");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check authentication status",
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/account");
      } else {
        navigate("/auth");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check authentication status",
        variant: "destructive",
      });
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/");
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-semibold text-gray-900">PropManager</span>
          </div>
          <Button onClick={handleSignIn}>Sign In</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
            Property Management Made Simple
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your property management with our comprehensive solution for landlords and property managers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle>Free Plan</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-3xl font-bold mt-4">$0/month</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Manage up to 2 properties",
                  "Basic tenant management",
                  "Simple payment tracking",
                  "Email support"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGetStarted} className="w-full">Get Started</Button>
            </CardFooter>
          </Card>

          {/* Starter Plan */}
          <Card className="relative border-primary">
            <CardHeader>
              <CardTitle>Starter Plan</CardTitle>
              <CardDescription>For growing property portfolios</CardDescription>
              <div className="text-3xl font-bold mt-4">$29/month</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Unlimited properties",
                  "Advanced tenant management",
                  "Automated payment tracking",
                  "Priority support",
                  "Financial reporting",
                  "Document storage",
                  "Maintenance requests"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpgrade} variant="default" className="w-full">
                Upgrade Now
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Landing;