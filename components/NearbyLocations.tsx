import Colors from "@/constants/Colors";
import useLocation from "@/hooks/useLocation";
import { supabase } from "@/lib/supabase";
import { Workspace, WorkspaceImage } from "@/types/Workspace";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RatingDisplay from "./RatingDisplay";
import WorkspaceDetailsModal from "./WorkspaceDetailsModal";

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

const NearbyLocations = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { latitude, longitude, loading: locationLoading } = useLocation();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [workspaceImages, setWorkspaceImages] = useState<{
    [key: string]: WorkspaceImage[];
  }>({});

  const fetchWorkspaceImages = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase.rpc("get_workspace_images", {
        p_workspace_id: workspaceId,
      });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching workspace images:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchNearbyWorkspaces = async () => {
      if (locationLoading || !latitude || !longitude) return;

      try {
        const { data, error } = await supabase.rpc("get_nearest_workspaces", {
          lat: latitude,
          lng: longitude,
          max_distance: 100000,
          limit_count: 15,
        });

        if (error) throw error;

        // Fetch ratings and images for workspaces
        const workspacesWithData = await Promise.all(
          (data || []).map(async (workspace: Workspace) => {
            const [avgRating, images] = await Promise.all([
              supabase.rpc("get_average_rating", {
                p_workspace_id: workspace.id,
              }),
              fetchWorkspaceImages(workspace.id),
            ]);

            setWorkspaceImages((prev) => ({
              ...prev,
              [workspace.id]: images,
            }));

            return {
              ...workspace,
              rating: avgRating.data || null,
            };
          })
        );

        setWorkspaces(workspacesWithData);
      } catch (error) {
        console.error("Error fetching nearby workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearbyWorkspaces();
  }, [latitude, longitude, locationLoading]);

  const formatDistance = (meters: number) => {
    return meters < 1000
      ? `${Math.round(meters)}m`
      : `${(meters / 1000).toFixed(1)}km`;
  };

  const handleWorkspacePress = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setModalVisible(true);
  };

  const refreshWorkspaceRating = async (workspace: Workspace) => {
    try {
      const { data: avgRating } = await supabase.rpc("get_average_rating", {
        p_workspace_id: workspace.id,
      });

      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === workspace.id ? { ...w, rating: avgRating } : w
        )
      );
    } catch (error) {
      console.error("Error fetching average rating:", error);
    }
  };

  const renderItem = ({ item }: { item: Workspace }) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      item.latitude,
      item.longitude
    );

    return (
      <TouchableOpacity
        style={styles.carouselItem}
        onPress={() => handleWorkspacePress(item)}
      >
        <Image
          source={{
            uri:
              workspaceImages[item.id]?.[0]?.image_url?.trim() ||
              "https://via.placeholder.com/150",
          }}
          style={styles.carouselImage}
          onError={(error) => {
            console.warn("Image loading error:", error.nativeEvent);
          }}
        />
        <View style={styles.cardContent}>
          <Text style={styles.locationName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.cardFooter}>
            <RatingDisplay rating={item.rating} showCount={false} />
            <Text style={styles.distanceText}>{formatDistance(distance)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading || locationLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading nearby spots...</Text>
      </View>
    );
  }

  if (workspaces.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No workspaces found nearby</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Study Spots</Text>
      <FlatList
        data={workspaces}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
      <WorkspaceDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        workspace={selectedWorkspace}
        onRatingChange={() =>
          selectedWorkspace && refreshWorkspaceRating(selectedWorkspace)
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: Colors.primary, // Changed from primary to text color
    paddingHorizontal: 15,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  carouselItem: {
    width: 280, // Increased from 150
    marginRight: 15,
    borderRadius: 12,
    backgroundColor: Colors.lightGrey,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  carouselImage: {
    width: "100%",
    height: 180, // Increased from 100
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 12,
  },
  locationName: {
    fontSize: 18, // Increased from 16
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14, // Increased from 12
    color: Colors.primary,
  },
  distanceText: {
    fontSize: 14,
    color: Colors.text,
    opacity: 0.7,
  },
});

export default NearbyLocations;
