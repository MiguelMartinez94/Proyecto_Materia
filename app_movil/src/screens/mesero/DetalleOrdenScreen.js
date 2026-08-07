import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, Alert } from "react-native";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function DetalleOrdenScreen({ route, navigation }) {
  const { ordenId, mesaId, mesaNumero } = route.params || {};

  const [orden, setOrden] = useState(null);
  const [mesaEstado, setMesaEstado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const isSubmitting = useRef(false);

  const fetchDetalle = async () => {
    setLoading(true);
    try {
      let targetId = ordenId;
      
      if (!targetId && mesaId) {
        try {
          const activeRes = await api.get("/mesero/ordenes/activas");
          const activeOrden = activeRes.data.find(o => o.mesa_id === mesaId);
          if (activeOrden) {
            targetId = activeOrden.id;
          }
        } catch (e) {
          console.warn("Could not fetch active orders");
        }
        
        if (!targetId) {
          try {
            const mesaOrdenRes = await api.get(`/mesero/ordenes/mesa/${mesaId}`);
            if (mesaOrdenRes.data) {
              setOrden(mesaOrdenRes.data);
              try {
                const mesasRes = await api.get("/mesero/mesas");
                const mesa = mesasRes.data.find(m => m.id === mesaId);
                if (mesa) setMesaEstado(mesa.estado);
              } catch (e) {
                console.warn("Could not fetch mesa state");
              }
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn("No orders found for this mesa");
            setOrden(null);
            setLoading(false);
            return;
          }
        }
      }

      if (targetId) {
        const response = await api.get(`/mesero/ordenes/${targetId}`);
        setOrden(response.data);
        if (response.data.mesa?.id) {
          try {
            const mesasRes = await api.get("/mesero/mesas");
            const mesa = mesasRes.data.find(m => m.id === response.data.mesa.id);
            if (mesa) setMesaEstado(mesa.estado);
          } catch (e) {
            console.warn("Could not fetch mesa state");
          }
        }
      }
    } catch (error) {
      console.warn("Backend inalcanzable:", error.message);
      setOrden(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalle();
  }, [ordenId, mesaId]);

  const getEstadoColor = (estado) => {
    switch (estado?.toUpperCase()) {
      case "EN_ESPERA": return COLORS.estadoEnEspera;
      case "EN_PREPARACION": return COLORS.accent;
      case "LISTA": return COLORS.estadoListo;
      case "PAGADA": return COLORS.primary;
      default: return COLORS.border;
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado?.toUpperCase()) {
      case "EN_ESPERA": return "En Espera";
      case "EN_PREPARACION": return "En Preparación";
      case "LISTA": return "Lista";
      case "PAGADA": return "Pagada";
      default: return estado;
    }
  };

  const handlePedirCuenta = async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setActionLoading(true);
    try {
      await api.patch(`/mesero/mesas/${orden.mesa.id}/pedir-cuenta`);
      showAlert("Cuenta enviada", "La cuenta ha sido enviada a caja correctamente.");
      navigation.navigate("MeseroMain", { screen: "MesasTab" });
    } catch (error) {
      const msg = error.response?.data?.detail || "Error al enviar la cuenta a caja.";
      showAlert("Error", msg);
    } finally {
      setActionLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleLiberarMesa = async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setActionLoading(true);
    try {
      await api.patch(`/mesero/mesas/${orden.mesa.id}/liberar`);
      showAlert("Mesa liberada", "La mesa ha sido liberada y ya está disponible nuevamente.");
      navigation.navigate("MeseroMain", { screen: "MesasTab" });
    } catch (error) {
      const msg = error.response?.data?.detail || "Error al liberar la mesa.";
      showAlert("Error", msg);
    } finally {
      setActionLoading(false);
      isSubmitting.current = false;
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
        <Text style={styles.errorText}>No se encontró orden para esta mesa.</Text>
        <Text style={{color: COLORS.textLight, marginBottom: 20, textAlign: 'center', paddingHorizontal: 20}}>
          Si la mesa quedó bloqueada por error, puedes liberarla para volver a usarla.
        </Text>
        <View style={{flexDirection: 'row', gap: 10}}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Regresar</Text>
          </TouchableOpacity>
          {mesaId && (
            <TouchableOpacity 
              style={[styles.backBtn, {backgroundColor: COLORS.estadoLibre || "#27AE60"}]} 
              onPress={async () => {
                try {
                  await api.patch(`/mesero/mesas/${mesaId}/liberar`);
                  showAlert("Mesa liberada", "La mesa ha sido liberada correctamente.");
                  navigation.goBack();
                } catch (err) {
                  showAlert("Error", "No se pudo liberar la mesa.");
                }
              }}
            >
              <Text style={styles.backBtnText}>Forzar Liberación</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      <View style={styles.cantCol}>
        <Text style={styles.cantText}>{item.cantidad}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNombre}>{item.producto.nombre}</Text>
        {item.observaciones ? (
          <Text style={styles.itemObs}> {item.observaciones}</Text>
        ) : null}
      </View>
      <Text style={styles.itemPrecio}>${(item.precio_unitario * item.cantidad).toFixed(2)}</Text>
    </View>
  );

  // Determine which action buttons to show based on mesa state
  const showPedirCuenta = mesaEstado === "EN_ESPERA";
  const showLiberarMesa = mesaEstado === "OCUPADA";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Orden - Mesa {orden.mesa?.numero}</Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(orden.estado) }]}>
          <Text style={styles.estadoText}>{getEstadoLabel(orden.estado)}</Text>
        </View>
      </View>

      <Text style={styles.seccionTitulo}>DETALLE DE PRODUCTOS</Text>

      <FlatList
        data={orden.items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          mesaEstado !== "OCUPADA" && mesaEstado !== "POR_COBRAR" ? (
            <TouchableOpacity 
              style={styles.addMoreBtn}
              onPress={() => navigation.navigate("MeseroMain", { screen: "MenuTab", params: { mesaId: orden.mesa.id, mesaNumero: orden.mesa.numero, ordenId: orden.id } })}
            >
              <Text style={styles.addMoreText}>+ Agregar más productos</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={styles.totalesContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalVal}>${orden.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Impuestos (16%)</Text>
          <Text style={styles.totalVal}>${orden.impuestos.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalVal}>${orden.total.toFixed(2)}</Text>
        </View>

        {actionLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 16 }} />
        ) : (
          <View style={styles.actionButtonsContainer}>
            {showPedirCuenta && (
              <TouchableOpacity style={styles.pedirCuentaBtn} onPress={handlePedirCuenta} activeOpacity={0.8}>
                <Text style={styles.pedirCuentaBtnText}>Mandar cuenta a Caja</Text>
              </TouchableOpacity>
            )}
            {showLiberarMesa && (
              <TouchableOpacity style={styles.liberarMesaBtn} onPress={handleLiberarMesa} activeOpacity={0.8}>
                <Text style={styles.liberarMesaBtnText}>Liberar Mesa</Text>
              </TouchableOpacity>
            )}
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
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  estadoBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  estadoText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
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
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cantCol: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cantText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  itemObs: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  itemPrecio: {
    fontSize: 15,
    fontWeight: "bold",
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
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  grandTotalVal: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  backBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  actionButtonsContainer: {
    marginTop: 16,
  },
  pedirCuentaBtn: {
    backgroundColor: COLORS.estadoPorCobrar || "#E67E22",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  pedirCuentaBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  liberarMesaBtn: {
    backgroundColor: COLORS.estadoLibre || "#27AE60",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  liberarMesaBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});
