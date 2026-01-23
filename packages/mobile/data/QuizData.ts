import { MCQQuestion } from "@/types/Quiz";

// Preset Test Data - Single Question
export const SINGLE_QUESTION_TEST: MCQQuestion = {
  id: 1,
  question: "What is the time complexity of dictionary lookups in Python?",
  answers: [
    { id: 1, text: "O(1) average case" },
    { id: 2, text: "O(n)" },
    { id: 3, text: "O(log n)" },
    { id: 4, text: "O(n²)" },
  ],
  correctAnswerId: 1,
  explanation:
    "Python dictionaries use hash tables, which provide O(1) average case time complexity for lookups. However, in worst case scenarios (with hash collisions), it can degrade to O(n).",
};

// Preset Test Data - Multiple Questions
export const MULTIPLE_QUESTIONS_TEST: MCQQuestion[] = [
  {
    id: 1,
    question: "How do you define a decorator in Python?",
    answers: [
      { id: 1, text: "Using @decorator syntax above the function" },
      { id: 2, text: "Using decorator() function call" },
      { id: 3, text: "Using def decorator keyword" },
      { id: 4, text: "Using class Decorator inheritance" },
    ],
    correctAnswerId: 1,
    explanation:
      "Decorators in Python are defined using the @decorator syntax placed above a function definition. They allow you to modify or enhance function behavior.",
  },
  {
    id: 2,
    question: "What is the difference between __str__ and __repr__?",
    answers: [
      { id: 1, text: "__str__ is for users, __repr__ is for developers" },
      { id: 2, text: "They are exactly the same method" },
      { id: 3, text: "__str__ is private, __repr__ is public" },
      { id: 4, text: "__repr__ only works with strings" },
    ],
    correctAnswerId: 1,
    explanation:
      "__str__ returns a readable string for end users, while __repr__ returns an unambiguous representation for developers that ideally could recreate the object.",
  },
  {
    id: 3,
    question: "What is the purpose of list comprehensions in Python?",
    answers: [
      { id: 1, text: "To create lists in a concise, readable way" },
      { id: 2, text: "To compress lists into smaller sizes" },
      { id: 3, text: "To sort lists automatically" },
      { id: 4, text: "To concatenate multiple lists" },
    ],
    correctAnswerId: 1,
    explanation:
      "List comprehensions provide a concise way to create lists based on existing lists or iterables, making code more readable and pythonic.",
  },
  {
    id: 4,
    question: "What is the main difference between lists and generators?",
    answers: [
      { id: 1, text: "Generators are lazy, lists are eager" },
      { id: 2, text: "Lists are always faster than generators" },
      { id: 3, text: "Generators cannot be iterated over" },
      { id: 4, text: "Lists use less memory than generators" },
    ],
    correctAnswerId: 1,
    explanation:
      "Generators are lazy iterators that generate values on-the-fly, while lists are eager and store all values in memory. This makes generators more memory-efficient for large datasets.",
  },
];


