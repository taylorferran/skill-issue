export const mockTopics = [
    {
        id: '1',
        title: 'Python',
        description: 'Learn Python programming from basics to advanced concepts',
        iconUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=400&q=80',
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
            },
            {
                id: '1-3',
                title: 'Machine Learning',
                parentTopicId: '1',
                order: 3,
                iconUrl: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=200&h=200'
            }
        ]
    },
    {
        id: '2',
        title: 'JavaScript',
        description: 'Master JavaScript for web development and beyond',
        iconUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&w=800&h=400&q=80',
        subtopics: [
            {
                id: '2-1',
                title: 'React',
                parentTopicId: '2',
                order: 1,
                iconUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=200&h=200'
            },
            {
                id: '2-2',
                title: 'Node.js',
                parentTopicId: '2',
                order: 2,
                iconUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&w=200&h=200'
            },
            {
                id: '2-3',
                title: 'TypeScript',
                parentTopicId: '2',
                order: 3,
                iconUrl: 'https://images.unsplash.com/photo-1614624532983-4bec03e00a23?auto=format&fit=crop&w=200&h=200'
            }
        ]
    },
    {
        id: '3',
        title: 'Java',
        description: 'Build robust applications with Java and enterprise frameworks',
        iconUrl: 'https://images.unsplash.com/photo-1516116216624-57e8b1d7b7b6?auto=format&fit=crop&w=800&h=400&q=80',
        subtopics: [
            {
                id: '3-1',
                title: 'Spring Boot',
                parentTopicId: '3',
                order: 1,
                iconUrl: 'https://images.unsplash.com/photo-1555066931-4365d147ae9b?auto=format&fit=crop&w=200&h=200'
            },
            {
                id: '3-2',
                title: 'Android Development',
                parentTopicId: '3',
                order: 2,
                iconUrl: 'https://images.unsplash.com/photo-1607252650356-f7fd0460cc54?auto=format&fit=crop&w=200&h=200'
            },
            {
                id: '3-3',
                title: 'Microservices',
                parentTopicId: '3',
                order: 3,
                iconUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&h=200'
            }
        ]
    },
    {
        id: '4',
        title: 'C++',
        description: 'Master systems programming with C++ for performance-critical applications',
        iconUrl: 'https://images.unsplash.com/photo-1516116216624-57e8b1d7b7b6?auto=format&fit=crop&w=800&h=400&q=80',
        subtopics: [
            {
                id: '4-1',
                title: 'Game Development',
                parentTopicId: '4',
                order: 1,
                iconUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=200&h=200'
            },
            {
                id: '4-2',
                title: 'System Programming',
                parentTopicId: '4',
                order: 2,
                iconUrl: 'https://images.unsplash.com/photo-1555066931-4365d147ae9b?auto=format&fit=crop&w=200&h=200'
            },
            {
                id: '4-3',
                title: 'Embedded Systems',
                parentTopicId: '4',
                order: 3,
                iconUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&h=200'
            }
        ]
    },
    {
        id: '5',
        title: 'Go',
        description: 'Learn Go for cloud-native development and concurrent programming',
        iconUrl: 'https://images.unsplash.com/photo-1555066931-4365d147ae9b?auto=format&fit=crop&w=800&h=400&q=80',
        subtopics: [
            {
                id: '5-1',
                title: 'Cloud Development',
                parentTopicId: '5',
                order: 1,
                iconUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=200&h=200'
            },
            {
                id: '5-2',
                title: 'Microservices',
                parentTopicId: '5',
                order: 2,
                iconUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&h=200'
            },
            {
                id: '5-3',
                title: 'DevOps Tools',
                parentTopicId: '5',
                order: 3,
                iconUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=200&h=200'
            }
        ]
    },
    {
        id: '6',
        title: 'Rust',
        description: 'Explore Rust for safe systems programming and high-performance applications',
        iconUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&h=400&q=80',
        subtopics: [
            {
                id: '6-1',
                title: 'Systems Programming',
                parentTopicId: '6',
                order: 1,
                iconUrl: 'https://images.unsplash.com/photo-1555066931-4365d147ae9b?auto=format&fit=crop&w=200&h=200'
            },
            {
                id: '6-2',
                title: 'WebAssembly',
                parentTopicId: '6',
                order: 2,
                iconUrl: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd3?auto=format&fit=crop&w=200&h=200'
            },
            {
                id: '6-3',
                title: 'Blockchain',
                parentTopicId: '6',
                order: 3,
                iconUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=200&h=200'
            }
        ]
    }
];
