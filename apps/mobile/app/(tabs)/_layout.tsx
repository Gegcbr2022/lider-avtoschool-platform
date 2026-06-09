import { Tabs } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { subscribeToConversations } from "../../lib/firestore";
import { subscribeNotificationInbox } from "../../lib/notifications";
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
  const { user, mode } = useAuth();
  const [chatBadge, setChatBadge] = useState(0);
  const [notificationBadge, setNotificationBadge] = useState(0);
  const lastSeenRef = useRef(new Date());

  useEffect(() => {
    if (mode !== "authenticated" || !user?.id || user.isGuest) return;
    const unsub = subscribeToConversations(user.id, (convs) => {
      const n = convs.filter(
        (c) =>
          c.unreadBy?.includes(user.id) ||
          (
            !c.unreadBy?.length &&
            c.lastMessageAt &&
            c.lastMessageAt > lastSeenRef.current &&
            // Only count messages from others — never from the current user themselves.
            c.lastSenderId !== user.id &&
            c.lastSenderId !== undefined
          )
      ).length;
      setChatBadge(n);
    });
    return unsub;
  }, [user?.id, mode]);

  useEffect(() => {
    if (mode !== "authenticated" || user?.isGuest) {
      setNotificationBadge(0);
      return;
    }
    return subscribeNotificationInbox((items) => {
      // Only actionable items drive the profile badge. Recurring engagement
      // nudges (тест дня / серія) re-fire daily and aren't something the user
      // "clears", so counting them produced a permanent phantom "1" badge.
      setNotificationBadge(
        items.filter(
          (item) => !item.readAt && item.kind !== "daily-test" && item.kind !== "streak"
        ).length
      );
    });
  }, [mode, user?.isGuest]);

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
          tabBarIcon: ({ focused }) => <TabIcon icon="💬" active={focused} badge={chatBadge} />,
        }}
        listeners={{
          tabPress: () => {
            lastSeenRef.current = new Date();
            setChatBadge(0);
          },
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
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" active={focused} badge={notificationBadge} />,
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
