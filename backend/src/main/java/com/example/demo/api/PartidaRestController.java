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
        Partida partida = partidaService.createPartida(nombre, barcos);
        Map<String, Object> response = Map.of(
                "id", partida.getId(),
                "nombre", partida.getNombre(),
                "order", partidaService.getBoatOrderForPartida(partida.getId())
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<Partida>> listar() {
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
