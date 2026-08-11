from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict




class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)




class IngredienteBase(BaseSchema):
    nombre: str
    unidad_medida: str
    stock_actual: float = Field(..., ge=0)
    stock_minimo: float = Field(..., ge=0)

class IngredienteOut(IngredienteBase):
    id: int

class IngredienteCreate(IngredienteBase):
    pass

class IngredienteUpdate(BaseSchema):
    nombre: Optional[str] = None
    unidad_medida: Optional[str] = None
    stock_actual: Optional[float] = Field(None, ge=0)
    stock_minimo: Optional[float] = Field(None, ge=0)

class IngredienteUpdateStock(BaseSchema):
    stock_actual: float = Field(..., ge=0)

class InventarioBulkUpdateItem(BaseSchema):
    id: int
    stock_actual: float = Field(..., ge=0)

class InventarioBulkUpdate(BaseSchema):
    items: List[InventarioBulkUpdateItem]




class ProductoIngredienteBase(BaseSchema):
    ingrediente_id: int
    cantidad_requerida: float = Field(..., gt=0)

class ProductoIngredienteOut(ProductoIngredienteBase):
    ingrediente: Optional[IngredienteOut] = None




class RoleBase(BaseSchema):
    nombre: str

class RoleOut(RoleBase):
    id: int

class UsuarioBase(BaseSchema):
    nombre: str
    username: str
    rol_id: int
    activo: bool = True

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioOut(UsuarioBase):
    id: int
    created_at: datetime
    rol: RoleOut




class MesaBase(BaseSchema):
    numero: int
    ubicacion: str
    estado: str = "LIBRE"

class MesaCreate(MesaBase):
    pass

class MesaOut(MesaBase):
    id: int




class CategoriaMenuBase(BaseSchema):
    nombre: str

class CategoriaMenuCreate(CategoriaMenuBase):
    pass

class CategoriaMenuOut(CategoriaMenuBase):
    id: int




class ProductoBase(BaseSchema):
    categoria_id: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None
    precio: float = Field(..., ge=0)
    disponible: bool = True
    imagen_url: Optional[str] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseSchema):
    categoria_id: Optional[int] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(None, ge=0)
    disponible: Optional[bool] = None
    imagen_url: Optional[str] = None

class ProductoOut(ProductoBase):
    id: int
    categoria: Optional[CategoriaMenuOut] = None

class ProductoConIngredientes(ProductoOut):
    ingredientes_req: List[ProductoIngredienteOut] = []




class DetalleOrdenBase(BaseSchema):
    producto_id: int
    cantidad: int = Field(..., gt=0)
    observaciones: Optional[str] = None

class DetalleOrdenCreate(DetalleOrdenBase):
    pass

class DetalleOrdenOut(BaseSchema):
    id: int
    orden_id: int
    producto: ProductoOut
    cantidad: int
    precio_unitario: float
    observaciones: Optional[str] = None
    estado: str

class DetalleOrdenUpdateEstado(BaseSchema):
    estado: str = Field(..., pattern="^(EN_ESPERA|EN_PREPARACION|LISTA)$")




class OrdenBase(BaseSchema):
    mesa_id: int
    mesero_id: int

class OrdenCreate(OrdenBase):
    items: List[DetalleOrdenCreate] = []

class OrdenOut(BaseSchema):
    id: int
    mesa: MesaOut
    mesero: UsuarioOut
    estado: str
    subtotal: float
    impuestos: float
    total: float
    created_at: datetime
    items: List[DetalleOrdenOut] = []

class OrdenResumen(BaseSchema):
    id: int
    mesa_id: int
    mesa: MesaOut
    mesero_nombre: str
    estado: str
    total: float
    created_at: datetime
    items_count: int

class OrdenUpdateEstado(BaseSchema):
    estado: str = Field(..., pattern="^(EN_ESPERA|EN_PREPARACION|LISTA|ENTREGADA|PAGADA)$")




class PagoRequest(BaseSchema):
    metodo_pago: str = Field(..., pattern="^(EFECTIVO|TARJETA)$")
    monto_recibido: float = Field(..., ge=0)

class VentaOut(BaseSchema):
    id: int
    orden_id: int
    metodo_pago: str
    monto_recibido: float
    cambio: float
    total_pagado: float
    ticket_folio: str
    created_at: datetime

class PagoResponse(BaseSchema):
    exitoso: bool
    venta: VentaOut
    cambio: float
    mensaje: str

class IngresosDiariosOut(BaseSchema):
    total_vendido: float
    ordenes_cobradas: int
    ticket_promedio: float
    ventas_detalle: List[VentaOut] = []




class ConfiguracionNegocioBase(BaseSchema):
    nombre_negocio: str
    mensaje_ticket: str
    impuesto_porcentaje: float = Field(..., ge=0)
    moneda: str

class ConfiguracionNegocioOut(ConfiguracionNegocioBase):
    id: int

class ConfiguracionNegocioUpdate(BaseSchema):
    nombre_negocio: Optional[str] = None
    mensaje_ticket: Optional[str] = None
    impuesto_porcentaje: Optional[float] = Field(None, ge=0)
    moneda: Optional[str] = None

class GastoBase(BaseSchema):
    descripcion: str
    monto: float = Field(..., ge=0)

class GastoCreate(GastoBase):
    pass

class GastoOut(GastoBase):
    id: int
    created_at: datetime
