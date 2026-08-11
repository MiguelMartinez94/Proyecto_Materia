from datetime import datetime, time
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Orden, Venta, Mesa, Gasto
from ..schemas import OrdenResumen, PagoRequest, PagoResponse, IngresosDiariosOut, VentaOut, GastoCreate, GastoOut
from ..services.payment_service import procesar_pago, calcular_totales_orden
from .auth import require_roles

router = APIRouter(
    prefix="/caja", 
    tags=["Caja"]
)

@router.get("/pendientes", response_model=List[OrdenResumen])
def listar_ordenes_pendientes(db: Session = Depends(get_db)):
    
    
    
    ordenes_pendientes = db.query(Orden).join(Mesa).filter(
        Orden.estado != "PAGADA",
        Mesa.estado == "POR_COBRAR"
    ).order_by(Orden.created_at.asc()).all()
    
    resumenes = []
    for o in ordenes_pendientes:
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

@router.post("/cobrar/{orden_id}", response_model=PagoResponse)
def cobrar_orden(orden_id: int, pago: PagoRequest, db: Session = Depends(get_db)):
    
    try:
        venta = procesar_pago(db, orden_id, pago.metodo_pago, pago.monto_recibido)
        return PagoResponse(
            exitoso=True,
            venta=VentaOut.model_validate(venta),
            cambio=venta.cambio,
            mensaje="Pago procesado exitosamente."
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar el pago.")

@router.get("/ingresos-dia", response_model=IngresosDiariosOut)
def obtener_ingresos_del_dia(db: Session = Depends(get_db)):
    
    hoy = datetime.utcnow().date()
    inicio_dia = datetime.combine(hoy, time.min)
    fin_dia = datetime.combine(hoy, time.max)
    
    
    ventas_hoy = db.query(Venta).filter(
        Venta.created_at >= inicio_dia,
        Venta.created_at <= fin_dia
    ).all()
    
    total_vendido = sum(v.total_pagado for v in ventas_hoy)
    ordenes_cobradas = len(ventas_hoy)
    ticket_promedio = (total_vendido / ordenes_cobradas) if ordenes_cobradas > 0 else 0.0
    
    return IngresosDiariosOut(
        total_vendido=round(total_vendido, 2),
        ordenes_cobradas=ordenes_cobradas,
        ticket_promedio=round(ticket_promedio, 2),
        ventas_detalle=ventas_hoy
    )

@router.post("/gastos", response_model=GastoOut)
def registrar_gasto(gasto: GastoCreate, db: Session = Depends(get_db)):
    nuevo_gasto = Gasto(
        descripcion=gasto.descripcion,
        monto=gasto.monto
    )
    db.add(nuevo_gasto)
    db.commit()
    db.refresh(nuevo_gasto)
    return nuevo_gasto

@router.get("/gastos", response_model=List[GastoOut])
def obtener_gastos_dia(db: Session = Depends(get_db)):
    hoy = datetime.utcnow().date()
    inicio_dia = datetime.combine(hoy, time.min)
    fin_dia = datetime.combine(hoy, time.max)
    
    gastos = db.query(Gasto).filter(
        Gasto.created_at >= inicio_dia,
        Gasto.created_at <= fin_dia
    ).order_by(Gasto.created_at.desc()).all()
    
    return gastos
