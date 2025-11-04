package com.example.demo.api;

import com.example.demo.dto.PartidaCreateRequest;
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
    public ResponseEntity<Map<String, Object>> crear(@RequestBody(required = false) PartidaCreateRequest body) {
        String nombre = body != null ? body.nombre() : null;
        List<Long> barcos = body != null && body.barcos() != null ? body.barcos() : List.of();
        Long mapaId = body != null ? body.mapaId() : null;
        Partida partida = partidaService.createPartida(nombre, barcos, mapaId);
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", partida.getId());
        response.put("nombre", partida.getNombre());
        response.put("order", partidaService.getBoatOrderForPartida(partida.getId()));
        if (partida.getMapa() != null) {
            response.put("mapaId", partida.getMapa().getId());
            response.put("mapaNombre", partida.getMapa().getNombre());
            response.put("mapaFilas", partida.getMapa().getFilas());
            response.put("mapaColumnas", partida.getMapa().getColumnas());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        return ResponseEntity.ok(partidaService.listPartidas());
    }

    @GetMapping("/{id}/events")
    public SseEmitter events(@PathVariable Long id) {
        return partidaService.registerEmitter(id);
    }

    @GetMapping("/{id}/state")
    public ResponseEntity<Map<String, Object>> currentState(@PathVariable Long id) {
        return ResponseEntity.ok(partidaService.getCurrentStateSnapshot(id));
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
