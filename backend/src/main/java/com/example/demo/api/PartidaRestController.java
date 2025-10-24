package com.example.demo.api;

import com.example.demo.entity.Barco;
import com.example.demo.entity.Partida;
import com.example.demo.service.PartidaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partidas")
public class PartidaRestController {

    private final PartidaService partidaService;

    public PartidaRestController(PartidaService partidaService) {
        this.partidaService = partidaService;
    }

    @PostMapping
    public ResponseEntity<Partida> crear(@RequestParam(required = false) String nombre) {
        return ResponseEntity.ok(partidaService.createPartida(nombre));
    }

    @GetMapping
    public ResponseEntity<List<Partida>> listar() {
        return ResponseEntity.ok(partidaService.listPartidas());
    }

    @GetMapping("/{id}/events")
    public SseEmitter events(@PathVariable Long id) {
        return partidaService.registerEmitter(id);
    }

    @PutMapping("/barcos/{barcoId}/pos")
    public ResponseEntity<?> moverBarco(@PathVariable Long barcoId, @RequestBody Map<String, Integer> body) {
        Integer x = body.get("x");
        Integer y = body.get("y");
        return partidaService.updateBarcoPos(barcoId, x, y)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/barcos/{barcoId}/vel")
    public ResponseEntity<?> setVel(@PathVariable Long barcoId, @RequestBody Map<String, Integer> body) {
        Integer vx = body.get("vx");
        Integer vy = body.get("vy");
        return partidaService.updateBarcoVel(barcoId, vx, vy)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}