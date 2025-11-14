package com.example.demo.api;

import com.example.demo.dto.PartidaCreateRequest;
import com.example.demo.entity.Partida;
import com.example.demo.entity.Role;
import com.example.demo.repository.BarcoRepository;
import com.example.demo.service.PartidaService;
import com.example.demo.security.CurrentUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partidas")
public class PartidaRestController {

    private final PartidaService partidaService;
    private final CurrentUserService currentUserService;
    private final BarcoRepository barcoRepository;

    public PartidaRestController(PartidaService partidaService,
                                 CurrentUserService currentUserService,
                                 BarcoRepository barcoRepository) {
        this.partidaService = partidaService;
        this.currentUserService = currentUserService;
        this.barcoRepository = barcoRepository;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','JUGADOR')")
    public ResponseEntity<Map<String, Object>> crear(@RequestBody(required = false) PartidaCreateRequest body) {
        String nombre = body != null ? body.nombre() : null;
        List<Long> barcos = body != null && body.barcos() != null ? body.barcos() : List.of();
        Long mapaId = body != null ? body.mapaId() : null;
        List<Long> sanitized = sanitizeBoatSelection(barcos);
        if (!currentUserService.hasRole(Role.ADMIN) && sanitized.isEmpty()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Solo puedes crear partidas con tu propio barco"));
        }
        Partida partida = partidaService.createPartida(nombre, sanitized, mapaId);
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
    @PreAuthorize("hasAnyRole('ADMIN','JUGADOR')")
    public ResponseEntity<?> moverBarco(@PathVariable Long barcoId, @RequestBody Map<String, Integer> body) {
        if (!canControlBoat(barcoId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No puedes controlar este barco");
        }
        Integer x = body.get("x");
        Integer y = body.get("y");
        return partidaService.updateBarcoPos(barcoId, x, y)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/barcos/{barcoId}/vel")
    @PreAuthorize("hasAnyRole('ADMIN','JUGADOR')")
    public ResponseEntity<?> setVel(@PathVariable Long barcoId, @RequestBody Map<String, Integer> body) {
        if (!canControlBoat(barcoId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No puedes controlar este barco");
        }
        Integer vx = body.get("vx");
        Integer vy = body.get("vy");
        return partidaService.updateBarcoVel(barcoId, vx, vy)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private List<Long> sanitizeBoatSelection(List<Long> requested) {
        if (currentUserService.hasRole(Role.ADMIN)) {
            return requested == null
                    ? List.of()
                    : requested.stream()
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .toList();
        }
        return currentUserService.getJugador()
                .map(jugador -> {
                    List<Long> ownIds = barcoRepository.findIdsByJugadorId(jugador.getId());
                    if (ownIds.isEmpty()) {
                        return List.<Long>of();
                    }
                    if (requested != null) {
                        for (Long id : requested) {
                            if (id != null && ownIds.contains(id)) {
                                return List.of(id);
                            }
                        }
                    }
                    return List.of(ownIds.get(0));
                })
                .orElse(List.of());
    }

    private boolean canControlBoat(Long barcoId) {
        if (currentUserService.hasRole(Role.ADMIN)) {
            return true;
        }
        return currentUserService.getJugador()
                .flatMap(jugador -> barcoRepository.findById(barcoId)
                        .map(boat -> boat.getJugador() != null && jugador.getId().equals(boat.getJugador().getId())))
                .orElse(false);
    }
}
