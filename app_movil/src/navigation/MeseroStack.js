import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, Image, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../theme";
import NotificationButton from "../components/NotificationButton";


import ListaDeMesasScreen from "../screens/mesero/ListaDeMesasScreen";
import CatalogoMenuScreen from "../screens/mesero/CatalogoMenuScreen";
import ListaOrdenesScreen from "../screens/mesero/ListaOrdenesScreen";
import ResumenPedidoScreen from "../screens/mesero/ResumenPedidoScreen";
import DetalleOrdenScreen from "../screens/mesero/DetalleOrdenScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const LogoTitle = () => (
  <Image 
    source={require("../../assets/Coffee Code.jpeg")} 
    style={{ width: 40, height: 40, borderRadius: 20 }} 
  />
);

function MeseroTabs() {
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
        headerTitle: (props) => <LogoTitle {...props} />,
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
        options={{ headerTitle: (props) => <LogoTitle {...props} /> }} 
      />
      <Stack.Screen 
        name="DetalleOrden" 
        component={DetalleOrdenScreen} 
        options={{ headerTitle: (props) => <LogoTitle {...props} /> }} 
      />
    </Stack.Navigator>
  );
}
