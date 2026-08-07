import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, Platform } from "react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS } from "../../theme";

export default function ConfirmacionPagoScreen({ route, navigation }) {
  const { venta, cambio, montoRecibido } = route.params || {
    venta: {
      total_pagado: 0.00,
      metodo_pago: "EFECTIVO",
      ticket_folio: "TKT-TEMP-00000",
      created_at: new Date().toISOString()
    },
    cambio: 0.00,
    montoRecibido: 0.00
  };

  const handlePrint = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: monospace; padding: 20px; width: 300px; margin: 0 auto; color: black; }
              .center { text-align: center; }
              .divider { border-bottom: 1px dashed black; margin: 10px 0; }
              .row { display: flex; justify-content: space-between; margin: 5px 0; }
              .bold { font-weight: bold; }
              .big { font-size: 20px; }
            </style>
          </head>
          <body>
            <div class="center bold big">Coffee Code</div>
            <div class="center">Querétaro, Qro.</div>
            <div class="divider"></div>
            <div class="row"><span>Folio:</span><span class="bold">${venta.ticket_folio}</span></div>
            <div class="row"><span>Fecha:</span><span>${formatFecha(venta.created_at)}</span></div>
            <div class="row"><span>Método:</span><span>${venta.metodo_pago}</span></div>
            <div class="divider"></div>
            <div class="center">*** COMPROBANTE DE PAGO ***</div>
            <div class="divider"></div>
            <div class="row bold big"><span>TOTAL</span><span>$${venta.total_pagado.toFixed(2)}</span></div>
            <div class="row"><span>Recibido</span><span>$${montoRecibido.toFixed(2)}</span></div>
            <div class="row"><span>Cambio</span><span>$${cambio.toFixed(2)}</span></div>
            <div class="divider"></div>
            <div class="center bold">¡Gracias por tu preferencia!</div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html: htmlContent });
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } else {
          Alert.alert("Ticket PDF", "El archivo PDF se ha generado correctamente pero no se puede compartir en este dispositivo.");
        }
      }
    } catch (error) {
      console.warn("Error al imprimir:", error);
      Alert.alert("Error", "No se pudo generar el documento PDF.");
    }
  };

  const formatFecha = (isoString) => {
    try {
      let safeIso = isoString;
      if (!safeIso.endsWith('Z')) safeIso += 'Z';
      const d = new Date(safeIso);
      return d.toLocaleString("es-MX", { hour12: true });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.exitoHeader}>

          <Text style={styles.exitoTitle}>Pago exitoso</Text>
          <Text style={styles.exitoSub}>
            {venta.metodo_pago} | ${venta.total_pagado.toFixed(2)}
          </Text>
        </View>


        <View style={styles.ticketCard}>
          <Text style={styles.ticketCafeName}>Coffee Code</Text>
          <Text style={styles.ticketCafeAddress}>Querétaro, Qro.</Text>
          
          <View style={styles.ticketMetaRow}>
            <Text style={styles.ticketMetaLabel}>Folio:</Text>
            <Text style={styles.ticketMetaVal}>{venta.ticket_folio}</Text>
          </View>
          <View style={styles.ticketMetaRow}>
            <Text style={styles.ticketMetaLabel}>Fecha:</Text>
            <Text style={styles.ticketMetaVal}>{formatFecha(venta.created_at)}</Text>
          </View>

          <View style={styles.dividerDashed} />




          <View style={styles.ticketTotalRow}>
            <Text style={styles.ticketTotalLabel}>TOTAL</Text>
            <Text style={styles.ticketTotalVal}>${venta.total_pagado.toFixed(2)}</Text>
          </View>
          
          <View style={styles.ticketSubRow}>
            <Text style={styles.ticketSubLabel}>Recibido</Text>
            <Text style={styles.ticketSubVal}>${montoRecibido.toFixed(2)}</Text>
          </View>
          <View style={styles.ticketSubRow}>
            <Text style={styles.ticketSubLabel}>Cambio</Text>
            <Text style={styles.ticketSubVal}>${cambio.toFixed(2)}</Text>
          </View>

          <View style={styles.ticketFooterContainer}>
            <Text style={styles.ticketFooterText}>¡Gracias por tu visita!</Text>
          </View>
        </View>


        <View style={styles.accionesContainer}>
          <TouchableOpacity 
            style={styles.finalizarBtn}
            onPress={() => navigation.navigate("CajaMain", { screen: "ColaTab" })}
            activeOpacity={0.8}
          >
            <Text style={styles.finalizarBtnText}>Finalizar y volver</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.imprimirBtn}
            onPress={handlePrint}
          >
            <Text style={styles.imprimirBtnText}>Imprimir ticket</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    alignItems: "center",
  },
  exitoHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.estadoLibre,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: "bold",
  },
  exitoTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  exitoSub: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
    fontWeight: "600",
  },
  ticketCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  ticketCafeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textDark,
    textAlign: "center",
  },
  ticketCafeAddress: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 16,
  },
  ticketMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ticketMetaLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  ticketMetaVal: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: "600",
  },
  dividerDashed: {
    height: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginVertical: 14,
  },
  itemsAviso: {
    fontSize: 12,
    fontStyle: "italic",
    color: COLORS.textLight,
    textAlign: "center",
  },
  ticketTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ticketTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  ticketTotalVal: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  ticketSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ticketSubLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  ticketSubVal: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: "600",
  },
  ticketFooterContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ticketFooterText: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  accionesContainer: {
    width: "100%",
  },
  finalizarBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  finalizarBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  imprimirBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  imprimirBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
});
