import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function AddPropertyDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error("You must be logged in to add a property");
      }

      const formData = new FormData(e.currentTarget);
      const propertyData = {
        owner_id: session.user.id,
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        province: formData.get("province") as string,
        zip_code: formData.get("zipCode") as string,
        rent_amount: parseFloat(formData.get("rentAmount") as string),
        status: "vacant" // Default status for new properties
      };

      const { error } = await supabase
        .from("properties")
        .insert(propertyData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property has been added successfully",
      });

      // Invalidate and refetch properties query
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Property
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="123 Main St"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              placeholder="New York"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="province">Province</Label>
            <Input
              id="province"
              name="province"
              placeholder="ON"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              name="zipCode"
              placeholder="10001"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rentAmount">Monthly Rent (K)</Label>
            <Input
              id="rentAmount"
              name="rentAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="2"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Property"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}