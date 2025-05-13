import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import Button from "../../components/Button";

const Profile = () => {
  const { session } = useAuth();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session?.user?.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error.message);
        } else {
          setUsername(data?.username);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error:", error.message);
        } else {
          console.error("Unexpected error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  // If user just signed out, redirect to sign in
  if (signedOut) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // If no session, redirect to sign in
  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <View style={styles.container}>
      {username && <Text style={styles.title}>Username: {username}!</Text>}
      <Text style={styles.title}>Profile</Text>
      <Button
        text="Sign Out"
        onPress={async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error("Sign out error:", error);
              Alert.alert("Error signing out", error.message);
            } else {
              setSignedOut(true);
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
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: Colors.text,
  },
});

export default Profile;
