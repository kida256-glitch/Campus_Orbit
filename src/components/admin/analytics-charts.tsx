"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PALETTE = [
  "#3479f6",
  "#10b981",
  "#8ec0ff",
  "#f59e0b",
  "#1b3e9f",
  "#6ee7b7",
  "#a78bfa",
  "#fb7185",
  "#2c4479",
  "#34d399",
];

interface ChartsProps {
  eventsByCategory: { category: string; count: number }[];
  registrationsByStatus: { status: string; count: number }[];
  signupsByWeek: { week: string; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  interested: "Interested",
  registered: "Registered",
  attended: "Awaiting verification",
  verified: "Verified",
};

/**
 * Analytics charts.
 *
 * Client-side only because recharts needs the DOM; every number arrives
 * pre-aggregated from `platform_analytics()`, so there is no data fetching here.
 */
export function AnalyticsCharts({
  eventsByCategory,
  registrationsByStatus,
  signupsByWeek,
}: ChartsProps) {
  const statusData = registrationsByStatus.map((row) => ({
    ...row,
    label: STATUS_LABELS[row.status] ?? row.status,
  }));

  const signupData = signupsByWeek.map((row) => ({
    ...row,
    label: format(new Date(`${row.week}T00:00:00`), "d MMM"),
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events by category</CardTitle>
          <p className="text-xs text-muted-foreground">
            Published and completed events.
          </p>
        </CardHeader>
        <CardContent>
          {eventsByCategory.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={eventsByCategory}
                  margin={{ top: 8, right: 8, bottom: 8, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4eaf5" vertical={false} />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "#5f7bb2" }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#5f7bb2" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e4eaf5",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Events">
                    {eventsByCategory.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={PALETTE[index % PALETTE.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance funnel</CardTitle>
          <p className="text-xs text-muted-foreground">
            How far registrations progress towards verified evidence.
          </p>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={45}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={entry.status}
                          fill={PALETTE[index % PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e4eaf5",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Text legend rather than in-chart labels: readable at small
                  sizes and available to screen readers. */}
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {statusData.map((entry, index) => (
                  <li
                    key={entry.status}
                    className="flex items-center gap-2 text-xs text-navy-700"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: PALETTE[index % PALETTE.length],
                      }}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">{entry.label}</span>
                    <span className="font-semibold tabular-nums">
                      {entry.count}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Signups over time</CardTitle>
          <p className="text-xs text-muted-foreground">
            New accounts per week, last eight weeks.
          </p>
        </CardHeader>
        <CardContent>
          {signupData.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={signupData}
                  margin={{ top: 8, right: 12, bottom: 8, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4eaf5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#5f7bb2" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#5f7bb2" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e4eaf5",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Signups"
                    stroke="#3479f6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#3479f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart() {
  return (
    <p className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/40 text-sm text-muted-foreground">
      Not enough data yet.
    </p>
  );
}
