import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, Image, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../theme";
import NotificationButton from "../components/NotificationButton";


import ColaOrdenesScreen from "../screens/caja/ColaOrdenesScreen";
import GestionMonetariaScreen from "../screens/caja/GestionMonetariaScreen";
import DetalleCobroScreen from "../screens/caja/DetalleCobroScreen";
import MetodoPagoScreen from "../screens/caja/MetodoPagoScreen";
import ConfirmacionPagoScreen from "../screens/caja/ConfirmacionPagoScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const LogoTitle = () => (
  <Image 
    source={require("../../assets/Coffee Code.jpeg")} 
    style={{ width: 40, height: 40, borderRadius: 20 }} 
  />
);

function CajaTabs() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let label = "";
          if (route.name === "ColaTab") label = "";
          else if (route.name === "MonetariaTab") label = "";
          return <Text style={{ fontSize: size }}>{label}</Text>;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.accent,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
          borderBottomColor: COLORS.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          color: COLORS.textDark,
        },
        headerTitle: (props) => <LogoTitle {...props} />,
        headerLeft: () => null,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NotificationButton />
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15, padding: 5 }}>
              <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Salir</Text>
            </TouchableOpacity>
          </View>
        ),
      })}
    >
      <Tab.Screen 
        name="ColaTab" 
        component={ColaOrdenesScreen} 
        options={{ tabBarLabel: "Cola de Órdenes" }} 
      />
      <Tab.Screen 
        name="MonetariaTab" 
        component={GestionMonetariaScreen} 
        options={{ tabBarLabel: "Gestión Monetaria" }} 
      />
    </Tab.Navigator>
  );
}

export default function CajaStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
          elevation: 1,
          shadowOpacity: 0.1,
        },
        headerTintColor: COLORS.textDark,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerTitle: (props) => <LogoTitle {...props} />,
      }}
    >
      <Stack.Screen 
        name="CajaMain" 
        component={CajaTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="DetalleCobro" 
        component={DetalleCobroScreen} 
        options={{ headerTitle: (props) => <LogoTitle {...props} /> }} 
      />
      <Stack.Screen 
        name="MetodoPago" 
        component={MetodoPagoScreen} 
        options={{ headerTitle: (props) => <LogoTitle {...props} /> }} 
      />
      <Stack.Screen 
        name="ConfirmacionPago" 
        component={ConfirmacionPagoScreen} 
        options={{ headerTitle: (props) => <LogoTitle {...props} />, headerLeft: () => null }} 
      />
    </Stack.Navigator>
  );
}
