from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db, is_sqlite
from ..models import Orden, DetalleOrden, Ingrediente, Mesa
from ..schemas import OrdenOut, DetalleOrdenOut, DetalleOrdenUpdateEstado, OrdenUpdateEstado, IngredienteOut
from ..services.inventory_service import descontar_inventario
from ..services.websocket_manager import manager
from .auth import require_roles

router = APIRouter(
    prefix="/cocina", 
    tags=["Cocina"]
)

@router.get("/comandas", response_model=List[OrdenOut])
def obtener_comandas(db: Session = Depends(get_db)):
    
    return db.query(Orden).filter(
        Orden.estado.in_(["EN_ESPERA", "EN_PREPARACION", "LISTA"])
    ).order_by(Orden.created_at.asc()).all()

@router.patch("/orden/{id}/estado", response_model=OrdenOut)
def actualizar_estado_orden(id: int, payload: OrdenUpdateEstado, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    
    orden = db.query(Orden).filter(Orden.id == id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
        
    nuevo_estado = payload.estado.upper()
    anterior_estado = orden.estado
    
    
    if nuevo_estado == "EN_PREPARACION" and anterior_estado == "EN_ESPERA":
        
        for item in orden.items:
            if item.estado == "EN_ESPERA":
                
                if is_sqlite:
                    try:
                        descontar_inventario(db, item.producto_id, item.cantidad)
                    except ValueError as e:
                        db.rollback()
                        raise HTTPException(status_code=400, detail=str(e))
                
                item.estado = "EN_PREPARACION"
                
    elif nuevo_estado == "LISTA":
        
        for item in orden.items:
            if item.estado in ["EN_ESPERA", "EN_PREPARACION"]:
                
                if item.estado == "EN_ESPERA" and is_sqlite:
                    try:
                        descontar_inventario(db, item.producto_id, item.cantidad)
                    except ValueError as e:
                        db.rollback()
                        raise HTTPException(status_code=400, detail=str(e))
                item.estado = "LISTA"
                
        
        mesa = db.query(Mesa).filter(Mesa.id == orden.mesa_id).first()
        if mesa:
            mesa.estado = "POR_COBRAR"

    orden.estado = nuevo_estado
    db.commit()
    db.refresh(orden)

    if nuevo_estado == "EN_PREPARACION":
        background_tasks.add_task(
            manager.broadcast,
            {
                "type": "ORDEN_PREPARACION",
                "title": "Orden en Preparación",
                "message": f"Mesa {orden.mesa.numero} está en preparación",
                "time": "Justo ahora"
            },
            "MESERO"
        )
    elif nuevo_estado == "LISTA":
        background_tasks.add_task(
            manager.broadcast,
            {
                "type": "ORDEN_LISTA",
                "title": "Orden Lista",
                "message": f"Mesa {orden.mesa.numero} está lista para entregar",
                "time": "Justo ahora"
            },
            "MESERO"
        )
        if mesa:
            background_tasks.add_task(
                manager.broadcast,
                {
                    "type": "CUENTA_POR_COBRAR",
                    "title": "Nueva Cuenta",
                    "message": f"Mesa {mesa.numero} pasó a estado Por Cobrar",
                    "time": "Justo ahora"
                },
                "CAJERO"
            )
    elif nuevo_estado == "ENTREGADA":
        background_tasks.add_task(
            manager.broadcast,
            {
                "type": "ORDEN_ENTREGADA",
                "title": "Orden Entregada",
                "message": f"Mesa {orden.mesa.numero} ha sido entregada",
                "time": "Justo ahora"
            },
            "MESERO"
        )

    return orden

@router.patch("/item/{id}/estado", response_model=DetalleOrdenOut)
def actualizar_estado_item(id: int, payload: DetalleOrdenUpdateEstado, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    
    item = db.query(DetalleOrden).filter(DetalleOrden.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Detalle de orden no encontrado")
        
    nuevo_estado = payload.estado.upper()
    anterior_estado = item.estado
    
    if nuevo_estado == "EN_PREPARACION" and anterior_estado == "EN_ESPERA":
        if is_sqlite:
            try:
                descontar_inventario(db, item.producto_id, item.cantidad)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
                
    item.estado = nuevo_estado
    
    
    orden = item.orden
    todos_items = orden.items
    
    if nuevo_estado == "EN_PREPARACION" and orden.estado == "EN_ESPERA":
        orden.estado = "EN_PREPARACION"
        
    if nuevo_estado == "LISTA":
        
        if all(i.estado == "LISTA" for i in todos_items):
            orden.estado = "LISTA"
            
            mesa = db.query(Mesa).filter(Mesa.id == orden.mesa_id).first()
            if mesa:
                mesa.estado = "POR_COBRAR"

    db.commit()
    db.refresh(item)

    if nuevo_estado == "EN_PREPARACION":
        background_tasks.add_task(
            manager.broadcast,
            {
                "type": "ITEM_PREPARACION",
                "title": "Item en Preparación",
                "message": f"1 producto de Mesa {orden.mesa.numero} en preparación",
                "time": "Justo ahora"
            },
            "MESERO"
        )
    elif nuevo_estado == "LISTA":
        if orden.estado == "LISTA":
            background_tasks.add_task(
                manager.broadcast,
                {
                    "type": "ORDEN_LISTA",
                    "title": "Orden Lista",
                    "message": f"Mesa {orden.mesa.numero} está lista para entregar",
                    "time": "Justo ahora"
                },
                "MESERO"
            )
            mesa = db.query(Mesa).filter(Mesa.id == orden.mesa_id).first()
            if mesa:
                background_tasks.add_task(
                    manager.broadcast,
                    {
                        "type": "CUENTA_POR_COBRAR",
                        "title": "Nueva Cuenta",
                        "message": f"Mesa {mesa.numero} pasó a estado Por Cobrar",
                        "time": "Justo ahora"
                    },
                    "CAJERO"
                )
        else:
            background_tasks.add_task(
                manager.broadcast,
                {
                    "type": "ITEM_LISTO",
                    "title": "Item Listo",
                    "message": f"1 producto de Mesa {orden.mesa.numero} está listo",
                    "time": "Justo ahora"
                },
                "MESERO"
            )

    return item

@router.get("/inventario", response_model=List[IngredienteOut])
def ver_inventario_cocina(db: Session = Depends(get_db)):
    
    return db.query(Ingrediente).order_by(Ingrediente.stock_actual.asc()).all()
