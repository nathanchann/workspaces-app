import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  workspace: {
    id: string; // Add id to the type
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
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (workspace?.id) {
      fetchVoteCounts();
    }
  }, [workspace?.id]);

  const fetchVoteCounts = async () => {
    if (!workspace?.id) return;

    try {
      const [upvoteData, downvoteData] = await Promise.all([
        supabase.rpc("get_upvote_count_for_workspace", {
          p_workspace_id: workspace.id, // Changed from workspace_id to p_workspace_id
        }),
        supabase.rpc("get_downvote_count_for_workspace", {
          p_workspace_id: workspace.id, // Changed from workspace_id to p_workspace_id
        }),
      ]);

      if (upvoteData.error) throw upvoteData.error;
      if (downvoteData.error) throw downvoteData.error;

      setUpvotes(upvoteData.data || 0);
      setDownvotes(downvoteData.data || 0);
    } catch (error) {
      console.error("Error fetching vote counts:", error);
    }
  };

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
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: workspace.image_url || "https://via.placeholder.com/150",
                }}
                style={styles.image}
              />
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.name}>{workspace.name}</Text>

              <View style={styles.statsRow}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={20} color={Colors.primary} />
                  <Text style={styles.rating}>{workspace.rating}/5</Text>
                </View>

                <View style={styles.votesContainer}>
                  <View style={styles.voteItem}>
                    <Ionicons
                      name="arrow-up-circle"
                      size={20}
                      color={Colors.primary}
                    />
                    <Text style={styles.voteCount}>{upvotes}</Text>
                  </View>
                  <View style={styles.voteItem}>
                    <Ionicons
                      name="arrow-down-circle"
                      size={20}
                      color={Colors.gray}
                    />
                    <Text style={styles.voteCount}>{downvotes}</Text>
                  </View>
                </View>
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
  imageContainer: {
    width: "100%",
    height: 250,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: Colors.background,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
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
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
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
  votesContainer: {
    flexDirection: "row",
    gap: 16,
  },
  voteItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  voteCount: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },
});
