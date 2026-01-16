import { useState } from 'react';
import { Topic } from '@learning-platform/shared/types';
import styles from './SubjectCard.module.css';

export interface SubjectCardProps {
  topic: Topic;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SubjectCard({ topic, isExpanded, onToggle }: SubjectCardProps) {
  return (
    <div className={`${styles.card} ${isExpanded ? styles.expanded : ''}`}>
      <button 
        className={styles.cardHeader}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`subtopics-${topic.id}`}
      >
        <div 
          className={styles.cardBackground}
          style={{ backgroundImage: `url(${topic.iconUrl})` }}
        />
        <div className={styles.cardContent}>
          <div className={styles.cardTitle}>{topic.title}</div>
          <div className={styles.cardDescription}>{topic.description}</div>
        </div>
        <div className={styles.cardIcon}>
          <svg 
            className={`${styles.chevron} ${isExpanded ? styles.chevronRotated : ''}`}
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none"
          >
            <path 
              d="M5 7.5L10 12.5L15 7.5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
      
      <div 
        id={`subtopics-${topic.id}`}
        className={`${styles.subtopicsContainer} ${isExpanded ? styles.subtopicsExpanded : ''}`}
      >
        <div className={styles.subtopicsContent}>
          {topic.subtopics.map((subtopic: any) => (
            <div key={subtopic.id} className={styles.subtopicItem}>
              <div className={styles.subtopicHeader}>
                <div className={styles.subtopicIconWrapper}>
                  {subtopic.iconUrl ? (
                    <img 
                      src={subtopic.iconUrl} 
                      alt={subtopic.title}
                      className={styles.subtopicIcon}
                    />
                  ) : (
                    <div className={styles.subtopicIconPlaceholder}>
                      {subtopic.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.subtopicInfo}>
                  <h4 className={styles.subtopicTitle}>{subtopic.title}</h4>
                  <p className={styles.subtopicDescription}>
                    Learn {subtopic.title.toLowerCase()} with {topic.title}
                  </p>
                </div>
              </div>
              <button className={styles.startLearningButton}>
                Start Learning
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}