import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text } from "react-native";
import { COLORS } from "../theme";


import TableroComandasScreen from "../screens/cocina/TableroComandasScreen";
import InventarioMenuScreen from "../screens/cocina/InventarioMenuScreen";
import DetallePreparacionScreen from "../screens/cocina/DetallePreparacionScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function CocinaTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let label = "";
          if (route.name === "TableroTab") label = "";
          else if (route.name === "InventarioTab") label = "";
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
        name="TableroTab" 
        component={TableroComandasScreen} 
        options={{ tabBarLabel: "Comandas" }} 
      />
      <Tab.Screen 
        name="InventarioTab" 
        component={InventarioMenuScreen} 
        options={{ tabBarLabel: "Inventario" }} 
      />
    </Tab.Navigator>
  );
}

export default function CocinaStack() {
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
        name="CocinaMain" 
        component={CocinaTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="DetallePreparacion" 
        component={DetallePreparacionScreen} 
        options={{ headerTitle: "Coffee Code" }} 
      />
    </Stack.Navigator>
  );
}
