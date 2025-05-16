import Colors from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Map from "./Map";
import NearbyLocations from "./NearbyLocations";
import ShareModal from "./ShareModal";

const Home = ({ initialShowShare = false }) => {
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [showShareModal, setShowShareModal] = useState(initialShowShare);

  useEffect(() => {
    setShowShareModal(initialShowShare);
  }, [initialShowShare]);

  const handleSearch = () => {
    setShowMap(true);
    // Optionally, pass searchQuery to your Map component as a prop
  };

  const handleGetCurrentLocation = () => {
    // TODO: Implement location access
    setShowMap(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {!showMap ? (
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Find a Workspace</Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <GooglePlacesAutocomplete
                  placeholder="Search for a location"
                  onPress={(data, details = null) => {
                    if (
                      details &&
                      details.geometry &&
                      details.geometry.location
                    ) {
                      const { lat, lng } = details.geometry.location;
                      console.log("Latitude:", lat, "Longitude:", lng);
                      setSearchQuery(data.description); // Save the place name
                      setSelectedCoordinates({ latitude: lat, longitude: lng });
                      setShowMap(true); // Show the map
                    } else {
                      console.error("Details object is missing or incomplete.");
                    }
                  }}
                  styles={{
                    container: {
                      flex: 1,
                    },
                    textInput: {
                      fontSize: 16,
                      height: 48,
                      borderRadius: 8,
                      paddingLeft: 12,
                      backgroundColor: Colors.lightGrey,
                    },
                  }}
                  fetchDetails
                  query={{
                    key: "AIzaSyCvA0q3zv_kZyHdF7b0fK7kDjlTwDw2rSo",
                    language: "en",
                    components: "country:au",
                  }}
                  nearbyPlacesAPI="GooglePlacesSearch"
                  debounce={1000}
                />
              </View>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleGetCurrentLocation}
              >
                <MaterialIcons
                  name="my-location"
                  size={24}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
          {/* Share Workspace Section */}
          <View style={styles.shareContainer}>
            <Text style={styles.shareTitle}>
              Share a Workspace or Study Spot
            </Text>
            <Text style={styles.shareDescription}>
              Know a great place to work or study? Share it with the community!
            </Text>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => setShowShareModal(true)}
            >
              <Text style={styles.shareButtonText}>Share a Space</Text>
            </TouchableOpacity>
          </View>
          <NearbyLocations />
          {/* End Share Workspace Section */}
          <ShareModal
            visible={showShareModal}
            onClose={() => setShowShareModal(false)}
          />
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowMap(false)}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Map searchQuery={searchQuery} coordinates={selectedCoordinates} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    margin: 20,
    marginTop: "15%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: Colors.primary, // Changed from primary to text color
    textAlign: "center",
  },
  searchContainer: {
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 12,
    shadowColor: Colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
  },
  locationButton: {
    padding: 12,
    backgroundColor: Colors.lightGrey,
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  searchButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  searchButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1,
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 8,
    shadowColor: Colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shareContainer: {
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    marginTop: 30,
    alignItems: "center",
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  shareTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary, // Changed from primary to text color
    marginBottom: 10,
    textAlign: "center",
  },
  shareDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 14,
    textAlign: "center",
  },
  shareButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 100,
  },
  shareButtonText: {
    color: Colors.background,
    fontWeight: "600",
    fontSize: 16,
  },
});

export default Home;
