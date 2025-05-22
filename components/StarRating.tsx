import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  rating: number;
  size?: number;
  onPress?: (rating: number) => void;
  userRating?: number | null;
};

export default function StarRating({
  rating,
  size = 16,
  onPress,
  userRating,
}: Props) {
  const displayRating = userRating ?? rating;

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = displayRating >= star;
        const isHalf = !isFull && displayRating > star - 1;

        return (
          <Pressable key={star} onPress={() => onPress?.(star)}>
            <Ionicons
              name={isHalf ? "star-half" : isFull ? "star" : "star-outline"}
              size={size}
              color={Colors.primary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
});
