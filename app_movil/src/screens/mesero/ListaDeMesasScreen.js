import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";
import CustomModal from "../../components/CustomModal";


const MOCK_MESAS = [
  { id: 1, numero: 4, ubicacion: "Terraza", estado: "EN_ESPERA" },
  { id: 2, numero: 2, ubicacion: "Interior", estado: "OCUPADA" },
  { id: 3, numero: 7, ubicacion: "Barra", estado: "LIBRE" },
  { id: 4, numero: 5, ubicacion: "Terraza", estado: "POR_COBRAR" },
  { id: 5, numero: 12, ubicacion: "Interior", estado: "OCUPADA" },
];

export default function ListaDeMesasScreen({ navigation }) {
  const [mesas, setMesas] = useState([]);
  const [filtroArea, setFiltroArea] = useState("TODAS");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMesaNum, setNewMesaNum] = useState(null);
  const [newMesaUbi, setNewMesaUbi] = useState(null);
  const [meseroName, setMeseroName] = useState("");
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customModalContent, setCustomModalContent] = useState({});

  useEffect(() => {
    const fetchName = async () => {
      const name = await AsyncStorage.getItem("userName");
      if (name) {
        setMeseroName(name);
        navigation.setOptions({
          headerLeft: () => (
            <Text style={{ marginLeft: 15, fontWeight: "bold", color: COLORS.textDark, fontSize: 16 }}>
              {name}
            </Text>
          ),
        });
      }
    };
    fetchName();
  }, [navigation]);

  const getAvailableNumbers = () => {
    const existing = mesas.map(m => m.numero);
    const available = [];
    for (let i = 1; i <= 30; i++) {
      if (!existing.includes(i)) available.push(i);
    }
    return available;
  };
  const availableNumbers = getAvailableNumbers();

  const handleCreateMesa = async () => {
    if (!newMesaNum || !newMesaUbi) {
      setCustomModalContent({
        title: "Atención",
        message: "Debes seleccionar un número y una ubicación",
        isSuccess: false,
        onClose: () => setCustomModalVisible(false)
      });
      setCustomModalVisible(true);
      return;
    }
    try {
      setLoading(true);
      await api.post("/mesero/mesas", {
        numero: newMesaNum,
        ubicacion: newMesaUbi,
        estado: "LIBRE"
      });
      setModalVisible(false);
      setNewMesaNum(null);
      setNewMesaUbi(null);
      
      setCustomModalContent({
        title: "¡Éxito!",
        message: "Mesa agregada correctamente.",
        isSuccess: true,
        onClose: () => {
          setCustomModalVisible(false);
          fetchMesas();
        }
      });
      setCustomModalVisible(true);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || "Error desconocido";
      setCustomModalContent({
        title: "Error al crear mesa",
        message: `Fallo: ${errorMsg}`,
        isSuccess: false,
        onClose: () => setCustomModalVisible(false)
      });
      setCustomModalVisible(true);
      setLoading(false);
    }
  };

  const fetchMesas = async () => {
    setLoading(true);
    try {
      const response = await api.get("/mesero/mesas");
      setMesas(response.data);
    } catch (error) {
      console.warn("Backend inalcanzable. Usando datos semilla simulados para mesas.");
      setMesas(MOCK_MESAS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchMesas();
    });
    return unsubscribe;
  }, [navigation]);

  const getEstadoColor = (estado) => {
    switch (estado.toUpperCase()) {
      case "LIBRE": return COLORS.estadoLibre;
      case "OCUPADA": return COLORS.estadoOcupada;
      case "EN_ESPERA": return COLORS.estadoEnEspera;
      case "POR_COBRAR": return COLORS.estadoPorCobrar;
      default: return COLORS.border;
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado.toUpperCase()) {
      case "LIBRE": return "Libre";
      case "OCUPADA": return "Pagada";
      case "EN_ESPERA": return "En Espera";
      case "POR_COBRAR": return "Por Cobrar";
      default: return estado;
    }
  };

  const getEstadoDescripcion = (estado) => {
    switch (estado.toUpperCase()) {
      case "LIBRE": return "Sin productos agregados";
      case "EN_ESPERA": return "Pendiente de enviar a caja";
      case "POR_COBRAR": return "Cuenta enviada a caja";
      case "OCUPADA": return "Ya fue cobrada";
      default: return "";
    }
  };

  
  const areas = ["TODAS", "INTERIOR", "BARRA", "TERRAZA"];
  const mesasFiltradas = filtroArea === "TODAS"
    ? mesas
    : mesas.filter(m => m.ubicacion.toUpperCase() === filtroArea);

  const handleMesaPress = (mesa) => {
    if (mesa.estado === "LIBRE") {
      
      navigation.navigate("MenuTab", { mesaId: mesa.id, mesaNumero: mesa.numero, mesaUbicacion: mesa.ubicacion });
    } else {
      
      navigation.navigate("DetalleOrden", { mesaId: mesa.id, mesaNumero: mesa.numero });
    }
  };

  const renderMesaItem = ({ item }) => {
    const colorEstado = getEstadoColor(item.estado);
    return (
      <TouchableOpacity 
        style={styles.mesaCard}
        onPress={() => handleMesaPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.mesaNumero}>Mesa {item.numero}</Text>
          <View style={[styles.estadoBadge, { backgroundColor: colorEstado }]}>
            <Text style={styles.estadoText}>{getEstadoTexto(item.estado)}</Text>
          </View>
        </View>
        <Text style={styles.mesaArea}>{item.ubicacion}</Text>
        <Text style={styles.mesaDescEstado}>{getEstadoDescripcion(item.estado)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          
          <Text style={FONTS.title}>Mesas</Text>
        </View>
        <TouchableOpacity style={styles.plusButton} activeOpacity={0.7} onPress={() => setModalVisible(true)}>
          <Text style={styles.plusButtonText}>+ Nueva Mesa</Text>
        </TouchableOpacity>
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
          data={mesasFiltradas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMesaItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay mesas disponibles en esta sección.</Text>
          }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Nueva Mesa</Text>

            <Text style={styles.modalSubtitle}>Número de Mesa (Disponibles):</Text>
            <View style={styles.selectorContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
                {availableNumbers.map(num => (
                  <TouchableOpacity 
                    key={num} 
                    style={[styles.selectorItem, newMesaNum === num && styles.selectorItemActive]}
                    onPress={() => setNewMesaNum(num)}
                  >
                    <Text style={[styles.selectorItemText, newMesaNum === num && styles.selectorItemTextActive]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.modalSubtitle}>Ubicación:</Text>
            <View style={styles.selectorUbicacionContainer}>
              {["INTERIOR", "BARRA", "TERRAZA"].map(ubi => (
                <TouchableOpacity 
                  key={ubi} 
                  style={[styles.selectorUbiItem, newMesaUbi === ubi && styles.selectorUbiItemActive]}
                  onPress={() => setNewMesaUbi(ubi)}
                >
                  <Text style={[styles.selectorUbiText, newMesaUbi === ubi && styles.selectorUbiTextActive]}>{ubi}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSubmit} onPress={handleCreateMesa}>
                <Text style={styles.modalBtnTextSubmit}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomModal 
        visible={customModalVisible}
        onClose={customModalContent.onClose}
        title={customModalContent.title}
        message={customModalContent.message}
        isSuccess={customModalContent.isSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  meseroText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  plusButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  plusButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
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
  mesaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mesaNumero: {
    fontSize: 28,
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
    fontSize: 12,
    fontWeight: "bold",
  },
  mesaArea: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  mesaDescEstado: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: "italic",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.textLight,
  },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center"
  },
  modalContent: {
    backgroundColor: COLORS.surface, width: "80%", padding: 20, borderRadius: 16
  },
  modalTitle: {
    fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center", color: COLORS.textDark
  },
  modalSubtitle: {
    fontSize: 14, fontWeight: "bold", color: COLORS.textLight, marginBottom: 8, marginTop: 10
  },
  selectorContainer: {
    height: 50, marginBottom: 15, width: "100%"
  },
  selectorScroll: {
    alignItems: "center",
    flexDirection: "row",
    paddingRight: 20
  },
  selectorItem: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center", marginRight: 10, borderWidth: 1, borderColor: COLORS.border
  },
  selectorItemActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary
  },
  selectorItemText: {
    color: COLORS.textDark, fontWeight: "bold"
  },
  selectorItemTextActive: {
    color: COLORS.white
  },
  selectorUbicacionContainer: {
    flexDirection: "row", justifyContent: "space-between", marginBottom: 20
  },
  selectorUbiItem: {
    flex: 1, paddingVertical: 10, backgroundColor: COLORS.background, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", marginHorizontal: 4
  },
  selectorUbiItemActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary
  },
  selectorUbiText: {
    fontSize: 12, color: COLORS.textDark, fontWeight: "bold"
  },
  selectorUbiTextActive: {
    color: COLORS.white
  },
  modalButtons: {
    flexDirection: "row", justifyContent: "space-between"
  },
  modalBtnCancel: {
    flex: 1, padding: 10, alignItems: "center", borderRadius: 8, backgroundColor: COLORS.border, marginRight: 5
  },
  modalBtnSubmit: {
    flex: 1, padding: 10, alignItems: "center", borderRadius: 8, backgroundColor: COLORS.primary, marginLeft: 5
  },
  modalBtnTextCancel: { color: COLORS.textDark, fontWeight: "bold" },
  modalBtnTextSubmit: { color: COLORS.white, fontWeight: "bold" },
});
