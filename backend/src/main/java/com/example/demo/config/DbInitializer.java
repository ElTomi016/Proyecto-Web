package com.example.demo.config;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class DbInitializer {

    private final JugadorRepository jugadorRepo;
    private final ModeloBarcoRepository modeloRepo;
    private final BarcoRepository barcoRepo;
    private final MapaRepository mapaRepo;
    private final CeldaRepository celdaRepo;

    public DbInitializer(JugadorRepository jugadorRepo,
                         ModeloBarcoRepository modeloRepo,
                         BarcoRepository barcoRepo,
                         MapaRepository mapaRepo,
                         CeldaRepository celdaRepo) {
        this.jugadorRepo = jugadorRepo;
        this.modeloRepo = modeloRepo;
        this.barcoRepo = barcoRepo;
        this.mapaRepo = mapaRepo;
        this.celdaRepo = celdaRepo;
    }

    @PostConstruct
    @Transactional
    public void init() {
        seedJugadores();
        seedModelos();
        seedMapas();
        seedBarcos();
    }

    private void seedJugadores() {
        if (jugadorRepo.count() > 0) {
            return;
        }
        List<Jugador> jugadores = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            Jugador j = new Jugador("Jugador " + i, "jugador" + i + "@correo.com");
            jugadores.add(j);
        }
        jugadorRepo.saveAll(jugadores);
    }

    private void seedModelos() {
        if (modeloRepo.count() > 0) {
            return;
        }
        String[] colores = {"Rojo", "Azul", "Verde", "Amarillo", "Negro", "Blanco", "Gris", "Naranja", "Morado", "Cafe"};
        List<ModeloBarco> modelos = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            ModeloBarco m = new ModeloBarco("Modelo " + i, colores[(i - 1) % colores.length]);
            modelos.add(m);
        }
        modeloRepo.saveAll(modelos);
    }

    private void seedMapas() {
        mapaRepo.findAll().stream()
                .filter(m -> m.getNombre() == null || m.getNombre().isBlank())
                .findFirst()
                .ifPresent(existing -> {
                    existing.setNombre("Estrecho Clásico");
                    mapaRepo.save(existing);
                });

        // Mapa 1: Estrecho clásico, pasillos con giros
        String[] estrechoClasico = {
                "############",
                "#S....#....#",
                "#S.##.#.##.#",
                "#....#....M#",
                "###.###.####",
                "#....#.....#",
                "#.####.###.#",
                "#....#.#...#",
                "##.###.#.###",
                "#....#.#...#",
                "#....#.....#",
                "############"
        };

        // Mapa 2: Archipiélago con múltiples rutas
        String[] archipielagoCentral = {
                "##############",
                "#S....#..#...#",
                "###.###..###.#",
                "#...#....#...#",
                "#.#.######.#.#",
                "#.#....##.#M.#",
                "#.####.#.###.#",
                "#.....#...#..#",
                "#.#S######...#",
                "##############"
        };

        // Mapa 3: Canal abierto con obstáculos dispersos
        String[] canalTormentoso = {
                "################",
                "#S.....#......M#",
                "###.###.####.###",
                "#...#.......#..#",
                "#.#.#.#####.#..#",
                "#.#.#.....#.#..#",
                "#.#.#####.#.#..#",
                "#.#.....#.#.#..#",
                "#.#####.#.#.#..#",
                "#.....#.#.#...##",
                "#S###.#.#.###S##",
                "################"
        };

        upsertMap("Estrecho Clásico", estrechoClasico);
        upsertMap("Archipiélago Central", archipielagoCentral);
        upsertMap("Canal Tormentoso", canalTormentoso);
    }

    private void seedBarcos() {
        if (barcoRepo.count() > 0) {
            return;
        }
        List<Jugador> jugadores = jugadorRepo.findAll();
        if (jugadores.isEmpty()) {
            return;
        }
        List<ModeloBarco> modelos = modeloRepo.findAll();
        if (modelos.isEmpty()) {
            return;
        }

        Random rnd = new Random();
        int idx = 0;
        for (Jugador jugador : jugadores) {
            for (int b = 0; b < 10; b++) {
                Barco barco = new Barco();
                barco.setPosX(2 + rnd.nextInt(3));
                barco.setPosY(2 + rnd.nextInt(3));
                barco.setVelocidadX(0);
                barco.setVelocidadY(0);
                barco.setJugador(jugador);
                barco.setModelo(modelos.get(idx % modelos.size()));
                barcoRepo.save(barco);
                idx++;
            }
        }
    }

    private void upsertMap(String nombre, String[] layout) {
        if (layout == null || layout.length == 0) {
            return;
        }
        int filas = layout.length;
        int columnas = layout[0].length();
        for (String row : layout) {
            if (row.length() != columnas) {
                throw new IllegalArgumentException("Todas las filas del mapa deben tener el mismo tamaño: " + nombre);
            }
        }

        Mapa mapa = mapaRepo.findByNombre(nombre)
                .orElseGet(() -> new Mapa(nombre, filas, columnas));
        mapa.setFilas(filas);
        mapa.setColumnas(columnas);
        mapa.setNombre(nombre);
        mapa = mapaRepo.save(mapa);

        if (mapa.getId() != null) {
            List<Celda> existing = celdaRepo.findByMapaId(mapa.getId());
            if (!existing.isEmpty()) {
                celdaRepo.deleteAll(existing);
            }
        }

        List<Celda> celdas = new ArrayList<>();
        for (int y = 0; y < filas; y++) {
            String row = layout[y];
            for (int x = 0; x < columnas; x++) {
                char symbol = Character.toUpperCase(row.charAt(x));
                Celda.Tipo tipo = switch (symbol) {
                    case '#', 'X' -> Celda.Tipo.PARED;
                    case 'S' -> Celda.Tipo.PARTIDA;
                    case 'M' -> Celda.Tipo.META;
                    default -> Celda.Tipo.AGUA;
                };
                celdas.add(new Celda(x, y, tipo, mapa));
            }
        }
        celdaRepo.saveAll(celdas);
    }
}
