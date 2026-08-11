import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal, TextInput } from "react-native";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";

const MOCK_VENTAS_DETALLE = [
  { id: 1, orden_id: 101, ticket_folio: "TKT-401", total_pagado: 170.00, metodo_pago: "EFECTIVO", created_at: new Date().toISOString(), mesa_numero: 4, mesa_ubicacion: "Terraza" },
  { id: 2, orden_id: 102, ticket_folio: "TKT-102", total_pagado: 430.00, metodo_pago: "TARJETA", created_at: new Date().toISOString(), mesa_numero: 1, mesa_ubicacion: "Interior" },
  { id: 3, orden_id: 103, ticket_folio: "TKT-803", total_pagado: 95.00, metodo_pago: "EFECTIVO", created_at: new Date().toISOString(), mesa_numero: 8, mesa_ubicacion: "Barra" },
];

export default function GestionMonetariaScreen({ navigation }) {
  const [ingresos, setIngresos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ingresos");
  const [gastos, setGastos] = useState([]);
  const [modalGastosVisible, setModalGastosVisible] = useState(false);
  const [nuevoGastoMonto, setNuevoGastoMonto] = useState("");
  const [nuevoGastoDesc, setNuevoGastoDesc] = useState("");

  const handleAddGasto = async () => {
    if (!nuevoGastoMonto || !nuevoGastoDesc) return;
    const monto = parseFloat(nuevoGastoMonto);
    if (isNaN(monto)) return;
    
    try {
      await api.post("/caja/gastos", {
        descripcion: nuevoGastoDesc,
        monto: monto
      });
      setNuevoGastoMonto("");
      setNuevoGastoDesc("");
      setModalGastosVisible(false);
      fetchIngresos(); // Refresh data
    } catch (error) {
      console.warn("Error guardando el gasto:", error);
      alert("No se pudo guardar el gasto");
    }
  };

  const fetchIngresos = async () => {
    setLoading(true);
    try {
      const [ingresosRes, gastosRes] = await Promise.all([
        api.get("/caja/ingresos-dia"),
        api.get("/caja/gastos")
      ]);
      setIngresos(ingresosRes.data);
      setGastos(gastosRes.data);
    } catch (error) {
      console.warn("Backend inalcanzable. Usando resumen monetario simulado.");
      setIngresos({
        total_vendido: 12450.00,
        ordenes_cobradas: 48,
        ticket_promedio: 250.00,
        ventas_detalle: MOCK_VENTAS_DETALLE
      });
      setGastos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchIngresos();
    });
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const formatHora = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
      return "14:32";
    }
  };

  const renderVentaItem = ({ item }) => {
    return (
      <View style={styles.ventaRow}>
        <View style={styles.ventaInfo}>
          <Text style={styles.ventaMesa}>
            Mesa {item.mesa_numero || item.orden_id} - {item.mesa_ubicacion || "Salón"}
          </Text>
          <Text style={styles.ventaFolio}>
            {formatHora(item.created_at)} - {item.metodo_pago}
          </Text>
        </View>
        <Text style={styles.ventaMonto}>+${item.total_pagado.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.header}>
        <Text style={FONTS.title}>Gestión Monetaria</Text>
        

        <View style={styles.toggleRow}>
          <TouchableOpacity 
            style={[styles.toggleBtn, activeTab === "ingresos" && styles.toggleBtnActive]}
            onPress={() => setActiveTab("ingresos")}
          >
            <Text style={[styles.toggleBtnText, activeTab === "ingresos" && styles.toggleBtnTextActive]}>Ingresos del día</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, activeTab === "gastos" && styles.toggleBtnActive]}
            onPress={() => setActiveTab("gastos")}
          >
            <Text style={[styles.toggleBtnText, activeTab === "gastos" && styles.toggleBtnTextActive]}>Registros gastos</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollViewContainer>
        {activeTab === "ingresos" ? (
          <>
            {ingresos && (
              <View style={styles.dashboard}>
                <View style={styles.mainCard}>
                  <Text style={styles.mainCardLabel}>VENTAS TOTALES</Text>
                  <Text style={styles.mainCardVal}>${ingresos.total_vendido.toFixed(2)}</Text>
                </View>
                <View style={styles.subCardsRow}>
                  <View style={styles.subCard}>
                    <Text style={styles.subCardLabel}>ÓRDENES COBRADAS</Text>
                    <Text style={styles.subCardVal}>{ingresos.ordenes_cobradas}</Text>
                  </View>
                  <View style={styles.subCard}>
                    <Text style={styles.subCardLabel}>TICKET PROMEDIO</Text>
                    <Text style={styles.subCardVal}>${ingresos.ticket_promedio.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.seccionTitulo}>DETALLE DE COBROS</Text>

            <FlatList
              data={ingresos?.ventas_detalle || []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderVentaItem}
              scrollEnabled={false} 
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No hay registros de ventas para el día de hoy.</Text>
              }
            />
          </>
        ) : (
          <View style={styles.dashboard}>
            <View style={styles.mainCard}>
              <Text style={styles.mainCardLabel}>GASTOS TOTALES</Text>
              <Text style={styles.mainCardVal}>${gastos.reduce((acc, g) => acc + g.monto, 0).toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity 
              style={{ backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: "center", marginVertical: 10 }}
              onPress={() => setModalGastosVisible(true)}
            >
              <Text style={{ color: COLORS.white, fontWeight: "bold" }}>+ Agregar Gasto</Text>
            </TouchableOpacity>

            <Text style={styles.seccionTitulo}>HISTORIAL DE GASTOS</Text>

            <FlatList
              data={gastos}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay registros de gastos de hoy.</Text>}
              renderItem={({ item }) => (
                <View style={styles.ventaRow}>
                  <View style={styles.ventaInfo}>
                    <Text style={styles.ventaMesa}>{item.descripcion}</Text>
                    <Text style={styles.ventaFolio}>{formatHora(item.created_at)}</Text>
                  </View>
                  <Text style={[styles.ventaMonto, { color: "#E74C3C" }]}>-${item.monto.toFixed(2)}</Text>
                </View>
              )}
            />
          </View>
        )}
      </ScrollViewContainer>

      <Modal visible={modalGastosVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Gasto</Text>
            
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej. Compra de insumos" 
              value={nuevoGastoDesc} 
              onChangeText={setNuevoGastoDesc} 
            />
            
            <Text style={styles.inputLabel}>Monto ($)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0.00" 
              keyboardType="numeric" 
              value={nuevoGastoMonto} 
              onChangeText={setNuevoGastoMonto} 
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalGastosVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSubmit} onPress={handleAddGasto}>
                <Text style={styles.modalBtnSubmitText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


function ScrollViewContainer({ children }) {
  return (
    <FlatList
      data={[{ key: "content" }]}
      renderItem={() => <View>{children}</View>}
      keyExtractor={(item) => item.key}
      showsVerticalScrollIndicator={false}
    />
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
  toggleRow: {
    flexDirection: "row",
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleBtnText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: "600",
  },
  toggleBtnTextActive: {
    color: COLORS.primary,
  },
  dashboard: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  mainCardLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.textLight,
    letterSpacing: 1,
  },
  mainCardVal: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 6,
  },
  subCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subCardLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.textLight,
  },
  subCardVal: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginTop: 4,
  },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textLight,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  ventaRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  ventaInfo: {
    flex: 1,
  },
  ventaMesa: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  ventaFolio: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  ventaMonto: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: COLORS.textLight,
  },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center"
  },
  modalContent: {
    width: "85%", backgroundColor: COLORS.background, borderRadius: 16, padding: 20
  },
  modalTitle: {
    fontSize: 18, fontWeight: "bold", color: COLORS.textDark, marginBottom: 15, textAlign: "center"
  },
  inputLabel: {
    fontSize: 12, color: COLORS.textLight, marginBottom: 5
  },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 14, color: COLORS.textDark
  },
  modalButtons: {
    flexDirection: "row", justifyContent: "space-between", marginTop: 10
  },
  modalBtnCancel: {
    flex: 1, padding: 12, alignItems: "center", marginRight: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border
  },
  modalBtnSubmit: {
    flex: 1, padding: 12, alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 8
  },
  modalBtnCancelText: {
    color: COLORS.textLight, fontWeight: "bold"
  },
  modalBtnSubmitText: {
    color: COLORS.white, fontWeight: "bold"
  }
});
