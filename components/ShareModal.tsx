import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Tag = {
  id: string;
  name: string;
  icon_url?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ShareModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [type, setType] = useState<"cafe" | "library" | "food_court" | null>(
    null
  );
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name?: string;
  } | null>(null);
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setType(null);
      setSelectedLocation(null);
      setRating(0);
      setImage(null);
      setIsLoading(false);
      setIsUploading(false);
      setSelectedTags([]);
      fetchTags();
    }
  }, [visible]);

  const handlePlacesPress = (data: any, details: any = null) => {
    if (details?.geometry?.location) {
      console.log("DEBUG: Valid location found:", details.geometry.location);
      setSelectedLocation({
        lat: details.geometry.location.lat,
        lng: details.geometry.location.lng,
        name: data.description, // Store the location name
      });
    } else {
      console.error("DEBUG: Invalid place data structure");
      console.error("DEBUG: Data received:", { data, details });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return null;

    try {
      setIsUploading(true);

      const fileExt = image.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // Read the file as base64
      const base64Data = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error: uploadError, data } = await supabase.storage
        .from("workspace-images")
        .upload(filePath, decode(base64Data), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Failed to upload to storage");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("workspace-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .neq("id", "00000000-0000-0000-0000-000000000001")
        .order("name");

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      Alert.alert("Error", "Please select a location");
      return;
    }

    setIsLoading(true);
    try {
      const imageUrl = await uploadImage();
      const workspaceName = selectedLocation.name
        ? selectedLocation.name.split(",")[0].trim()
        : `Workspace at ${selectedLocation.lat.toFixed(
            6
          )}, ${selectedLocation.lng.toFixed(6)}`;

      // Insert workspace without image_url
      const { data: workspaceId, error: workspaceError } = await supabase.rpc(
        "insert_workspace",
        {
          p_name: workspaceName,
          p_lat: selectedLocation.lat,
          p_lng: selectedLocation.lng,
        }
      );

      if (workspaceError) throw workspaceError;

      // Add image if one was uploaded
      if (imageUrl) {
        const { error: imageError } = await supabase.rpc(
          "add_workspace_image",
          {
            p_workspace_id: workspaceId,
            p_user_id: session!.user.id,
            p_image_url: imageUrl,
          }
        );

        if (imageError) throw imageError;
      }

      // Set initial rating if user provided one
      if (rating > 0) {
        const { error: ratingError } = await supabase.rpc("set_rating", {
          p_user_id: session!.user.id,
          p_workspace_id: workspaceId,
          p_rating: rating,
        });

        if (ratingError) throw ratingError;
      }

      // Insert tag votes if tags were selected
      if (selectedTags.length > 0) {
        const tagVotes = selectedTags.map((tagId) => ({
          workspace_id: workspaceId,
          vote_type: 1,
          tag_id: tagId,
        }));

        const { error: tagVotesError } = await supabase
          .from("votes")
          .insert(tagVotes);

        if (tagVotesError) throw tagVotesError;
      }

      onClose();
    } catch (error) {
      console.error("Error adding workspace:", error);
      Alert.alert("Error", "Failed to add workspace. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={rating >= star ? "star" : "star-outline"}
              size={28} // Reduced from 32
              color={Colors.primary}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

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
            <Text style={styles.heading}>Share Workspace</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={[styles.body, { paddingBottom: insets.bottom }]}>
            <GooglePlacesAutocomplete
              placeholder="Search for location"
              onPress={handlePlacesPress}
              fetchDetails={true}
              query={{
                key: "AIzaSyCvA0q3zv_kZyHdF7b0fK7kDjlTwDw2rSo",
                language: "en",
                components: "country:au",
              }}
              enablePoweredByContainer={false}
              minLength={4}
              styles={{
                container: styles.searchContainer,
                textInput: styles.searchInput,
                listView: {
                  position: "absolute",
                  top: 45,
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  borderRadius: 5,
                  flex: 1,
                  elevation: 3,
                  zIndex: 1000,
                },
              }}
            />

            <View style={styles.ratingContainer}>
              <Text style={styles.label}>Rating</Text>
              {renderStars()}
            </View>

            <View style={styles.tagsContainer}>
              <Text style={styles.label}>Features (Optional)</Text>
              <View style={styles.tagsList}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagButton,
                      selectedTags.includes(tag.id) && styles.tagButtonSelected,
                    ]}
                    onPress={() => toggleTag(tag.id)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTags.includes(tag.id) && styles.tagTextSelected,
                      ]}
                    >
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Ionicons name="images" size={24} color={Colors.primary} />
                <Text style={styles.imageButtonText}>Choose from Library</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color={Colors.primary} />
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>

            {image && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => setImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedLocation || isLoading || isUploading) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedLocation || isLoading || isUploading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading || isUploading ? "Sharing..." : "Share Workspace"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 6,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text, // Changed from primary to text color
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 24, // Same as the close icon size
  },
  description: {
    fontSize: 16,
    color: "#666",
  },
  body: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flex: 0,
  },
  searchInput: {
    height: 48,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
  },
  ratingContainer: {
    marginVertical: 15,
    alignItems: "flex-start", // Changed from center
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start", // Changed from center
    padding: 10,
    paddingLeft: 0, // Added to align with label
  },
  starButton: {
    padding: 3, // Reduced from 5
  },
  tagsContainer: {
    marginVertical: 15,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: "transparent",
  },
  tagButtonSelected: {
    backgroundColor: Colors.primary,
  },
  tagText: {
    color: Colors.primary,
    fontSize: 14,
  },
  tagTextSelected: {
    color: Colors.background,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  imageButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  imageButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    alignItems: "center", // Center everything
    justifyContent: "center",
  },
  imageButtonText: {
    color: Colors.primary,
    fontSize: 14,
    marginTop: 8, // Space between icon and text
    textAlign: "center",
  },
  imagePreview: {
    position: "relative",
    height: 200,
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeImage: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
});
