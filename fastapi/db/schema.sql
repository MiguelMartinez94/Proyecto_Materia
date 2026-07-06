-- ==========================================
-- SCRIPT DE BASE DE DATOS POSTGRESQL
-- SISTEMA INTEGRAL PARA ADMINISTRACIÓN DE CAFETERÍA
-- ==========================================

-- Habilitar extensión uuid-ossp si es necesaria
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- 1. ENUMS Y DOMINIOS
-- -----------------------------------------------------
CREATE TYPE ROL_NOMBRE AS ENUM ('MESERO', 'CAJERO', 'COCINERO');
CREATE TYPE MESA_ESTADO AS ENUM ('LIBRE', 'OCUPADA', 'EN_ESPERA', 'POR_COBRAR');
CREATE TYPE ORDEN_ESTADO AS ENUM ('EN_ESPERA', 'EN_PREPARACION', 'LISTA', 'PAGADA');
CREATE TYPE DETALLE_ESTADO AS ENUM ('EN_ESPERA', 'EN_PREPARACION', 'LISTA');
CREATE TYPE METODO_PAGO AS ENUM ('EFECTIVO', 'TARJETA');

-- -----------------------------------------------------
-- 2. CREACIÓN DE TABLAS
-- -----------------------------------------------------

-- roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre ROL_NOMBRE NOT NULL UNIQUE
);

-- usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- mesas
CREATE TABLE mesas (
    id SERIAL PRIMARY KEY,
    numero INT NOT NULL UNIQUE,
    ubicacion VARCHAR(100) NOT NULL, -- e.g., 'Terraza', 'Interior', 'Barra'
    estado MESA_ESTADO DEFAULT 'LIBRE' NOT NULL
);

-- categorias_menu
CREATE TABLE categorias_menu (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    categoria_id INT REFERENCES categorias_menu(id) ON DELETE SET NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    disponible BOOLEAN DEFAULT TRUE NOT NULL
);

-- ordenes
CREATE TABLE ordenes (
    id SERIAL PRIMARY KEY,
    mesa_id INT NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
    mesero_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    estado ORDEN_ESTADO DEFAULT 'EN_ESPERA' NOT NULL,
    subtotal DECIMAL(10, 2) DEFAULT 0.00 NOT NULL CHECK (subtotal >= 0),
    impuestos DECIMAL(10, 2) DEFAULT 0.00 NOT NULL CHECK (impuestos >= 0),
    total DECIMAL(10, 2) DEFAULT 0.00 NOT NULL CHECK (total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- detalle_orden
CREATE TABLE detalle_orden (
    id SERIAL PRIMARY KEY,
    orden_id INT NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    observaciones TEXT,
    estado DETALLE_ESTADO DEFAULT 'EN_ESPERA' NOT NULL
);

-- ingredientes
CREATE TABLE ingredientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    unidad_medida VARCHAR(20) NOT NULL, -- e.g., 'g', 'ml', 'pcs', 'kg'
    stock_actual DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (stock_actual >= 0),
    stock_minimo DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (stock_minimo >= 0)
);

-- producto_ingredientes (Tabla pivote)
CREATE TABLE producto_ingredientes (
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    ingrediente_id INT NOT NULL REFERENCES ingredientes(id) ON DELETE CASCADE,
    cantidad_requerida DECIMAL(10, 2) NOT NULL CHECK (cantidad_requerida > 0),
    PRIMARY KEY (producto_id, ingrediente_id)
);

-- ventas
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    orden_id INT NOT NULL REFERENCES ordenes(id) ON DELETE RESTRICT,
    metodo_pago METODO_PAGO NOT NULL,
    monto_recibido DECIMAL(10, 2) NOT NULL CHECK (monto_recibido >= 0),
    cambio DECIMAL(10, 2) NOT NULL CHECK (cambio >= 0),
    total_pagado DECIMAL(10, 2) NOT NULL CHECK (total_pagado >= 0),
    ticket_folio VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cambio CHECK (monto_recibido >= total_pagado)
);

-- -----------------------------------------------------
-- 3. ÍNDICES DE RENDIMIENTO
-- -----------------------------------------------------
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_ordenes_mesa ON ordenes(mesa_id);
CREATE INDEX idx_ordenes_mesero ON ordenes(mesero_id);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_detalle_orden_orden ON detalle_orden(orden_id);
CREATE INDEX idx_detalle_orden_producto ON detalle_orden(producto_id);
CREATE INDEX idx_detalle_orden_estado ON detalle_orden(estado);
CREATE INDEX idx_ventas_orden ON ventas(orden_id);
CREATE INDEX idx_ventas_created_at ON ventas(created_at);

-- -----------------------------------------------------
-- 4. TRIGGERS PARA ACTUALIZACIÓN DE INVENTARIO
-- -----------------------------------------------------

-- Función del trigger para descontar stock de ingredientes
CREATE OR REPLACE FUNCTION fn_descontar_stock()
RETURNS TRIGGER AS $$
DECLARE
    r RECORD;
