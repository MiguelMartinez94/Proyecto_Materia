import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";

const MOCK_ORDENES = [
  { id: 1, mesa_id: 1, mesa: { numero: 4, ubicacion: "Terraza" }, mesero_nombre: "Juan Pérez", estado: "EN_ESPERA", total: 190.0, items_count: 3, items_summary: "2x Americano, 1x Tostado Jamón" },
  { id: 2, mesa_id: 2, mesa: { numero: 2, ubicacion: "Interior" }, mesero_nombre: "Ana Gómez", estado: "EN_PREPARACION", total: 245.0, items_count: 4, items_summary: "2x Cappuccino Vainilla, 1x Croissant Almendra" },
  { id: 3, mesa_id: 3, mesa: { numero: 1, ubicacion: "Barra" }, mesero_nombre: "Carlos Chef", estado: "LISTA", total: 120.0, items_count: 2, items_summary: "1x Expresso Doble, 1x Agua Mineral" },
];

export default function ListaOrdenesScreen({ navigation }) {
  const [ordenes, setOrdenes] = useState([]);
  const [filtroArea, setFiltroArea] = useState("TODAS");
  const [loading, setLoading] = useState(false);

  const fetchOrdenesActivas = async () => {
    setLoading(true);
    try {
      const response = await api.get("/mesero/ordenes/activas");
      setOrdenes(response.data);
    } catch (error) {
      console.warn("Backend inalcanzable. Usando órdenes activas de simulación.");
      setOrdenes(MOCK_ORDENES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchOrdenesActivas();
    });
    return unsubscribe;
  }, [navigation]);

  const getEstadoColor = (estado) => {
    switch (estado.toUpperCase()) {
      case "EN_ESPERA": return COLORS.estadoEnEspera;
      case "EN_PREPARACION": return COLORS.accent;
      case "LISTA": return COLORS.estadoListo;
      case "PAGADA": return COLORS.primary;
      default: return COLORS.border;
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado.toUpperCase()) {
      case "EN_ESPERA": return "En Espera";
      case "EN_PREPARACION": return "Preparando";
      case "LISTA": return "Lista";
      case "PAGADA": return "Pagada";
      default: return estado;
    }
  };

  const areas = ["TODAS", "TERRAZA", "INTERIOR", "BARRA"];
  const ordenesFiltradas = filtroArea === "TODAS"
    ? ordenes
    : ordenes.filter(o => o.mesa?.ubicacion?.toUpperCase() === filtroArea);

  const renderOrdenItem = ({ item }) => {
    const colorEstado = getEstadoColor(item.estado);
    const sub = item.items_summary || `${item.items_count} productos`;

    return (
      <TouchableOpacity 
        style={styles.ordenCard}
        onPress={() => navigation.navigate("DetalleOrden", { ordenId: item.id, mesaNumero: item.mesa?.numero })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.mesaLabel}>Mesa {item.mesa?.numero || item.mesa_id}</Text>
          <View style={[styles.estadoBadge, { backgroundColor: colorEstado }]}>
            <Text style={styles.estadoText}>{getEstadoTexto(item.estado)}</Text>
          </View>
        </View>

        <Text style={styles.meseroLabel}> {item.mesa?.ubicacion}</Text>
        <Text style={styles.itemsResumen} numberOfLines={2}> {sub}</Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalMonto}>${item.total.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        
        <Text style={FONTS.title}>Órdenes Activas</Text>
      </View>

      <View style={styles.tabsContainer}>
        {areas.map(area => (
          <TouchableOpacity
            key={area}
            style={[
              styles.tabButton,
              filtroArea === area && styles.tabButtonActive
            ]}
            onPress={() => setFiltroArea(area)}
          >
            <Text style={[
              styles.tabButtonText,
              filtroArea === area && styles.tabButtonTextActive
            ]}>
              {area.charAt(0) + area.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ordenesFiltradas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrdenItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay órdenes activas en esta área.</Text>
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
  meseroText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 12,
    justifyContent: "space-between",
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.accentLight,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ordenCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mesaLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  estadoText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  meseroLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 6,
  },
  itemsResumen: {
    fontSize: 13,
    color: COLORS.textDark,
    marginTop: 6,
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.accentLight,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  totalMonto: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.textLight,
  },
});
