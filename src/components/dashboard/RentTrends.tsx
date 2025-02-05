import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfYear, endOfYear, format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RentTrendsProps {
  isLoading?: boolean;
}

export function RentTrends({ isLoading }: RentTrendsProps) {
  const isMobile = useIsMobile();
  
  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['rental-performance'],
    queryFn: async () => {
      const currentDate = new Date();
      const yearStart = startOfYear(currentDate);
      const yearEnd = endOfYear(currentDate);

      const { data, error } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .eq('payment_type', 'rent')
        .gte('payment_date', yearStart.toISOString())
        .lte('payment_date', yearEnd.toISOString())
        .order('payment_date');

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      // Process data to group by month
      const monthlyData = data.reduce((acc: any, payment) => {
        const month = format(new Date(payment.payment_date), 'MMM');
        if (!acc[month]) {
          acc[month] = { 
            month, 
            total: 0,
            paid: 0,
            unpaid: 0 
          };
        }
        const amount = Number(payment.amount);
        acc[month].total += amount;
        
        if (payment.status === 'completed') {
          acc[month].paid += amount;
        } else {
          acc[month].unpaid += amount;
        }
        
        return acc;
      }, {});

      return Object.values(monthlyData);
    },
  });

  const { data: maintenanceRequests, isLoading: isMaintenanceLoading } = useQuery({
    queryKey: ['recent-maintenance-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          tenant:tenants(
            profile:profiles(full_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching maintenance requests:', error);
        throw error;
      }

      return data;
    },
  });

  if (isLoading || isPaymentsLoading || isMaintenanceLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rental Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rental Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentsData} barSize={20}>
                <XAxis 
                  dataKey="month" 
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `K${value}`}
                />
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <Tooltip
                  formatter={(value: number) => [`K${value.toFixed(2)}`, "Amount"]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <Bar
                  dataKey="paid"
                  name="Paid Rent"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="unpaid"
                  name="Unpaid Rent"
                  fill="hsl(var(--destructive))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceRequests?.map((request: any) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.title}</TableCell>
                  <TableCell>{request.tenant?.profile?.full_name}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.status}</TableCell>
                  <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}