import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme, radii, shadows } from "../lib/theme";

type LidikGuideProps = {
  text: string;
  actionText?: string;
  onAction?: () => void;
  style?: object;
  variant?: "default" | "card" | "inline";
};

export function LidikGuide({ text, actionText, onAction, style, variant = "default" }: LidikGuideProps) {
  const { colors } = useTheme();

  if (variant === "inline") {
    return (
      <View style={[styles.inlineContainer, { backgroundColor: colors.infoSoft }, style]}>
        <Text style={styles.inlineAvatar}>🤖</Text>
        <Text style={[styles.inlineText, { color: colors.textPrimary }]}>{text}</Text>
        {actionText && onAction && (
          <Pressable onPress={onAction} style={styles.inlineAction}>
            <Text style={[styles.inlineActionText, { color: colors.info }]}>{actionText}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variant === "card" ? colors.bgCard : "transparent",
          borderColor: variant === "card" ? colors.border : "transparent",
          borderWidth: variant === "card" ? 1 : 0,
          borderRadius: radii.lg,
          padding: variant === "card" ? 16 : 0,
        },
        variant === "card" ? shadows.card : null,
        style,
      ]}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarBg, { backgroundColor: colors.infoSoft }]}>
          <Text style={styles.avatar}>🤖</Text>
        </View>
      </View>
      <View style={[styles.bubble, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
        <View style={[styles.bubbleTriangleBorder, { borderRightColor: colors.border }]} />
        <View style={[styles.bubbleTriangleFill, { borderRightColor: colors.bgElevated }]} />
        <Text style={[styles.text, { color: colors.textPrimary }]}>{text}</Text>
        {actionText && onAction && (
          <Pressable onPress={onAction} style={[styles.actionButton, { backgroundColor: colors.info }]}>
            <Text style={styles.actionText}>{actionText}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarContainer: {
    paddingTop: 4,
  },
  avatarBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    fontSize: 24,
  },
  bubble: {
    flex: 1,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    position: "relative",
  },
  bubbleTriangleBorder: {
    position: "absolute",
    left: -11,
    top: 11,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 11,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  bubbleTriangleFill: {
    position: "absolute",
    left: -9,
    top: 13,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 9,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  actionButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  inlineAvatar: {
    fontSize: 20,
  },
  inlineText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  inlineAction: {
    paddingLeft: 8,
  },
  inlineActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
