import React, { useEffect } from "react";
import { router } from "expo-router";
import { MCQQuiz } from "@/components/mcq-quiz/quiz/MCQQuiz";
import { useRouteParams } from "@/navigation/navigation";

interface AnswerOption {
  id: string;
  label: string;
  text: string;
}

const SkillAssessmentScreen = () => {
  const { data } = useRouteParams("quiz");

  const quizKey = Array.isArray(data)
    ? data.map((q) => q.id).join("-")
    : data.id;

  return (
    <MCQQuiz
      key={quizKey}
      data={data}
      onFinish={() => router.back()}
    />
  );
};

export default SkillAssessmentScreen;
