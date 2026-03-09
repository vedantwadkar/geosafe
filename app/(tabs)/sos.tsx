import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SMS from "expo-sms";
import * as Location from "expo-location";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  isPrimary: boolean;
}

export default function SOSScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [sending, setSending] = useState(false);
  const [alertActive, setAlertActive] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  useFocusEffect(
    React.useCallback(() => {
      loadContacts();
    }, [])
  );

  const sendLocationSMS = async () => {
    if (contacts.length === 0) return;

    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

      const message = `🚨 SOS ALERT!
I need help!

📍 Live Location:
${mapsLink}

Sent via GeoSafe`;

      const phoneNumbers = contacts.map((c) => c.phone);

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(phoneNumbers, message);
      }
    } catch (error) {
      console.log("Error sending SMS");
    }
  };

  const startSOS = async () => {
    if (contacts.length === 0) {
      Alert.alert("No contacts", "Add contacts in Profile first.");
      return;
    }

    setAlertActive(true);
    setSending(true);

    await sendLocationSMS(); // Send immediately

    intervalRef.current = setInterval(() => {
      sendLocationSMS();
    }, 5 * 60 * 1000); // 5 minutes

    setSending(false);
    Alert.alert("SOS Activated", "Location will be sent every 5 minutes.");
  };

  const stopSOS = () => {
    setAlertActive(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    Alert.alert("SOS Stopped");
  };

  const callPrimary = () => {
    if (contacts.length === 0) {
      Alert.alert("No contacts", "Add contacts in Profile first.");
      return;
    }

    const primary =
      contacts.find((c) => c.isPrimary) || contacts[0];

    Linking.openURL(`tel:${primary.phone}`);
  };

  const primaryContact =
    contacts.find((c) => c.isPrimary) || contacts[0];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency</Text>

      <Pressable
        style={[
          styles.sosBtn,
          alertActive && { backgroundColor: "#7f1d1d" },
        ]}
        onPress={alertActive ? stopSOS : startSOS}
      >
        {sending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Ionicons
            name={alertActive ? "stop" : "alert"}
            size={40}
            color="white"
          />
        )}
      </Pressable>

      <Text style={{ color: "white", marginBottom: 20 }}>
        {alertActive ? "SOS ACTIVE" : "Tap to Activate SOS"}
      </Text>

      <Pressable style={styles.callBtn} onPress={callPrimary}>
        <Ionicons name="call" size={22} color="white" />
        <Text style={styles.callText}>
          Call {primaryContact?.name || "No contact"}
        </Text>
      </Pressable>

      {contacts.length === 0 && (
        <Text style={{ marginTop: 20, color: "#94a3b8" }}>
          Add emergency contacts in Profile tab.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: "white",
    marginBottom: 40,
    fontWeight: "bold",
  },
  sosBtn: {
    backgroundColor: "#ef4444",
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  callBtn: {
    backgroundColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  callText: {
    color: "white",
    fontSize: 16,
  },
});