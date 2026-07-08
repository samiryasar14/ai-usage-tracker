import { StyleSheet, Text, View } from "react-native";
import type { ModelLeaderboardRow } from "../apiClient";
import { formatCompactNumber, formatCurrency } from "./format";

interface ModelLeaderboardListProps {
  rows: ModelLeaderboardRow[];
}

/** Top-5-by-cost model leaderboard — `rows` is expected pre-sorted by the API. */
export function ModelLeaderboardList({ rows }: ModelLeaderboardListProps) {
  if (rows.length === 0) {
    return <Text style={styles.empty}>No model usage recorded yet.</Text>;
  }

  const top = rows.slice(0, 5);

  return (
    <View>
      {top.map((row, index) => (
        <View key={row.modelName} style={[styles.row, index === top.length - 1 && styles.rowLast]}>
          <View style={styles.rank}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {row.modelName}
            </Text>
            <Text style={styles.meta}>
              {formatCompactNumber(row.calls)} calls · {formatCompactNumber(row.tokens)} tokens
            </Text>
          </View>
          <Text style={styles.cost}>{formatCurrency(row.cost)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2c2c2a",
  },
  rowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  rank: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#232320",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rankText: { color: "#a3a3a3", fontSize: 11, fontWeight: "600" },
  info: { flex: 1, marginRight: 10 },
  name: { color: "#fff", fontSize: 13, fontWeight: "600" },
  meta: { color: "#8a8a8a", fontSize: 11, marginTop: 2 },
  cost: { color: "#fff", fontSize: 13, fontWeight: "600" },
  empty: { color: "#8a8a8a", fontSize: 13 },
});
