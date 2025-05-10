import { StyleSheet, Text, View } from "react-native";
import React from "react";
import useLocation from "../hooks/useLocation";
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from "react-native-maps";

const Map = () => {
  const { latitude, longitude, error, loading } = useLocation();
  return (
    <View style={{ flex: 1 }}>
      {/* {session && session.user ( */}
      <View style={{ flex: 1 }}>
        {!loading && latitude && longitude ? (
          <MapView
            provider={PROVIDER_DEFAULT}
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

export default Map;
