import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ShareModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      transparent={false}
      statusBarTranslucent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.modalView, { paddingTop: insets.top }]}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
            <Text style={styles.heading}>Share Workspace</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={[styles.body, { paddingBottom: insets.bottom }]}>
            <Text style={styles.description}>Share</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.primary,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 24, // Same as the close icon size
  },
  description: {
    fontSize: 16,
    color: "#666",
  },
  body: {
    flex: 1,
    padding: 20,
  },
});
