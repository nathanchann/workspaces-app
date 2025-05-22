import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Workspace } from "@/types/Workspace";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StarRating from "./StarRating";

type TagVotes = {
  tag_name: string;
  upvotes: number;
  downvotes: number;
};

type VoteType = 1 | -1 | null;

type UserVotes = {
  [key: string]: VoteType;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  onRatingChange?: () => void; // Add this prop
};

export default function WorkspaceDetailsModal({
  visible,
  onClose,
  workspace: initialWorkspace,
  onRatingChange,
}: Props) {
  const { session } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(
    initialWorkspace
  );
  const [tagVotes, setTagVotes] = useState<TagVotes[]>([]);
  const [userTagVotes, setUserTagVotes] = useState<UserVotes>({});
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const insets = useSafeAreaInsets();

  // Update workspace when initialWorkspace changes
  useEffect(() => {
    setWorkspace(initialWorkspace);
  }, [initialWorkspace]);

  useEffect(() => {
    if (workspace?.id) {
      fetchTagVotes();
      fetchUserVotes();
      fetchCurrentRating();
    }
  }, [visible, workspace?.id]);

  const fetchCurrentRating = async () => {
    if (!workspace?.id) return;
    try {
      const { data: avgRating } = await supabase.rpc("get_average_rating", {
        p_workspace_id: workspace.id,
      });

      if (avgRating !== null) {
        setWorkspace((prev) =>
          prev
            ? {
                ...prev,
                rating: avgRating,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error fetching rating:", error);
    }
  };

  const fetchTagVotes = async () => {
    if (!workspace?.id) return;
    try {
      // Get all tags first
      const { data: allTags, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .order("name");

      if (tagsError) throw tagsError;

      // Get the vote counts
      const { data: voteData, error: votesError } = await supabase.rpc(
        "get_tag_vote_counts_for_workspace",
        {
          p_workspace_id: workspace.id,
        }
      );

      if (votesError) throw votesError;

      // Merge tags with vote data, defaulting to 0 votes if no votes exist
      const mergedTagVotes = (allTags || []).map((tag) => ({
        tag_name: tag.name,
        upvotes:
          voteData?.find((v: any) => v.tag_name === tag.name)?.upvotes || 0,
        downvotes:
          voteData?.find((v: any) => v.tag_name === tag.name)?.downvotes || 0,
      }));

      setTagVotes(mergedTagVotes);
    } catch (error) {
      console.error("Error fetching tag votes:", error);
    }
  };

  const fetchUserVotes = async () => {
    if (!workspace?.id || !session?.user) return;

    try {
      const { data: tagVotes, error } = await supabase.rpc(
        "get_user_tag_votes",
        {
          p_workspace_id: workspace.id,
          p_user_id: session.user.id,
        }
      );

      if (error) throw error;
      setUserTagVotes(tagVotes || {});
    } catch (error) {
      console.error("Error fetching user votes:", error);
    }
  };

  const updateWorkspaceRatings = async (workspaceId: string) => {
    try {
      const [avgRating, ratingCount] = await Promise.all([
        supabase.rpc("get_average_rating", { p_workspace_id: workspaceId }),
        supabase.rpc("get_rating_count", { p_workspace_id: workspaceId }),
      ]);

      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              rating: avgRating.data || null,
              rating_count: ratingCount.data || null,
            }
          : null
      );
    } catch (error) {
      console.error("Error updating ratings:", error);
    }
  };

  const handleRate = async (rating: number) => {
    if (!workspace?.id) return;

    try {
      const { error: ratingError } = await supabase.rpc("set_rating", {
        p_user_id: session!.user.id, // Use non-null assertion
        p_workspace_id: workspace.id,
        p_rating: rating,
      });

      if (ratingError) throw ratingError;

      setUserRating(rating);
      await updateWorkspaceRatings(workspace.id);

      // Trigger refresh of workspace data
      if (onRatingChange) {
        onRatingChange();
      }
    } catch (error) {
      console.error("Error setting rating:", error);
      setError("Failed to submit rating");
    }
  };

  const handleTagVote = async (tagName: string, isUpvote: boolean) => {
    if (!workspace?.id) return;

    const currentVote = userTagVotes[tagName];
    // If clicking the same vote type, remove the vote
    // If clicking different vote type, switch the vote
    let newVoteType: VoteType = null;
    if (currentVote === (isUpvote ? 1 : -1)) {
      // Removing vote
      newVoteType = null;
    } else {
      // Setting new vote
      newVoteType = isUpvote ? 1 : -1;
    }

    // Store previous states for rollback
    const previousTagVotes = [...tagVotes];
    const previousUserTagVotes = { ...userTagVotes };

    // Optimistically update UI
    setUserTagVotes((prev) => ({
      ...prev,
      [tagName]: newVoteType,
    }));

    // Update tag vote counts optimistically
    setTagVotes((prev) =>
      prev.map((tag) => {
        if (tag.tag_name !== tagName) return tag;

        let updatedTag = { ...tag };
        // Remove previous vote if it exists
        if (currentVote === 1) updatedTag.upvotes--;
        if (currentVote === -1) updatedTag.downvotes--;
        // Add new vote if applicable
        if (newVoteType === 1) updatedTag.upvotes++;
        if (newVoteType === -1) updatedTag.downvotes++;

        return updatedTag;
      })
    );

    try {
      const { error } = await supabase.rpc("set_tag_vote", {
        p_workspace_id: workspace.id,
        p_user_id: session!.user.id, // Use non-null assertion
        p_tag_name: tagName,
        p_vote_type: newVoteType,
      });

      if (error) throw error;
    } catch (error) {
      // Revert optimistic updates on error
      setTagVotes(previousTagVotes);
      setUserTagVotes(previousUserTagVotes);
      console.error("Error voting for tag:", error);
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
                  <Text style={styles.rating}>
                    {workspace.rating?.toFixed(1) ?? "No ratings"}
                  </Text>
                  <StarRating
                    rating={workspace.rating ?? 0}
                    size={18}
                    onPress={handleRate}
                    userRating={userRating}
                  />
                  <Text style={styles.reviewCount}>
                    ({workspace.rating_count ?? 0})
                  </Text>
                </View>
              </View>

              <View style={styles.tagVotesSection}>
                <Text style={styles.sectionTitle}>Tags</Text>
                {tagVotes.map((tag) => (
                  <View key={tag.tag_name} style={styles.tagVoteRow}>
                    <Text style={styles.tagName}>{tag.tag_name}</Text>
                    <View style={styles.votesContainer}>
                      <Pressable
                        style={[
                          styles.voteItem,
                          userTagVotes[tag.tag_name] === 1 && styles.activeVote,
                        ]}
                        onPress={() => handleTagVote(tag.tag_name, true)}
                        disabled={userTagVotes[tag.tag_name] === -1}
                      >
                        <Ionicons
                          name="arrow-up-circle"
                          size={16}
                          color={
                            userTagVotes[tag.tag_name] === -1
                              ? Colors.gray
                              : userTagVotes[tag.tag_name] === 1
                              ? Colors.primary
                              : Colors.gray
                          }
                        />
                        <Text style={styles.voteCount}>{tag.upvotes}</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.voteItem,
                          userTagVotes[tag.tag_name] === -1 &&
                            styles.activeVote,
                        ]}
                        onPress={() => handleTagVote(tag.tag_name, false)}
                        disabled={userTagVotes[tag.tag_name] === 1}
                      >
                        <Ionicons
                          name="arrow-down-circle"
                          size={16}
                          color={
                            userTagVotes[tag.tag_name] === 1
                              ? Colors.gray
                              : userTagVotes[tag.tag_name] === -1
                              ? Colors.primary
                              : Colors.gray
                          }
                        />
                        <Text style={styles.voteCount}>{tag.downvotes}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
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
    alignItems: "center",
    marginTop: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rating: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 14,
    color: Colors.gray,
  },
  tagVotesSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  tagVoteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  tagName: {
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
    padding: 4, // Add padding for better touch target
  },
  activeVote: {
    // Add styles for active vote state if needed
  },
  voteCount: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },
});
