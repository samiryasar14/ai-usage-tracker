import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "../apiClient";
import { StatCard } from "../components/StatCard";
import { Section } from "../components/Section";
import { TimelineList } from "../components/TimelineList";
import { ModelLeaderboardList } from "../components/ModelLeaderboardList";
import { formatCompactNumber, formatCount, formatCurrency } from "../components/format";

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const overviewQuery = useQuery({ queryKey: ["overview"], queryFn: api.overview });
  const forecastQuery = useQuery({ queryKey: ["forecast"], queryFn: api.forecast });
  const timelineQuery = useQuery({ queryKey: ["timeline", 14], queryFn: () => api.timeline(14) });
  const modelsQuery = useQuery({ queryKey: ["models"], queryFn: api.models });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        overviewQuery.refetch(),
        forecastQuery.refetch(),
        timelineQuery.refetch(),
        modelsQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [overviewQuery.refetch, forecastQuery.refetch, timelineQuery.refetch, modelsQuery.refetch]);

  const overview = overviewQuery.data;
  const forecast = forecastQuery.data;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22d3ee" />}
      >
        <Text style={styles.pageTitle}>Dashboard</Text>

        {overviewQuery.isLoading || forecastQuery.isLoading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : overviewQuery.isError || forecastQuery.isError ? (
          <Text style={styles.error}>Couldn't load — pull to retry</Text>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Today's Requests" value={overview ? formatCount(overview.todayRequests) : "—"} />
            <StatCard label="Today's Tokens" value={overview ? formatCompactNumber(overview.todayTokens) : "—"} />
            <StatCard label="Monthly Tokens" value={overview ? formatCompactNumber(overview.monthlyTokens) : "—"} />
            <StatCard
              label="Est. Monthly Cost"
              value={overview ? formatCurrency(overview.estimatedMonthlyCost) : "—"}
            />
            <StatCard
              label="Projected Month-End"
              value={forecast ? formatCurrency(forecast.projectedMonthlyCost) : "—"}
              sublabel={forecast ? `Day ${forecast.elapsedDays} of ${forecast.totalDays}` : undefined}
            />
          </View>
        )}

        <Section title="Last 14 Days">
          {timelineQuery.isLoading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : timelineQuery.isError ? (
            <Text style={styles.error}>Couldn't load — pull to retry</Text>
          ) : (
            <TimelineList days={timelineQuery.data ?? []} />
          )}
        </Section>

        <Section title="Top Models">
          {modelsQuery.isLoading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : modelsQuery.isError ? (
            <Text style={styles.error}>Couldn't load — pull to retry</Text>
          ) : (
            <ModelLeaderboardList rows={modelsQuery.data ?? []} />
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0d0d0d" },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 16 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  muted: { color: "#a3a3a3", fontSize: 13 },
  error: { color: "#f87171", fontSize: 13 },
});
