import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  workspace: {
    name: string;
    image_url: string;
    rating: number;
  } | null;
};

export default function WorkspaceDetailsModal({
  visible,
  onClose,
  workspace,
}: Props) {
  const insets = useSafeAreaInsets();

  if (!workspace) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      statusBarTranslucent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.modalView, { paddingTop: insets.top }]}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
            <Text style={styles.heading}>Workspace Details</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            <Image
              source={{
                uri: workspace.image_url || "https://via.placeholder.com/150",
              }}
              style={styles.image}
            />
            <View style={styles.detailsContainer}>
              <Text style={styles.name}>{workspace.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color={Colors.primary} />
                <Text style={styles.rating}>{workspace.rating}/5</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: 250,
  },
  detailsContainer: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 16,
    color: Colors.text,
  },
});
