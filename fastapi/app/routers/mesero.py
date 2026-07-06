from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Mesa, Producto, CategoriaMenu, Orden, DetalleOrden, Usuario
from ..schemas import MesaOut, ProductoOut, OrdenOut, OrdenCreate, DetalleOrdenCreate, OrdenResumen
from ..services.payment_service import calcular_totales_orden
from .auth import require_roles

router = APIRouter(
    prefix="/mesero", 
    tags=["Mesero"],
    dependencies=[Depends(require_roles(["MESERO", "ADMINISTRADOR"]))]
)

@router.get("/mesas", response_model=List[MesaOut])
def listar_mesas(estado: Optional[str] = None, db: Session = Depends(get_db)):
    
    query = db.query(Mesa)
    if estado:
        query = query.filter(Mesa.estado == estado.upper())
    return query.order_by(Mesa.numero).all()

@router.get("/menu", response_model=List[ProductoOut])
def obtener_menu(db: Session = Depends(get_db)):
    
    return db.query(Producto).filter(Producto.disponible == True).all()

@router.post("/ordenes", response_model=OrdenOut)
def crear_orden(orden_data: OrdenCreate, db: Session = Depends(get_db)):
    
    
    mesa = db.query(Mesa).filter(Mesa.id == orden_data.mesa_id).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
        
    
    mesero = db.query(Usuario).filter(Usuario.id == orden_data.mesero_id).first()
    if not mesero:
        raise HTTPException(status_code=404, detail="Mesero no encontrado")

    
    nueva_orden = Orden(
        mesa_id=orden_data.mesa_id,
        mesero_id=orden_data.mesero_id,
        estado="EN_ESPERA",
        subtotal=0.0,
        impuestos=0.0,
        total=0.0
    )
    db.add(nueva_orden)
    db.flush() 

    
    for item in orden_data.items:
        producto = db.query(Producto).filter(Producto.id == item.producto_id).first()
        if not producto:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Producto con ID {item.producto_id} no encontrado")
            
        detalle = DetalleOrden(
            orden_id=nueva_orden.id,
            producto_id=producto.id,
            cantidad=item.cantidad,
            precio_unitario=producto.precio,
            observaciones=item.observaciones,
            estado="EN_ESPERA"
        )
        db.add(detalle)
    
    
    db.flush()
    calcular_totales_orden(nueva_orden)
    
    
    mesa.estado = "EN_ESPERA"
    
    db.commit()
    db.refresh(nueva_orden)
    return nueva_orden

@router.post("/ordenes/{id}/items", response_model=OrdenOut)
def agregar_items_orden(id: int, items: List[DetalleOrdenCreate], db: Session = Depends(get_db)):
    
    orden = db.query(Orden).filter(Orden.id == id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
        
    if orden.estado == "PAGADA":
        raise HTTPException(status_code=400, detail="No se pueden añadir productos a una orden ya cobrada")

    for item in items:
        producto = db.query(Producto).filter(Producto.id == item.producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto con ID {item.producto_id} no encontrado")
            
        
        detalle_existente = db.query(DetalleOrden).filter(
            DetalleOrden.orden_id == orden.id,
            DetalleOrden.producto_id == producto.id,
            DetalleOrden.observaciones == item.observaciones,
            DetalleOrden.estado == "EN_ESPERA" 
        ).first()
        
        if detalle_existente:
            detalle_existente.cantidad += item.cantidad
        else:
            nuevo_detalle = DetalleOrden(
                orden_id=orden.id,
                producto_id=producto.id,
                cantidad=item.cantidad,
                precio_unitario=producto.precio,
                observaciones=item.observaciones,
                estado="EN_ESPERA"
            )
            db.add(nuevo_detalle)
            
    db.flush()
    calcular_totales_orden(orden)
    db.commit()
    db.refresh(orden)
    return orden

@router.get("/ordenes/activas", response_model=List[OrdenResumen])
def listar_ordenes_activas(db: Session = Depends(get_db)):
    
    ordenes_activas = db.query(Orden).filter(Orden.estado != "PAGADA").order_by(Orden.created_at.desc()).all()
    
    resumenes = []
    for o in ordenes_activas:
        items_count = sum(item.cantidad for item in o.items)
        resumenes.append(OrdenResumen(
            id=o.id,
            mesa_id=o.mesa_id,
            mesa=o.mesa,
            mesero_nombre=o.mesero.nombre,
            estado=o.estado,
            total=o.total,
            created_at=o.created_at,
            items_count=items_count
        ))
    return resumenes

@router.get("/ordenes/{id}", response_model=OrdenOut)
def detalle_orden(id: int, db: Session = Depends(get_db)):
    
    orden = db.query(Orden).filter(Orden.id == id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return orden
