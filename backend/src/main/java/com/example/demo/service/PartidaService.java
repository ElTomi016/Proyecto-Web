package com.example.demo.service;

import com.example.demo.entity.Barco;
import com.example.demo.entity.Celda;
import com.example.demo.entity.Mapa;
import com.example.demo.entity.Partida;
import com.example.demo.entity.PartidaBarco;
import com.example.demo.repository.BarcoRepository;
import com.example.demo.repository.CeldaRepository;
import com.example.demo.repository.PartidaBarcoRepository;
import com.example.demo.repository.MapaRepository;
import com.example.demo.repository.PartidaRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class PartidaService {

    private final BarcoRepository barcoRepo;
    private final PartidaRepository partidaRepo;
    private final MapaRepository mapaRepo;
    private final CeldaRepository celdaRepo;
    private final PartidaBarcoRepository partidaBarcoRepo;
    private final Map<Long, Long> partidaGanador = new ConcurrentHashMap<>();

    // emisores SSE por partida
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public PartidaService(BarcoRepository barcoRepo,
                          PartidaRepository partidaRepo,
                          MapaRepository mapaRepo,
                          CeldaRepository celdaRepo,
                          PartidaBarcoRepository partidaBarcoRepo) {
        this.barcoRepo = barcoRepo;
        this.partidaRepo = partidaRepo;
        this.mapaRepo = mapaRepo;
        this.celdaRepo = celdaRepo;
        this.partidaBarcoRepo = partidaBarcoRepo;
    }

    @Transactional
    public Partida createPartida(String nombre, List<Long> barcoIds, Long mapaId) {
        Partida p = new Partida(nombre == null ? "Partida" : nombre);
        p.setActiva(true);
        Mapa mapa = resolveMapaForPartida(mapaId);
        if (mapa != null) {
            p.setMapa(mapa);
        }
        Partida saved = partidaRepo.save(p);
        if (barcoIds != null && !barcoIds.isEmpty()) {
            assignBoatsToPartida(saved, barcoIds);
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPartidas() {
        return partidaRepo.findAll().stream()
                .map(p -> {
                    Long partidaId = p.getId();
                    Long winnerId = getWinnerId(partidaId);
                    Map<String, Object> info = new HashMap<>();
                    info.put("id", partidaId);
                    info.put("nombre", p.getNombre());
                    info.put("activa", p.isActiva());
                    info.put("barcos", getBoatOrder(partidaId));
                    info.put("winnerBarcoId", winnerId);
                    info.put("finalizada", p.getFinalizada());
                    Mapa mapa = p.getMapa();
                    if (mapa != null) {
                        info.put("mapaId", mapa.getId());
                        info.put("mapaNombre", mapa.getNombre());
                        info.put("mapaFilas", mapa.getFilas());
                        info.put("mapaColumnas", mapa.getColumnas());
                    }
                    return info;
                })
                .collect(Collectors.toList());
    }

    public List<Long> getBoatOrderForPartida(Long partidaId) {
        return new ArrayList<>(getBoatOrder(partidaId));
    }

    private Mapa resolveMapaForPartida(Long mapaId) {
        if (mapaId != null) {
            return mapaRepo.findById(mapaId).orElseGet(() -> mapaRepo.findAll().stream().findFirst().orElse(null));
        }
        return mapaRepo.findAll().stream().findFirst().orElse(null);
    }

    private Mapa getMapaForPartidaId(Long partidaId) {
        if (partidaId == null) {
            return null;
        }
        return partidaRepo.findById(partidaId)
                .map(p -> {
                    Mapa mapa = p.getMapa();
                    if (mapa == null) {
                        mapa = resolveMapaForPartida(null);
                        if (mapa != null) {
                            p.setMapa(mapa);
                            partidaRepo.save(p);
                        }
                    }
                    return mapa;
                })
                .orElse(null);
    }

    public SseEmitter registerEmitter(Long partidaId) {
        SseEmitter emitter = new SseEmitter(0L); // sin timeout
        emitters.computeIfAbsent(partidaId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> emitters.getOrDefault(partidaId, new CopyOnWriteArrayList<>()).remove(emitter));
        emitter.onTimeout(() -> emitters.getOrDefault(partidaId, new CopyOnWriteArrayList<>()).remove(emitter));

        sendStateToEmitter(partidaId, emitter);
        return emitter;
    }

    private int safeInt(Integer v) {
        return v == null ? 0 : v;
    }

    private Map<String, Object> toMap(Barco b) {
        Map<String, Object> m = new HashMap<>();
        try {
            m.put("id", b.getId());
            m.put("posX", b.getPosX());
            m.put("posY", b.getPosY());
            m.put("velX", b.getVelocidadX());
            m.put("velY", b.getVelocidadY());
            String label = null;
            if (b.getJugador() != null) {
                m.put("jugadorId", b.getJugador().getId());
                if (b.getJugador().getNombre() != null) {
                    m.put("jugadorNombre", b.getJugador().getNombre());
                    label = b.getJugador().getNombre();
                }
            }
            if (b.getModelo() != null) {
                m.put("modeloId", b.getModelo().getId());
                if (b.getModelo().getNombreModelo() != null) {
                    m.put("modeloNombre", b.getModelo().getNombreModelo());
                    if (label == null) label = b.getModelo().getNombreModelo();
                }
            }
            if (label == null && b.getId() != null) label = "Barco #" + b.getId();
            if (label != null) m.put("label", label);
        } catch (Exception ignored) {}
        return m;
    }

    private void emitToPid(Long pid, Object payload) {
        List<SseEmitter> list = emitters.getOrDefault(pid, new CopyOnWriteArrayList<>());
        for (SseEmitter e : new ArrayList<>(list)) {
            try {
                e.send(SseEmitter.event().name("state").data(payload));
            } catch (Exception ex) {
                list.remove(e);
            }
        }
    }

    private List<Long> getBoatOrder(Long partidaId) {
        if (partidaId == null) return List.of();
        return partidaBarcoRepo.findBoatIdsByPartida(partidaId);
    }

    private Long getWinnerId(Long partidaId) {
        if (partidaId == null) return null;
        Long cached = partidaGanador.get(partidaId);
        if (cached != null) return cached;
        return partidaRepo.findById(partidaId)
                .map(p -> {
                    Long gid = p.getGanadorBarcoId();
                    if (gid != null) partidaGanador.put(partidaId, gid);
                    return gid;
                })
                .orElse(null);
    }

    private void registerWinner(Long partidaId, Barco barco) {
        if (partidaId == null || barco == null || barco.getId() == null) return;
        partidaGanador.compute(partidaId, (pid, current) -> {
            if (current != null) return current;
            Long winnerId = barco.getId();
            partidaRepo.findById(pid).ifPresent(p -> {
                if (p.getGanadorBarcoId() == null) {
                    p.setGanadorBarcoId(winnerId);
                    p.setFinalizada(Instant.now());
                    p.setActiva(false);
                    partidaRepo.save(p);
                }
            });
            return winnerId;
        });
    }

    private List<Barco> getBarcosForPartida(Long partidaId) {
        List<Long> ids = getBoatOrder(partidaId);
        if (ids.isEmpty()) return Collections.emptyList();
        Map<Long, Barco> byId = barcoRepo.findAllById(ids).stream()
                .collect(Collectors.toMap(Barco::getId, b -> b));
        List<Barco> ordered = new ArrayList<>();
        for (Long id : ids) {
            Barco b = byId.get(id);
            if (b != null) ordered.add(b);
        }
        return ordered;
    }

    private Map<String, Object> buildStatePayload(Long partidaId) {
        List<Long> order = getBoatOrder(partidaId);
        Map<Long, Map<String, Object>> boatMap = barcoRepo.findAllById(order).stream()
                .collect(Collectors.toMap(Barco::getId, this::toMap));
        List<Map<String, Object>> boats = new ArrayList<>();
        for (Long id : order) {
            Map<String, Object> data = boatMap.get(id);
            if (data != null) boats.add(data);
        }
        Long winnerId = getWinnerId(partidaId);
        Map<String, Object> winnerData = null;
        if (winnerId != null) {
            Map<String, Object> info = boatMap.get(winnerId);
            if (info == null) {
                info = barcoRepo.findById(winnerId).map(this::toMap).orElse(null);
            } else {
                info = new HashMap<>(info);
            }
            if (info != null) {
                info.putIfAbsent("label", info.getOrDefault("jugadorNombre", "Barco #" + winnerId));
                info.put("id", winnerId);
                winnerData = info;
            }
        }
        Map<String, Object> state = new HashMap<>();
        state.put("partidaId", partidaId);
        state.put("order", order);
        state.put("barcos", boats);
        state.put("ts", System.currentTimeMillis());
        state.put("winner", winnerData);
        state.put("finished", winnerId != null);
        Mapa mapa = getMapaForPartidaId(partidaId);
        if (mapa != null) {
            state.put("mapaId", mapa.getId());
            state.put("mapaNombre", mapa.getNombre());
            state.put("mapaFilas", mapa.getFilas());
            state.put("mapaColumnas", mapa.getColumnas());
        }
        return state;
    }

    private void broadcastState(Long partidaId) {
        if (partidaId == null) return;
        emitToPid(partidaId, buildStatePayload(partidaId));
    }

    private void sendStateToEmitter(Long partidaId, SseEmitter emitter) {
        try {
            emitter.send(SseEmitter.event().name("state").data(buildStatePayload(partidaId)));
        } catch (Exception ex) {
            emitter.completeWithError(ex);
        }
    }

    public Map<String, Object> getCurrentStateSnapshot(Long partidaId) {
        if (partidaId == null) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("partidaId", null);
            empty.put("order", List.of());
            empty.put("barcos", List.of());
            empty.put("ts", System.currentTimeMillis());
            empty.put("winner", null);
            empty.put("finished", false);
            empty.put("mapaId", null);
            empty.put("mapaNombre", null);
            empty.put("mapaFilas", null);
            empty.put("mapaColumnas", null);
            return empty;
        }
        return buildStatePayload(partidaId);
    }

    private void assignBoatsToPartida(Partida partida, List<Long> boatIds) {
        if (partida == null) return;
        partidaBarcoRepo.deleteByPartidaId(partida.getId());
        partidaGanador.remove(partida.getId());
        partida.setGanadorBarcoId(null);
        partida.setFinalizada(null);
        partida.setActiva(true);
        Set<Long> affectedPartidas = new HashSet<>();
        LinkedHashSet<Long> uniqueOrdered = new LinkedHashSet<>();
        for (Long boatId : boatIds) {
            if (boatId != null) uniqueOrdered.add(boatId);
        }
        Mapa mapa = partida.getMapa();
        if (mapa == null) {
            mapa = resolveMapaForPartida(null);
            partida.setMapa(mapa);
        }
        List<Celda> partidaCells = (mapa != null && mapa.getId() != null)
                ? celdaRepo.findByMapaIdAndTipoOrderByYAscXAsc(mapa.getId(), Celda.Tipo.PARTIDA)
                : Collections.emptyList();

        int index = 0;
        for (Long boatId : uniqueOrdered) {
            if (boatId == null) continue;
            Long currentId = boatId;
            Optional<Barco> maybeBoat = barcoRepo.findById(currentId);
            if (maybeBoat.isEmpty()) continue;
            Barco barco = maybeBoat.get();
            partidaBarcoRepo.findPartidaIdByBarco(currentId)
                    .filter(prev -> !Objects.equals(prev, partida.getId()))
                    .ifPresent(affectedPartidas::add);
            partidaBarcoRepo.deleteByBarcoId(currentId);
            barco.setVelocidadX(0);
            barco.setVelocidadY(0);

            if (!partidaCells.isEmpty()) {
                Celda start = partidaCells.get(index % partidaCells.size());
                barco.setPosX(start.getX());
                barco.setPosY(start.getY());
            } else {
                barco.setPosX(1 + (index % 4));
                barco.setPosY(1 + (index / 4));
            }

            barcoRepo.save(barco);
            PartidaBarco link = new PartidaBarco(partida, barco, index++);
            partidaBarcoRepo.save(link);
        }
        partidaRepo.save(partida);
        affectedPartidas.forEach(this::broadcastState);
        broadcastState(partida.getId());
    }

    private boolean applyPlannedMove(Barco barco, Mapa mapa, List<Barco> snapshot, Long partidaId) {
        if (barco == null) return false;
        int mapWidth = resolveMapWidth(mapa);
        int mapHeight = resolveMapHeight(mapa);

        int proposedX = safeInt(barco.getPosX()) + safeInt(barco.getVelocidadX());
        int proposedY = safeInt(barco.getPosY()) + safeInt(barco.getVelocidadY());

        final int nx = Math.min(Math.max(proposedX, 0), mapWidth > 0 ? mapWidth - 1 : proposedX);
        final int ny = Math.min(Math.max(proposedY, 0), mapHeight > 0 ? mapHeight - 1 : proposedY);

        Optional<Celda> targetCell = mapa != null ? findCelda(mapa, nx, ny) : Optional.empty();
        boolean blockedByCell = targetCell
                .map(c -> c.getTipo() != null && c.getTipo() == Celda.Tipo.PARED)
                .orElse(false);

        boolean collision = snapshot.stream().anyMatch(other ->
                other.getId() != null &&
                        !other.getId().equals(barco.getId()) &&
                        safeInt(other.getPosX()) == nx &&
                        safeInt(other.getPosY()) == ny
        );

        if (blockedByCell || collision) {
            barco.setVelocidadX(0);
            barco.setVelocidadY(0);
            return false;
        }

        barco.setPosX(nx);
        barco.setPosY(ny);
        boolean reachedMeta = targetCell
                .map(c -> c.getTipo() != null && c.getTipo() == Celda.Tipo.META)
                .orElse(false);
        if (reachedMeta) {
            registerWinner(partidaId, barco);
            barco.setVelocidadX(0);
            barco.setVelocidadY(0);
            return true;
        }
        return true;
    }

    // API para mover un barco (llamada desde frontend)
    @Transactional
    public Optional<Barco> updateBarcoPos(Long barcoId, Integer x, Integer y) {
        return barcoRepo.findById(barcoId).map(b -> {
            if (x != null) b.setPosX(x);
            if (y != null) b.setPosY(y);
            Barco saved = barcoRepo.save(b);
            partidaBarcoRepo.findPartidaIdByBarco(barcoId).ifPresent(this::broadcastState);
            return saved;
        });
    }

    @Transactional
    public Optional<Barco> updateBarcoVel(Long barcoId, Integer vx, Integer vy) {
        return barcoRepo.findById(barcoId).map(b -> {
            Long partidaId = partidaBarcoRepo.findPartidaIdByBarco(barcoId).orElse(null);
            Long winnerId = getWinnerId(partidaId);
            if (winnerId != null && !Objects.equals(winnerId, barcoId)) {
                throw new IllegalStateException("La partida ya finalizó con un ganador.");
            }

            if (vx != null) b.setVelocidadX(vx);
            if (vy != null) b.setVelocidadY(vy);

            Partida partida = partidaId != null ? partidaRepo.findById(partidaId).orElse(null) : null;
            Mapa mapa = partida != null ? partida.getMapa() : resolveMapaForPartida(null);
            if (partida != null && partida.getMapa() == null && mapa != null) {
                partida.setMapa(mapa);
                partidaRepo.save(partida);
            }
            List<Barco> snapshot = partidaId != null ? getBarcosForPartida(partidaId) : barcoRepo.findAll();
            applyPlannedMove(b, mapa, snapshot, partidaId);

            Barco saved = barcoRepo.save(b);
            if (partidaId != null) {
                broadcastState(partidaId);
            }
            return saved;
        });
    }

    // Resuelve ancho del mapa intentando varios getters/campos por reflexión.
    private int resolveMapWidth(Mapa mapa) {
        if (mapa == null) return 10;
        Integer v = tryGetIntProperty(mapa, new String[]{"getWidth","getAncho","getColumns","getCols","getColsCount","getXSize","getW"});
        if (v != null) return v;
        v = tryGetIntField(mapa, new String[]{"width","ancho","columns","cols","colsCount","xSize","w"});
        return v == null ? 10 : v;
    }

    // Resuelve alto del mapa intentando varios getters/campos por reflexión.
    private int resolveMapHeight(Mapa mapa) {
        if (mapa == null) return 10;
        Integer v = tryGetIntProperty(mapa, new String[]{"getHeight","getAlto","getRows","getFilas","getYSize","getH"});
        if (v != null) return v;
        v = tryGetIntField(mapa, new String[]{"height","alto","rows","filas","ySize","h"});
        return v == null ? 10 : v;
    }

    private Integer tryGetIntProperty(Object obj, String[] names) {
        for (String name : names) {
            try {
                Method m = obj.getClass().getMethod(name);
                Object val = m.invoke(obj);
                if (val instanceof Number) return ((Number) val).intValue();
            } catch (Exception ignored) {}
        }
        return null;
    }

    private Integer tryGetIntField(Object obj, String[] names) {
        for (String name : names) {
            try {
                Field f = obj.getClass().getDeclaredField(name);
                f.setAccessible(true);
                Object val = f.get(obj);
                if (val instanceof Number) return ((Number) val).intValue();
            } catch (Exception ignored) {}
        }
        return null;
    }

    /**
     * Busca una Celda para el mapa y coordenadas dadas usando
     * comparación por referencia de mapa (id) y detección de campos/getters
     * para x/y por reflexión (por compatibilidad con distintos nombres).
     */
    private Optional<Celda> findCelda(Mapa mapa, int x, int y) {
        if (mapa == null) return Optional.empty();
        if (mapa.getId() != null) {
            Optional<Celda> precise = celdaRepo.findByMapaIdAndXAndY(mapa.getId(), x, y);
            if (precise.isPresent()) {
                return precise;
            }
        }
        // intentar filtrar por mapa si Celda tiene referencia a Mapa
        return celdaRepo.findAll().stream()
                .filter(c -> {
                    try {
                        // comparar mapa por id si existe
                        Method gm = null;
                        try { gm = c.getClass().getMethod("getMapa"); } catch (NoSuchMethodException ignored) {}
                        if (gm != null) {
                            Object cm = gm.invoke(c);
                            if (cm != null) {
                                // intentar getId
                                Method gid = null;
                                try { gid = cm.getClass().getMethod("getId"); } catch (NoSuchMethodException ignored) {}
                                if (gid != null) {
                                    Object cid = gid.invoke(cm);
                                    Object mid = mapa.getId();
                                    if (cid != null && mid != null && cid.equals(mid)) {
                                        // mapa coincide, seguir comprobando coords
                                    } else {
                                        return false;
                                    }
                                }
                            }
                        }
                        // comparar coordenadas de la celda con reflexión
                        Integer cx = tryGetIntProperty(c, new String[]{"getPosX","getX","getCol","getColumna","getFilaX","getPosicionX","getPosicion"});
                        if (cx == null) cx = tryGetIntField(c, new String[]{"posX","x","col","columna","filaX","posicionX","posicion"});
                        Integer cy = tryGetIntProperty(c, new String[]{"getPosY","getY","getRow","getFila","getPosicionY","getPosicion"});
                        if (cy == null) cy = tryGetIntField(c, new String[]{"posY","y","row","fila","posicionY","posicion"});
                        if (cx == null || cy == null) return false;
                        return cx == x && cy == y;
                    } catch (Exception ex) {
                        return false;
                    }
                })
                .findFirst();
    }
}
