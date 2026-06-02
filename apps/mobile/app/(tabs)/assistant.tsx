import Constants from "expo-constants";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, Label, PrimaryButton, Screen } from "../../components/mobile-ui";
import { colors } from "../../lib/theme";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const quickPrompts = ["Підібрати категорію", "Пояснити документи", "Скільки триває B?", "Де найближча філія?"] as const;

const categoryQuestions = [
  "Права потрібні для себе чи роботи?",
  "Є вже відкрита категорія?",
  "Плануєте легкове авто, мото чи вантажний транспорт?",
  "У якому місті зручно проходити практику?"
] as const;

export default function AssistantTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Я онлайн-помічник автошколи. Запитайте про категорії, документи, ціни, філії або ПДР."
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function sendMessage(prompt = input) {
    const content = prompt.trim();

    if (!content || isSending) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const apiUrl = String(Constants.expoConfig?.extra?.apiUrl ?? "").replace(/\/$/, "");
      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-10), intent: "consultation" })
      });
      const payload = (await response.json()) as { answer?: string };

      if (!response.ok) {
        throw new Error("AI request failed");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.answer ?? "Можу допомогти з категорією, ціною, документами, філією або записом."
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Поки відповідаю у резервному режимі: B для легкового авто, A/A1 для мото, C для вантажного, CE для причепа. Напишіть місто і мету навчання, менеджер уточнить деталі."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Screen
      title="Онлайн-помічник"
      subtitle="Консультант для категорій, документів, філій, ПДР-помилок і швидкої заявки менеджеру."
    >
      <Card tone="green">
        <Label inverse>Онлайн</Label>
        <Text style={styles.heroTitle}>Поставте питання без дзвінка</Text>
        <Text style={styles.heroText}>
          Помічник відповідає коротко, а контактні дані передає тільки менеджеру автошколи після вашої заявки.
        </Text>
      </Card>

      <Card>
        <Label>Швидкі питання</Label>
        <View style={styles.prompts}>
          {quickPrompts.map((prompt) => (
            <Pressable key={prompt} style={styles.prompt} onPress={() => sendMessage(prompt)}>
              <Text style={styles.promptText}>{prompt}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card tone="yellow">
        <Label>Підбір категорії</Label>
        <Text style={styles.categoryTitle}>Помічник поставить 3-5 питань і порадить A, A1, B, C або CE</Text>
        <View style={styles.questionList}>
          {categoryQuestions.map((question, index) => (
            <Text key={question} style={styles.question}>
              {index + 1}. {question}
            </Text>
          ))}
        </View>
        <PrimaryButton onPress={() => sendMessage("Підібрати категорію прав. Задай мені 3-5 питань.")}>
          Почати підбір
        </PrimaryButton>
      </Card>

      <Card>
        <Label>Чат</Label>
        <View style={styles.chat}>
          {messages.map((message, index) => (
            <View
              key={`${message.role}-${index}`}
              style={[styles.message, message.role === "user" ? styles.userMessage : styles.assistantMessage]}
            >
              <Text style={[styles.messageText, message.role === "user" && styles.userMessageText]}>
                {message.content}
              </Text>
            </View>
          ))}
          {isSending ? <Text style={styles.typing}>Готуємо відповідь...</Text> : null}
        </View>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ваше питання"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
          />
          <Pressable style={styles.sendButton} onPress={() => sendMessage()}>
            <Text style={styles.sendText}>OK</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    marginTop: 8,
    color: colors.white,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.4
  },
  heroText: {
    marginTop: 10,
    color: "rgba(255,255,255,0.74)",
    lineHeight: 22
  },
  prompts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14
  },
  prompt: {
    borderRadius: 999,
    backgroundColor: "#edf5f2",
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  promptText: {
    color: colors.green,
    fontWeight: "800"
  },
  categoryTitle: {
    marginTop: 8,
    color: colors.graphite,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26
  },
  questionList: {
    gap: 8,
    marginVertical: 14
  },
  question: {
    color: colors.graphite,
    lineHeight: 22
  },
  chat: {
    gap: 10,
    marginTop: 14
  },
  message: {
    maxWidth: "88%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#edf5f2"
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: colors.green
  },
  messageText: {
    color: colors.graphite,
    lineHeight: 21
  },
  userMessageText: {
    color: colors.white
  },
  typing: {
    color: colors.muted,
    fontWeight: "800"
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 14
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.graphite,
    backgroundColor: colors.white
  },
  sendButton: {
    height: 46,
    minWidth: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green
  },
  sendText: {
    color: colors.white,
    fontWeight: "900"
  }
});
