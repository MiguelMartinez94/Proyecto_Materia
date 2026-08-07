from datetime import datetime
import random
from sqlalchemy.orm import Session
from ..models import Orden, Venta, Mesa

def calcular_totales_orden(orden: Orden):
    
    subtotal = 0.0
    for item in orden.items:
        subtotal += item.cantidad * item.precio_unitario
        
    impuestos = subtotal * 0.16
    total = subtotal + impuestos
    
    orden.subtotal = round(subtotal, 2)
    orden.impuestos = round(impuestos, 2)
    orden.total = round(total, 2)
    
    return orden

def procesar_pago(db: Session, orden_id: int, metodo_pago: str, monto_recibido: float) -> Venta:
    
    orden = db.query(Orden).filter(Orden.id == orden_id).first()
    if not orden:
        raise ValueError("La orden especificada no existe.")
        
    if orden.estado == "PAGADA":
        raise ValueError("Esta orden ya ha sido cobrada anteriormente.")
        
    
    calcular_totales_orden(orden)
    
    if monto_recibido < orden.total:
        raise ValueError(
            f"El monto recibido (${monto_recibido:.2f}) es menor al "
            f"total a pagar (${orden.total:.2f})."
        )
        
    
    cambio = round(monto_recibido - orden.total, 2)
    
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    rand_suffix = random.randint(100, 999)
    ticket_folio = f"TKT-{timestamp}-{orden.id}-{rand_suffix}"
    
    
    nueva_venta = Venta(
        orden_id=orden.id,
        metodo_pago=metodo_pago,
        monto_recibido=round(monto_recibido, 2),
        cambio=cambio,
        total_pagado=orden.total,
        ticket_folio=ticket_folio,
        created_at=datetime.utcnow()
    )
    
    
    orden.estado = "PAGADA"
    
    
    mesa = db.query(Mesa).filter(Mesa.id == orden.mesa_id).first()
    if mesa:
        mesa.estado = "OCUPADA"
        
    db.add(nueva_venta)
    db.commit()
    db.refresh(nueva_venta)
    
    return nueva_venta
