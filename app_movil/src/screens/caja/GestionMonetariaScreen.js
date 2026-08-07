import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
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

  const fetchIngresos = async () => {
    setLoading(true);
    try {
      const response = await api.get("/caja/ingresos-dia");
      setIngresos(response.data);
    } catch (error) {
      console.warn("Backend inalcanzable. Usando resumen monetario simulado.");
      setIngresos({
        total_vendido: 12450.00,
        ordenes_cobradas: 48,
        ticket_promedio: 250.00,
        ventas_detalle: MOCK_VENTAS_DETALLE
      });
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
        <View style={styles.ventaIconCont}>
          <Text style={styles.ventaIcon}>{item.metodo_pago === "EFECTIVO" ? "" : ""}</Text>
        </View>
        <View style={styles.ventaInfo}>
          <Text style={styles.ventaMesa}>
            Mesa {item.mesa_numero || item.orden_id} - {item.mesa_ubicacion || "Salón"}
          </Text>
          <Text style={styles.ventaFolio}>
            {formatHora(item.created_at)} • {item.metodo_pago}
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
          <TouchableOpacity style={[styles.toggleBtn, styles.toggleBtnActive]}>
            <Text style={[styles.toggleBtnText, styles.toggleBtnTextActive]}>Ingresos del día</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleBtn}>
            <Text style={styles.toggleBtnText}>Registros gastos</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollViewContainer>
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
      </ScrollViewContainer>
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
  ventaIconCont: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ventaIcon: {
    fontSize: 18,
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
});
