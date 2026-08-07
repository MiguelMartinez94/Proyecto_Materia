import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";

const MOCK_ORDEN_CAJA = {
  id: 1,
  mesa: { numero: 4, ubicacion: "Terraza" },
  mesero: { nombre: "Juan Pérez" },
  estado: "LISTA",
  subtotal: 195.00,
  impuestos: 31.20,
  total: 226.20,
  items: [
    { id: 201, producto: { nombre: "Americano", precio: 35.0 }, cantidad: 2, precio_unitario: 35.0 },
    { id: 202, producto: { nombre: "Croissant", precio: 45.0 }, cantidad: 1, precio_unitario: 45.0 },
    { id: 203, producto: { nombre: "Jugo Naranja", precio: 80.0 }, cantidad: 1, precio_unitario: 80.0 },
  ]
};

export default function DetalleCobroScreen({ route, navigation }) {
  const { ordenId } = route.params || {};

  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrden = async () => {
    setLoading(true);
    try {
      if (ordenId) {
        const response = await api.get(`/mesero/ordenes/${ordenId}`);
        setOrden(response.data);
      } else {
        setOrden(MOCK_ORDEN_CAJA);
      }
    } catch (error) {
      console.warn("Backend inalcanzable. Usando orden simulada para cobrar.");
      setOrden(MOCK_ORDEN_CAJA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrden();
  }, [ordenId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!orden) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se pudo cargar la orden.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      <Text style={styles.cantText}>{item.cantidad}x</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNombre}>{item.producto.nombre}</Text>
        <Text style={styles.itemUnitario}>${item.precio_unitario.toFixed(2)} c/u</Text>
      </View>
      <Text style={styles.itemSubtotal}>${(item.precio_unitario * item.cantidad).toFixed(2)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Cobrar - Mesa {orden.mesa?.numero}</Text>
        <Text style={styles.meseroLabel}>
           {orden.mesa?.ubicacion}
        </Text>
      </View>

      <Text style={styles.seccionTitulo}>DETALLE DE LA ORDEN</Text>

      <FlatList
        data={orden.items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.totalesContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalVal}>${orden.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA (16%)</Text>
          <Text style={styles.totalVal}>${orden.impuestos.toFixed(2)}</Text>
        </View>
        
        <View style={styles.pagoGrandeContainer}>
          <Text style={styles.totalPagarLabel}>Total a pagar</Text>
          <Text style={styles.totalPagarMonto}>${orden.total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity 
          style={styles.pagarBtn}
          onPress={() => navigation.navigate("MetodoPago", { ordenId: orden.id, total: orden.total })}
          activeOpacity={0.8}
        >
          <Text style={styles.pagarBtnText}>Pagar ➔</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelarBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelarBtnText}>Cancelar pago</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  meseroLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textLight,
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cantText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  itemUnitario: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  totalesContainer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  totalVal: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: "600",
  },
  pagoGrandeContainer: {
    alignItems: "center",
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderRadius: 16,
  },
  totalPagarLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "bold",
  },
  totalPagarMonto: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 4,
  },
  pagarBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  pagarBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelarBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelarBtnText: {
    color: COLORS.estadoOcupada,
    fontWeight: "bold",
    fontSize: 14,
  },
  errorText: {
    color: COLORS.textLight,
  },
});
