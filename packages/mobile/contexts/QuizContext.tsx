import React, { createContext, useContext, useState } from 'react';

export interface IQuizState {
  currentQuestion: number;
  totalQuestions: number;
  isSingleQuestion: boolean;
  timeLeft: number;
  totalTime: number;
  isTimeUp: boolean;
}

interface QuizContextType {
  quizState: IQuizState | null;
  setQuizState: (state: IQuizState | null) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [quizState, setQuizState] = useState<IQuizState | null>(null);

  return (
    <QuizContext.Provider value={{quizState, setQuizState}}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
