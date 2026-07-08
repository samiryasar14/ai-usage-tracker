import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api, type ProjectAnalyticsRow } from "../apiClient";
import { ProjectDetail } from "../components/ProjectDetail";
import { formatCompactNumber, formatCurrency, formatLastActive } from "../components/format";

export function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: api.projects });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await projectsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [projectsQuery.refetch]);

  const selectedProject = projectsQuery.data?.find((p) => p.projectId === selectedProjectId) ?? null;

  if (selectedProject) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ProjectDetail project={selectedProject} onBack={() => setSelectedProjectId(null)} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={projectsQuery.data ?? []}
        keyExtractor={(item) => item.projectId}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2a78d6" />}
        ListHeaderComponent={<Text style={styles.pageTitle}>Projects</Text>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }: { item: ProjectAnalyticsRow }) => (
          <TouchableOpacity style={styles.row} onPress={() => setSelectedProjectId(item.projectId)}>
            <View style={styles.rowMain}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowMeta}>
                {item.sessions} sessions · {formatCompactNumber(item.requests)} requests · last active{" "}
                {formatLastActive(item.lastActiveAt)}
              </Text>
            </View>
            <Text style={styles.rowCost}>{formatCurrency(item.cost)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={projectsQuery.isError ? styles.error : styles.muted}>
            {projectsQuery.isLoading
              ? "Loading…"
              : projectsQuery.isError
                ? "Couldn't load — pull to retry"
                : "No projects tracked yet."}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0d0d0d" },
  listContent: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 16 },
  separator: { height: 1, backgroundColor: "#2c2c2a" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  rowMain: { flex: 1, marginRight: 12 },
  rowName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  rowMeta: { color: "#8a8a8a", fontSize: 12, marginTop: 4 },
  rowCost: { color: "#fff", fontSize: 15, fontWeight: "600" },
  muted: { color: "#a3a3a3", fontSize: 13, marginTop: 8 },
  error: { color: "#f87171", fontSize: 13, marginTop: 8 },
});
