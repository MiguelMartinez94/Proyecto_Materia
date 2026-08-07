import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text } from "react-native";
import { COLORS } from "../theme";


import ListaDeMesasScreen from "../screens/mesero/ListaDeMesasScreen";
import CatalogoMenuScreen from "../screens/mesero/CatalogoMenuScreen";
import ListaOrdenesScreen from "../screens/mesero/ListaOrdenesScreen";
import ResumenPedidoScreen from "../screens/mesero/ResumenPedidoScreen";
import DetalleOrdenScreen from "../screens/mesero/DetalleOrdenScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MeseroTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let label = "";
          if (route.name === "MesasTab") label = "";
          else if (route.name === "MenuTab") label = "";
          else if (route.name === "OrdenesTab") label = "";
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
        name="MesasTab" 
        component={ListaDeMesasScreen} 
        options={{ tabBarLabel: "Mesas" }} 
      />
      <Tab.Screen 
        name="MenuTab" 
        component={CatalogoMenuScreen} 
        options={{ tabBarLabel: "Menú" }} 
      />
      <Tab.Screen 
        name="OrdenesTab" 
        component={ListaOrdenesScreen} 
        options={{ tabBarLabel: "Órdenes" }} 
      />
    </Tab.Navigator>
  );
}

export default function MeseroStack() {
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
        name="MeseroMain" 
        component={MeseroTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ResumenPedido" 
        component={ResumenPedidoScreen} 
        options={{ headerTitle: "Coffee Code" }} 
      />
      <Stack.Screen 
        name="DetalleOrden" 
        component={DetalleOrdenScreen} 
        options={{ headerTitle: "Coffee Code" }} 
      />
    </Stack.Navigator>
  );
}
