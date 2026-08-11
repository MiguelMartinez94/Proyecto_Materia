import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, StatusBar, ActivityIndicator, Alert, Platform, Image, KeyboardAvoidingView, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../theme";
import api, { setToken, setBaseURL } from "../services/api";

import MeseroStack from "./MeseroStack";
import CajaStack from "./CajaStack";
import CocinaStack from "./CocinaStack";
import { NotificationProvider } from "../contexts/NotificationContext";

const RootStack = createStackNavigator();

function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [serverIP, setServerIP] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  React.useEffect(() => {
    const loadIP = async () => {
      try {
        const savedIP = await AsyncStorage.getItem("server_ip");
        if (savedIP) {
          setServerIP(savedIP);
        }
      } catch (e) {
        console.error("Failed to load IP", e);
      }
    };
    loadIP();
  }, []);

  const handleLogin = async () => {
    if (!correo || !password) {
      setErrorMsg("Por favor, ingrese correo y contraseña");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      if (serverIP) {
        await AsyncStorage.setItem("server_ip", serverIP.trim());
        setBaseURL(serverIP.trim());
      }

      const params = new URLSearchParams();
      params.append('username', correo);
      params.append('password', password);

      const res = await api.post("/auth/login", params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      
      const { access_token, usuario } = res.data;
      setToken(access_token);
      
      const rol = usuario.rol;
      await AsyncStorage.setItem('userToken', access_token);
      await AsyncStorage.setItem('userRole', rol);
      await AsyncStorage.setItem('userName', usuario.nombre);
      await AsyncStorage.setItem('userId', usuario.id.toString());

      if (rol === "MESERO") {
        navigation.navigate("MeseroFlow");
        setLoading(false);
        setCorreo("");
        setPassword("");
      } else if (rol === "CAJERO") {
        navigation.navigate("CajaFlow");
        setLoading(false);
        setCorreo("");
        setPassword("");
      } else if (rol === "COCINERO") {
        navigation.navigate("CocinaFlow");
        setLoading(false);
        setCorreo("");
        setPassword("");
      } else if (rol === "ADMINISTRADOR") {
        if (Platform.OS === 'web') {
          window.alert("El panel de administración es accesible desde la versión de escritorio/web.");
        } else {
          Alert.alert("Aviso", "El panel de administración es accesible desde la versión de escritorio/web.");
        }
        setLoading(false);
      } else {
        setErrorMsg("Rol no reconocido: " + rol);
        setLoading(false);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setErrorMsg("Usuario o contraseña incorrectos");
      } else if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg("Error al conectar con el servidor");
      }
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Image 
          source={require("../../assets/Coffee Code.jpeg")} 
          style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 10 }} 
        />
        <Text style={styles.tagline}>Café Todo el Día, Todos los Días...</Text>
      </View>

      <View style={styles.loginFormContainer}>
        <Text style={styles.sectionTitle}>Iniciar Sesión</Text>
        
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Correo Electrónico</Text>
          <TextInput 
            style={styles.input}
            placeholder="ejemplo@ejemplo.com"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Contraseña</Text>
          <TextInput 
            style={styles.input}
            placeholder="******"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>IP</Text>
          <TextInput 
            style={styles.input}
            placeholder="Ej: 192.168.1.20"
            value={serverIP}
            onChangeText={setServerIP}
            keyboardType="default"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.loginButtonText}>Ingresar</Text>
          )}
        </TouchableOpacity>
      </View>


        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function AppNavigator() {
  const [isReady, setIsReady] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState("Login");

  React.useEffect(() => {
    const checkToken = async () => {
      try {
        const savedIP = await AsyncStorage.getItem("server_ip");
        if (savedIP) {
          setBaseURL(savedIP);
        }

        const token = await AsyncStorage.getItem("userToken");
        const role = await AsyncStorage.getItem("userRole");
        if (token && role) {
          setToken(token);
          if (role === "MESERO") setInitialRoute("MeseroFlow");
          else if (role === "CAJERO") setInitialRoute("CajaFlow");
          else if (role === "COCINERO") setInitialRoute("CocinaFlow");
        }
      } catch (e) {
        console.error("Failed to load session", e);
      }
      setIsReady(true);
    };
    checkToken();
  }, []);

  if (!isReady) {
    return (
      <View style={{flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background}}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NotificationProvider>
      <NavigationContainer>
        <RootStack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="MeseroFlow" component={MeseroStack} />
          <RootStack.Screen name="CajaFlow" component={CajaStack} />
          <RootStack.Screen name="CocinaFlow" component={CocinaStack} />
        </RootStack.Navigator>
      </NavigationContainer>
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoText: {
    fontSize: 45,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  loginFormContainer: {
    width: "100%",
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 20,
  },
  errorText: {
    color: "#E74C3C",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.background,
    color: COLORS.textDark,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
    opacity: 0.7,
  },
});
