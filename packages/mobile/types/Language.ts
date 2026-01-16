import { Ionicons } from "@expo/vector-icons";

export type Language=  {
  id: string;
  name: string;
  subtopics: number;
  aiPowered: boolean;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPrimary: boolean;
}

export const languageMock : Language[] = [
  {
    id: "1",
    name: "Rust",
    subtopics: 24,
    aiPowered: true,
    description:
      "Performance, safety, and modern systems programming with a focus on memory safety.",
    icon: "settings-outline",
    isPrimary: true,
  },
  {
    id: "2",
    name: "JavaScript",
    subtopics: 42,
    aiPowered: false,
    description:
      "The versatile language of the web, powering everything from browser UIs to scalable servers.",
    icon: "logo-javascript",
    isPrimary: false,
  },
  {
    id: "3",
    name: "Python",
    subtopics: 38,
    aiPowered: true,
    description:
      "Simple syntax for AI, data science, and automation. Perfect for beginners and researchers.",
    icon: "server-outline",
    isPrimary: false,
  },
  {
    id: "4",
    name: "TypeScript",
    subtopics: 31,
    aiPowered: false,
    description:
      "Strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.",
    icon: "code-slash-outline",
    isPrimary: false,
  },

]

