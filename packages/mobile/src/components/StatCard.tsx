import { StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
}

export function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
      {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "48%",
    backgroundColor: "#161613",
    borderWidth: 1,
    borderColor: "#2c2c2a",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  value: { color: "#fff", fontSize: 20, fontWeight: "700" },
  label: { color: "#a3a3a3", fontSize: 12, marginTop: 4 },
  sublabel: { color: "#8a8a8a", fontSize: 11, marginTop: 2 },
});
