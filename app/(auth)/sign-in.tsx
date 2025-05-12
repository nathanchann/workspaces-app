import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { Link, Stack } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../components/Button";

const SignInScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Sign in" }} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="jon@gmail.com"
        style={styles.input}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder=""
        style={styles.input}
        secureTextEntry
      />

      <Button
        onPress={signInWithEmail}
        disabled={loading}
        text={loading ? "Signing in..." : "Sign in"}
      />
      <Link href="/(auth)/sign-up" style={styles.textButton}>
        Create an account
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
});

export default SignInScreen;
