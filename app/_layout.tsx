import { Stack } from "expo-router";
import AuthProvider, { useAuth } from "../providers/AuthProvider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { session } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!session ? (
        <Stack.Screen name="(auth)" />
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}
