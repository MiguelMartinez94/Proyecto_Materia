import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";

const MOCK_PREPARACION = {
  id: 1,
  mesa: { numero: 4, ubicacion: "Terraza" },
  created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  estado: "EN_PREPARACION",
  items: [
    { id: 301, producto: { nombre: "Hamburguesa Clásica" }, cantidad: 2, observaciones: "sin cebolla, término 1/2", estado: "EN_PREPARACION" }
  ]
};

export default function DetallePreparacionScreen({ route, navigation }) {
  const { ordenId } = route.params || {};

  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDetalle = async () => {
    setLoading(true);
    try {
      if (ordenId) {
        const response = await api.get(`/mesero/ordenes/${ordenId}`);
        setOrden(response.data);
      } else {
        setOrden(MOCK_PREPARACION);
      }
    } catch (error) {
      console.warn("Backend inalcanzable. Usando comanda simulada para detalle de preparación.");
      setOrden(MOCK_PREPARACION);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalle();
  }, [ordenId]);

  const cambiarEstado = async (nuevoEstado) => {
    try {
      await api.patch(`/cocina/orden/${orden.id}/estado`, { estado: nuevoEstado });
      navigation.goBack();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "No se pudo actualizar el estado de la comanda.";
      Alert.alert("Error", errorMsg);
      
      
      if (!error.response) {
        navigation.goBack();
      }
    }
  };

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.mesaTitle}>Mesa {orden.mesa?.numero} - {orden.mesa?.ubicacion}</Text>
        <View style={styles.estadoBadge}>
          <Text style={styles.estadoText}>{orden.estado}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.seccionTitulo}>PRODUCTOS POR PREPARAR</Text>
        
        {orden.items.map((item, idx) => (
          <View key={item.id || idx} style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={styles.cantCircle}>
                <Text style={styles.cantText}>{item.cantidad}</Text>
              </View>
              <Text style={styles.itemNombre}>{item.producto.nombre}</Text>
            </View>
            
            {item.observaciones ? (
              <View style={styles.obsCont}>
                <Text style={styles.obsLabel}>OBSERVACIÓN:</Text>
                <Text style={styles.obsVal}>{item.observaciones}</Text>
              </View>
            ) : null}
          </View>
        ))}

        <View style={styles.timeline}>
          <Text style={styles.timelineText}> Recibido a las {formatHora(orden.created_at)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        {orden.estado === "EN_ESPERA" && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: COLORS.estadoEnEspera }]}
            onPress={() => cambiarEstado("EN_PREPARACION")}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>INICIAR PREPARACIÓN</Text>
          </TouchableOpacity>
        )}

        {orden.estado === "EN_PREPARACION" && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: COLORS.estadoListo }]}
            onPress={() => cambiarEstado("LISTA")}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>MARCAR COMO LISTO</Text>
          </TouchableOpacity>
        )}

        {orden.estado === "LISTA" && (
          <View style={styles.completadoBanner}>
            <Text style={styles.completadoText}>Producto entregado</Text>
          </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mesaTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  estadoBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  estadoText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
  },
  body: {
    flex: 1,
    padding: 20,
  },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textLight,
    marginBottom: 12,
    letterSpacing: 1,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cantCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cantText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  obsCont: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  obsLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.estadoOcupada,
    letterSpacing: 0.5,
  },
  obsVal: {
    fontSize: 13,
    color: COLORS.textDark,
    marginTop: 2,
  },
  timeline: {
    marginTop: 20,
    alignItems: "center",
  },
  timelineText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontStyle: "italic",
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  completadoBanner: {
    backgroundColor: COLORS.accentLight,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  completadoText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  errorText: {
    color: COLORS.textLight,
  },
});
