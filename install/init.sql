-- -------------------------------------------------
-- Base de datos: colonia_app
-- -------------------------------------------------
DROP DATABASE IF EXISTS colonia_app;
CREATE DATABASE colonia_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE colonia_app;

-- -------------------------------------------------
-- Tabla: usuarios
-- -------------------------------------------------
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    rol ENUM('vecino','admin') DEFAULT 'vecino',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_correo (correo),
    INDEX idx_rol (rol)
);

-- -------------------------------------------------
-- Tabla: noticias
-- -------------------------------------------------
CREATE TABLE noticias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    imagen_url VARCHAR(500),
    destacada BOOLEAN DEFAULT FALSE,
    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_fecha (fecha_publicacion),
    INDEX idx_destacada (destacada)
);

-- -------------------------------------------------
-- Tabla: eventos
-- -------------------------------------------------
CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    lugar VARCHAR(255),
    max_asistentes INT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fechas (fecha_inicio, fecha_fin),
    INDEX idx_activo (activo)
);

-- -------------------------------------------------
-- Tabla: conceptos_pago
-- -------------------------------------------------
CREATE TABLE conceptos_pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo ENUM('unico','parcial') NOT NULL DEFAULT 'unico',
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    mensualidades INT DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    fecha_limite DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_activo (activo)
);

-- -------------------------------------------------
-- Tabla: pagos
-- -------------------------------------------------
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    concepto_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    parcialidad INT DEFAULT 1,
    referencia VARCHAR(100),
    estado ENUM('pendiente','pagado','cancelado') DEFAULT 'pendiente',
    metodo_pago ENUM('efectivo','transferencia','tarjeta') DEFAULT 'efectivo',
    comprobante_url VARCHAR(500),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (concepto_id) REFERENCES conceptos_pago(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_pago),
    INDEX idx_estado (estado),
    UNIQUE KEY uk_concepto_parcialidad (usuario_id, concepto_id, parcialidad)
);

-- -------------------------------------------------
-- Tabla: asistencias
-- -------------------------------------------------
CREATE TABLE asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    evento_id INT NOT NULL,
    presente BOOLEAN DEFAULT FALSE,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_asistencia DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_usuario_evento (usuario_id, evento_id),
    INDEX idx_evento (evento_id),
    INDEX idx_presente (presente)
);

-- -------------------------------------------------
-- Tabla: qr_usuarios
-- -------------------------------------------------
CREATE TABLE qr_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    codigo_qr TEXT NOT NULL,
    token_verificacion VARCHAR(100) NOT NULL UNIQUE,
    fecha_generado DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token (token_verificacion),
    INDEX idx_expiracion (fecha_expiracion)
);

-- -------------------------------------------------
-- Tabla: notificaciones
-- -------------------------------------------------
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('sistema','pago','evento','noticia') DEFAULT 'sistema',
    leida BOOLEAN DEFAULT FALSE,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_leida DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_leida (usuario_id, leida),
    INDEX idx_fecha (fecha_envio)
);

-- -------------------------------------------------
-- Tabla: auditoria (logs importantes)
-- -------------------------------------------------
CREATE TABLE auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(50),
    accion ENUM('INSERT','UPDATE','DELETE'),
    usuario_id INT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_fecha (created_at)
);

-- -------------------------------------------------
-- Triggers para auditoría (ejemplo para usuarios)
-- -------------------------------------------------
DELIMITER //
CREATE TRIGGER tr_usuarios_after_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, accion, usuario_id, datos_anteriores, datos_nuevos)
    VALUES ('usuarios', 'UPDATE', NEW.id,
            JSON_OBJECT('nombre', OLD.nombre, 'correo', OLD.correo, 'rol', OLD.rol),
            JSON_OBJECT('nombre', NEW.nombre, 'correo', NEW.correo, 'rol', NEW.rol));
END//
DELIMITER ;

-- -------------------------------------------------
-- Vista: estado_cuenta_por_usuario
-- -------------------------------------------------
CREATE VIEW vista_estado_cuenta AS
SELECT 
    u.id as usuario_id,
    u.nombre,
    u.correo,
    cp.nombre as concepto,
    cp.total as total_concepto,
    COALESCE(SUM(p.monto), 0) as total_pagado,
    (cp.total - COALESCE(SUM(p.monto), 0)) as saldo_pendiente,
    COUNT(p.id) as pagos_realizados,
    CASE 
        WHEN cp.tipo = 'parcial' THEN 
            CONCAT(COUNT(p.id), '/', cp.mensualidades)
        ELSE 
            CASE WHEN COALESCE(SUM(p.monto), 0) >= cp.total THEN 'Completado' ELSE 'Pendiente' END
    END as estado
FROM usuarios u
CROSS JOIN conceptos_pago cp
LEFT JOIN pagos p ON p.usuario_id = u.id AND p.concepto_id = cp.id AND p.estado = 'pagado'
WHERE cp.activo = TRUE
GROUP BY u.id, cp.id
ORDER BY u.nombre, cp.nombre;

-- -------------------------------------------------
-- Datos iniciales de ejemplo
-- -------------------------------------------------

-- Usuarios (password: Admin123! y Vecino123!)
INSERT INTO usuarios (nombre, correo, password, direccion, telefono, rol) VALUES
('Administrador Principal', 'admin@colonia.com', '$2b$10$YourHashedPasswordHere1', 'Oficina de Administración', '555-1000', 'admin'),
('María González', 'maria@vecino.com', '$2b$10$YourHashedPasswordHere2', 'Calle Primavera #123', '555-1001', 'vecino'),
('Carlos López', 'carlos@vecino.com', '$2b$10$YourHashedPasswordHere3', 'Av. Central #456', '555-1002', 'vecino'),
('Ana Martínez', 'ana@vecino.com', '$2b$10$YourHashedPasswordHere4', 'Calle Roble #789', '555-1003', 'vecino');

