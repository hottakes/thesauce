'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Target, Award } from 'lucide-react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { Tables } from '@/lib/supabase/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export const AdminDashboard = () => {
  // Fetch total applicants
  const { data: totalApplicants } = useQuery({
    queryKey: ['admin-total-applicants'],
    queryFn: async () => {
      const { count } = await supabase
        .from('applicants')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // Fetch this week's applicants
  const { data: weekApplicants } = useQuery({
    queryKey: ['admin-week-applicants'],
    queryFn: async () => {
      const weekAgo = subDays(new Date(), 7).toISOString();
      const { count } = await supabase
        .from('applicants')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo);
      return count || 0;
    },
  });

  // Fetch average waitlist position
  const { data: avgPosition } = useQuery({
    queryKey: ['admin-avg-position'],
    queryFn: async () => {
      const { data } = await supabase
        .from('applicants')
        .select('waitlist_position');
      if (!data || data.length === 0) return 0;
      const sum = data.reduce((acc: number, curr: { waitlist_position: number }) => acc + curr.waitlist_position, 0);
      return Math.round(sum / data.length);
    },
  });

  // Fetch applications over time (last 30 days)
  const { data: timelineData } = useQuery({
    queryKey: ['admin-timeline'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from('applicants')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      // Group by day
      const grouped: Record<string, number> = {};
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const day = format(subDays(new Date(), i), 'MMM d');
        days.push(day);
        grouped[day] = 0;
      }

      data?.forEach((item: { created_at: string }) => {
        const day = format(parseISO(item.created_at), 'MMM d');
        if (grouped[day] !== undefined) {
          grouped[day]++;
        }
      });

      return days.map((day) => ({ day, count: grouped[day] }));
    },
  });

  // Fetch applications by school
  const { data: schoolData } = useQuery({
    queryKey: ['admin-school-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('applicants')
        .select('school');
      
      const grouped: Record<string, number> = {};
      data?.forEach((item: { school: string }) => {
        grouped[item.school] = (grouped[item.school] || 0) + 1;
      });

      return Object.entries(grouped)
        .map(([school, count]) => ({ school: school.replace('University of ', 'U of ').replace(' University', ''), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    },
  });

  // Fetch recent applicants
  const { data: recentApplicants } = useQuery({
    queryKey: ['admin-recent-applicants'],
    queryFn: async () => {
      const { data } = await supabase
        .from('applicants')
        .select('id, instagram_handle, school, ambassador_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const stats = [
    { title: 'Total Applicants', value: totalApplicants || 0, icon: Users, change: '+12%' },
    { title: 'This Week', value: weekApplicants || 0, icon: TrendingUp, change: '+8%' },
    { title: 'Completion Rate', value: '78%', icon: Target, change: '+3%' },
    { title: 'Avg Position', value: avgPosition || '-', icon: Award, change: '' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your ambassador program</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <p className="text-xs text-green-500">{stat.change} from last month</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applications Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applications by School</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={schoolData || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    dataKey="school"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applicants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Applicants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Instagram</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">School</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Applied</th>
                </tr>
              </thead>
              <tbody>
                {recentApplicants?.map((applicant: { id: string; instagram_handle: string; school: string; ambassador_type: string; created_at: string }) => (
                  <tr key={applicant.id} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="py-3 px-4 text-sm font-medium">@{applicant.instagram_handle}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{applicant.school}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{applicant.ambassador_type}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {format(parseISO(applicant.created_at), 'MMM d, h:mm a')}
                    </td>
                  </tr>
                ))}
                {(!recentApplicants || recentApplicants.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No applicants yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
