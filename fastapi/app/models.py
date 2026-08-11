from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Table, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from .database import Base


class ProductoIngrediente(Base):
    __tablename__ = "producto_ingredientes"
    
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"), primary_key=True)
    ingrediente_id = Column(Integer, ForeignKey("ingredientes.id", ondelete="CASCADE"), primary_key=True)
    cantidad_requerida = Column(Float, nullable=False)
    
    
    producto = relationship("Producto", back_populates="ingredientes_req")
    ingrediente = relationship("Ingrediente")


class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)
    
    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    username = Column(String(50), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    rol = relationship("Role", back_populates="usuarios")
    ordenes = relationship("Orden", back_populates="mesero")


class Mesa(Base):
    __tablename__ = "mesas"
    
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(Integer, nullable=False, unique=True)
    ubicacion = Column(String(100), nullable=False)
    estado = Column(
        String(20), 
        default="LIBRE", 
        nullable=False
    )
    
    ordenes = relationship("Orden", back_populates="mesa")


class CategoriaMenu(Base):
    __tablename__ = "categorias_menu"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    
    productos = relationship("Producto", back_populates="categoria")


class Producto(Base):
    __tablename__ = "productos"
    
    id = Column(Integer, primary_key=True, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias_menu.id", ondelete="SET NULL"), nullable=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(String, nullable=True)
    precio = Column(Float, nullable=False)
    disponible = Column(Boolean, default=True, nullable=False)
    imagen_url = Column(String, nullable=True)
    
    categoria = relationship("CategoriaMenu", back_populates="productos")
    
    ingredientes_req = relationship("ProductoIngrediente", back_populates="producto", cascade="all, delete-orphan")


class Orden(Base):
    __tablename__ = "ordenes"
    
    id = Column(Integer, primary_key=True, index=True)
    mesa_id = Column(Integer, ForeignKey("mesas.id", ondelete="CASCADE"), nullable=False)
    mesero_id = Column(Integer, ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=False)
    estado = Column(
        String(20), 
        default="EN_ESPERA", 
        nullable=False
    )
    subtotal = Column(Float, default=0.0, nullable=False)
    impuestos = Column(Float, default=0.0, nullable=False)
    total = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    mesa = relationship("Mesa", back_populates="ordenes")
    mesero = relationship("Usuario", back_populates="ordenes")
    items = relationship("DetalleOrden", back_populates="orden", cascade="all, delete-orphan")
    ventas = relationship("Venta", back_populates="orden")


class DetalleOrden(Base):
    __tablename__ = "detalle_orden"
    
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="RESTRICT"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)
    observaciones = Column(String, nullable=True)
    estado = Column(
        String(20), 
        default="EN_ESPERA", 
        nullable=False
    )
    
    orden = relationship("Orden", back_populates="items")
    producto = relationship("Producto")


class Ingrediente(Base):
    __tablename__ = "ingredientes"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    unidad_medida = Column(String(20), nullable=False)
    stock_actual = Column(Float, default=0.0, nullable=False)
    stock_minimo = Column(Float, default=0.0, nullable=False)


class Venta(Base):
    __tablename__ = "ventas"
    
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes.id", ondelete="RESTRICT"), nullable=False)
    metodo_pago = Column(
        String(20), 
        nullable=False
    )
    monto_recibido = Column(Float, nullable=False)
    cambio = Column(Float, nullable=False)
    total_pagado = Column(Float, nullable=False)
    ticket_folio = Column(String(50), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    orden = relationship("Orden", back_populates="ventas")

class ConfiguracionNegocio(Base):
    __tablename__ = "configuracion_negocio"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre_negocio = Column(String(150), default="Mi Cafetería", nullable=False)
    mensaje_ticket = Column(String(255), default="¡Gracias por su preferencia!", nullable=False)
    impuesto_porcentaje = Column(Float, default=16.0, nullable=False)
    moneda = Column(String(10), default="MXN", nullable=False)


class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String(255), nullable=False)
    monto = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
