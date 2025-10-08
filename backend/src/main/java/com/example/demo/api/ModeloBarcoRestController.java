package com.example.demo.api;

import com.example.demo.entity.ModeloBarco;
import com.example.demo.repository.ModeloBarcoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/modelos")
public class ModeloBarcoRestController {

    private final ModeloBarcoRepository repo;

    public ModeloBarcoRestController(ModeloBarcoRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<ModeloBarco> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ModeloBarco> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ModeloBarco> create(@RequestBody ModeloBarco modelo) {
        ModeloBarco saved = repo.save(modelo);
        return ResponseEntity.created(URI.create("/api/modelos/" + saved.getId())).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ModeloBarco> update(@PathVariable Long id, @RequestBody ModeloBarco modelo) {
        return repo.findById(id).map(existing -> {
            existing.setNombreModelo(modelo.getNombreModelo());
            existing.setColor(modelo.getColor());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
