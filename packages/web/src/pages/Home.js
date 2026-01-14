import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Header } from '@/components/layout';
import { SubjectCard } from '@/components/ui';
import { mockTopics } from '@learning-platform/shared/types';
import './Home.styles.css';
export function Home() {
    const [expandedTopic, setExpandedTopic] = useState(null);
    const handleToggleTopic = (topicId) => {
        setExpandedTopic(expandedTopic === topicId ? null : topicId);
    };
    return (_jsxs("div", { className: "home-container", children: [_jsx(Header, {}), _jsxs("main", { className: "home-main", children: [_jsxs("div", { className: "home-header", children: [_jsx("h1", { children: "Choose Your Learning Path" }), _jsx("p", { children: "Select a programming language to begin your AI-powered learning journey" })] }), _jsx("div", { className: "subjects-list", children: mockTopics.map((topic) => (_jsx(SubjectCard, { topic: topic, isExpanded: expandedTopic === topic.id, onToggle: () => handleToggleTopic(topic.id) }, topic.id))) })] })] }));
}
