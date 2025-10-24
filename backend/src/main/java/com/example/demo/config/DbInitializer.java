package com.example.demo.config;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

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
    public void init() {
        // Sólo inicializar si no hay datos (idempotente)
        if (jugadorRepo.count() > 0 || modeloRepo.count() > 0 || barcoRepo.count() > 0) {
            return;
        }

        // Jugadores
        List<Jugador> jugadores = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            Jugador j = new Jugador("Jugador " + i, "jugador" + i + "@correo.com");
            jugadores.add(jugadorRepo.save(j));
        }

        // Modelos
        String[] colores = {"Rojo", "Azul", "Verde", "Amarillo", "Negro", "Blanco", "Gris", "Naranja", "Morado", "Café"};
        List<ModeloBarco> modelos = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            ModeloBarco m = new ModeloBarco("Modelo " + i, colores[(i-1) % colores.length]);
            modelos.add(modeloRepo.save(m));
        }

        Mapa mapa = new Mapa(10, 10);
        mapa = mapaRepo.save(mapa);
        for (int x = 0; x < 10; x++) {
            for (int y = 0; y < 10; y++) {
                Celda.Tipo tipo = Celda.Tipo.AGUA;
                // bordes como paredes
                if (x == 0 || y == 0 || x == 9 || y == 9) tipo = Celda.Tipo.PARED;
                celdaRepo.save(new Celda(x, y, tipo, mapa));
            }
        }
        // partida y meta
        Celda partida = new Celda(1, 1, Celda.Tipo.PARTIDA, mapa);
        Celda meta = new Celda(8, 8, Celda.Tipo.META, mapa);
        celdaRepo.save(partida);
        celdaRepo.save(meta);

        // 50 barcos: 10 por jugador, modelos rotando
        Random rnd = new Random();
        int idx = 0;
        for (Jugador j : jugadores) {
            for (int b = 0; b < 10; b++) {
                Barco barco = new Barco();
                barco.setPosX(1 + rnd.nextInt(2)); // cerca de la partida
                barco.setPosY(1 + rnd.nextInt(2));
                barco.setVelocidadX(0);
                barco.setVelocidadY(0);
                barco.setJugador(j);
                barco.setModelo(modelos.get(idx % modelos.size()));
                barcoRepo.save(barco);
                idx++;
            }
        }
    }
}
