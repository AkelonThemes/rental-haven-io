import { Button } from "@/components/ui/button";

interface PaymentFiltersProps {
  typeFilter: 'all' | 'rent' | 'subscription';
  statusFilter: 'all' | 'pending' | 'completed' | 'failed' | 'refunded';
  setTypeFilter: (filter: 'all' | 'rent' | 'subscription') => void;
  setStatusFilter: (filter: 'all' | 'pending' | 'completed' | 'failed' | 'refunded') => void;
}

export function PaymentFilters({
  typeFilter,
  statusFilter,
  setTypeFilter,
  setStatusFilter,
}: PaymentFiltersProps) {
  return (
    <div className="flex gap-2">
      <div className="mr-4">
        <Button 
          variant={typeFilter === 'all' ? "default" : "ghost"}
          onClick={() => setTypeFilter('all')}
        >
          All Types
        </Button>
        <Button 
          variant={typeFilter === 'rent' ? "default" : "ghost"}
          onClick={() => setTypeFilter('rent')}
        >
          Rent
        </Button>
        <Button 
          variant={typeFilter === 'subscription' ? "default" : "ghost"}
          onClick={() => setTypeFilter('subscription')}
        >
          Subscription
        </Button>
      </div>
      <div>
        <Button 
          variant={statusFilter === 'all' ? "default" : "ghost"}
          onClick={() => setStatusFilter('all')}
        >
          All Status
        </Button>
        <Button 
          variant={statusFilter === 'pending' ? "default" : "ghost"}
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </Button>
        <Button 
          variant={statusFilter === 'completed' ? "default" : "ghost"}
          onClick={() => setStatusFilter('completed')}
        >
          Completed
        </Button>
      </div>
    </div>
  );
}