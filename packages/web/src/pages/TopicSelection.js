import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { mockTopics } from '../../../shared/src/types/topic';
import './TopicSelection.styles.css';
export function TopicSelection() {
    const [selectedTopic, setSelectedTopic] = useState(null);
    return (_jsxs("div", { className: "topic-selection-container", children: [_jsx("h1", { children: "Select a Topic" }), _jsx("div", { className: "topics-grid", children: mockTopics.map((topic) => (_jsxs("div", { className: `topic-card ${selectedTopic === topic.id ? 'selected' : ''}`, onClick: () => setSelectedTopic(topic.id), children: [_jsx("img", { src: topic.iconUrl, alt: topic.title, className: "topic-icon" }), _jsx("h2", { children: topic.title }), _jsx("p", { children: topic.description }), _jsx("div", { className: "subtopics", children: topic.subtopics.map((subtopic) => (_jsxs("div", { className: "subtopic", children: [_jsx("img", { src: subtopic.iconUrl, alt: subtopic.title, className: "subtopic-icon" }), _jsx("span", { children: subtopic.title })] }, subtopic.id))) })] }, topic.id))) })] }));
}
