package com.example.demo.api;

import com.example.demo.entity.Celda;
import com.example.demo.entity.Mapa;
import com.example.demo.repository.CeldaRepository;
import com.example.demo.repository.MapaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mapa")
public class MapaRestController {

    private final MapaRepository mapaRepo;
    private final CeldaRepository celdaRepo;

    public MapaRestController(MapaRepository mapaRepo, CeldaRepository celdaRepo) {
        this.mapaRepo = mapaRepo;
        this.celdaRepo = celdaRepo;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<MapaResponse> list() {
        return mapaRepo.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<MapaResponse> getById(@PathVariable Long id) {
        return mapaRepo.findById(id)
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private MapaResponse toResponse(Mapa mapa) {
        List<Celda> celdas = celdaRepo.findByMapaId(mapa.getId());
        List<CeldaResponse> celdaDtos = celdas.stream()
                .sorted(Comparator.comparingInt(Celda::getY).thenComparingInt(Celda::getX))
                .map(c -> new CeldaResponse(c.getX(), c.getY(), c.getTipo()))
                .collect(Collectors.toList());
        return new MapaResponse(
                mapa.getId(),
                mapa.getNombre(),
                mapa.getFilas(),
                mapa.getColumnas(),
                celdaDtos
        );
    }

    public record MapaResponse(Long id, String nombre, int filas, int columnas, List<CeldaResponse> celdas) {}
    public record CeldaResponse(int x, int y, Celda.Tipo tipo) {}
}
