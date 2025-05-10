import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import useLocation from "../hooks/useLocation";

interface MapProps {
  searchQuery: string;
}

const Map: React.FC<MapProps> = ({ searchQuery }) => {
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const { latitude, longitude, error, loading } = useLocation();

  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      if (!latitude || !longitude) return;

      try {
        const response = await fetch(
          "https://places.googleapis.com/v1/places:searchNearby",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": "YOUR_API_KEY_HERE",
              "X-Goog-FieldMask": "places.displayName,places.location",
            },
            body: JSON.stringify({
              includedTypes: ["restaurant"],
              maxResultCount: 10,
              locationRestriction: {
                circle: {
                  center: {
                    latitude: latitude,
                    longitude: longitude,
                  },
                  radius: 500.0,
                },
              },
            }),
          }
        );

        const data = await response.json();
        setNearbyPlaces(data.places || []);
      } catch (error) {
        console.error("Error fetching nearby places:", error);
      }
    };

    fetchNearbyPlaces();
  }, [latitude, longitude]);
  return (
    <View style={{ flex: 1 }}>
      {/* {session && session.user ( */}
      <View style={{ flex: 1 }}>
        {!loading && latitude && longitude ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: latitude,
              longitude: longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation={true}
          />
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
      {/* )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default Map;
