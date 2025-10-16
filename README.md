# Proyecto Semestral – Regata Online

## Descripción
**Regata Online** es un juego multijugador de carreras por turnos donde barcos navegan a través de un mapa representado como una cuadrícula. Los jugadores deben mover sus barcos evitando obstáculos y tratando de llegar a la meta antes que los demás.

El sistema está desarrollado en **Spring Boot** bajo un enfoque multipágina (MPA) utilizando **Spring MVC, Thymeleaf y JPA**. Esta primera entrega incluye las funcionalidades CRUD para Jugadores, Modelos de Barco y Barcos, así como la inicialización automática de datos en la base de datos.

---

Video de sustentación #1 - https://youtu.be/SdSmSomyeBI

---

## Modelo Entidad–Relación
El siguiente diagrama muestra el modelo entidad–relación diseñado para la aplicación:

![Modelo Entidad Relación](Entidad%20relacion%20Desarrollo%20We.jpg)

### Entidades principales
- **Jugador**: Contiene la información del jugador y los barcos que controla.
- **ModeloBarco**: Define características de un modelo de barco (nombre y color).
- **Barco**: Representa un barco en la carrera, asociado a un jugador y un modelo, con posición y velocidad.
- **Mapa**: Representa el tablero de juego definido por filas y columnas.
- **Celda**: Cada casilla del mapa que puede ser agua, pared, punto de partida o meta.

---

## Funcionalidades implementadas
- CRUD de **Jugadores**: crear, listar, editar y eliminar jugadores.
- CRUD de **Modelos de Barco**: crear, listar, editar y eliminar modelos.
- CRUD de **Barcos**: creación y gestión de barcos vinculados a un jugador y a un modelo.
- Inicialización automática de datos mediante `DbInitializer` (5 jugadores, 10 modelos de barco y 50 barcos).

---

## Mockups de la Aplicación

### Panel de Administración
![Panel de Administración](mockups%20regata%20online_pages-to-jpg-0008.jpg)

### Vista del Mapa
![Vista del Mapa](mockups%20regata%20online_pages-to-jpg-0001.jpg)

### Crear Barco
![Crear Barco](mockups%20regata%20online_pages-to-jpg-0002.jpg)

### Lista de Barcos
![Lista de Barcos](mockups%20regata%20online_pages-to-jpg-0003.jpg)

### Crear Jugador
![Crear Jugador](mockups%20regata%20online_pages-to-jpg-0004.jpg)

### Lista de Jugadores
![Lista de Jugadores](mockups%20regata%20online_pages-to-jpg-0005.jpg)

### Crear Modelo de Barco
![Crear Modelo de Barco](mockups%20regata%20online_pages-to-jpg-0006.jpg)

### Lista de Modelos de Barco
![Lista de Modelos de Barco](mockups%20regata%20online_pages-to-jpg-0007.jpg)

---

## Historias de Usuario

### Jugador
- **Registrar un jugador**: Como administrador quiero registrar un nuevo jugador con su nombre y correo electrónico para que pueda participar en la carrera.
- **Listar jugadores**: Como administrador quiero ver la lista de jugadores registrados para gestionar fácilmente quiénes están disponibles.
- **Editar un jugador**: Como administrador quiero modificar la información de un jugador existente para mantener sus datos actualizados.
- **Eliminar un jugador**: Como administrador quiero eliminar un jugador del sistema para que no participe en el juego.

### Modelo de Barco
- **Registrar un modelo**: Como administrador quiero crear nuevos modelos de barco con nombre y color para que los jugadores puedan utilizarlos.  
- **Listar modelos**: Como administrador quiero ver los modelos de barco disponibles para gestionarlos.
- **Editar un modelo**: Como administrador quiero actualizar el nombre o color de un modelo existente.
- **Eliminar un modelo**: Como administrador quiero eliminar un modelo de barco para que ya no esté disponible.

### Barco
- **Crear un barco**: Como administrador quiero crear un barco asociado a un jugador y a un modelo para que pueda participar en la carrera.  
- **Listar barcos**: Como administrador quiero visualizar todos los barcos creados con sus detalles de jugador y modelo.
- **Editar un barco**: Como administrador quiero modificar la información de un barco (posición, velocidad, jugador o modelo).
- **Eliminar un barco**: Como administrador quiero eliminar un barco del sistema.

### Mapa y Celdas
- **Definir un mapa**: Como administrador quiero definir el tamaño del mapa y sus celdas para establecer el terreno de juego.
- **Configurar celdas especiales**: Como administrador quiero marcar celdas como pared, partida o meta para definir obstáculos y objetivos.

---

## Ejecución del proyecto
1. Clonar este repositorio.
2. Compilar y ejecutar con Maven:
   ```bash
   mvn spring-boot:run
