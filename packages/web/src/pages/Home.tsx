import { useState } from 'react';
import { Header } from '@/components/layout';
import { SubjectCard } from '@/components/ui';
import { mockTopics } from '@learning-platform/shared/types';
import './Home.styles.css';

export function Home() {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const handleToggleTopic = (topicId: string) => {
    setExpandedTopic(expandedTopic === topicId ? null : topicId);
  };

  return (
    <div className="home-container">
      <Header />
      
      <main className="home-main">
        <div className="home-header">
          <h1>Choose Your Learning Path</h1>
          <p>Select a programming language to begin your AI-powered learning journey</p>
        </div>
        
        <div className="subjects-list">
          {mockTopics.map((topic: any) => (
            <SubjectCard
              key={topic.id}
              topic={topic}
              isExpanded={expandedTopic === topic.id}
              onToggle={() => handleToggleTopic(topic.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}