import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import api from "../../services/api";
import { COLORS, FONTS } from "../../theme";

const MOCK_PRODUCTOS = [
  { id: 1, categoria_id: 2, nombre: "Café Expresso", descripcion: "Café concentrado con cuerpo e intensidad.", precio: 35.0, disponible: true },
  { id: 2, categoria_id: 1, nombre: "Bagel de Salmón", descripcion: "Bagel tostado con queso crema y salmón.", precio: 120.0, disponible: true },
  { id: 3, categoria_id: 1, nombre: "Croissant", descripcion: "Croissant clásico de mantequilla horneado hoy.", precio: 45.0, disponible: true },
  { id: 4, categoria_id: 2, nombre: "Americano", descripcion: "Café expresso diluido con agua.", precio: 35.0, disponible: true },
  { id: 5, categoria_id: 2, nombre: "Jugo Naranja", descripcion: "Exprimido natural de temporada.", precio: 80.0, disponible: true },
];

export default function CatalogoMenuScreen({ route, navigation }) {
  
  const { mesaId, mesaNumero, mesaUbicacion, ordenId } = route.params || {};

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("TODOS");
  
  
  const [carrito, setCarrito] = useState([]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await api.get("/mesero/menu");
      setProductos(response.data);
    } catch (error) {
      console.warn("Backend inalcanzable. Usando catálogo semilla para pruebas.");
      setProductos(MOCK_PRODUCTOS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  
  useEffect(() => {
    setCarrito([]);
  }, [mesaId]);

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const itemExistente = prev.find(item => item.producto.id === producto.id);
      if (itemExistente) {
        return prev.map(item => 
          item.producto.id === producto.id 
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { producto, cantidad: 1, observaciones: "" }];
    });
  };

  const quitarDelCarrito = (producto) => {
    setCarrito(prev => {
      const itemExistente = prev.find(item => item.producto.id === producto.id);
      if (!itemExistente) return prev;
      if (itemExistente.cantidad === 1) {
        return prev.filter(item => item.producto.id !== producto.id);
      }
      return prev.map(item => 
        item.producto.id === producto.id 
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      );
    });
  };

  
  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                             (p.descripcion && p.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
    
    let coincideCategoria = true;
    if (categoriaSel !== "TODOS") {
      const catId = categoriaSel === "ALIMENTOS" ? 1 : (categoriaSel === "BEBIDAS" ? 2 : 3);
      coincideCategoria = p.categoria_id === catId;
    }
    
    return coincideBusqueda && coincideCategoria;
  });

  const cantidadTotal = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  const renderProductoItem = ({ item }) => {
    const itemCarrito = carrito.find(c => c.producto.id === item.id);
    const cantidadEnCarrito = itemCarrito ? itemCarrito.cantidad : 0;

    return (
      <View style={styles.productoCard}>
        <View style={styles.productoInfo}>
          <Text style={styles.productoNombre}>{item.nombre}</Text>
          <Text style={styles.productoDesc} numberOfLines={2}>{item.descripcion}</Text>
          <Text style={styles.productoPrecio}>${item.precio.toFixed(2)}</Text>
        </View>
        
        <View style={styles.accionesContainer}>
          {cantidadEnCarrito > 0 && (
            <>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => quitarDelCarrito(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>-</Text>
              </TouchableOpacity>
              <View style={styles.cantidadBadge}>
                <Text style={styles.cantidadText}>{cantidadEnCarrito}</Text>
              </View>
            </>
          )}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => agregarAlCarrito(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.header}>
        <Text style={styles.mesaTitle}>
          {mesaNumero ? `Mesa ${mesaNumero} - ${mesaUbicacion}` : "Menú"}
        </Text>
        {!mesaNumero && (
          <Text style={styles.alertaMesa}>Selecciona una mesa libre primero para abrir una orden</Text>
        )}
      </View>


      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar alimentos o bebidas..."
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>


      <View style={styles.categoryContainer}>
        {["TODOS", "ALIMENTOS", "BEBIDAS", "POSTRES"].map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryTab, categoriaSel === cat && styles.categoryTabActive]}
            onPress={() => setCategoriaSel(cat)}
          >
            <Text style={[styles.categoryTabText, categoriaSel === cat && styles.categoryTabTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductoItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron productos coincidentes.</Text>
          }
        />
      )}


      {carrito.length > 0 && (
        <TouchableOpacity
          style={styles.floatingSheet}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("ResumenPedido", {
            carrito,
            mesaId,
            mesaNumero,
            mesaUbicacion,
            ordenId
          })}
        >
          <Text style={styles.floatingText}>Ver resumen del pedido</Text>
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>{cantidadTotal} prod</Text>
          </View>
        </TouchableOpacity>
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
  mesaTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  alertaMesa: {
    fontSize: 12,
    color: COLORS.estadoOcupada,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.textDark,
  },
  categoryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 8,
    justifyContent: "space-between",
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.accentLight,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  categoryTabText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "bold",
  },
  categoryTabTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 80, 
  },
  productoCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  productoDesc: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
    paddingRight: 8,
  },
  productoPrecio: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 4,
  },
  accionesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cantidadBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  cantidadText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  actionButtonText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.textLight,
  },
  floatingSheet: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  floatingText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 15,
  },
  floatingBadge: {
    backgroundColor: COLORS.accent,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  floatingBadgeText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
  },
});
