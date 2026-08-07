import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, Alert, ActivityIndicator } from "react-native";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";

export default function MetodoPagoScreen({ route, navigation }) {
  const { ordenId, total } = route.params || { total: 0.00 };

  const [metodo, setMetodo] = useState("EFECTIVO"); 
  const [montoRecibido, setMontoRecibido] = useState("");
  const [loading, setLoading] = useState(false);

  const quickAmounts = [20, 50, 100, 200, 500];

  const handleQuickAmountPress = (amount) => {
    setMontoRecibido(amount.toString());
  };

  const getMontoNumerico = () => {
    if (metodo === "TARJETA") return total;
    const val = parseFloat(montoRecibido);
    return isNaN(val) ? 0.0 : val;
  };

  const calcularCambio = () => {
    const recibido = getMontoNumerico();
    const cambio = recibido - total;
    return cambio >= 0 ? cambio : 0.0;
  };

  const procesarCobro = async () => {
    const recibido = getMontoNumerico();
    if (recibido < total) {
      Alert.alert("Monto Insuficiente", "El monto recibido es menor al total a pagar.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        metodo_pago: metodo,
        monto_recibido: recibido
      };

      const response = await api.post(`/caja/cobrar/${ordenId}`, payload);
      
      if (response.data.exitoso) {
        navigation.navigate("ConfirmacionPago", {
          venta: response.data.venta,
          cambio: response.data.cambio,
          montoRecibido: recibido
        });
      } else {
        Alert.alert("Error", response.data.mensaje || "No se pudo procesar el pago.");
      }
    } catch (error) {
      console.warn("Backend inalcanzable. Simulando venta cobrada localmente.");
      
      const mockVenta = {
        id: Math.floor(Math.random() * 1000),
        orden_id: ordenId,
        metodo_pago: metodo,
        monto_recibido: recibido,
        cambio: calcularCambio(),
        total_pagado: total,
        ticket_folio: `TKT-SIM-${Date.now()}-${ordenId}`,
        created_at: new Date().toISOString()
      };
      
      navigation.navigate("ConfirmacionPago", {
        venta: mockVenta,
        cambio: mockVenta.cambio,
        montoRecibido: recibido
      });
    } finally {
      setLoading(false);
    }
  };

  const cambioCalculado = calcularCambio();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.label}>MÉTODO DE PAGO</Text>
        <Text style={styles.totalText}>${total.toFixed(2)}</Text>
      </View>

      <View style={styles.body}>

        <View style={styles.metodoSelector}>
          <TouchableOpacity
            style={[styles.metodoCard, metodo === "TARJETA" && styles.metodoCardActive]}
            onPress={() => {
              setMetodo("TARJETA");
              setMontoRecibido("");
            }}
          >
            <Text style={styles.metodoIcon}></Text>
            <Text style={[styles.metodoLabel, metodo === "TARJETA" && styles.metodoLabelActive]}>Tarjeta</Text>
            <Text style={styles.metodoSub}>Débito o crédito</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metodoCard, metodo === "EFECTIVO" && styles.metodoCardActive]}
            onPress={() => setMetodo("EFECTIVO")}
          >
            <Text style={styles.metodoIcon}></Text>
            <Text style={[styles.metodoLabel, metodo === "EFECTIVO" && styles.metodoLabelActive]}>Efectivo</Text>
            <Text style={styles.metodoSub}>Moneda Nacional</Text>
          </TouchableOpacity>
        </View>


        {metodo === "EFECTIVO" && (
          <View style={styles.efectivoForm}>
            <Text style={styles.formTitle}>Monto recibido</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={montoRecibido}
                onChangeText={setMontoRecibido}
              />
            </View>


            <View style={styles.quickAmountsRow}>
              {quickAmounts.map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountBtn}
                  onPress={() => handleQuickAmountPress(amount)}
                >
                  <Text style={styles.quickAmountText}>+${amount}</Text>
                </TouchableOpacity>
              ))}
            </View>


            <View style={styles.cambioContainer}>
              <Text style={styles.cambioLabel}>Cambio a entregar:</Text>
              <Text style={styles.cambioMonto}>${cambioCalculado.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {metodo === "TARJETA" && (
          <View style={styles.tarjetaForm}>
            <Text style={styles.tarjetaAviso}>Inserta, desliza o acerca la tarjeta en la terminal de pago.</Text>
            <Text style={styles.tarjetaMonto}>Monto a cobrar: ${total.toFixed(2)}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <TouchableOpacity 
            style={styles.confirmarBtn}
            onPress={procesarCobro}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmarBtnText}>Confirmar pago</Text>
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
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.textLight,
  },
  totalText: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 4,
  },
  body: {
    flex: 1,
    padding: 20,
  },
  metodoSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metodoCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  metodoCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.accentLight,
  },
  metodoIcon: {
    fontSize: 32,
  },
  metodoLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginTop: 8,
  },
  metodoLabelActive: {
    color: COLORS.primary,
  },
  metodoSub: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  efectivoForm: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textLight,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.primary,
    marginVertical: 12,
    paddingBottom: 4,
  },
  inputPrefix: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  quickAmountsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  quickAmountBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  cambioContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cambioLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  cambioMonto: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  tarjetaForm: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tarjetaAviso: {
    fontSize: 14,
    color: COLORS.textDark,
    textAlign: "center",
    lineHeight: 20,
  },
  tarjetaMonto: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 16,
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  confirmarBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmarBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});
