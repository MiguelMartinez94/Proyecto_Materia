import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";

const MOCK_INVENTARIO = [
  { id: 1, nombre: "Pan Hamb.", unidad_medida: "pzas", stock_actual: 0, stock_minimo: 10 },
  { id: 2, nombre: "Aguacate", unidad_medida: "pzas", stock_actual: 3, stock_minimo: 5 },
  { id: 3, nombre: "Carne Res 150g", unidad_medida: "pzas", stock_actual: 42, stock_minimo: 10 },
  { id: 4, nombre: "Queso Cheddar", unidad_medida: "kg", stock_actual: 15, stock_minimo: 2 },
  { id: 5, nombre: "Café de grano", unidad_medida: "kg", stock_actual: 5, stock_minimo: 1 },
];

export default function InventarioMenuScreen({ navigation }) {
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const fetchInventario = async () => {
    setLoading(true);
    try {
      const response = await api.get("/cocina/inventario");
      const dataFormatted = response.data.map(item => ({
        ...item,
        unidad_medida: item.unidad_medida === "pcs" ? "pzas" : item.unidad_medida
      }));
      setInventario(dataFormatted);
    } catch (error) {
      console.warn("Backend inalcanzable. Usando datos de inventario simulados.");
      setInventario(MOCK_INVENTARIO);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchInventario();
    });
    return unsubscribe;
  }, [navigation]);

  const modificarStockLocal = (id, delta) => {
    setInventario(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const nuevoStock = Math.max(0, item.stock_actual + delta);
          return { ...item, stock_actual: nuevoStock };
        }
        return item;
      });
    });
  };

  const setStockLocal = (id, value) => {
    setInventario(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const num = parseFloat(value);
          return { ...item, stock_actual: isNaN(num) ? 0 : num };
        }
        return item;
      });
    });
  };

  const filteredInventario = inventario.filter(item => 
    item.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  
  const advertencias = filteredInventario.filter(item => item.stock_actual <= item.stock_minimo);
  const regularItems = filteredInventario.filter(item => item.stock_actual > item.stock_minimo);

  const renderStockItem = ({ item }) => {
    const esBajo = item.stock_actual <= item.stock_minimo;
    const esAgotado = item.stock_actual === 0;

    let cardBg = COLORS.surface;
    let badgeText = "Normal";
    let badgeColor = COLORS.estadoLibre;

    if (esAgotado) {
      cardBg = "#FFEBEE"; 
      badgeText = "AGOTADO";
      badgeColor = COLORS.estadoOcupada;
    } else if (esBajo) {
      cardBg = "#FFF8E1"; 
      badgeText = "CRÍTICO";
      badgeColor = COLORS.estadoEnEspera;
    }

    return (
      <View style={[styles.itemCard, { backgroundColor: cardBg }]}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemNombre}>{item.nombre}</Text>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        </View>

        <View style={styles.stockControl}>
          <TouchableOpacity 
            style={styles.controlBtn}
            onPress={() => modificarStockLocal(item.id, -1)}
          >
            <Text style={styles.controlBtnText}>-</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.stockInput}
            keyboardType="numeric"
            value={String(item.stock_actual)}
            onChangeText={(text) => setStockLocal(item.id, text)}
          />
          <Text style={styles.unidadText}>{item.unidad_medida}</Text>
          <TouchableOpacity 
            style={styles.controlBtn}
            onPress={() => modificarStockLocal(item.id, 1)}
          >
            <Text style={styles.controlBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={FONTS.title}>Inventario de Cocina</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ingrediente..."
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <ScrollViewContainer>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <View>
            {advertencias.length > 0 && (
              <View>
                <Text style={styles.seccionTitulo}>ADVERTENCIAS DE STOCK BAJO</Text>
                <FlatList
                  data={advertencias}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderStockItem}
                  scrollEnabled={false}
                  contentContainerStyle={styles.listContent}
                />
              </View>
            )}

            <Text style={styles.seccionTitulo}> INGREDIENTES CLAVE</Text>
            <FlatList
              data={regularItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderStockItem}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No hay ingredientes en esta sección.</Text>
              }
            />
          </View>
        )}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.textDark,
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
    paddingBottom: 8,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "space-between",
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemNombre: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginRight: 10,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.white,
  },
  stockControl: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  controlBtnText: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: "bold",
  },
  stockVal: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 12,
    color: COLORS.textDark,
  },
  stockInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 8,
    width: 60,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  unidadText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginRight: 8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: COLORS.textLight,
  },
});
