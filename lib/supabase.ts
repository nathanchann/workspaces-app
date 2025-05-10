import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://idubrzsptelcloayvofh.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkdWJyenNwdGVsY2xvYXl2b2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTEwMjUsImV4cCI6MjA2MTQ2NzAyNX0.btGtC8VgrOE1svLL5usXfN0uY6BRStk30X6Chkmy2eA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
