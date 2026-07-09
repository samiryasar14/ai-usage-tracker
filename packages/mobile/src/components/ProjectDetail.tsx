import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api, type ProjectAnalyticsRow } from "../apiClient";
import { StatCard } from "./StatCard";
import { Section } from "./Section";
import { formatCompactNumber, formatCount, formatCurrency, formatLastActive } from "./format";

interface ProjectDetailProps {
  project: ProjectAnalyticsRow;
  onBack: () => void;
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const recommendationQuery = useQuery({
    queryKey: ["projectRecommendation", project.projectId],
    queryFn: () => api.projectRecommendation(project.projectId),
  });

  const recommendation = recommendationQuery.data;
  const trend = recommendation?.trendPercent ?? 0;
  const trendArrow = trend > 0 ? "↑" : trend < 0 ? "↓" : "→";
  const trendStyle = trend > 0 ? styles.trendUp : trend < 0 ? styles.trendDown : styles.trendFlat;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} hitSlop={8} style={styles.backButton}>
        <Text style={styles.backText}>‹ Projects</Text>
      </TouchableOpacity>

      <Text style={styles.name}>{project.name}</Text>
      <Text style={styles.path} numberOfLines={1}>
        {project.path}
      </Text>

      <View style={styles.statsGrid}>
        <StatCard label="Sessions" value={formatCount(project.sessions)} />
        <StatCard label="Requests" value={formatCount(project.requests)} />
        <StatCard label="Tokens" value={formatCompactNumber(project.tokens)} />
        <StatCard label="Cost" value={formatCurrency(project.cost)} />
      </View>

      <Section title="Last active">
        <Text style={styles.lastActive}>{formatLastActive(project.lastActiveAt)}</Text>
      </Section>

      <Section title="Recommended monthly limit">
        {recommendationQuery.isLoading ? (
          <Text style={styles.muted}>Calculating…</Text>
        ) : recommendationQuery.isError ? (
          <Text style={styles.error}>Couldn't load — pull to retry</Text>
        ) : recommendation ? (
          <>
            <Text style={styles.reasoning}>{recommendation.reasoning}</Text>

            <Text style={styles.recommendedValue}>
              {formatCurrency(recommendation.recommendedMonthlyUsd)}
              <Text style={styles.perMonth}> /mo</Text>
            </Text>

            <View style={styles.trendRow}>
              <Text style={[styles.trend, trendStyle]}>
                {trendArrow} {Math.abs(trend).toFixed(1)}%
              </Text>
              <Text style={styles.trailing}>
                Trailing avg {formatCurrency(recommendation.trailingAverageUsd)}/mo
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.muted}>No recommendation available yet.</Text>
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 16 },
  backText: { color: "#22d3ee", fontSize: 14, fontWeight: "600" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  path: { color: "#8a8a8a", fontSize: 12, marginTop: 4, marginBottom: 16 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  lastActive: { color: "#fff", fontSize: 14 },
  reasoning: { color: "#fff", fontSize: 14, lineHeight: 20, marginBottom: 14 },
  recommendedValue: { color: "#fff", fontSize: 30, fontWeight: "700" },
  perMonth: { color: "#a3a3a3", fontSize: 14, fontWeight: "400" },
  trendRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 10 },
  trend: { fontSize: 13, fontWeight: "600" },
  trendUp: { color: "#f87171" },
  trendDown: { color: "#4ade80" },
  trendFlat: { color: "#a3a3a3" },
  trailing: { color: "#8a8a8a", fontSize: 12 },
  muted: { color: "#a3a3a3", fontSize: 13 },
  error: { color: "#f87171", fontSize: 13 },
});
