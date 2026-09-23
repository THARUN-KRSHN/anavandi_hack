import React from 'react';
import type { DepotWorkload } from '../../types/analytics';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DepotWorkloadChartProps {
  data: DepotWorkload[];
}

export const DepotWorkloadChart: React.FC<DepotWorkloadChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    name: d.depotName.replace(' Depot', '').replace(' Central', ''),
    Open: d.open,
    Overdue: d.overdue,
    Resolved: Math.round(d.resolvedThisWeek / 5),
  }));

  return (
    <Card className="p-5">
      <CardHeader>
        <CardTitle>Depot Workload & Active Queue</CardTitle>
        <CardDescription>Comparison of open, overdue, and daily resolved complaints across major depots</CardDescription>
      </CardHeader>
      <div className="h-64 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#667085" fontSize={12} tickLine={false} />
            <YAxis stroke="#667085" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #EAECF0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
            <Legend />
            <Bar dataKey="Open" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Overdue" fill="#D92D20" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Resolved" fill="#16A34A" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
