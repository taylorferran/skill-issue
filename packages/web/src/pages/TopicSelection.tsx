import { useState } from 'react';
import { mockTopics } from '../../../shared/src/types/topic';
import './TopicSelection.styles.css';

export function TopicSelection() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  return (
    <div className="topic-selection-container">
      <h1>Select a Topic</h1>
      <div className="topics-grid">
        {mockTopics.map((topic: any) => (
          <div 
            key={topic.id} 
            className={`topic-card ${selectedTopic === topic.id ? 'selected' : ''}`}
            onClick={() => setSelectedTopic(topic.id)}
          >
            <img src={topic.iconUrl} alt={topic.title} className="topic-icon" />
            <h2>{topic.title}</h2>
            <p>{topic.description}</p>
            <div className="subtopics">
              {topic.subtopics.map((subtopic: any) => (
                <div key={subtopic.id} className="subtopic">
                  <img src={subtopic.iconUrl} alt={subtopic.title} className="subtopic-icon" />
                  <span>{subtopic.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}