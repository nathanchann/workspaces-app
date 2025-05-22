import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Workspace } from "@/types/Workspace";
import { MaterialIcons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkspaceDetailsModal from "../../components/WorkspaceDetailsModal";

const Profile = () => {
  const { session } = useAuth();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", session?.user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkspaces(data || []);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    }
  };

  const handleDelete = async (workspaceId: string) => {
    Alert.alert(
      "Delete Workspace",
      "Are you sure you want to delete this workspace?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsRefreshing(true);
              const { error } = await supabase
                .from("workspaces")
                .delete()
                .eq("id", workspaceId);

              if (error) throw error;
              await fetchWorkspaces();
            } catch (error) {
              console.error("Error deleting workspace:", error);
              Alert.alert("Error", "Failed to delete workspace");
            } finally {
              setIsRefreshing(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    const fetchUserData = async () => {
      try {
        const [profileData, workspacesData] = await Promise.all([
          supabase
            .from("profiles")
            .select("username")
            .eq("id", session?.user?.id)
            .single(),
          supabase
            .from("workspaces")
            .select("*")
            .eq("user_id", session?.user?.id)
            .order("created_at", { ascending: false }),
        ]);

        if (profileData.error) {
          console.error("Error fetching profile:", profileData.error.message);
        } else {
          setUsername(profileData.data?.username);
        }

        if (workspacesData.error) {
          console.error(
            "Error fetching workspaces:",
            workspacesData.error.message
          );
        } else {
          setWorkspaces(workspacesData.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  // If user just signed out, redirect to sign in
  if (signedOut) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // If no session, redirect to sign in
  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                console.error("Sign out error:", error);
              } else {
                setSignedOut(true);
              }
            } catch (error) {
              console.error("Error signing out:", error);
            }
          }}
        >
          <MaterialIcons name="logout" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {username ? username[0].toUpperCase() : "?"}
              </Text>
            </View>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.workspaceCount}>
              {workspaces.length}{" "}
              {workspaces.length === 1 ? "workspace" : "workspaces"} shared
            </Text>
          </View>
        </View>

        <View style={styles.workspacesContainer}>
          <Text style={styles.sectionTitle}>Your Shared Workspaces</Text>
          {workspaces.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                You haven't shared any workspaces yet
              </Text>
            </View>
          ) : (
            <View style={styles.workspacesGrid}>
              {workspaces.map((workspace) => (
                <TouchableOpacity
                  key={workspace.id}
                  style={styles.workspaceCard}
                  onPress={() => {
                    setSelectedWorkspace(workspace);
                    setModalVisible(true);
                  }}
                >
                  <Image
                    source={{
                      uri:
                        workspace.image_url ||
                        "https://via.placeholder.com/150",
                    }}
                    style={styles.workspaceImage}
                  />
                  <View style={styles.workspaceInfo}>
                    <Text style={styles.workspaceName}>{workspace.name}</Text>
                    <Text style={styles.workspaceRating}>
                      Rating: {workspace.rating}/5
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(workspace.id)}
                  >
                    <MaterialIcons
                      name="delete"
                      size={20}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <WorkspaceDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        workspace={selectedWorkspace}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  signOutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileInfo: {
    alignItems: "center",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  username: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  workspaceCount: {
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 24,
  },
  workspacesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 16,
  },
  workspacesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  workspaceCard: {
    width: (Dimensions.get("window").width - 56) / 2,
    backgroundColor: Colors.light,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  workspaceImage: {
    width: "100%",
    height: 120,
  },
  workspaceInfo: {
    padding: 12,
  },
  workspaceName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 4,
  },
  workspaceRating: {
    fontSize: 14,
    color: Colors.gray,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: "center",
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});

export default Profile;
