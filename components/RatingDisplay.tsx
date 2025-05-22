import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  rating: number | null;
  ratingCount?: number | null;
  showCount?: boolean;
  size?: number;
};

export default function RatingDisplay({
  rating,
  ratingCount,
  showCount = true,
  size = 14,
}: Props) {
  if (!rating) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.rating, { fontSize: size }]}>
        {rating.toFixed(1)}
      </Text>
      <View style={[styles.starsContainer, { marginLeft: 4 }]}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = rating >= star;
          const isHalf = !isFull && rating > star - 1;

          return (
            <Ionicons
              key={star}
              name={isHalf ? "star-half" : isFull ? "star" : "star-outline"}
              size={Math.round(size * 0.8)} // Make stars 75% of text size
              color={Colors.primary}
            />
          );
        })}
      </View>
      {showCount && ratingCount ? (
        <Text style={[styles.count, { fontSize: size * 0.8 }]}>
          ({ratingCount})
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontWeight: "400",
    color: Colors.text,
    minWidth: 24, // Slightly reduced
  },
  starsContainer: {
    flexDirection: "row",
    gap: 1, // Reduce gap between stars
    alignItems: "center",
  },
  count: {
    color: Colors.gray,
    marginLeft: 2,
  },
});