BEGIN
    -- Se descuenta inventario si se crea un detalle directamente en 'EN_PREPARACION' 
    -- o si se actualiza su estado de 'EN_ESPERA' a 'EN_PREPARACION'
    IF (TG_OP = 'INSERT' AND NEW.estado = 'EN_PREPARACION') OR
       (TG_OP = 'UPDATE' AND OLD.estado = 'EN_ESPERA' AND NEW.estado = 'EN_PREPARACION') THEN
        
        -- Iterar por cada ingrediente requerido por el producto
        FOR r IN 
            SELECT pi.ingrediente_id, pi.cantidad_requerida, i.nombre, i.stock_actual
            FROM producto_ingredientes pi
            JOIN ingredientes i ON pi.ingrediente_id = i.id
            WHERE pi.producto_id = NEW.producto_id
        LOOP
            -- Validar si hay stock suficiente
            IF r.stock_actual < (r.cantidad_requerida * NEW.cantidad) THEN
                RAISE EXCEPTION 'Stock insuficiente para el ingrediente % (Requerido: %, Disponible: %)', 
                    r.nombre, (r.cantidad_requerida * NEW.cantidad), r.stock_actual;
            END IF;

            -- Descontar el stock
            UPDATE ingredientes 
            SET stock_actual = stock_actual - (r.cantidad_requerida * NEW.cantidad)
            WHERE id = r.ingrediente_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_descontar_stock
AFTER INSERT OR UPDATE ON detalle_orden
FOR EACH ROW
EXECUTE FUNCTION fn_descontar_stock();

-- -----------------------------------------------------
-- 5. VALORES INICIALES (SEED DATA)
-- -----------------------------------------------------

-- Insertar roles
INSERT INTO roles (nombre) VALUES 
('MESERO'),
('CAJERO'),
('COCINERO');

-- Insertar usuarios iniciales (Contraseña de prueba hashed: pbkdf2:sha256...)
-- Nota: 'admin123' o hash simple, en FastAPI se puede usar bcrypt/passlib.
INSERT INTO usuarios (nombre, username, password_hash, rol_id) VALUES
('Juan Pérez', 'juan.mesero', '$2b$12$EixZaYVK1fsAH1SpxE32O.7C6eD25h.G/d/o/m541656...', 1),
('Ana Gómez', 'ana.caja', '$2b$12$EixZaYVK1fsAH1SpxE32O.7C6eD25h.G/d/o/m541656...', 2),
('Carlos Chef', 'carlos.cocina', '$2b$12$EixZaYVK1fsAH1SpxE32O.7C6eD25h.G/d/o/m541656...', 3);

-- Insertar mesas
INSERT INTO mesas (numero, ubicacion, estado) VALUES
(4, 'Terraza', 'EN_ESPERA'),
(2, 'Interior', 'OCUPADA'),
(7, 'Barra', 'LIBRE'),
(5, 'Terraza', 'POR_COBRAR'),
(12, 'Interior', 'OCUPADA');

-- Insertar categorías
INSERT INTO categorias_menu (nombre) VALUES
('ALIMENTOS'),
('BEBIDAS'),
('POSTRES');

-- Insertar ingredientes
INSERT INTO ingredientes (nombre, unidad_medida, stock_actual, stock_minimo) VALUES
('Café de grano', 'g', 5000.00, 1000.00),
('Leche entera', 'ml', 10000.00, 2000.00),
('Bagel', 'pcs', 15.00, 5.00),
('Salmón ahumado', 'g', 1200.00, 300.00),
('Croissant', 'pcs', 20.00, 5.00),
('Pan de Hamburguesa', 'pcs', 0.00, 10.00), -- Agotado para pruebas
('Aguacate', 'pcs', 3.00, 5.00),          -- Crítico para pruebas
('Carne Res 150g', 'pcs', 42.00, 10.00),
('Queso Cheddar', 'kg', 15.00, 2.00);

-- Insertar productos
INSERT INTO productos (categoria_id, nombre, descripcion, precio, disponible) VALUES
(2, 'Café Expresso', 'Café concentrado con cuerpo e intensidad.', 35.00, TRUE),
(1, 'Bagel de Salmón', 'Bagel tostado con queso crema y salmón.', 120.00, TRUE),
(1, 'Croissant', 'Croissant clásico de mantequilla horneado hoy.', 45.00, TRUE),
(2, 'Americano', 'Café expresso diluido con agua caliente.', 35.00, TRUE),
(2, 'Jugo Naranja', 'Exprimido natural de temporada.', 80.00, TRUE),
(1, 'Hamburguesa Clásica', 'Hamburguesa con queso cheddar y papas.', 160.00, TRUE);

-- Relacionar productos con ingredientes
INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad_requerida) VALUES
(1, 1, 18.00),  -- Café Expresso requiere 18g de café
(2, 3, 1.00),   -- Bagel de Salmón requiere 1 Bagel
(2, 4, 80.00),  -- Bagel de Salmón requiere 80g de salmón
(3, 5, 1.00),   -- Croissant requiere 1 croissant de stock
(4, 1, 18.00),  -- Americano requiere 18g de café
(6, 6, 1.00),   -- Hamburguesa Clásica requiere 1 pan
(6, 8, 1.00),   -- Hamburguesa Clásica requiere 1 carne
(6, 9, 0.05);   -- Hamburguesa Clásica requiere 0.05kg queso
