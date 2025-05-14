import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Colors } from "../constants/Colors";
import useLocation from "../hooks/useLocation";

const API_KEY = "AIzaSyCvA0q3zv_kZyHdF7b0fK7kDjlTwDw2rSo";

interface MapProps {
  searchQuery: string;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
}

interface Place {
  displayName: {
    text: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
}

interface MarkerPosition {
  x: number;
  y: number;
}

const Map: React.FC<MapProps> = ({ searchQuery, coordinates }) => {
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [markerPositions, setMarkerPositions] = useState<{
    [key: number]: MarkerPosition;
  }>({});
  const [overlayWidths, setOverlayWidths] = useState<{ [key: number]: number }>(
    {}
  );
  const { latitude, longitude, error, loading } = useLocation();
  const mapRef = useRef<MapView>(null);
  const updateTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      const centerLatitude = coordinates?.latitude || latitude;
      const centerLongitude = coordinates?.longitude || longitude;
      if (!centerLatitude || !centerLongitude) return;
      setIsLoadingPlaces(true);
      try {
        const response = await fetch(
          "https://places.googleapis.com/v1/places:searchNearby",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": API_KEY,
              "X-Goog-FieldMask":
                "places.displayName,places.location,places.types",
              "X-iOS-Bundle-Identifier": "com.nathan.workspaces",
            },
            body: JSON.stringify({
              includedTypes: ["cafe", "library", "food_court"],
              excludedTypes: [
                "gas_station",
                "amusement_center",
                "amusement_park",
                "restaurant",
                "hotel",
                "motel",
                "inn",
                "hostel",
                "video_arcade",
                "supermarket",
                "grocery_store",
                "fast_food_restaurant",
                "bar",
                "movie_theater",
                "ice_cream_shop",
                "store",
                "playground",
                "golf_course",
                "sports_club",
                "stadium",
                "airport",
                "church",
                "confectionery",
                "diner",
                "deli",
                "bowling_alley",
                "movie_theater",
                "aquarium",
                "art_gallery",
                "museum",
              ],
              maxResultCount: 20,
              locationRestriction: {
                circle: {
                  center: {
                    latitude: centerLatitude,
                    longitude: centerLongitude,
                  },
                  radius: 2500.0,
                },
              },
            }),
          }
        );

        const data = await response.json();
        setNearbyPlaces(data.places || []);
        console.log("Full API response:", data); // Add this line first
        console.log("Nearby places:", data.places); // Add this line
      } catch (error) {
        console.error("Error fetching nearby places:", error);
      } finally {
        setIsLoadingPlaces(false);
      }
    };

    fetchNearbyPlaces();
  }, [coordinates, latitude, longitude]);

  const debouncedUpdateMarkerPositions = useCallback(() => {
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }

    updateTimeout.current = setTimeout(() => {
      if (!mapRef.current) return;
      nearbyPlaces.forEach((place, index) => {
        mapRef.current?.pointForCoordinate(place.location).then((point) => {
          setMarkerPositions((prev) => ({
            ...prev,
            [index]: point,
          }));
        });
      });
    }, 8);
  }, [nearbyPlaces]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {!loading && !isLoadingPlaces && latitude && longitude ? (
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFillObject}
              region={{
                latitude: coordinates?.latitude || latitude,
                longitude: coordinates?.longitude || longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              showsUserLocation={true}
              onLayout={debouncedUpdateMarkerPositions}
              onRegionChange={debouncedUpdateMarkerPositions}
            >
              {nearbyPlaces.map((place, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: place.location.latitude,
                    longitude: place.location.longitude,
                  }}
                >
                  <View style={styles.pin} />
                </Marker>
              ))}
            </MapView>
            {nearbyPlaces.map(
              (place, index) =>
                markerPositions[index] && (
                  <Animated.View
                    key={`overlay-${index}`}
                    style={[
                      styles.testBox,
                      {
                        position: "absolute",
                        left:
                          markerPositions[index].x -
                          (overlayWidths[index]
                            ? overlayWidths[index] / 2
                            : 40),
                        top: markerPositions[index].y - 45,
                        zIndex: place.displayName.text
                          .toLowerCase()
                          .includes("library")
                          ? 2
                          : 1,
                      },
                    ]}
                    onLayout={(event) => {
                      const { width } = event.nativeEvent.layout;
                      setOverlayWidths((prev) => ({ ...prev, [index]: width }));
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => Alert.alert(place.displayName.text)}
                    >
                      <View style={styles.titleContainer}>
                        <Text numberOfLines={1} style={styles.markerText}>
                          {place.displayName.text}
                        </Text>
                        {place.types?.includes("library") ? (
                          <Ionicons
                            name="book-outline"
                            size={12}
                            color={Colors.primary}
                            style={styles.titleIcon}
                          />
                        ) : place.types?.includes("cafe") ? (
                          <Ionicons
                            name="cafe-outline"
                            size={12}
                            color={Colors.primary}
                            style={styles.titleIcon}
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                )
            )}
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text>Loading map...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  testBox: {
    backgroundColor: "white",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    maxWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  markerText: {
    fontSize: 11,
    color: "#333",
    textAlign: "center",
  },
  pin: {
    width: 20,
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
    paddingHorizontal: 11,
  },
  titleIcon: {
    marginLeft: 4,
  },
});

export default Map;
