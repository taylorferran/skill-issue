// components/mcq-quiz/star-rating/StarRating.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Theme } from "@/theme/Theme";
import { styles } from "./StarRating.styles";

type StarRatingProps = {
  rating: number | null;
  text: string;
  onRatingSelect: (rating: number) => void;
};

export const StarRating: React.FC<StarRatingProps> = ({
  text,
  rating,
  onRatingSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{text}</Text>

      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingSelect(star)}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <MaterialIcons
              name={rating && star <= rating ? "star" : "star-border"}
              size={40}
              color={
                rating && star <= rating
                  ? Theme.colors.warning.main
                  : Theme.colors.text.secondary
              }
            />
          </TouchableOpacity>
        ))}
      </View>

      {rating && (
        <Text style={styles.ratingText}>
          You rated this {rating} star{rating !== 1 ? "s" : ""}
        </Text>
      )}
    </View>
  );
};
