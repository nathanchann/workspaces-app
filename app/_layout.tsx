import { Stack } from "expo-router";
import { useAuth } from "../providers/AuthProvider";
import AuthProvider from "../providers/AuthProvider";

export default function RootLayout() {
  const { session } = useAuth();

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="(auth)" />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
      </Stack>
    </AuthProvider>
  );
}