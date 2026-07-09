import { StyleSheet, Text, View } from "react-native";
import type { TimelineDay } from "../apiClient";
import { formatCompactNumber, formatCount, formatCurrency, formatShortDate, widthPercent } from "./format";

interface TimelineListProps {
  days: TimelineDay[];
}

/** Plain-list rendering of the last N days, most recent first, with a cost bar per row. */
export function TimelineList({ days }: TimelineListProps) {
  if (days.length === 0) {
    return <Text style={styles.empty}>No usage recorded yet.</Text>;
  }

  const maxCost = Math.max(...days.map((d) => d.cost), 0.01);
  const ordered = [...days].reverse();

  return (
    <View>
      {ordered.map((day) => (
        <View key={day.day} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={styles.date}>{formatShortDate(day.day)}</Text>
            <Text style={styles.cost}>{formatCurrency(day.cost)}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: widthPercent((day.cost / maxCost) * 100) }]} />
          </View>
          <Text style={styles.meta}>
            {formatCompactNumber(day.tokens)} tokens · {formatCount(day.requests)} requests
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 14 },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  date: { color: "#fff", fontSize: 13, fontWeight: "600" },
  cost: { color: "#fff", fontSize: 13 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#232320",
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: "#22d3ee", borderRadius: 3 },
  meta: { color: "#8a8a8a", fontSize: 11, marginTop: 5 },
  empty: { color: "#8a8a8a", fontSize: 13 },
});
