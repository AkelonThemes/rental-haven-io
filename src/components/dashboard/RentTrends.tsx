import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfYear, endOfYear, format } from "date-fns";

interface RentTrendsProps {
  isLoading?: boolean;
}

export function RentTrends({ isLoading }: RentTrendsProps) {
  const isMobile = useIsMobile();
  
  // Fetch all rental payments data for the current year
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

  if (isLoading || isPaymentsLoading) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paymentsData}>
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
              <Line
                type="monotone"
                dataKey="paid"
                name="Paid"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="unpaid"
                name="Unpaid"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}