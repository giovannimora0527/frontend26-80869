-- =====================================================================
-- Script de base de datos - Clinica Veterinaria
-- Segundo Parcial de Programacion Web
-- =====================================================================
-- Este script crea la base de datos `clinica` con sus tablas y datos de
-- ejemplo. Al final incluye los ALTER TABLE con las columnas nuevas que
-- requiere esta version (historia clinica completa, anotaciones con
-- observacion/diagnostico y formulas con frecuencia/duracion/activo).
--
-- Nota: el backend tiene spring.jpa.hibernate.ddl-auto=update, por lo que
-- Hibernate tambien agrega automaticamente esas columnas si no existen. Los
-- ALTER TABLE de abajo se dejan documentados por si se desea aplicarlos
-- manualmente.
-- =====================================================================

CREATE DATABASE  IF NOT EXISTS `clinica` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `clinica`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `anotacion_historia`
--
DROP TABLE IF EXISTS `anotacion_historia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anotacion_historia` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `historia_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `descripcion` text NOT NULL,
  `observacion` text DEFAULT NULL,
  `diagnostico` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `anotacion_historia` WRITE;
/*!40000 ALTER TABLE `anotacion_historia` DISABLE KEYS */;
INSERT INTO `anotacion_historia` (`id`,`historia_id`,`medico_id`,`fecha`,`descripcion`) VALUES
 (1,1,3,'2024-09-01 08:30:00','Paciente asiste a consulta de control general. Se recomienda continuar con controles periodicos.'),
 (2,2,3,'2025-09-02 09:30:00','Se realiza valoracion medica general. No se encuentran alteraciones importantes.'),
 (3,3,2,'2024-09-03 10:30:00','Paciente presenta molestias generales. Se recomienda seguimiento de los sintomas.'),
 (4,4,4,'2026-09-04 09:00:00','Se realiza revision medica. Paciente estable y sin novedades relevantes.'),
 (5,5,5,'2024-09-05 09:30:00','Se realiza valoracion y control. Se recomienda continuar con las indicaciones medicas.');
/*!40000 ALTER TABLE `anotacion_historia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cita`
--
DROP TABLE IF EXISTS `cita`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cita` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `mascota_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `fecha_hora` datetime NOT NULL,
  `estado` varchar(20) NOT NULL,
  `motivo` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cita` WRITE;
/*!40000 ALTER TABLE `cita` DISABLE KEYS */;
INSERT INTO `cita` VALUES
 (1,1,1,3,'2026-10-02 15:00:00','ATENDIDA','Control de rutina - completado'),
 (2,2,11,3,'2026-12-21 14:30:00','PROGRAMADA','Consulta odontologica'),
 (3,3,3,2,'2026-12-20 18:30:00','PROGRAMADA','Consulta general'),
 (4,1,1,3,'2026-12-01 10:00:00','PROGRAMADA','Control de rutina');
