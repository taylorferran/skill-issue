import { Theme } from "@/theme/Theme";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { createTextStyle } from "@/theme/ThemeUtils";
import { styles } from "./_index.styles";
import { router } from "expo-router";

interface AnswerOption {
  id: string;
  label: string;
  text: string;
}

const SkillAssessmentScreen = () => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("A");
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userFeedback, setUserFeedback] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(100)).current;

  const TOTAL_TIME = 30;
  const HALFWAY_POINT = TOTAL_TIME / 2;
  const CORRECT_ANSWER = "A"; // This would come from your API/data

  const explanation = "The call method explicitly set sthe 'this' context";

  const answerOptions: AnswerOption[] = [
    {
      id: "A",
      label: "A",
      text: "'Skill Issue'",
    },
    {
      id: "B",
      label: "B",
      text: "undefined",
    },
    {
      id: "C",
      label: "C",
      text: "TypeError",
    },
    {
      id: "D",
      label: "D",
      text: "null",
    },
  ];

  useEffect(() => {
    if (!isSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSubmitted]);

  useEffect(() => {
    const progressPercentage = (timeRemaining / TOTAL_TIME) * 100;
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [timeRemaining]);

  const getProgressColor = () => {
    if (timeRemaining <= HALFWAY_POINT) {
      return Theme.colors.accent.orange;
    }
    return Theme.colors.primary.main;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const handleSubmit = () => {
    if (!isSubmitted) {
      // Stop timer and show results
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsSubmitted(true);
    } else if (userFeedback !== null) {
      router.back();
    }
  };

  const getAnswerState = (optionId: string) => {
    if (!isSubmitted) return "default";
    if (optionId === CORRECT_ANSWER) return "correct";
    if (optionId === selectedAnswer && optionId !== CORRECT_ANSWER)
      return "incorrect";
    return "default";
  };

  const canProceed = !isSubmitted || (isSubmitted && userFeedback !== null);

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        {/* <View style={styles.headerCenter}> */}
        {/*   <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text> */}
        {/*   <Text style={styles.timerLabel}> */}
        {/*     {isSubmitted ? "Time Used" : "Time Remaining"} */}
        {/*   </Text> */}
        {/* </View> */}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
                backgroundColor: getProgressColor(),
              },
            ]}
          />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Section */}
        <View style={styles.questionSection}>
          <Text style={styles.questionText}>
            What is the output of the following JavaScript code?
          </Text>

          {/* Code Snippet Container */}
          <View style={styles.codeContainer}>
            <View style={styles.codeHeader}>
              <Text style={styles.codeFileName}>index.js</Text>
              <View style={styles.codeDots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>

            <View style={styles.codeContent}>
              <Text style={styles.codeText}>
                <Text style={styles.codePink}>function</Text>
                <Text> </Text>
                <Text style={styles.codeBlue}>greet</Text>
                <Text>{"() {"}</Text>
                {"\n"}
                <Text> console.</Text>
                <Text style={styles.codeBlue}>log</Text>
                <Text>(</Text>
                <Text style={styles.codePink}>this</Text>
                <Text>.name);</Text>
                {"\n"}
                <Text>{"}"}</Text>
                {"\n"}
                <Text>greet.</Text>
                <Text style={styles.codeBlue}>call</Text>
                <Text>{"({ name: "}</Text>
                <Text style={styles.codeOrange}>'Skill Issue'</Text>
                <Text>{" });"}</Text>
              </Text>
            </View>
          </View>
        </View>


        {/* Answer Options */}
        <View style={styles.answersContainer}>
          {answerOptions.map((option) => {
            const answerState = getAnswerState(option.id);
            const isCorrect = answerState === "correct";
            const isIncorrect = answerState === "incorrect";
            const isUserSelection = option.id === selectedAnswer;
            return (
              <View key={option.id} style={styles.answerWrapper}>
                <TouchableOpacity
                  style={[
                    styles.answerOption,
                    isUserSelection &&
                    !isSubmitted &&
                    styles.answerOptionSelected,
                    isCorrect && styles.answerOptionCorrect,
                    isIncorrect && styles.answerOptionIncorrect,
                  ]}
                  onPress={() => !isSubmitted && setSelectedAnswer(option.id)}
                  activeOpacity={isSubmitted ? 1 : 0.7}
                  disabled={isSubmitted}
                >
                  <View style={styles.answerContent}>
                    <View style={styles.answerHeader}>
                      <View
                        style={[
                          styles.answerLabel,
                          isUserSelection &&
                          !isSubmitted &&
                          styles.answerLabelSelected,
                          isCorrect && styles.answerLabelCorrect,
                          isIncorrect && styles.answerLabelIncorrect,
                        ]}
                      >
                        <Text
                          style={[
                            styles.answerLabelText,
                            isUserSelection &&
                            !isSubmitted &&
                            styles.answerLabelTextSelected,
                            isCorrect && styles.answerLabelTextCorrect,
                            isIncorrect && styles.answerLabelTextIncorrect,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </View>
                      <Text style={styles.answerText}>{option.text}</Text>
                    </View>
                  </View>

                  {/* Status Icons */}
                  {isUserSelection && !isSubmitted && (
                    <MaterialIcons
                      name="check-circle"
                      size={24}
                      color={Theme.colors.accent.orange}
                    />
                  )}
                  {isCorrect && (
                    <MaterialIcons
                      name="check-circle"
                      size={24}
                      color={Theme.colors.success.main}
                    />
                  )}
                  {isIncorrect && (
                    <MaterialIcons
                      name="cancel"
                      size={24}
                      color={Theme.colors.accent.orange}
                    />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
        {/* Detailed Explanation (shown after submission) */}
        {isSubmitted && (
          <View style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <MaterialIcons
                name="info"
                size={16}
                color={Theme.colors.primary.main}
              />
              <Text style={styles.explanationTitle}>Explanation</Text>
            </View>
            <Text style={styles.explanationText}>{explanation}</Text>
          </View>
        )}

        {/* Feedback Section (shown after submission) */}
        {isSubmitted && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>
              How useful was this question?
            </Text>
            <Text style={styles.feedbackSubtitle}>
              Your feedback helps us improve
            </Text>

            <View style={styles.feedbackRating}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    userFeedback === rating && styles.ratingButtonSelected,
                  ]}
                  onPress={() => setUserFeedback(rating)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={
                      userFeedback && userFeedback >= rating
                        ? "star"
                        : "star-border"
                    }
                    size={32}
                    color={
                      userFeedback && userFeedback >= rating
                        ? Theme.colors.primary.main
                        : Theme.colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.ratingText,
                      userFeedback === rating && styles.ratingTextSelected,
                    ]}
                  >
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            !canProceed && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          activeOpacity={0.9}
          disabled={!canProceed}
        >
          <Text style={styles.submitButtonText}>
            {!isSubmitted ? "Submit Answer" : "Continue"}
          </Text>
          <MaterialIcons
            name="arrow-forward"
            size={20}
            color={Theme.colors.text.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SkillAssessmentScreen;
