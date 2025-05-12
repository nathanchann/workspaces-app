import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { Link, Stack } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { generateUsername } from "unique-username-generator";
import Button from "../../components/Button";

const SignUpScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");

  // Function to create or update user profile with a generated username
  async function handleUsernameUpdate(userId: string) {
    // Generate a unique username using the unique-username-generator package
    const username = generateUsername(); // This generates a random username

    setLoading(true);
    console.log(userId);
    // Check if the user already has a profile in the 'profiles' table
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    console.log(data, error);

    if (error) {
      Alert.alert("Error creating Profile");
      return;
    } else {
      // If profile exists, update with the new username
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username: username })
        .eq("id", userId);

      if (updateError) {
        console.log("Error updating profile:", updateError.message);
        return;
      }
    }
    setLoading(false);
    console.log("Profile updated with username:", username);
  }

  async function signUpWithEmail() {
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });
    const user = data?.user;

    if (error) Alert.alert(error.message);

    if (user) {
      await handleUsernameUpdate(user.id);
    } else {
      Alert.alert("User creation failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Sign up" }} />
      <Text style={styles.title}>Workspaces</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} />

      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder=""
        placeholderTextColor="#777e86"
        style={styles.input}
        secureTextEntry
      />

      <Button
        onPress={signUpWithEmail}
        disabled={loading}
        text={loading ? "Creating account..." : "Create account"}
      />
      <Link href="/(auth)/sign-in" style={styles.textButton}>
        Sign in
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: "center",
    flex: 1,
    backgroundColor: Colors.background,
  },
  label: {
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.text,
    padding: 10,
    marginTop: 5,
    marginBottom: 20,
    backgroundColor: Colors.lightGrey,
    borderRadius: 10,
  },
  textButton: {
    alignSelf: "center",
    fontWeight: "bold",
    color: Colors.primary,
    marginVertical: 10,
  },
  title: {
    fontSize: 45,
    fontWeight: "bold",
    marginBottom: 70,
    color: Colors.primary,
    textAlign: "center",
  },
});

export default SignUpScreen;
