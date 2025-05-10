import { useState, useEffect } from "react";
import * as Location from "expo-location";

export interface LocationState {
  latitude: number;
  longitude: number;
  error: string | null;
  loading: boolean;
}

export default function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: 0,
    longitude: 0,
    error: null,
    loading: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setState((prev) => ({
            ...prev,
            error: "Permission denied",
            loading: false,
          }));
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setState({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          error: null,
          loading: false,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Error getting location",
          loading: false,
        }));
      }
    })();
  }, []);

  return state;
}
