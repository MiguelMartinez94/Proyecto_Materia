import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text } from "react-native";
import { COLORS } from "../theme";


import ColaOrdenesScreen from "../screens/caja/ColaOrdenesScreen";
import GestionMonetariaScreen from "../screens/caja/GestionMonetariaScreen";
import DetalleCobroScreen from "../screens/caja/DetalleCobroScreen";
import MetodoPagoScreen from "../screens/caja/MetodoPagoScreen";
import ConfirmacionPagoScreen from "../screens/caja/ConfirmacionPagoScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function CajaTabs() {
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
        headerTitle: "Coffee Code",
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
        headerTitle: "Coffee Code",
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
        options={{ headerTitle: "Coffee Code" }} 
      />
      <Stack.Screen 
        name="MetodoPago" 
        component={MetodoPagoScreen} 
        options={{ headerTitle: "Coffee Code" }} 
      />
      <Stack.Screen 
        name="ConfirmacionPago" 
        component={ConfirmacionPagoScreen} 
        options={{ headerTitle: "Coffee Code", headerLeft: () => null }} 
      />
    </Stack.Navigator>
  );
}
