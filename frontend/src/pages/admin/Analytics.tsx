import React, { useState, useEffect } from 'react';
import {
  fetchTrendData,
  fetchCategoryDistribution,
} from '../../services/analyticsService';
import type { TrendPoint, CategoryDistribution } from '../../types/analytics';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { fetchAiTrends } from '../../services/api';

export const AdminAnalytics: React.FC = () => {
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryDistribution[]>([]);
  const [aiTrends, setAiTrends] = useState<any>(null);

  useEffect(() => {
    Promise.all([fetchTrendData(), fetchCategoryDistribution()]).then(([t, c]) => {
      setTrends(t);
      setCategories(c);
    });
    fetchAiTrends().then((res) => {
      if (res) setAiTrends(res);
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-[#EAECF0]">
        <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
          System Analytics & SLA Performance
        </h1>
        <p className="text-xs text-[#667085] mt-1">
          7-day grievance volume trends, category breakdowns, and resolution efficiency.
        </p>
      </div>

      {/* AI Executive Transit Trend Insights Card */}
      {aiTrends && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 text-white p-6 rounded-[28px] border border-blue-800/50 shadow-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 fill-amber-300" />
              <span>AI Executive Transit Insights</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Google Gemini 3.5 Flash Active
              </span>
              <span className="text-[10px] font-extrabold bg-white/10 text-blue-200 px-2.5 py-0.5 rounded-full border border-white/20">
                Statewide Network Trends
              </span>
            </div>
          </div>

          <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
            {aiTrends.system_health_summary || "Transit network operating stably with automated grievance categorization across regional hubs."}
          </p>

          {aiTrends.emerging_issues && aiTrends.emerging_issues.length > 0 && (
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {aiTrends.emerging_issues.slice(0, 2).map((issue: any, idx: number) => (
                <div key={idx} className="bg-white/10 p-3.5 rounded-2xl border border-white/10 space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{issue.title}</span>
                    <span className="text-[10px] text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
                      {issue.depot_or_route}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200">{issue.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Privacy Notice Banner */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <strong>Strict Privacy Standard:</strong> All analytics and trends are strictly aggregated and anonymized. Passenger identities and exact personal GPS locations are never stored or exposed in analytics views.
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Daily Grievance Inflow vs. Resolution Rate</CardTitle>
          <CardDescription>Compare daily submitted complaints against resolved cases over time</CardDescription>
        </CardHeader>
        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" stroke="#667085" fontSize={12} />
              <YAxis stroke="#667085" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #EAECF0',
                  borderRadius: '12px',
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="submitted" stroke="#D92D20" fill="#FEE2E2" name="Submitted" />
              <Area type="monotone" dataKey="resolved" stroke="#16A34A" fill="#DCFCE7" name="Resolved" />
              <Area type="monotone" dataKey="escalated" stroke="#F59E0B" fill="#FEF3C7" name="Escalated" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category Breakdown Pie Chart */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Grievance Distribution by Category</CardTitle>
          <CardDescription>Breakdown of complaint root causes across public transit routes</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mt-4">
          <div className="md:col-span-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-6 space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.category}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9FAFB] border border-[#EAECF0] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-[#171717]">{cat.label}</span>
                </div>
                <div className="font-mono text-[#667085]">
                  {cat.count} cases ({cat.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
