import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, Image, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../theme";
import NotificationButton from "../components/NotificationButton";


import TableroComandasScreen from "../screens/cocina/TableroComandasScreen";
import InventarioMenuScreen from "../screens/cocina/InventarioMenuScreen";
import DetallePreparacionScreen from "../screens/cocina/DetallePreparacionScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const LogoTitle = () => (
  <Image 
    source={require("../../assets/Coffee Code.jpeg")} 
    style={{ width: 40, height: 40, borderRadius: 20 }} 
  />
);

function CocinaTabs() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('userId');
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
        headerTitle: (props) => <LogoTitle {...props} />,
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
        headerTitle: (props) => <LogoTitle {...props} />,
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
        options={{ headerTitle: (props) => <LogoTitle {...props} /> }} 
      />
    </Stack.Navigator>
  );
}
