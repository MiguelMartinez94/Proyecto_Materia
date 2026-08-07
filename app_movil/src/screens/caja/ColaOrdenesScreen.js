import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";

const MOCK_PENDIENTES = [
  { id: 1, mesa_id: 1, mesa: { numero: 4, ubicacion: "Terraza" }, mesero_nombre: "Juan Pérez", estado: "EN_ESPERA", total: 220.40, items_count: 3 },
  { id: 2, mesa_id: 2, mesa: { numero: 12, ubicacion: "Interior" }, mesero_nombre: "Ana Gómez", estado: "LISTA", total: 1180.00, items_count: 2 },
  { id: 3, mesa_id: 3, mesa: { numero: 7, ubicacion: "Barra" }, mesero_nombre: "Carlos Chef", estado: "LISTA", total: 1200.00, items_count: 5 },
];

export default function ColaOrdenesScreen({ navigation }) {
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metricas, setMetricas] = useState({ ventasTotales: 2450.00, ordenesCobradas: 12 });

  const fetchPendientes = async () => {
    setLoading(true);
    try {
      
      const resPendientes = await api.get("/caja/pendientes");
      setPendientes(resPendientes.data);
      
      
      const resIngresos = await api.get("/caja/ingresos-dia");
      setMetricas({
        ventasTotales: resIngresos.data.total_vendido || 0,
        ordenesCobradas: resIngresos.data.ordenes_cobradas || 0
      });
    } catch (error) {
      console.warn("Backend inalcanzable. Usando datos simulados para caja.");
      setPendientes(MOCK_PENDIENTES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPendientes();
    });
    return unsubscribe;
  }, [navigation]);

  const renderOrdenPendiente = ({ item }) => {
    return (
      <View style={styles.ordenCard}>
        <View style={styles.cardInfo}>
          <Text style={styles.mesaTitle}>Mesa {item.mesa?.numero || item.mesa_id} - {item.mesa?.ubicacion || "Mesa"}</Text>
          <Text style={styles.detallesText}>{item.items_count} productos</Text>
          <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.cobrarBtn}
          onPress={() => navigation.navigate("DetalleCobro", { ordenId: item.id })}
          activeOpacity={0.7}
        >
          <Text style={styles.cobrarBtnText}>Cobrar ➔</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.header}>
        <View style={styles.row}>
          <Text style={FONTS.title}>Caja</Text>
          <TouchableOpacity 
            style={styles.resumenBtn}
            onPress={() => navigation.navigate("MonetariaTab")}
          >
            <Text style={styles.resumenBtnText}>Resumen de ventas</Text>
          </TouchableOpacity>
        </View>
        

        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>${metricas.ventasTotales.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Ventas del día</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{metricas.ordenesCobradas}</Text>
            <Text style={styles.metricLabel}>Órdenes cobradas</Text>
          </View>
        </View>
      </View>

      <Text style={styles.seccionTitulo}>ÓRDENES PENDIENTES DE PAGO</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={pendientes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrdenPendiente}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay órdenes por cobrar en este momento.</Text>
          }
        />
      )}
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resumenBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resumenBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
  },
  metricsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "space-around",
  },
  metricItem: {
    alignItems: "center",
  },
  metricVal: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.primaryLight,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.accent,
  },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textLight,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ordenCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardInfo: {
    flex: 1,
  },
  mesaTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  detallesText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 6,
  },
  cobrarBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cobrarBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 13,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.textLight,
  },
});
