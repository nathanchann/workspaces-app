import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [tagVotes, setTagVotes] = useState<TagVotes[]>([]);
  const [userWorkspaceVote, setUserWorkspaceVote] = useState<VoteType>(null);
  const [userTagVotes, setUserTagVotes] = useState<UserVotes>({});
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (workspace?.id) {
      fetchVoteCounts();
      fetchTagVotes();
      fetchUserVotes(); // Add this call
    }
  }, [visible, workspace?.id]);

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

  const fetchTagVotes = async () => {
    if (!workspace?.id) return;
    try {
      const { data, error } = await supabase.rpc(
        "get_tag_vote_counts_for_workspace",
        {
          p_workspace_id: workspace.id,
        }
      );
      if (error) throw error;
      setTagVotes(data || []);
    } catch (error) {
      console.error("Error fetching tag votes:", error);
    }
  };

  const fetchUserVotes = async () => {
    if (!workspace?.id) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return; // Don't show error on initial load
    }

    try {
      const [workspaceVote, tagVotes] = await Promise.all([
        supabase.rpc("get_user_workspace_vote", {
          p_workspace_id: workspace.id,
          p_user_id: session.user.id,
        }),
        supabase.rpc("get_user_tag_votes", {
          p_workspace_id: workspace.id,
          p_user_id: session.user.id,
        }),
      ]);

      if (workspaceVote.error) throw workspaceVote.error;
      if (tagVotes.error) throw tagVotes.error;

      setUserWorkspaceVote(workspaceVote.data);
      setUserTagVotes(tagVotes.data || {});
    } catch (error) {
      console.error("Error fetching user votes:", error);
    }
  };

  const handleWorkspaceVote = async (isUpvote: boolean) => {
    if (!workspace?.id) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setError("Please sign in to vote");
      return;
    }

    const desiredVote: VoteType = isUpvote ? 1 : -1;
    // If clicking the same vote type, remove the vote. Otherwise, set new vote.
    const newVoteType: VoteType =
      userWorkspaceVote === desiredVote ? null : desiredVote;

    // Store previous state for rollback
    const previousVote = userWorkspaceVote;
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;

    // Optimistically update UI
    setUserWorkspaceVote(newVoteType);
    if (previousVote === 1) setUpvotes((prev) => prev - 1);
    if (previousVote === -1) setDownvotes((prev) => prev - 1);
    if (newVoteType === 1) setUpvotes((prev) => prev + 1);
    if (newVoteType === -1) setDownvotes((prev) => prev + 1);

    try {
      const { error } = await supabase.rpc("set_workspace_vote", {
        p_workspace_id: workspace.id,
        p_user_id: session.user.id,
        p_vote_type: newVoteType,
      });

      if (error) throw error;
    } catch (error) {
      // Revert optimistic updates on error
      setUserWorkspaceVote(previousVote);
      setUpvotes(previousUpvotes);
      setDownvotes(previousDownvotes);
      console.error("Error voting for workspace:", error);
    }
  };

  const handleTagVote = async (tagName: string, isUpvote: boolean) => {
    if (!workspace?.id) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setError("Please sign in to vote");
      return;
    }

    const desiredVote: VoteType = isUpvote ? 1 : -1;
    const currentVote = userTagVotes[tagName];
    const newVoteType: VoteType =
      currentVote === desiredVote ? null : desiredVote;

    // Store previous states
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
        p_user_id: session.user.id,
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
                  <Ionicons name="star" size={20} color={Colors.primary} />
                  <Text style={styles.rating}>{workspace.rating}/5</Text>
                </View>

                <View style={styles.votesContainer}>
                  <Pressable
                    style={[
                      styles.voteItem,
                      userWorkspaceVote === 1 && styles.activeVote,
                    ]}
                    onPress={() => handleWorkspaceVote(true)}
                  >
                    <Ionicons
                      name="arrow-up-circle"
                      size={20}
                      color={
                        userWorkspaceVote === 1 ? Colors.primary : Colors.gray
                      }
                    />
                    <Text style={styles.voteCount}>{upvotes}</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.voteItem,
                      userWorkspaceVote === -1 && styles.activeVote,
                    ]}
                    onPress={() => handleWorkspaceVote(false)}
                  >
                    <Ionicons
                      name="arrow-down-circle"
                      size={20}
                      color={
                        userWorkspaceVote === -1 ? Colors.primary : Colors.gray
                      }
                    />
                    <Text style={styles.voteCount}>{downvotes}</Text>
                  </Pressable>
                </View>
              </View>

              {tagVotes.length > 0 && (
                <View style={styles.tagVotesSection}>
                  <Text style={styles.sectionTitle}>Tags</Text>
                  {tagVotes.map((tag) => (
                    <View key={tag.tag_name} style={styles.tagVoteRow}>
                      <Text style={styles.tagName}>{tag.tag_name}</Text>
                      <View style={styles.votesContainer}>
                        <Pressable
                          style={[
                            styles.voteItem,
                            userTagVotes[tag.tag_name] === 1 &&
                              styles.activeVote,
                          ]}
                          onPress={() => handleTagVote(tag.tag_name, true)}
                        >
                          <Ionicons
                            name="arrow-up-circle"
                            size={16}
                            color={
                              userTagVotes[tag.tag_name] === 1
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
                        >
                          <Ionicons
                            name="arrow-down-circle"
                            size={16}
                            color={
                              userTagVotes[tag.tag_name] === -1
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
              )}
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
});
