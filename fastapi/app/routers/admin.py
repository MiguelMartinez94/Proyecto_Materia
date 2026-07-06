from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from ..database import get_db
from ..models import Usuario, ConfiguracionNegocio, Role, Ingrediente, Producto, CategoriaMenu, Venta, Orden
from ..schemas import (UsuarioOut, UsuarioCreate, ConfiguracionNegocioOut, ConfiguracionNegocioUpdate, BaseSchema, 
                       IngredienteOut, ProductoOut, CategoriaMenuOut, IngredienteCreate, IngredienteUpdate, 
                       ProductoCreate, ProductoUpdate, CategoriaMenuCreate, RoleOut)
from .auth import require_roles, get_password_hash

class UsuarioUpdate(BaseSchema):
    nombre: str | None = None
    username: str | None = None
    password: str | None = None
    rol_id: int | None = None
    activo: bool | None = None

router = APIRouter(
    prefix="/admin",
    tags=["Administración"],
    dependencies=[Depends(require_roles(["ADMINISTRADOR"]))]
)




@router.get("/usuarios", response_model=List[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).options(joinedload(Usuario.rol)).all()

@router.post("/usuarios", response_model=UsuarioOut)
def crear_usuario(user: UsuarioCreate, db: Session = Depends(get_db)):
    
    if db.query(Usuario).filter(Usuario.username == user.username).first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
        
    
    if not db.query(Role).filter(Role.id == user.rol_id).first():
        raise HTTPException(status_code=400, detail="Rol inválido")
        
    hashed_pw = get_password_hash(user.password)
    nuevo_usuario = Usuario(
        nombre=user.nombre,
        username=user.username,
        password_hash=hashed_pw,
        rol_id=user.rol_id,
        activo=user.activo
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@router.put("/usuarios/{id}", response_model=UsuarioOut)
def actualizar_usuario(id: int, user_update: UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if user_update.username and user_update.username != usuario.username:
        if db.query(Usuario).filter(Usuario.username == user_update.username).first():
            raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
        usuario.username = user_update.username
        
    if user_update.nombre is not None:
        usuario.nombre = user_update.nombre
    if user_update.rol_id is not None:
        if not db.query(Role).filter(Role.id == user_update.rol_id).first():
            raise HTTPException(status_code=400, detail="Rol inválido")
        usuario.rol_id = user_update.rol_id
    if user_update.activo is not None:
        usuario.activo = user_update.activo
    if user_update.password is not None:
        usuario.password_hash = get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(usuario)
    return usuario

@router.delete("/usuarios/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    
    usuario.activo = False
    db.commit()
    return None




@router.get("/configuracion", response_model=ConfiguracionNegocioOut)
def obtener_configuracion(db: Session = Depends(get_db)):
    config = db.query(ConfiguracionNegocio).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return config

@router.put("/configuracion", response_model=ConfiguracionNegocioOut)
def actualizar_configuracion(payload: ConfiguracionNegocioUpdate, db: Session = Depends(get_db)):
    config = db.query(ConfiguracionNegocio).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
        
    if payload.nombre_negocio is not None:
        config.nombre_negocio = payload.nombre_negocio
    if payload.mensaje_ticket is not None:
        config.mensaje_ticket = payload.mensaje_ticket
    if payload.impuesto_porcentaje is not None:
        config.impuesto_porcentaje = payload.impuesto_porcentaje
    if payload.moneda is not None:
        config.moneda = payload.moneda
        
    db.commit()
    db.refresh(config)
    return config




@router.get("/roles", response_model=List[RoleOut])
def listar_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()

@router.get("/ingredientes", response_model=List[IngredienteOut])
def listar_ingredientes(db: Session = Depends(get_db)):
    return db.query(Ingrediente).all()

@router.post("/ingredientes", response_model=IngredienteOut)
def crear_ingrediente(ingrediente: IngredienteCreate, db: Session = Depends(get_db)):
    nuevo = Ingrediente(**ingrediente.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/ingredientes/{id}", response_model=IngredienteOut)
def actualizar_ingrediente(id: int, payload: IngredienteUpdate, db: Session = Depends(get_db)):
    ingrediente = db.query(Ingrediente).filter(Ingrediente.id == id).first()
    if not ingrediente:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ingrediente, key, value)
        
    db.commit()
    db.refresh(ingrediente)
    return ingrediente

@router.delete("/ingredientes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_ingrediente(id: int, db: Session = Depends(get_db)):
    ingrediente = db.query(Ingrediente).filter(Ingrediente.id == id).first()
    if not ingrediente:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    db.delete(ingrediente)
    db.commit()
    return None

@router.get("/menu/categorias", response_model=List[CategoriaMenuOut])
def listar_categorias(db: Session = Depends(get_db)):
    return db.query(CategoriaMenu).all()

@router.post("/menu/categorias", response_model=CategoriaMenuOut)
def crear_categoria(categoria: CategoriaMenuCreate, db: Session = Depends(get_db)):
    nueva = CategoriaMenu(**categoria.dict())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.get("/menu/productos", response_model=List[ProductoOut])
def listar_productos(db: Session = Depends(get_db)):
    return db.query(Producto).all()

@router.post("/menu/productos", response_model=ProductoOut)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    nuevo = Producto(**producto.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/menu/productos/{id}", response_model=ProductoOut)
def actualizar_producto(id: int, payload: ProductoUpdate, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(producto, key, value)
        
    db.commit()
    db.refresh(producto)
    return producto

@router.delete("/menu/productos/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    producto.disponible = False
    db.commit()
    return None




@router.get("/reportes/ventas")
def reporte_ventas(db: Session = Depends(get_db)):
    
    ventas = db.query(Venta).all()
    total = sum(v.total_pagado for v in ventas)
    return {
        "total_historico_vendido": round(total, 2),
        "total_ordenes_cobradas": len(ventas)
    }

