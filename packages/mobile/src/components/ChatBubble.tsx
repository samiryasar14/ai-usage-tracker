import { StyleSheet, Text, View } from "react-native";
import type { ChatMessageDto } from "../apiClient";

interface ChatBubbleProps {
  message: ChatMessageDto;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <Text style={styles.label}>{isUser ? "You" : "Assistant"}</Text>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={styles.text}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 6, paddingHorizontal: 16 },
  rowUser: { alignItems: "flex-end" },
  rowAssistant: { alignItems: "flex-start" },
  label: { color: "#8a8a8a", fontSize: 11, marginBottom: 4, marginHorizontal: 2 },
  bubble: { maxWidth: "82%", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: "#2a78d6", borderBottomRightRadius: 4 },
  bubbleAssistant: {
    backgroundColor: "#1a1a19",
    borderWidth: 1,
    borderColor: "#2c2c2a",
    borderBottomLeftRadius: 4,
  },
  text: { color: "#fff", fontSize: 14, lineHeight: 20 },
});
