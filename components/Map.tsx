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
              "X-Goog-FieldMask": "places.displayName,places.location",
              "X-iOS-Bundle-Identifier": "com.nathan.workspaces",
            },
            body: JSON.stringify({
              includedTypes: ["cafe", "library"],
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
    }, 16);
  }, [nearbyPlaces, markerPositions]);

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
                            : 60),
                        top: markerPositions[index].y - 60,
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
                      <Text>{place.displayName.text}</Text>
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
  calloutContainer: {
    backgroundColor: "white",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    minWidth: 100,
  },
  calloutText: {
    fontSize: 12,
    textAlign: "center",
  },
  testBox: {
    position: "absolute",
    top: 100,
    left: 100,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "black",
    zIndex: 1000,
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
  },
});

export default Map;
