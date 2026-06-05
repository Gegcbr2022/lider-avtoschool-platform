import { Tabs } from "expo-router";
import { Platform, Text, View } from "react-native";
import { useTheme, radii } from "../../lib/theme";

function TabIcon({ icon, active, badge }: { icon: string; active: boolean; badge?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 22, opacity: active ? 1 : 0.45 }}>{icon}</Text>
      {badge ? (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -8,
            backgroundColor: colors.red,
            borderRadius: radii.full,
            minWidth: 16,
            height: 16,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ color: colors.white, fontSize: 9, fontWeight: "900" }}>
            {badge > 9 ? "9+" : badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.icon,
        tabBarStyle: {
          height: Platform.OS === "ios" ? 85 : 72,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.bgCard,
          ...Platform.select({
            android: { elevation: 12 },
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Головна",
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          title: "Навчання",
          tabBarIcon: ({ focused }) => <TabIcon icon="📚" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Чат",
          tabBarIcon: ({ focused }) => <TabIcon icon="💬" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="club"
        options={{
          title: "Клуб",
          tabBarIcon: ({ focused }) => <TabIcon icon="🏆" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профіль",
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" active={focused} />,
        }}
      />

      {/* Hidden routes — reachable via router.push, not shown in the tab bar.
          Tests are now integrated into the Навчання hub; assistant (Лідик) opens from Home/Навчання. */}
      <Tabs.Screen name="tests" options={{ href: null }} />
      <Tabs.Screen name="practice" options={{ href: null }} />
      <Tabs.Screen name="assistant" options={{ href: null }} />
    </Tabs>
  );
}
