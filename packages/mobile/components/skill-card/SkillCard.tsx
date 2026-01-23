import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Skill } from '@/types/Skill';
import { Theme } from '@/theme/Theme';
import { ProgressBar } from '@/components/progress-bar/ProgressBar';
import { styles } from './SkillCard.styles';

interface SkillCardProps {
  skill: Skill;
  onSelect: (skill: Skill) => void;
}

export function SkillCard({ skill, onSelect }: SkillCardProps) {
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onSelect(skill)}
      activeOpacity={0.95}
    >
      {/* Main Content */}
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.level}>Lvl {skill.level}</Text>
          <Text style={styles.name}>{skill.name}</Text>
          <Text style={styles.category}>{skill.category}</Text>
        </View>
        
        {/* Skill Icon */}
        <View style={[styles.iconContainer]}>
          <Ionicons 
            name={skill.icon} 
            size={28} 
            color={Theme.colors.text.inverse} 
          />
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar 
        progress={skill.progress} 
        color={Theme.colors.primary.main}
      />
    </TouchableOpacity>
  );
}
