import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  isPrimary: boolean;
}

export default function ProfileScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const tabBarHeight = useBottomTabBarHeight(); // 👈 FIX

  const loadContacts = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await getDocs(
      collection(db, "users", user.uid, "contacts")
    );

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmergencyContact[];

    setContacts(data);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!name.trim() || !phone.trim()) {
      Alert.alert("Fill all fields");
      return;
    }

    await addDoc(collection(db, "users", user.uid, "contacts"), {
      name: name.trim(),
      phone: phone.trim(),
      isPrimary: contacts.length === 0,
    });

    setName("");
    setPhone("");
    setModalVisible(false);
    loadContacts();
  };

  const handleDelete = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;

    await deleteDoc(doc(db, "users", user.uid, "contacts", id));
    loadContacts();
  };

  const togglePrimary = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;

    for (const c of contacts) {
      await updateDoc(
        doc(db, "users", user.uid, "contacts", c.id),
        { isPrimary: c.id === id }
      );
    }

    loadContacts();
  };

  return (
    <SafeAreaView
      style={[styles.container, { paddingBottom: tabBarHeight }]} // 👈 FIX
    >
      <Text style={styles.title}>Emergency Contacts</Text>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 80, // 👈 extra safe spacing
        }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable onPress={() => togglePrimary(item.id)}>
              <Ionicons
                name={item.isPrimary ? "star" : "person"}
                size={24}
                color={item.isPrimary ? "#f59e0b" : "#94a3b8"}
              />
            </Pressable>

            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
              {item.isPrimary && (
                <Text style={styles.primaryLabel}>
                  Primary Contact
                </Text>
              )}
            </View>

            <Pressable onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash" size={20} color="#ef4444" />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No emergency contacts added yet.
          </Text>
        }
      />

      {/* Floating Add Button */}
      <Pressable
        style={[styles.floatingBtn, { bottom: tabBarHeight + 20 }]} // 👈 FIX
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Contact</Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={{ color: "white" }}>Save</Text>
            </Pressable>

            <Pressable
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#94a3b8" }}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    marginVertical: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  phone: {
    color: "#94a3b8",
    fontSize: 14,
  },
  primaryLabel: {
    color: "#f59e0b",
    fontSize: 12,
    marginTop: 3,
  },
  emptyText: {
    color: "#94a3b8",
    marginTop: 40,
    textAlign: "center",
  },
  floatingBtn: {
    position: "absolute",
    right: 25,
    backgroundColor: "#ef4444",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modal: {
    backgroundColor: "#1e293b",
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: "white",
  },
  saveBtn: {
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  cancelBtn: {
    alignItems: "center",
    marginTop: 10,
  },
});