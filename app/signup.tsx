import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { auth } from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Account created successfully");
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Signup Error", error.message);
    }
  };

  return (
    <LinearGradient
      colors={["#0F172A", "#1E293B"]}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join GeoSafe today</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Back to Login</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 30,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 25,
  },
  input: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 14,
    color: "#FFFFFF",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#38BDF8",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#0F172A",
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    color: "#22C55E",
    textAlign: "center",
    marginTop: 20,
  },
});
