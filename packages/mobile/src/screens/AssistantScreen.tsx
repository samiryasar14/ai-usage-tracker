import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ChatMessageDto } from "../apiClient";
import { ChatBubble } from "../components/ChatBubble";

export function AssistantScreen() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const messagesQuery = useQuery({
    queryKey: ["assistantMessages"],
    queryFn: api.assistantMessages,
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) => api.sendAssistantMessage(content),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["assistantMessages"] });
    },
  });

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content || sendMessage.isPending) return;
    sendMessage.mutate(content);
  }, [draft, sendMessage]);

  const messages = messagesQuery.data ?? [];
  // FlatList is inverted (renders bottom-up) so the newest message is visible without
  // scrolling; the API returns messages oldest-first, so reverse to newest-first here.
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Text style={styles.title}>AI Assistant</Text>

        <View style={styles.listArea}>
          {messagesQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color="#2a78d6" />
            </View>
          ) : messagesQuery.isError ? (
            <View style={styles.centered}>
              <Text style={styles.error}>Couldn't load messages.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => messagesQuery.refetch()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                No messages yet — ask about your spend, most-used model, cost forecast, or a recommended budget for
                a project.
              </Text>
            </View>
          ) : (
            <FlatList<ChatMessageDto>
              data={invertedMessages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ChatBubble message={item} />}
              inverted
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>

        {sendMessage.isError && (
          <Text style={styles.sendError}>
            {sendMessage.error instanceof Error ? sendMessage.error.message : "Failed to send message."}
          </Text>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask about spend, models, forecasts…"
            placeholderTextColor="#8a8a8a"
            value={draft}
            onChangeText={setDraft}
            editable={!sendMessage.isPending}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, (sendMessage.isPending || !draft.trim()) && styles.sendButtonDisabled]}
            disabled={sendMessage.isPending || !draft.trim()}
            onPress={handleSend}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0d0d0d" },
  flex: { flex: 1 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  listArea: { flex: 1 },
  listContent: { paddingVertical: 8 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  emptyText: { color: "#a3a3a3", fontSize: 14, textAlign: "center", lineHeight: 20 },
  error: { color: "#f87171", fontSize: 13, marginBottom: 12, textAlign: "center" },
  retryButton: {
    borderWidth: 1,
    borderColor: "#2c2c2a",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  sendError: { color: "#f87171", fontSize: 12, paddingHorizontal: 20, paddingBottom: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#2c2c2a",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2c2c2a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: "#2a78d6",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
