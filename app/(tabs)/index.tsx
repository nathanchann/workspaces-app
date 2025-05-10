import { View, ActivityIndicator } from "react-native";
import React from "react";
import { useAuth } from "../../providers/AuthProvider";
import { Redirect } from "expo-router";
import MapComponent from "../../components/Map";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!session) {
    return <Redirect href={'/(auth)/sign-in'} />;
  }
  // if (!session) {
  //   return <Redirect href={'/Profile'} />;
  // }
  return (
    <View style={{ flex: 1 }}>
      <MapComponent />
    </View>
  );
}
