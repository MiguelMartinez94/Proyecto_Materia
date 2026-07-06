from sqlalchemy.orm import Session
from ..models import Producto, Ingrediente, ProductoIngrediente

def validar_existencia(db: Session, producto_id: int, cantidad: int) -> bool:
    
    
    recetas = db.query(ProductoIngrediente).filter(ProductoIngrediente.producto_id == producto_id).all()
    
    
    if not recetas:
        return True
        
    for receta in recetas:
        ingrediente = db.query(Ingrediente).filter(Ingrediente.id == receta.ingrediente_id).first()
        if not ingrediente:
            return False
            
        req = receta.cantidad_requerida * cantidad
        if ingrediente.stock_actual < req:
            return False
            
    return True

def descontar_inventario(db: Session, producto_id: int, cantidad: int):
    
    recetas = db.query(ProductoIngrediente).filter(ProductoIngrediente.producto_id == producto_id).all()
    
    if not recetas:
        return
        
    
    for receta in recetas:
        ingrediente = db.query(Ingrediente).filter(Ingrediente.id == receta.ingrediente_id).first()
        if not ingrediente:
            raise ValueError(f"Ingrediente con ID {receta.ingrediente_id} no registrado en inventario.")
            
        req = receta.cantidad_requerida * cantidad
        if ingrediente.stock_actual < req:
            raise ValueError(
                f"Stock insuficiente para {ingrediente.nombre}. "
                f"Requerido: {req:.2f} {ingrediente.unidad_medida}, "
                f"Disponible: {ingrediente.stock_actual:.2f} {ingrediente.unidad_medida}."
            )
            
    
    for receta in recetas:
        ingrediente = db.query(Ingrediente).filter(Ingrediente.id == receta.ingrediente_id).first()
        req = receta.cantidad_requerida * cantidad
        ingrediente.stock_actual -= req
        
    
    
