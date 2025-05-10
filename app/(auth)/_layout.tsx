import { Stack } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { session } = useAuth();

  // Redirect to home page if already logged in
  if (session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#000',
      }}
    >
      <Stack.Screen
        name="sign-in"
        options={{
          title: 'Sign In'
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: 'Create Account'
        }}
      />
    </Stack>
  );
}