import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, SafeAreaView, Alert, ActivityIndicator, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";

export default function ResumenPedidoScreen({ route, navigation }) {
  const { carrito: carritoInicial, mesaId, mesaNumero, mesaUbicacion, ordenId } = route.params || {};

  const [carrito, setCarrito] = useState(carritoInicial || []);
  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false);
  const [itemEditandoNota, setItemEditandoNota] = useState(null); 
  const [notaTemp, setNotaTemp] = useState("");
  const [meseroId, setMeseroId] = useState(1);

  React.useEffect(() => {
    const fetchId = async () => {
      const idStr = await AsyncStorage.getItem("userId");
      if (idStr) {
        setMeseroId(parseInt(idStr, 10));
      }
    };
    fetchId();
  }, []);

  const actualizarCantidad = (productoId, delta) => {
    setCarrito(prev => {
      return prev.map(item => {
        if (item.producto.id === productoId) {
          const nuevaCant = item.cantidad + delta;
          return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const abrirNotaModal = (item) => {
    setItemEditandoNota(item.producto.id);
    setNotaTemp(item.observaciones || "");
  };

  const guardarNota = (productoId) => {
    setCarrito(prev => {
      return prev.map(item => 
        item.producto.id === productoId 
          ? { ...item, observaciones: notaTemp }
          : item
      );
    });
    setItemEditandoNota(null);
  };

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + (item.producto.price || item.producto.precio) * item.cantidad, 0);
  };

  const enviarPedido = async () => {
    if (isSubmitting.current) return;
    if (!mesaId) {
      if (Platform.OS === 'web') {
        window.alert("Por favor selecciona una mesa antes de enviar el pedido.");
      } else {
        Alert.alert("Atención", "Por favor selecciona una mesa antes de enviar el pedido.");
      }
      return;
    }
    if (carrito.length === 0) {
      if (Platform.OS === 'web') {
        window.alert("El pedido está vacío.");
      } else {
        Alert.alert("Atención", "El pedido está vacío.");
      }
      return;
    }

    setLoading(false);
    try {
      isSubmitting.current = true;
      setLoading(true);
      const itemsPayload = carrito.map(item => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        observaciones: item.observaciones || null
      }));

      if (ordenId) {
        await api.post(`/mesero/ordenes/${ordenId}/items`, itemsPayload);
      } else {
        const payload = {
          mesa_id: mesaId,
          mesero_id: meseroId, 
          items: itemsPayload
        };
        await api.post("/mesero/ordenes", payload);
      }
      
      if (Platform.OS === 'web') {
        window.alert(`El pedido para la Mesa ${mesaNumero} ha sido enviado correctamente.`);
      } else {
        Alert.alert("Éxito", `El pedido para la Mesa ${mesaNumero} ha sido enviado correctamente.`);
      }
      navigation.navigate("MeseroMain", { screen: "MesasTab" });
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || "Error desconocido";
      console.warn("Error al enviar pedido:", errorMsg);
      if (Platform.OS === 'web') {
        window.alert(`Error al enviar: ${errorMsg}`);
      } else {
        Alert.alert("Error al enviar", `Fallo: ${errorMsg}\n\nAsegúrate de que el backend esté corriendo.`);
      }
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const renderCartItem = ({ item }) => {
    const editando = itemEditandoNota === item.producto.id;
    const precio = item.producto.price || item.producto.precio;

    return (
      <View style={styles.itemCard}>
        <View style={styles.rowMain}>
          <Text style={styles.itemCantidad}>{item.cantidad}x</Text>
          <View style={styles.infoCol}>
            <Text style={styles.itemName}>{item.producto.nombre}</Text>
            <Text style={styles.itemPrecioUnitario}>${precio.toFixed(2)} c/u</Text>
          </View>
          <Text style={styles.itemSubtotal}>${(precio * item.cantidad).toFixed(2)}</Text>
        </View>

        {item.observaciones ? (
          <View style={styles.notaCont}>
            <Text style={styles.notaLabel}>Observaciones: </Text>
            <Text style={styles.notaTexto}>{item.observaciones}</Text>
          </View>
        ) : null}

        {editando ? (
          <View style={styles.notaInputRow}>
            <TextInput
              style={styles.notaInput}
              placeholder="Ej: sin cebolla, término 3/4"
              value={notaTemp}
              onChangeText={setNotaTemp}
            />
            <TouchableOpacity 
              style={styles.guardarNotaBtn}
              onPress={() => guardarNota(item.producto.id)}
            >
              <Text style={styles.guardarNotaText}>Listo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itemAcciones}>
            <TouchableOpacity 
              style={styles.notaBoton}
              onPress={() => abrirNotaModal(item)}
            >
              <Text style={styles.notaBotonText}>
                {item.observaciones ? " Editar Nota" : " Agregar Nota"}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.selectorCant}>
              <TouchableOpacity 
                style={styles.selectorBtn} 
                onPress={() => actualizarCantidad(item.producto.id, -1)}
              >
                <Text style={styles.selectorBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.selectorCantText}>{item.cantidad}</Text>
              <TouchableOpacity 
                style={styles.selectorBtn} 
                onPress={() => actualizarCantidad(item.producto.id, 1)}
              >
                <Text style={styles.selectorBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.mesaTitle}>Mesa {mesaNumero || "?"}</Text>
        <Text style={styles.mesaSub}>{mesaUbicacion || "Ubicación"}</Text>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={carrito}
        keyExtractor={(item) => item.producto.id.toString()}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity 
            style={styles.addMoreBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.addMoreText}>+ Agregar Producto</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Mesa:</Text>
          <Text style={styles.totalMonto}>${calcularTotal().toFixed(2)}</Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 10 }} />
        ) : (
          <TouchableOpacity 
            style={styles.enviarBtn} 
            onPress={enviarPedido}
            activeOpacity={0.8}
          >
            <Text style={styles.enviarText}>Enviar pedido a Cocina</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  mesaTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  mesaSub: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemCantidad: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  itemPrecioUnitario: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  itemAcciones: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.accentLight,
    paddingTop: 8,
  },
  notaBoton: {
    paddingVertical: 4,
  },
  notaBotonText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "bold",
  },
  notaCont: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    flexDirection: "row",
  },
  notaLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.textLight,
  },
  notaTexto: {
    fontSize: 11,
    color: COLORS.textDark,
    flex: 1,
  },
  notaInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  notaInput: {
    flex: 1,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 12,
    backgroundColor: COLORS.background,
  },
  guardarNotaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  guardarNotaText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  selectorCant: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectorBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  selectorBtnText: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: "bold",
  },
  selectorCantText: {
    fontSize: 14,
    fontWeight: "bold",
    marginHorizontal: 10,
    color: COLORS.textDark,
  },
  addMoreBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.accent,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  addMoreText: {
    color: COLORS.accent,
    fontWeight: "bold",
    fontSize: 14,
  },
  footer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  totalMonto: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  enviarBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  enviarText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});
