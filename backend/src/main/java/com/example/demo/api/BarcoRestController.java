package com.example.demo.api;

import com.example.demo.entity.Barco;
import com.example.demo.entity.Jugador;
import com.example.demo.entity.ModeloBarco;
import com.example.demo.repository.BarcoRepository;
import com.example.demo.repository.JugadorRepository;
import com.example.demo.repository.ModeloBarcoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/barcos")
public class BarcoRestController {

    private final BarcoRepository barcoRepo;
    private final JugadorRepository jugadorRepo;
    private final ModeloBarcoRepository modeloRepo;

    public BarcoRestController(BarcoRepository barcoRepo,
                               JugadorRepository jugadorRepo,
                               ModeloBarcoRepository modeloRepo) {
        this.barcoRepo = barcoRepo;
        this.jugadorRepo = jugadorRepo;
        this.modeloRepo = modeloRepo;
    }

    @GetMapping
    public List<Barco> list() {
        return barcoRepo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Barco> get(@PathVariable Long id) {
        return barcoRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Para crear desde Angular enviando ids relacionados
    public static record BarcoPayload(
            Integer posX, Integer posY, Integer velocidadX, Integer velocidadY,
            Long jugadorId, Long modeloId) {}

    @PostMapping
    public ResponseEntity<?> create(@RequestBody BarcoPayload body) {
        Jugador jugador = jugadorRepo.findById(body.jugadorId()).orElse(null);
        ModeloBarco modelo = modeloRepo.findById(body.modeloId()).orElse(null);
        if (jugador == null || modelo == null) return ResponseEntity.badRequest().body("jugadorId o modeloId inválidos");

        Barco b = new Barco();
        b.setPosX(body.posX() == null ? 0 : body.posX());
        b.setPosY(body.posY() == null ? 0 : body.posY());
        b.setVelocidadX(body.velocidadX() == null ? 0 : body.velocidadX());
        b.setVelocidadY(body.velocidadY() == null ? 0 : body.velocidadY());
        b.setJugador(jugador);
        b.setModelo(modelo);

        Barco saved = barcoRepo.save(b);
        return ResponseEntity.created(URI.create("/api/barcos/" + saved.getId())).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody BarcoPayload body) {
        return barcoRepo.findById(id).map(existing -> {
            if (body.posX() != null) existing.setPosX(body.posX());
            if (body.posY() != null) existing.setPosY(body.posY());
            if (body.velocidadX() != null) existing.setVelocidadX(body.velocidadX());
            if (body.velocidadY() != null) existing.setVelocidadY(body.velocidadY());

            if (body.jugadorId() != null) {
                Jugador j = jugadorRepo.findById(body.jugadorId()).orElse(null);
                if (j == null) return ResponseEntity.badRequest().body("jugadorId inválido");
                existing.setJugador(j);
            }
            if (body.modeloId() != null) {
                ModeloBarco m = modeloRepo.findById(body.modeloId()).orElse(null);
                if (m == null) return ResponseEntity.badRequest().body("modeloId inválido");
                existing.setModelo(m);
            }
            return ResponseEntity.ok(barcoRepo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!barcoRepo.existsById(id)) return ResponseEntity.notFound().build();
        barcoRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
