import Colors from "@/constants/Colors";
import { WorkspaceImage } from "@/types/Workspace";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type Props = {
  images: WorkspaceImage[];
  selectedImageIndex: number;
  onImageChange: (index: number) => void;
  canRemoveImage?: (imageId: string) => boolean;
  onRemoveImage?: (imageId: string) => void;
};

export default function ImageGallery({
  images,
  selectedImageIndex,
  onImageChange,
  canRemoveImage,
  onRemoveImage,
}: Props) {
  const translateX = useSharedValue(0);
  const context = useSharedValue({ x: 0 });

  const handleIndexChange = (newIndex: number) => {
    onImageChange(newIndex);
    translateX.value = withSpring(0);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value };
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;
    })
    .onEnd((event) => {
      const shouldSwipe =
        Math.abs(event.velocityX) > 500 || Math.abs(translateX.value) > 100;

      if (shouldSwipe) {
        const direction = event.velocityX > 0 ? -1 : 1;
        const newIndex = selectedImageIndex + direction;

        if (newIndex >= 0 && newIndex < images.length) {
          runOnJS(handleIndexChange)(newIndex);
        } else {
          translateX.value = withSpring(0);
        }
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.imageWrapper, rStyle]}>
          <Image
            source={{
              uri:
                images[selectedImageIndex]?.image_url?.trim() ||
                "https://via.placeholder.com/150",
            }}
            style={styles.image}
          />
        </Animated.View>
      </GestureDetector>

      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                selectedImageIndex === index && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}

      {canRemoveImage &&
        onRemoveImage &&
        images[selectedImageIndex] &&
        canRemoveImage(images[selectedImageIndex].id) && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemoveImage(images[selectedImageIndex].id)}
          >
            <Ionicons name="trash-outline" size={24} color="white" />
          </TouchableOpacity>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 300,
    backgroundColor: Colors.background,
    overflow: "hidden",
    position: "relative",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  pagination: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  removeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
});
