import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PropertyCard from "@/components/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  status: "occupied" | "vacant" | "maintenance";
  rent_amount: number;
}

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setShowAuthDialog(true);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
            data: {
              full_name: email.split('@')[0], // Default name from email
              role: 'landlord' // Default role
            }
          }
        });

        if (error) throw error;

        // If sign up is successful and we have a session, close the dialog
        if (data.session) {
          setShowAuthDialog(false);
          toast({
            title: "Welcome!",
            description: "Your account has been created successfully.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setShowAuthDialog(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setShowAuthDialog(true);
    }
  };

  // Fetch properties
  const { data: properties = [], isError } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*');
      
      if (error) {
        toast({
          title: "Error fetching properties",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Property[];
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">Manage your real estate portfolio</p>
        </div>
        <div className="flex gap-4">
          <AddPropertyDialog />
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSignUp ? "Create Account" : "Sign In"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isError ? (
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load properties. Please try again later.</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No properties found. Add your first property to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              address={property.address}
              tenants={0}
              rentAmount={property.rent_amount}
              status={property.status}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Index;