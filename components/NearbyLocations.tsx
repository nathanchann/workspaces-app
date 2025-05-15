import Colors from "@/constants/Colors";
import React from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Location = {
  id: string;
  name: string;
  image: string;
  distance?: string;
};

const NearbyLocations = () => {
  const mockLocations: Location[] = [
    {
      id: "1",
      name: "State Library",
      image: "https://via.placeholder.com/150",
      distance: "0.5km",
    },
    {
      id: "2",
      name: "Coffee Club",
      image: "https://via.placeholder.com/150",
      distance: "0.8km",
    },
    {
      id: "3",
      name: "WeWork Space",
      image: "https://via.placeholder.com/150",
      distance: "1.2km",
    },
    {
      id: "4",
      name: "Study Hub",
      image: "https://via.placeholder.com/150",
      distance: "1.5km",
    },
    {
      id: "5",
      name: "University Library",
      image: "https://via.placeholder.com/150",
      distance: "2.0km",
    },
  ];

  const renderItem = ({ item }: { item: Location }) => (
    <TouchableOpacity style={styles.carouselItem}>
      <Image source={{ uri: item.image }} style={styles.carouselImage} />
      <Text style={styles.locationName}>{item.name}</Text>
      <Text style={styles.distanceText}>{item.distance}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Study Spots</Text>
      <FlatList
        data={mockLocations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: Colors.primary,
    paddingHorizontal: 15,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  carouselItem: {
    width: 150,
    marginRight: 15,
    borderRadius: 12,
    backgroundColor: Colors.lightGrey,
    padding: 10,
  },
  carouselImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 14,
    color: Colors.text,
    opacity: 0.7,
  },
});

export default NearbyLocations;
