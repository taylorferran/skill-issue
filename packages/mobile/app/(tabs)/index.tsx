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

const { width } = Dimensions.get('window');

export default function SkillIssueDashboard() {
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
            <MaterialIcons name="lock" size={20} color="#8d705e" />
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
                  <MaterialIcons name="psychology" size={12} color="#ff8b42" />
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
                <MaterialIcons name="play-arrow" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.bookmarkButton}>
                <MaterialIcons name="bookmark-border" size={24} color="#ff8b42" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <MaterialIcons name="workspace-premium" size={20} color="#ff8b42" />
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
            <MaterialIcons name="local-fire-department" size={20} color="#ff8b42" />
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
            <MaterialIcons name="auto-awesome" size={20} color="#ff8b42" />
            <Text style={styles.aiCalloutTitle}>AI Assessment Ready</Text>
          </View>
          <Text style={styles.aiCalloutText}>
            You've been crushing hooks! Ready for a 2-minute quiz to unlock the Next Level?
          </Text>
          <TouchableOpacity style={styles.aiCalloutButton}>
            <Text style={styles.aiCalloutButtonText}>Start Assessment</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#ff8b42" />
          </TouchableOpacity>
        </View>
        <MaterialIcons 
          name="quiz" 
          size={100} 
          color="rgba(255, 139, 66, 0.1)" 
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
              <MaterialIcons name="storage" size={24} color="#ff8b42" />
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
          <MaterialIcons name="chevron-right" size={24} color="#8d705e" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.skillItem}>
          <View style={styles.skillItemLeft}>
            <View style={styles.skillIcon}>
              <MaterialIcons name="api" size={24} color="#ff8b42" />
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
          <MaterialIcons name="chevron-right" size={24} color="#8d705e" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf9f3',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 128,
  },
  
  // Headline
  headline: {
    marginBottom: 32,
  },
  headlineTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#181310',
    lineHeight: 32,
  },
  headlineSubtitle: {
    fontSize: 14,
    color: '#8d705e',
    marginTop: 4,
  },

  // Stack Container
  stackContainer: {
    height: 420,
    marginBottom: 48,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  backCard2: {
    top: 32,
    height: 388,
    opacity: 0.4,
    transform: [{ scale: 0.88 }, { translateY: 16 }],
    borderColor: 'rgba(255, 139, 66, 0.05)',
  },
  backCard1: {
    top: 16,
    height: 404,
    opacity: 0.8,
    transform: [{ scale: 0.94 }, { translateY: 8 }],
    borderColor: 'rgba(255, 139, 66, 0.1)',
    justifyContent: 'flex-end',
    padding: 24,
  },
  lockedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.5,
  },
  lockedText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#181310',
  },
  primaryCard: {
    top: 0,
    height: 420,
    borderColor: 'rgba(255, 139, 66, 0.2)',
    padding: 24,
    shadowColor: '#ff8b42',
    shadowOpacity: 0.15,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(255, 139, 66, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    color: '#ff8b42',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  aiIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 139, 66, 0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#181310',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#8d705e',
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#ff8b42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  bookmarkButton: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: 'rgba(255, 139, 66, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 139, 66, 0.1)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#181310',
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  statNumber: {
    fontSize: 30,
    fontWeight: '700',
    color: '#181310',
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8d705e',
  },
  successBadge: {
    backgroundColor: 'rgba(160, 217, 177, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  successBadgeText: {
    color: '#A0D9B1',
    fontSize: 10,
    fontWeight: '700',
  },
  primaryBadge: {
    backgroundColor: 'rgba(255, 139, 66, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  primaryBadgeText: {
    color: '#ff8b42',
    fontSize: 10,
    fontWeight: '700',
  },

  // AI Callout
  aiCallout: {
    backgroundColor: 'rgba(255, 139, 66, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 139, 66, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
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
    gap: 8,
    marginBottom: 8,
  },
  aiCalloutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181310',
  },
  aiCalloutText: {
    fontSize: 14,
    color: '#8d705e',
    lineHeight: 20,
    marginBottom: 16,
  },
  aiCalloutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiCalloutButtonText: {
    color: '#ff8b42',
    fontWeight: '700',
    fontSize: 14,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181310',
  },
  sectionLink: {
    color: '#ff8b42',
    fontSize: 14,
    fontWeight: '700',
  },

  // Skills List
  skillsList: {
    gap: 16,
  },
  skillItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 139, 66, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  skillIcon: {
    backgroundColor: '#fcf9f3',
    padding: 8,
    borderRadius: 8,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#181310',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: 96,
    height: 6,
    backgroundColor: 'rgba(255, 139, 66, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff8b42',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8d705e',
  },
});
