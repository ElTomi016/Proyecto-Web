package com.example.demo.api;

import com.example.demo.entity.Mapa;
import com.example.demo.repository.MapaRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mapa")
public class MapaRestController {

    private final MapaRepository mapaRepo;

    public MapaRestController(MapaRepository mapaRepo) {
        this.mapaRepo = mapaRepo;
    }

    @GetMapping
    public List<Mapa> list() {
        return mapaRepo.findAll(); // devuelve mapa(s) con sus celdas
    }
}
