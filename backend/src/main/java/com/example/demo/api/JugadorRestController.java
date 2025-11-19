package com.example.demo.api;

import com.example.demo.entity.Jugador;
import com.example.demo.repository.JugadorRepository;
import com.example.demo.service.JugadorAccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/jugadores")
public class JugadorRestController {

    private final JugadorRepository repo;
    private final JugadorAccountService jugadorAccountService;

    public JugadorRestController(JugadorRepository repo,
                                 JugadorAccountService jugadorAccountService) {
        this.repo = repo;
        this.jugadorAccountService = jugadorAccountService;
    }

    @GetMapping
    public List<Jugador> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Jugador> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Jugador> create(@RequestBody Jugador jugador) {
        Jugador saved = repo.save(jugador);
        jugadorAccountService.ensureAccountFor(saved);
        return ResponseEntity.created(URI.create("/api/jugadores/" + saved.getId())).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Jugador> update(@PathVariable Long id, @RequestBody Jugador jugador) {
        return repo.findById(id).map(existing -> {
            existing.setNombre(jugador.getNombre());
            existing.setEmail(jugador.getEmail());
            Jugador updated = repo.save(existing);
            jugadorAccountService.ensureAccountFor(updated);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        jugadorAccountService.removeAccountForJugadorId(id);
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