/*!40000 ALTER TABLE `cita` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente`
--
DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `cliente_id` bigint(20) unsigned NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `tipo_documento` varchar(10) NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `genero` char(1) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `activo` tinyint(1) NOT NULL,
  PRIMARY KEY (`cliente_id`),
  UNIQUE KEY `id` (`cliente_id`),
  UNIQUE KEY `numero_documento` (`numero_documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
INSERT INTO `cliente` VALUES
 (1,1,'CC','100000001','Juan','Perez Lopez','1990-05-12','M','3001112233','Calle 10 #12-34',1),
 (2,2,'CC','100000002','Maria','Gomez Rodriguez','1985-08-22','F','3012223344','Carrera 15 #20-10',1),
 (3,3,'TI','900000003','Andres','Martinez Diaz','2005-03-18','M','3023334455','Av. Boyaca #45-67',1),
 (4,4,'CC','100000004','Laura','Hernandez Ruiz','1992-12-01','F','3034445566','Calle 5 #7-89',1),
 (5,5,'CC','100000005','Carlos','Ramirez Torres','1980-07-30','M','3045556677','Carrera 8 #15-20',1),
 (6,6,'CE','200000006','Ana','Castro Moreno','1998-01-25','F','3056667788','Diagonal 12 #25-50',1),
 (7,7,'CC','100000007','Santiago','Moreno Vargas','1995-09-14','M','3067778899','Transversal 20 #40-22',1),
 (8,8,'CC','100000008','Paula','Rios Fernandez','1987-11-10','F','3078889900','Calle 22 #18-45',1),
 (9,9,'TI','900000009','Felipe','Gutierrez Mendez','2006-06-06','M','3089990011','Carrera 50 #60-12',1),
 (10,10,'CC','100000010','Diana','Salazar Pena','1993-04-21','F','3090001122','Av. Caracas #100-50',1);
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `especializacion`
--
DROP TABLE IF EXISTS `especializacion`;
CREATE TABLE `especializacion` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `codigo_especializacion` varchar(10) NOT NULL DEFAULT '""',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  UNIQUE KEY `codigo_especializacion_UNIQUE` (`codigo_especializacion`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `especializacion` WRITE;
INSERT INTO `especializacion` VALUES
 (1,'Cardiologia','Enfermedades del corazon.','COD_01'),
 (2,'Neurologia','Trastornos del sistema nervioso.','COD_02'),
 (3,'Pediatria','Atencion de cachorros y crias.','COD_03'),
 (4,'Oncologia','Tratamiento de distintos tipos de cancer.','COD_04'),
 (5,'Dermatologia','Enfermedades de la piel.','COD_05'),
 (6,'Ginecologia','Sistema reproductor.','COD_06'),
 (7,'Urologia','Sistema urinario.','COD_07'),
 (8,'Cirugia','Procedimientos quirurgicos.','COD_08'),
 (9,'Oftalmologia','Salud ocular.','COD_09'),
 (10,'Odontologia','Salud dental.','COD_10');
UNLOCK TABLES;

--
-- Table structure for table `formula_medica`
--
DROP TABLE IF EXISTS `formula_medica`;
CREATE TABLE `formula_medica` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cita_id` int(11) NOT NULL,
  `medicamento_id` int(11) NOT NULL,
  `dosis` text NOT NULL,
  `frecuencia` varchar(100) DEFAULT NULL,
  `duracion` varchar(100) DEFAULT NULL,
  `indicaciones` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion_registro` datetime NOT NULL,
  `fecha_actualizacion_registro` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `formula_medica` WRITE;
INSERT INTO `formula_medica` (`id`,`cita_id`,`medicamento_id`,`dosis`,`frecuencia`,`duracion`,`indicaciones`,`activo`,`fecha_creacion_registro`) VALUES
 (1,1,5,'800 mg','Cada 12 horas','7 dias','Tomar despues de las comidas',1,'2026-10-02 15:17:32'),
 (2,3,2,'500 mg','Cada 8 horas','5 dias','Tomar con abundante liquido',1,'2026-12-20 18:52:42');
UNLOCK TABLES;

--
-- Table structure for table `historia_medica`
--
DROP TABLE IF EXISTS `historia_medica`;
CREATE TABLE `historia_medica` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `paciente_id` int(11) NOT NULL,
  `cita_id` int(11) DEFAULT NULL,
  `medico_id` int(11) DEFAULT NULL,
  `motivo` text DEFAULT NULL,
  `diagnostico` text DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `estado` varchar(20) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `historia_medica` WRITE;
INSERT INTO `historia_medica` (`id`,`paciente_id`,`cita_id`,`medico_id`,`motivo`,`diagnostico`,`observaciones`,`estado`,`fecha_creacion`) VALUES
 (1,1,1,3,'Control de rutina','Paciente sano','Continuar controles','ATENDIDA','2026-10-02 15:00:00'),
 (2,2,NULL,3,'Valoracion general','Sin alteraciones','Seguimiento semestral','ACTIVA','2025-09-02 09:00:00'),
 (3,3,3,2,'Consulta general','Molestias leves','Observar sintomas','ACTIVA','2024-09-03 10:00:00'),
 (4,4,NULL,4,'Revision','Estable','Sin novedades','ACTIVA','2026-09-04 08:30:00'),
 (5,5,NULL,5,'Control','Favorable','Continuar indicaciones','ACTIVA','2024-09-05 09:00:00');
UNLOCK TABLES;

--
-- Table structure for table `mascota`
--
DROP TABLE IF EXISTS `mascota`;
CREATE TABLE `mascota` (
  `mascota_id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_mascota` varchar(100) NOT NULL,
  `edad` int(11) NOT NULL,
  `raza_id` int(11) NOT NULL,
  `fecha_registro` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  `cliente_id` int(11) NOT NULL,
  PRIMARY KEY (`mascota_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `mascota` WRITE;
INSERT INTO `mascota` VALUES
 (1,'Max',3,1,'2026-08-01 08:15:00','2026-08-15 10:20:00',1),
 (2,'Luna',2,2,'2026-08-01 09:30:00','2026-08-16 11:00:00',2),
 (3,'Rocky',5,1,'2026-08-02 10:00:00',NULL,3),
 (4,'Bella',4,2,'2026-08-02 11:20:00','2026-08-17 09:15:00',4),
 (5,'Toby',1,1,'2026-08-03 08:45:00',NULL,5),
 (6,'Nala',6,2,'2026-08-03 14:10:00','2026-08-18 14:30:00',6),
 (7,'Coco',3,1,'2026-08-04 09:00:00',NULL,7),
 (8,'Simba',2,2,'2026-08-04 15:30:00','2026-08-19 16:00:00',8),
 (9,'Milo',7,1,'2026-08-05 10:15:00',NULL,9),
 (10,'Maya',4,2,'2026-08-05 16:00:00','2026-08-20 10:00:00',10),
 (11,'Thor',5,1,'2026-08-06 08:30:00',NULL,2);
UNLOCK TABLES;

--
-- Table structure for table `medicamento`
--
DROP TABLE IF EXISTS `medicamento`;
CREATE TABLE `medicamento` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `presentacion` varchar(100) DEFAULT NULL,
  `fecha_compra` date NOT NULL,
  `fecha_vence` date NOT NULL,
  `fecha_creacion_registro` datetime NOT NULL,
  `fecha_modificacion_registro` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `medicamento` WRITE;
INSERT INTO `medicamento` VALUES
 (2,'Paracetamol','Analgesico y antipiretico','Tabletas 500mg','2024-06-01','2027-06-01','2025-09-11 20:56:13',NULL),
 (5,'Paracetamol Inyectable','Analgesico y antipiretico','Ampolla 1200mg','2024-06-01','2027-06-01','2025-09-13 10:58:40',NULL),
 (6,'Paracetamol Solucion','Analgesico y antipiretico','Jarabe 800mg','2024-06-01','2027-06-01','2025-09-13 12:27:12',NULL);
UNLOCK TABLES;

--
-- Table structure for table `medico`
--
DROP TABLE IF EXISTS `medico`;
CREATE TABLE `medico` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tipo_documento` varchar(10) NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `registro_profesional` varchar(50) NOT NULL,
  `especializacion_id` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_documento` (`numero_documento`),
  UNIQUE KEY `registro_profesional` (`registro_profesional`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `medico` WRITE;
INSERT INTO `medico` VALUES
 (1,'CC','1001001001','Juan','Perez Gomez','3001112233','RP-1001',8),
 (2,'CC','1001001002','Maria','Rodriguez Lopez','3001112234','RP-1002',2),
 (3,'CC','1001001003','Carlos','Martinez Ruiz','3001112235','RP-1003',3),
 (4,'CC','1001001004','Laura','Fernandez Diaz','3001112236','RP-1004',4),
 (5,'CC','1001001005','Andres','Ramirez Soto','3001112237','RP-1005',5),
 (6,'CC','1001001006','Diana','Gomez Torres','3001112238','RP-1006',6),
 (7,'CC','1001001007','Ricardo','Jimenez Vargas','3001112239','RP-1007',7),
 (8,'CC','1001001008','Patricia','Hernandez Rios','3001112240','RP-1008',8),
 (9,'CC','1001001009','Santiago','Morales Castro','3001112241','RP-1009',9),
 (10,'CC','1001001010','Natalia','Garcia Mendoza','3001112242','RP-1010',10);
UNLOCK TABLES;

--
-- Table structure for table `raza`
--
DROP TABLE IF EXISTS `raza`;
CREATE TABLE `raza` (
  `raza_id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `especie` varchar(100) NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`raza_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `raza` WRITE;
INSERT INTO `raza` VALUES
 (1,'Gato','Felino','2026-01-01 00:00:00','2026-01-01 00:00:00'),
 (2,'Perro','Canino','2026-01-01 00:00:00','2026-01-01 00:00:00');
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--
DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` text DEFAULT NULL,
  `rol` varchar(30) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT 1,
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `usuario` WRITE;
INSERT INTO `usuario` VALUES
 (29,'gmora','8f8439bd01556aace5fd2b93ea927958','ADMIN','2025-11-06 20:59:54',1,'gmora@gmail.com'),
 (33,'juan.perez','hash_001','CLIENTE','2026-01-10 08:00:00',1,'juan.perez@gmail.com'),
 (34,'maria.gomez','hash_002','CLIENTE','2026-01-11 09:00:00',1,'maria.gomez@gmail.com');
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- =====================================================================
-- ALTER TABLE (por si se parte del script original del profesor y solo se
-- quieren agregar las columnas nuevas sin recrear las tablas).
-- Ejecutar solo si las columnas no existen todavia.
--
-- =====================================================================
-- ALTER TABLE `historia_medica`
--   ADD COLUMN `cita_id` int(11) DEFAULT NULL,
--   ADD COLUMN `medico_id` int(11) DEFAULT NULL,
--   ADD COLUMN `motivo` text DEFAULT NULL,
--   ADD COLUMN `diagnostico` text DEFAULT NULL,
--   ADD COLUMN `observaciones` text DEFAULT NULL,
--   ADD COLUMN `estado` varchar(20) DEFAULT NULL;
--
-- ALTER TABLE `anotacion_historia`
--   ADD COLUMN `observacion` text DEFAULT NULL,
--   ADD COLUMN `diagnostico` text DEFAULT NULL;
--
-- ALTER TABLE `formula_medica`
--   ADD COLUMN `frecuencia` varchar(100) DEFAULT NULL,
--   ADD COLUMN `duracion` varchar(100) DEFAULT NULL,
--   ADD COLUMN `activo` tinyint(1) DEFAULT 1;
