import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export function RentTrends() {
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authenticated session');

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate cumulative rent over time
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
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Rent Growth Trend</h3>
        <p className="text-sm text-gray-500">Cumulative monthly rent over time</p>
      </div>
      <div className="h-[300px]">
        <ChartContainer config={chartConfig}>
          <LineChart data={rentData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Date
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {payload[0].payload.name}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Total Rent
                        </span>
                        <span className="font-bold">
                          ${payload[0].value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }} />
            <Line
              type="monotone"
              dataKey="rent"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </Card>
  );
}