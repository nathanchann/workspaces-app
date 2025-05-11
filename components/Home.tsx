import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Map from "./Map";

const Home = () => {
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMap, setShowMap] = useState(false);

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
      <GooglePlacesAutocomplete
        placeholder="Search"
        onPress={(data, details = null) => {
          if (details && details.geometry && details.geometry.location) {
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
            flex: 0,
          },
          textInput: {
            fontSize: 18,
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
      {!showMap ? (
        <View style={styles.searchContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for places..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#666"
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleGetCurrentLocation}
            >
              <MaterialIcons name="my-location" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowMap(false)}
          >
            <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
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
    backgroundColor: "#fff",
  },
  searchContainer: {
    margin: 20,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  locationButton: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
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
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default Home;
