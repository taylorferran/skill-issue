export interface Topic {
  id: string;
  title: string;
  description: string;
  subtopics: Subtopic[];
  iconUrl?: string;
}

export interface Subtopic {
  id: string;
  title: string;
  parentTopicId: string;
  order: number;
  iconUrl?: string;
}

export const mockTopics: Topic[] = [
  {
    id: '1',
    title: 'Python',
    description: 'Learn Python programming from basics to advanced concepts',
    iconUrl: 'https://images.unsplash.com/photo-1579427338807-7c39020f88dc?auto=format&fit=crop&w=200&h=200',
    subtopics: [
      {
        id: '1-1',
        title: 'Data Analytics',
        parentTopicId: '1',
        order: 1,
        iconUrl: 'https://images.unsplash.com/photo-1551288045-7c13fb841fa5?auto=format&fit=crop&w=200&h=200'
      },
      {
        id: '1-2',
        title: 'Web Development',
        parentTopicId: '1',
        order: 2,
        iconUrl: 'https://images.unsplash.com/photo-1555066931-4365d147ae9b?auto=format&fit=crop&w=200&h=200'
      }
    ]
  },
  {
    id: '2',
    title: 'JavaScript',
    description: 'Master JavaScript for web development and beyond',
    iconUrl: 'https://images.unsplash.com/photo-1555066931-4365d147ae9b?auto=format&fit=crop&w=200&h=200',
    subtopics: [
      {
        id: '2-1',
        title: 'React',
        parentTopicId: '2',
        order: 1,
        iconUrl: 'https://images.unsplash.com/photo-1555066931-4365d147ae9b?auto=format&fit=crop&w=200&h=200'
      },
      {
        id: '2-2',
        title: 'Node.js',
        parentTopicId: '2',
        order: 2,
        iconUrl: 'https://images.unsplash.com/photo-1555066931-4365d147ae9b?auto=format&fit=crop&w=200&h=200'
      }
    ]
  }
];