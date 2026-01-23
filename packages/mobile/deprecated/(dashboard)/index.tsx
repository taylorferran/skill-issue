
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/theme/Theme';


export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Headline Section */}
      <View style={styles.headline}>
        <Text style={styles.headlineTitle}>Your Current Path</Text>
        <Text style={styles.headlineSubtitle}>
          AI has detected a gap in your React state patterns.
        </Text>
      </View>

      {/* Discovery Stack Layout */}
      <View style={styles.stackContainer}>
        {/* Back Card 2 (Deepest) */}
        <View style={[styles.card, styles.backCard2]} />
        
        {/* Back Card 1 (Middle) */}
        <View style={[styles.card, styles.backCard1]}>
          <View style={styles.lockedContent}>
            <Text style={styles.lockedText}>Next: System Design Fundamentals</Text>
            <MaterialIcons 
              name="lock" 
              size={Theme.iconSize.md} 
              color={Theme.colors.text.secondary} 
            />
          </View>
        </View>

        {/* Front Primary Card */}
        <View style={[styles.card, styles.primaryCard]}>
          <View style={styles.cardContent}>
            <View>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>ACTIVE MODULE</Text>
                </View>
                <View style={styles.aiIconContainer}>
                  <MaterialIcons 
                    name="psychology" 
                    size={Theme.iconSize.xs} 
                    color={Theme.colors.primary.main} 
                  />
                </View>
              </View>

              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCokdKyeL5m6FkGwsy6ZszrwVqXWnPlqvNBO7NHJIJ4bSGj5a5PMMslzYZ4Tg14z9-yDsv9TOrD7netmERwhTKMSIYXf-WCG3JKu-CyKYRYkoMaIT0SkOwJmKiziTUHdiz3pLww3VPf4kN_iRyclm4zM_rQFzxTP9qLOsv5yy0EP87Fdntak8WQLj4YQbupyEcmLwn3sUd_LCEICFCfBQWn-icI-eS2p1R4bKB2A7EwuTFVDCFBTaLvEvDjxG1K-Rbars5bfgnhO-HU' }}
                style={styles.cardImage}
                contentFit="cover"
              />

              <Text style={styles.cardTitle}>React Hooks Deep Dive</Text>
              <Text style={styles.cardDescription}>
                Master `useMemo` and `useCallback` to prevent unnecessary re-renders in large lists.
              </Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Continue Learning</Text>
                <MaterialIcons 
                  name="play-arrow" 
                  size={Theme.iconSize.lg} 
                  color={Theme.colors.text.inverse} 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.bookmarkButton}>
                <MaterialIcons 
                  name="bookmark-border" 
                  size={Theme.iconSize.lg} 
                  color={Theme.colors.primary.main} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <MaterialIcons 
              name="workspace-premium" 
              size={Theme.iconSize.md} 
              color={Theme.colors.primary.main} 
            />
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>12</Text>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>+3 this week</Text>
            </View>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <MaterialIcons 
              name="local-fire-department" 
              size={Theme.iconSize.md} 
              color={Theme.colors.primary.main} 
            />
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>
              8 <Text style={styles.statUnit}>Days</Text>
            </Text>
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>New High</Text>
            </View>
          </View>
        </View>
      </View>

      {/* AI Insights Callout */}
      <View style={styles.aiCallout}>
        <View style={styles.aiCalloutContent}>
          <View style={styles.aiCalloutHeader}>
            <MaterialIcons 
              name="auto-awesome" 
              size={Theme.iconSize.md} 
              color={Theme.colors.primary.main} 
            />
            <Text style={styles.aiCalloutTitle}>AI Assessment Ready</Text>
          </View>
          <Text style={styles.aiCalloutText}>
            You've been crushing hooks! Ready for a 2-minute quiz to unlock the Next Level?
          </Text>
          <TouchableOpacity style={styles.aiCalloutButton}>
            <Text style={styles.aiCalloutButtonText}>Start Assessment</Text>
            <MaterialIcons 
              name="arrow-forward" 
              size={Theme.iconSize.sm} 
              color={Theme.colors.primary.main} 
            />
          </TouchableOpacity>
        </View>
        <MaterialIcons 
          name="quiz" 
          size={Theme.iconSize.xl} 
          color={Theme.colors.primary.light} 
          style={styles.aiCalloutIcon}
        />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Skill Gaps (AI Insights)</Text>
        <TouchableOpacity>
          <Text style={styles.sectionLink}>View Roadmap</Text>
        </TouchableOpacity>
      </View>

      {/* Skill Pills List */}
      <View style={styles.skillsList}>
        <TouchableOpacity style={styles.skillItem}>
          <View style={styles.skillItemLeft}>
            <View style={styles.skillIcon}>
              <MaterialIcons 
                name="storage" 
                size={Theme.iconSize.lg} 
                color={Theme.colors.primary.main} 
              />
            </View>
            <View style={styles.skillInfo}>
              <Text style={styles.skillName}>State Management</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '65%' }]} />
                </View>
                <Text style={styles.progressText}>65%</Text>
              </View>
            </View>
          </View>
          <MaterialIcons 
            name="chevron-right" 
            size={Theme.iconSize.lg} 
            color={Theme.colors.text.secondary} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.skillItem}>
          <View style={styles.skillItemLeft}>
            <View style={styles.skillIcon}>
              <MaterialIcons 
                name="api" 
                size={Theme.iconSize.lg} 
                color={Theme.colors.primary.main} 
              />
            </View>
            <View style={styles.skillInfo}>
              <Text style={styles.skillName}>GraphQL Basics</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '20%' }]} />
                </View>
                <Text style={styles.progressText}>20%</Text>
              </View>
            </View>
          </View>
          <MaterialIcons 
            name="chevron-right" 
            size={Theme.iconSize.lg} 
            color={Theme.colors.text.secondary} 
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  contentContainer: {
    padding: Theme.spacing['2xl'],
    paddingBottom: Theme.spacing['5xl'],
  },
  
  // Headline
  headline: {
    marginBottom: Theme.spacing['3xl'],
  },
  headlineTitle: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    lineHeight: Theme.typography.lineHeight.normal,
  },
  headlineSubtitle: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.xs,
  },

  // Stack Container
  stackContainer: {
    height: 420,
    marginBottom: Theme.spacing['4xl'],
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    ...Theme.shadows.card,
  },
  backCard2: {
    top: Theme.components.card.stackedTop.back2,
    height: 388,
    opacity: Theme.opacity.low,
    transform: [
      { scale: Theme.components.card.stackedScale.back2 }, 
      { translateY: Theme.components.card.stackedTranslateY.back2 }
    ],
    borderColor: Theme.colors.primary.light,
  },
  backCard1: {
    top: Theme.components.card.stackedTop.back1,
    height: 404,
    opacity: Theme.opacity.high,
    transform: [
      { scale: Theme.components.card.stackedScale.back1 }, 
      { translateY: Theme.components.card.stackedTranslateY.back1 }
    ],
    borderColor: Theme.colors.primary.medium,
    justifyContent: 'flex-end',
    padding: Theme.spacing['2xl'],
  },
  lockedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: Theme.opacity.medium,
  },
  lockedText: {
    fontWeight: Theme.typography.fontWeight.bold,
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
  },
  primaryCard: {
    top: Theme.components.card.stackedTop.front,
    height: 420,
    borderColor: Theme.colors.primary.border,
    padding: Theme.spacing['2xl'],
    ...Theme.shadows.primaryCard,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  badge: {
    backgroundColor: Theme.colors.primary.medium,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.xl,
  },
  badgeText: {
    color: Theme.colors.primary.main,
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: Theme.typography.letterSpacing.wide,
  },
  aiIconContainer: {
    width: Theme.spacing['2xl'],
    height: Theme.spacing['2xl'],
    borderRadius: Theme.spacing.md,
    backgroundColor: Theme.colors.primary.border,
    borderWidth: Theme.borderWidth.medium,
    borderColor: Theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing['2xl'],
  },
  cardTitle: {
    fontSize: Theme.typography.fontSize.xl,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  cardDescription: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    lineHeight: Theme.typography.lineHeight.tight,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Theme.spacing.lg,
    marginTop: Theme.spacing['2xl'],
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    gap: Theme.spacing.sm,
  },
  primaryButtonText: {
    color: Theme.colors.text.inverse,
    fontWeight: Theme.typography.fontWeight.bold,
    fontSize: Theme.typography.fontSize.base,
  },
  bookmarkButton: {
    width: Theme.components.button.height,
    height: Theme.components.button.height,
    borderWidth: Theme.borderWidth.medium,
    borderColor: Theme.colors.primary.border,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.lg,
    marginBottom: Theme.spacing['3xl'],
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.colors.background.secondary,
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  statLabel: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  statNumber: {
    fontSize: Theme.typography.fontSize['3xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },
  statUnit: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.regular,
    color: Theme.colors.text.secondary,
  },
  successBadge: {
    backgroundColor: Theme.colors.success.light,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.borderRadius.lg,
  },
  successBadgeText: {
    color: Theme.colors.success.main,
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  primaryBadge: {
    backgroundColor: Theme.colors.primary.border,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.borderRadius.lg,
  },
  primaryBadgeText: {
    color: Theme.colors.primary.main,
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
  },

  // AI Callout
  aiCallout: {
    backgroundColor: Theme.colors.primary.light,
    borderWidth: Theme.borderWidth.medium,
    borderColor: Theme.colors.primary.borderMedium,
    borderStyle: 'dashed',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing['2xl'],
    marginBottom: Theme.spacing['3xl'],
    position: 'relative',
    overflow: 'hidden',
  },
  aiCalloutContent: {
    position: 'relative',
    zIndex: 10,
  },
  aiCalloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  aiCalloutTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },
  aiCalloutText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    lineHeight: Theme.typography.lineHeight.tight,
    marginBottom: Theme.spacing.lg,
  },
  aiCalloutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  aiCalloutButtonText: {
    color: Theme.colors.primary.main,
    fontWeight: Theme.typography.fontWeight.bold,
    fontSize: Theme.typography.fontSize.base,
  },
  aiCalloutIcon: {
    position: 'absolute',
    right: -16,
    bottom: -16,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },
  sectionLink: {
    color: Theme.colors.primary.main,
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.bold,
  },

  // Skills List
  skillsList: {
    gap: Theme.spacing.lg,
  },
  skillItem: {
    backgroundColor: Theme.colors.background.secondary,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.lg,
    flex: 1,
  },
  skillIcon: {
    backgroundColor: Theme.colors.background.primary,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  progressBar: {
    width: Theme.components.progressBar.width,
    height: Theme.components.progressBar.height,
    backgroundColor: Theme.colors.primary.border,
    borderRadius: Theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.sm,
  },
  progressText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.secondary,
  },
});
