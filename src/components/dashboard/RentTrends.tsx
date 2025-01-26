import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

export function RentTrends() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const rentData = properties.map((property, index) => {
    const cumulativeRent = properties
      .slice(0, index + 1)
      .reduce((sum, p) => sum + (p.rent_amount || 0), 0);
    
    return {
      name: new Date(property.created_at).toLocaleDateString(),
      rent: cumulativeRent,
    };
  });

  const chartConfig = {
    rent: {
      label: "Monthly Rent",
      theme: {
        light: "#2563eb",
        dark: "#3b82f6",
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rent Trends</CardTitle>
        <CardDescription>Monthly rent collection overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rentData}
              margin={{
                top: 5,
                right: 10,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickMargin={10}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                tickMargin={10}
              />
              <Tooltip
                formatter={(value) => [`$${value}`, "Amount"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="rent"
                stroke="hsl(var(--primary))"
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