-- Conceptos de pago
INSERT INTO conceptos_pago (nombre, descripcion, tipo, total, mensualidades, fecha_limite) VALUES
('Aportación Anual 2024', 'Mantenimiento de áreas comunes anual', 'unico', 1200.00, 1, '2024-12-31'),
('Acometida Eléctrica', 'Instalación eléctrica comunitaria', 'parcial', 3600.00, 6, '2024-06-30'),
('Fondo de Emergencia', 'Reserva para imprevistos', 'parcial', 2400.00, 12, '2024-12-31'),
('Mejora Alumbrado', 'Renovación sistema de iluminación', 'unico', 800.00, 1, '2024-03-31');

-- Pagos de ejemplo
INSERT INTO pagos (usuario_id, concepto_id, monto, parcialidad, estado, metodo_pago) VALUES
(2, 1, 1200.00, 1, 'pagado', 'transferencia'),
(2, 2, 600.00, 1, 'pagado', 'efectivo'),
(2, 2, 600.00, 2, 'pagado', 'transferencia'),
(3, 1, 1200.00, 1, 'pagado', 'tarjeta'),
(3, 2, 600.00, 1, 'pendiente', NULL),
(4, 1, 600.00, 1, 'pagado', 'efectivo');

-- Eventos
INSERT INTO eventos (nombre, descripcion, fecha_inicio, fecha_fin, lugar, max_asistentes) VALUES
('Asamblea General Trimestral', 'Revisión de estados financieros y proyectos', '2024-01-15 18:00:00', '2024-01-15 20:00:00', 'Salón Comunitario', 50),
('Jornada de Limpieza', 'Limpieza de áreas verdes y comunes', '2024-01-20 09:00:00', '2024-01-20 13:00:00', 'Parque Central', 30),
('Fiesta Navideña', 'Celebración de fin de año para familias', '2024-12-15 17:00:00', '2024-12-15 23:00:00', 'Área de Juegos', 100);

-- Noticias
INSERT INTO noticias (titulo, contenido, imagen_url, destacada, usuario_id) VALUES
('Nuevo Sistema de Seguridad', 'Se ha instalado cámaras de seguridad en puntos estratégicos de la colonia...', 'https://ejemplo.com/seguridad.jpg', TRUE, 1),
('Reparación de Tuberías', 'El próximo lunes se realizarán trabajos de mantenimiento en el sistema de agua...', NULL, FALSE, 1),
('Horarios de Recolección', 'A partir de febrero cambian los horarios de recolección de basura...', 'https://ejemplo.com/basura.jpg', TRUE, 1);

-- Asistencias
INSERT INTO asistencias (usuario_id, evento_id, presente, fecha_asistencia) VALUES
(2, 1, TRUE, '2024-01-15 18:05:00'),
(3, 1, FALSE, NULL),
(4, 1, TRUE, '2024-01-15 18:10:00'),
(2, 2, TRUE, '2024-01-20 09:00:00');

-- Notificaciones de ejemplo
INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES
(2, 'Pago Confirmado', 'Tu pago de Aportación Anual ha sido confirmado', 'pago'),
(3, 'Evento Próximo', 'No olvides la Asamblea General del próximo lunes', 'evento'),
(NULL, 'Nueva Noticia', 'Revisa la nueva información sobre seguridad', 'noticia');

-- -------------------------------------------------
-- Procedimiento: Generar QR para usuario
-- -------------------------------------------------
DELIMITER //
CREATE PROCEDURE sp_generar_qr_usuario(
    IN p_usuario_id INT,
    IN p_token VARCHAR(100)
)
BEGIN
    INSERT INTO qr_usuarios (usuario_id, codigo_qr, token_verificacion, fecha_expiracion)
    VALUES (
        p_usuario_id,
        CONCAT('QR-COLONIA-', p_usuario_id, '-', UNIX_TIMESTAMP()),
        p_token,
        DATE_ADD(NOW(), INTERVAL 1 YEAR)
    )
    ON DUPLICATE KEY UPDATE
        codigo_qr = CONCAT('QR-COLONIA-', p_usuario_id, '-', UNIX_TIMESTAMP()),
        token_verificacion = p_token,
        fecha_expiracion = DATE_ADD(NOW(), INTERVAL 1 YEAR),
        activo = TRUE;
END//
DELIMITER ;

-- -------------------------------------------------
-- Función: Obtener saldo total usuario
-- -------------------------------------------------
DELIMITER //
CREATE FUNCTION fn_saldo_total_usuario(p_usuario_id INT) 
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_saldo DECIMAL(10,2);
    
    SELECT SUM(cp.total - COALESCE(p.total_pagado, 0)) INTO v_saldo
    FROM conceptos_pago cp
    LEFT JOIN (
        SELECT concepto_id, SUM(monto) as total_pagado
        FROM pagos
        WHERE usuario_id = p_usuario_id AND estado = 'pagado'
        GROUP BY concepto_id
    ) p ON cp.id = p.concepto_id
    WHERE cp.activo = TRUE;
    
    RETURN COALESCE(v_saldo, 0);
END//
DELIMITER ;

-- -------------------------------------------------
-- Usuarios con permisos (ejemplo para producción)
-- -------------------------------------------------
CREATE USER 'colonia_app_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON colonia_app.* TO 'colonia_app_user'@'localhost';
FLUSH PRIVILEGES;

-- Mostrar resumen
SELECT 'Base de datos creada exitosamente' as mensaje;
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT COUNT(*) as total_conceptos FROM conceptos_pago;
SELECT COUNT(*) as total_eventos FROM eventos;
