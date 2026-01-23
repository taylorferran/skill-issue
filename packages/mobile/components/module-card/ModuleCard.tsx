import { Theme } from "@/theme/Theme";
import { styles } from "./ModuleCard.styles";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Module } from "@/types/Module";

interface ModuleCardProps {
  module: Module;
  isLast: boolean;
  onPress?: () => void;
}

const Icon = ({ 
  name, 
  size = 24, 
  color = Theme.colors.text.primary,
  filled = false 
}: { 
  name: string; 
  size?: number; 
  color?: string;
  filled?: boolean;
}) => (
  <View style={{ width: size, height: size }} />
);



export const ModuleCard: React.FC<ModuleCardProps> = ({ module, isLast, onPress }) => {
  const isCompleted = module.status === 'completed';
  const isActive = module.status === 'active';
  const isLocked = module.status === 'locked';

  const getIconContainerStyle = () => {
    if (isCompleted) {
      return [styles.iconContainer, styles.iconContainerCompleted];
    }
    if (isActive) {
      return [styles.iconContainer, styles.iconContainerActive];
    }
    return [styles.iconContainer, styles.iconContainerLocked];
  };

  const getIconName = () => {
    if (isCompleted) return 'check';
    if (isActive) return 'play_arrow';
    return 'lock';
  };

  const getCardStyle = () => {
    if (isCompleted) {
      return [styles.card, styles.cardCompleted];
    }
    if (isActive) {
      return [styles.card, styles.cardActive, Theme.shadows.card];
    }
    return [styles.card, styles.cardLocked];
  };

  const getBadgeStyle = () => {
    if (isCompleted) {
      return [styles.badge, styles.badgeCompleted];
    }
    if (isActive) {
      return [styles.badge, styles.badgeActive];
    }
    return null;
  };

  const getBadgeText = () => {
    if (isCompleted) return 'Completed';
    if (isActive) return 'In Progress';
    return null;
  };

  return (
    <View style={styles.moduleContainer}>
      {/* Timeline connector */}
      {!isLast && (
        <View 
          style={[
            styles.timelineConnector,
            isCompleted ? styles.timelineConnectorActive : styles.timelineConnectorInactive
          ]} 
        />
      )}

      {/* Timeline dot/icon */}
      <View style={getIconContainerStyle()}>
        <Icon 
          name={getIconName()} 
          size={24} 
          color={isLocked ? Theme.colors.text.secondary : Theme.colors.text.inverse}
        />
      </View>

      {/* Card content */}
      <TouchableOpacity 
        style={getCardStyle()} 
        disabled={isLocked}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {isActive && <View style={styles.activeGlowCircle} />}
        
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isLocked && styles.textMuted]}>
            {module.title}
          </Text>
          {getBadgeText() && (
            <View style={getBadgeStyle()}>
              <Text style={styles.badgeText}>{getBadgeText()}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardDescription, isLocked && styles.textMuted]}>
          {module.description}
        </Text>

        {isActive && module.progress !== undefined && (
          <View style={styles.activeCardFooter}>
            <TouchableOpacity style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continue Learning</Text>
              <Icon name="bolt" size={18} color={Theme.colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{module.progress}%</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};


