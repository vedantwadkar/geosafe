import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Logged in successfully");
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
    }
  };

  return (
    <LinearGradient
      colors={["#0F172A", "#1E293B"]}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>GeoSafe</Text>
        <Text style={styles.subtitle}>Stay aware. Stay safe.</Text>

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

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/signup")}>
          <Text style={styles.link}>Create Account</Text>
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
    fontSize: 28,
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
    backgroundColor: "#22C55E",
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
    color: "#38BDF8",
    textAlign: "center",
    marginTop: 20,
  },
});
