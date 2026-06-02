import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../lib/theme";

const icons = {
  index: "Г",
  learning: "L",
  practice: "P",
  tests: "T",
  assistant: "П",
  profile: "К"
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: colors.line,
          backgroundColor: colors.white
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800"
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 16, fontWeight: "900" }}>
            {icons[route.name as keyof typeof icons] ?? "•"}
          </Text>
        )
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Головна" }} />
      <Tabs.Screen name="learning" options={{ title: "Навчання" }} />
      <Tabs.Screen name="practice" options={{ title: "Практика" }} />
      <Tabs.Screen name="tests" options={{ title: "Тести" }} />
      <Tabs.Screen name="assistant" options={{ title: "Помічник" }} />
      <Tabs.Screen name="profile" options={{ title: "Кабінет" }} />
    </Tabs>
  );
}
