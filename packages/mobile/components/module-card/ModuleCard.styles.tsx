import { Theme } from "@/theme/Theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  contentContainer: {
    paddingBottom: Theme.spacing['4xl'],
  },

  // Progress Section
  progressSection: {
    padding: Theme.spacing['2xl'],
  },
  progressLabel: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.secondary,
    letterSpacing: Theme.typography.letterSpacing.wide,
    marginBottom: Theme.spacing.xs,
  },
  progressTitle: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },
  progressPercentage: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.accent.teal,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: Theme.colors.timeline.trackInactive,
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: Theme.spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.accent.teal,
    borderRadius: Theme.borderRadius.lg,
  },
  progressSubtext: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
  },

  // Timeline
  timeline: {
    paddingHorizontal: Theme.spacing.lg,
  },

  // Module Container
  moduleContainer: {
    flexDirection: 'row',
    marginBottom: Theme.spacing['3xl'],
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -32,
    width: 2,
  },
  timelineConnectorActive: {
    backgroundColor: Theme.colors.accent.tealLight,
  },
  timelineConnectorInactive: {
    backgroundColor: Theme.colors.timeline.trackInactive,
  },

  // Icon Container
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing['2xl'],
    zIndex: 10,
  },
  iconContainerCompleted: {
    backgroundColor: Theme.colors.accent.orange,
    ...Theme.shadows.card,
  },
  iconContainerActive: {
    backgroundColor: Theme.colors.accent.teal,
    shadowColor: Theme.colors.accent.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainerLocked: {
    backgroundColor: Theme.colors.timeline.trackInactive,
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    borderWidth: Theme.borderWidth.thin,
  },
  cardCompleted: {
    borderColor: Theme.colors.timeline.borderInactive,
    opacity: 0.8,
  },
  cardActive: {
    borderColor: Theme.colors.accent.teal,
    borderWidth: 2,
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.background.secondary,
    position: 'relative',
    overflow: 'hidden',
  },
  cardLocked: {
    borderColor: Theme.colors.timeline.borderInactive,
    borderStyle: 'dashed',
    backgroundColor: Theme.colors.background.tertiary,
    opacity: 0.6,
  },
  activeGlowCircle: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 128,
    height: 128,
    backgroundColor: Theme.colors.accent.tealLight,
    borderRadius: 64,
    opacity: 0.15,
  },

  // Card Content
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginRight: Theme.spacing.sm,
  },
  cardDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    lineHeight: Theme.typography.lineHeight.tight,
  },
  textMuted: {
    opacity: 0.7,
  },

  // Badge
  badge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.lg,
  },
  badgeCompleted: {
    backgroundColor: Theme.colors.accent.orangeLight,
  },
  badgeActive: {
    backgroundColor: Theme.colors.accent.tealLight,
  },
  badgeText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.accent.orange,
    textTransform: 'uppercase',
  },

  // Active Card Footer
  activeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
  },
  continueButton: {
    flex: 1,
    height: 40,
    backgroundColor: Theme.colors.accent.teal,
    borderRadius: Theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
  },
  continueButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },
  progressInfo: {
    alignItems: 'flex-end',
  },
  progressLabel: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.secondary,
  },
  progressValue: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },

  // AI Assessment Card
  aiAssessmentCard: {
    margin: Theme.spacing.lg,
    marginTop: Theme.spacing['3xl'],
    padding: Theme.spacing['2xl'],
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: Theme.colors.accent.tealLight,
    borderWidth: Theme.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  aiIconContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: Theme.spacing.sm,
    opacity: 0.3,
  },
  aiContent: {
    position: 'relative',
    zIndex: 10,
  },
  aiTitle: {
    fontSize: Theme.typography.fontSize.xl,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  aiDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    lineHeight: Theme.typography.lineHeight.tight,
    marginBottom: Theme.spacing.lg,
  },
  aiProgressBars: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  aiProgressBarActive: {
    flex: 1,
    height: 6,
    backgroundColor: Theme.colors.accent.tealLight,
    borderRadius: Theme.borderRadius.sm,
    overflow: 'hidden',
  },
  aiProgressBarFillActive: {
    height: '100%',
    width: '100%',
    backgroundColor: Theme.colors.accent.teal,
    opacity: 0.5,
  },
  aiProgressBarInactive: {
    flex: 1,
    height: 6,
    backgroundColor: Theme.colors.timeline.trackInactive,
    borderRadius: Theme.borderRadius.sm,
  },
});

