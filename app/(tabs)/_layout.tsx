import ShareModal from "@/components/ShareModal";
import Colors from "@/constants/Colors";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useState } from "react";

export default function TabsLayout() {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: "",
            tabBarIcon: ({ color }) => (
              <Feather name="map-pin" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="share"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowShareModal(true);
            },
          }}
          options={{
            tabBarLabel: "",
            tabBarIcon: ({ color }) => (
              <Feather name="share-2" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarLabel: "",
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="user-circle" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}
