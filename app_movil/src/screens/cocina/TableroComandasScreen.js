import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";

const MOCK_COMANDAS = [
  {
    id: 1,
    mesa: { numero: 4, ubicacion: "Terraza" },
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), 
    estado: "EN_ESPERA",
    items: [
      { id: 301, producto: { nombre: "Hamburguesa Clásica" }, cantidad: 2, observaciones: "sin cebolla, término 1/2", estado: "EN_ESPERA" }
    ]
  },
  {
    id: 2,
    mesa: { numero: 10, ubicacion: "Interior" },
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), 
    estado: "EN_ESPERA",
    items: [
      { id: 302, producto: { nombre: "Pizza Pepperoni" }, cantidad: 1, observaciones: "Extra queso", estado: "EN_ESPERA" }
    ]
  }
];

export default function TableroComandasScreen({ navigation }) {
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComandas = async () => {
    setLoading(true);
    try {
      const response = await api.get("/cocina/comandas");
      setComandas(response.data);
    } catch (error) {
      console.warn("Backend inalcanzable. Usando comandas de cocina simuladas.");
      setComandas(MOCK_COMANDAS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchComandas();
    });
    return unsubscribe;
  }, [navigation]);

  const iniciarPreparacion = async (ordenId) => {
    try {
      await api.patch(`/cocina/orden/${ordenId}/estado`, { estado: "EN_PREPARACION" });
      fetchComandas();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "No se pudo actualizar el estado de la orden.";
      
      Alert.alert("Inventario Insuficiente", errorMsg);
      
      
      if (!error.response) {
        setComandas(prev => 
          prev.map(c => c.id === ordenId ? { ...c, estado: "EN_PREPARACION" } : c)
        );
        Alert.alert("Simulación Offline", "Preparación iniciada localmente.");
      }
    }
  };

  const formatHora = (isoString) => {
    try {
      let safeIso = isoString;
      if (!safeIso.endsWith('Z')) safeIso += 'Z';
      const d = new Date(safeIso);
      return d.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
      return "14:32";
    }
  };

  const renderComanda = ({ item }) => {
    const itemsResumen = item.items.map(i => `${i.cantidad}x ${i.producto.nombre}`).join(", ");
    const observaciones = item.items.find(i => i.observaciones)?.observaciones;

    return (
      <TouchableOpacity 
        style={styles.comandaCard}
        onPress={() => navigation.navigate("DetallePreparacion", { ordenId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.mesaTitle}>Mesa {item.mesa?.numero} - {item.mesa?.ubicacion}</Text>
          <Text style={styles.horaText}>{formatHora(item.created_at)}</Text>
        </View>

        <Text style={styles.productosText}> {itemsResumen}</Text>
        
        {observaciones ? (
          <View style={styles.observacionCont}>
            <Text style={styles.observacionTexto}>Nota: {observaciones}</Text>
          </View>
        ) : null}

        {item.estado === "EN_ESPERA" ? (
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => iniciarPreparacion(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}> INICIAR PREPARACIÓN</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.preparandoBadge}>
            <Text style={styles.preparandoBadgeText}> EN PREPARACIÓN</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={FONTS.title}>Cocina - Comandas</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={comandas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComanda}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay pedidos activos por preparar.</Text>
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  comandaCard: {
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  mesaTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  horaText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  productosText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
    marginVertical: 4,
  },
  observacionCont: {
    backgroundColor: COLORS.accentLight,
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
  },
  observacionTexto: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: "italic",
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 1,
  },
  preparandoBadge: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },
  preparandoBadgeText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.textLight,
  },
});
