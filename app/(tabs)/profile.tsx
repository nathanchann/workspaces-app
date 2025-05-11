import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Redirect } from "expo-router";
import React from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
// Changed to capital P for React component naming convention
const Profile = () => {
  const { session } = useAuth();
  // If no session, redirect to sign in
  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    // Added styles to ensure button is visible
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Button
        title="Sign Out"
        onPress={async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error("Sign out error:", error);
              Alert.alert("Error signing out", error.message);
            }
          } catch (error) {
            console.error("Caught error:", error);
            Alert.alert(
              "Network Error",
              "Please check your internet connection"
            );
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

// Changed to match component name
export default Profile;
