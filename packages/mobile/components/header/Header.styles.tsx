import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 16,
  },
  backButton: {
    paddingRight: 4,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: "#ff8b42",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
  },
  profileContainer: {
    padding: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 139, 66, 0.2)",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 139, 66, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
