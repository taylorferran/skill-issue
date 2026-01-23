import { Theme } from '@/theme/Theme';
import { flex } from '@/theme/ThemeUtils';
import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { navigateTo, useRouteParams } from '@/navigation/navigation';
import { SubtopicCard } from '@/components/topic-card/TopicCard';
import { styles } from './_index.styles';

// Icon component placeholder - replace with your actual icon component
const Icon = ({ name, size = 24, color = Theme.colors.text.primary }: { 
  name: string; 
  size?: number; 
  color?: string;
}) => (
  <View style={{ width: size, height: size }} />
);

export const TopicSelectScreen: React.FC = () => {
  const { skill } = useRouteParams('topicSelection');
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: skill,
    });
  }, [navigation, skill]);

  const handleAssess = (topic: string) => {
    navigateTo('questions', { skill: skill, progress: 0});
    // Handle navigation or modal opening
  };

  const handleAICoach = () => {
    console.log('Starting AI Coach');
    // Handle navigation to AI coach
  };

  const subtopics = [
    {
      id: '1',
      title: 'Memory Management',
      grade: 4,
      maxGrade: 10,
      iconName: 'memory',
      backgroundColor: Theme.colors.pastel.peach,
    },
    {
      id: '2',
      title: 'Ownership & Borrowing',
      grade: 7,
      maxGrade: 10,
      iconName: 'link',
      backgroundColor: Theme.colors.pastel.lavender,
    },
  ];

  const overallGrade = 3.6;
  const maxGrade = 10;
  const progressPercentage = (overallGrade / maxGrade) * 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Overall Progress Section */}
      <View style={[styles.progressCard, Theme.shadows.card]}>
        <View style={[flex.rowBetween, { marginBottom: Theme.spacing.lg }]}>
          <View>
            <Text style={styles.progressLabel}>LEARNING PATH</Text>
            <Text style={styles.progressTitle}>Overall Mastery</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.gradeNumber}>
              {overallGrade}
              <Text style={styles.gradeMax}>/{maxGrade}</Text>
            </Text>
          </View>
        </View>
        <View style={{ marginBottom: Theme.spacing.sm }}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
        </View>
        <Text style={styles.progressMessage}>
          Keep pushing, you're getting there!
        </Text>
      </View>

      {/* Subtopics Grid */}
      <View style={styles.bentoGrid}>
        {/* First Row - Two Small Cards */}
        <View style={styles.gridRow}>
          <SubtopicCard
            title="Memory Management"
            grade={4}
            maxGrade={10}
            iconName="memory"
            backgroundColor={Theme.colors.pastel.peach}
            onPress={() => handleAssess('Memory Management')}
          />
          <SubtopicCard
            title="Ownership & Borrowing"
            grade={7}
            maxGrade={10}
            iconName="link"
            backgroundColor={Theme.colors.pastel.lavender}
            onPress={() => handleAssess('Ownership & Borrowing')}
          />
        </View>

        {/* Large Card */}
        <SubtopicCard
          title="Enums & Pattern Matching"
          grade={2}
          maxGrade={10}
          iconName="grid_view"
          backgroundColor={Theme.colors.pastel.yellow}
          isLarge
          onPress={() => handleAssess('Enums & Pattern Matching')}
        />

        {/* Second Row - Two Small Cards */}
        <View style={styles.gridRow}>
          <SubtopicCard
            title="Structs & Traits"
            grade={0}
            maxGrade={10}
            iconName="rebase_edit"
            backgroundColor={Theme.colors.pastel.mint}
            onPress={() => handleAssess('Structs & Traits')}
          />
          <SubtopicCard
            title="Error Handling"
            grade={5}
            maxGrade={10}
            iconName="error"
            backgroundColor={Theme.colors.pastel.grey}
            onPress={() => handleAssess('Error Handling')}
          />
        </View>
      </View>

      {/* AI Assistant Promo */}
      <View style={styles.aiPromoCard}>
        <View style={styles.aiPromoCircle1} />
        <View style={styles.aiPromoCircle2} />
        <View style={styles.aiPromoContent}>
          <Text style={styles.aiPromoTitle}>Personalized AI Coach</Text>
          <Text style={styles.aiPromoDescription}>
            Want a custom study plan based on your current grades?
          </Text>
          <TouchableOpacity style={styles.aiPromoButton} onPress={handleAICoach}>
            <Text style={styles.aiPromoButtonText}>Start Chatting</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};


export default TopicSelectScreen;
