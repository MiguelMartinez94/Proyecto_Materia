import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal, is_sqlite
from .models import Role, Usuario, Mesa, CategoriaMenu, Ingrediente, Producto, ProductoIngrediente, ConfiguracionNegocio
from .routers import mesero, caja, cocina, auth, admin, notificaciones

app = FastAPI(
    title="Sistema Integral de Cafetería API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(mesero.router)
app.include_router(caja.router)
app.include_router(cocina.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(notificaciones.router)

@app.on_event("startup")
def startup_event():
    
    
    Base.metadata.create_all(bind=engine)
    
    
    db = SessionLocal()
    try:
        
        if db.query(Role).count() == 0:
            print("Sembrando datos iniciales en la base de datos...")
            
            
            roles = [
                Role(id=1, nombre="MESERO"),
                Role(id=2, nombre="CAJERO"),
                Role(id=3, nombre="COCINERO"),
                Role(id=4, nombre="ADMINISTRADOR")
            ]
            db.add_all(roles)
            db.flush()

            
            from .routers.auth import get_password_hash
            default_hash = get_password_hash("123456")
            
            usuarios = [
                Usuario(id=1, nombre="Juan Pérez", username="juan.mesero", password_hash=default_hash, rol_id=1),
                Usuario(id=2, nombre="Ana Gómez", username="ana.caja", password_hash=default_hash, rol_id=2),
                Usuario(id=3, nombre="Carlos Chef", username="carlos.cocina", password_hash=default_hash, rol_id=3),
                Usuario(id=4, nombre="Admin Principal", username="admin@ejemplo.com", password_hash=default_hash, rol_id=4)
            ]
            db.add_all(usuarios)
            
            
            mesas = [
                Mesa(id=1, numero=4, ubicacion="Terraza", estado="EN_ESPERA"),
                Mesa(id=2, numero=2, ubicacion="Interior", estado="OCUPADA"),
                Mesa(id=3, numero=7, ubicacion="Barra", estado="LIBRE"),
                Mesa(id=4, numero=5, ubicacion="Terraza", estado="POR_COBRAR"),
                Mesa(id=5, numero=12, ubicacion="Interior", estado="OCUPADA")
            ]
            db.add_all(mesas)
            
            
            categorias = [
                CategoriaMenu(id=1, nombre="ALIMENTOS"),
                CategoriaMenu(id=2, nombre="BEBIDAS"),
                CategoriaMenu(id=3, nombre="POSTRES")
            ]
            db.add_all(categorias)
            db.flush()
            
            
            ingredientes = [
                Ingrediente(id=1, nombre="Café de grano", unidad_medida="g", stock_actual=5000.0, stock_minimo=1000.0),
                Ingrediente(id=2, nombre="Leche entera", unidad_medida="ml", stock_actual=10000.0, stock_minimo=2000.0),
                Ingrediente(id=3, nombre="Bagel", unidad_medida="pcs", stock_actual=15.0, stock_minimo=5.0),
                Ingrediente(id=4, nombre="Salmón ahumado", unidad_medida="g", stock_actual=1200.0, stock_minimo=300.0),
                Ingrediente(id=5, nombre="Croissant", unidad_medida="pcs", stock_actual=20.0, stock_minimo=5.0),
                Ingrediente(id=6, nombre="Pan de Hamburguesa", unidad_medida="pcs", stock_actual=0.0, stock_minimo=10.0), 
                Ingrediente(id=7, nombre="Aguacate", unidad_medida="pcs", stock_actual=3.0, stock_minimo=5.0),          
                Ingrediente(id=8, nombre="Carne Res 150g", unidad_medida="pcs", stock_actual=42.0, stock_minimo=10.0),
                Ingrediente(id=9, nombre="Queso Cheddar", unidad_medida="kg", stock_actual=15.0, stock_minimo=2.0)
            ]
            db.add_all(ingredientes)
            db.flush()
            
            
            productos = [
                Producto(id=1, categoria_id=2, nombre="Café Expresso", descripcion="Café concentrado con cuerpo e intensidad.", precio=35.0, disponible=True),
                Producto(id=2, categoria_id=1, nombre="Bagel de Salmón", descripcion="Bagel tostado con queso crema y salmón.", precio=120.0, disponible=True),
                Producto(id=3, categoria_id=1, nombre="Croissant", descripcion="Croissant clásico de mantequilla horneado hoy.", precio=45.0, disponible=True),
                Producto(id=4, categoria_id=2, nombre="Americano", descripcion="Café expresso diluido con agua caliente.", precio=35.0, disponible=True),
                Producto(id=5, categoria_id=2, nombre="Jugo Naranja", descripcion="Exprimido natural de temporada.", precio=80.0, disponible=True),
                Producto(id=6, categoria_id=1, nombre="Hamburguesa Clásica", descripcion="Hamburguesa con queso cheddar y papas.", precio=160.0, disponible=True)
            ]
            db.add_all(productos)
            db.flush()
            
            
            recetas = [
                ProductoIngrediente(producto_id=1, ingrediente_id=1, cantidad_requerida=18.0),
                ProductoIngrediente(producto_id=2, ingrediente_id=3, cantidad_requerida=1.0),
                ProductoIngrediente(producto_id=2, ingrediente_id=4, cantidad_requerida=80.0),
                ProductoIngrediente(producto_id=3, ingrediente_id=5, cantidad_requerida=1.0),
                ProductoIngrediente(producto_id=4, ingrediente_id=1, cantidad_requerida=18.0),
                ProductoIngrediente(producto_id=6, ingrediente_id=6, cantidad_requerida=1.0),
                ProductoIngrediente(producto_id=6, ingrediente_id=8, cantidad_requerida=1.0),
                ProductoIngrediente(producto_id=6, ingrediente_id=9, cantidad_requerida=0.05)
            ]
            db.add_all(recetas)
            
            
            config = ConfiguracionNegocio(
                id=1,
                nombre_negocio="Mi Cafetería",
                mensaje_ticket="¡Gracias por su preferencia!",
                impuesto_porcentaje=16.0,
                moneda="MXN"
            )
            db.add(config)
            
            db.commit()
            print("Siembra completada con éxito.")
    except Exception as e:
        db.rollback()
        print(f"Error al sembrar base de datos: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Bienvenido a la API del Sistema de Cafetería",
        "docs": "/docs"
    }
