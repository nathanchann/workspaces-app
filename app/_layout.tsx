import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AuthProvider, { useAuth } from "../providers/AuthProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </GestureHandlerRootView>
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
