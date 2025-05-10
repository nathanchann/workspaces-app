import Home from "@/components/Home";
import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../providers/AuthProvider";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!session) {
    return <Redirect href={"/(auth)/sign-in"} />;
  }
  // if (!session) {
  //   return <Redirect href={'/Profile'} />;
  // }
  return (
    <View style={{ flex: 1 }}>
      <Home />
    </View>
  );
}
