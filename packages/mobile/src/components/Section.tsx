import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

interface SectionProps {
  title: string;
  children: ReactNode;
}

/** A bordered card wrapper with a title, matching the pairing screen's border/card conventions. */
export function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderColor: "#2c2c2a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  title: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 12 },
});
