import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
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

const Map: React.FC<MapProps> = ({ searchQuery, coordinates }) => {
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const { latitude, longitude, error, loading } = useLocation();

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
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {!loading && !isLoadingPlaces && latitude && longitude ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            region={{
              latitude: coordinates?.latitude || latitude,
              longitude: coordinates?.longitude || longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation={true}
          >
            {nearbyPlaces.map((place, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: place.location.latitude,
                  longitude: place.location.longitude,
                }}
                title={place.displayName.text}
              />
            ))}
          </MapView>
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
});

export default Map;
