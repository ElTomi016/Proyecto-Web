package com.example.demo.service;

import com.example.demo.entity.Barco;
import com.example.demo.entity.Celda;
import com.example.demo.entity.Mapa;
import com.example.demo.entity.Partida;
import com.example.demo.repository.BarcoRepository;
import com.example.demo.repository.CeldaRepository;
import com.example.demo.repository.MapaRepository;
import com.example.demo.repository.PartidaRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.annotation.PostConstruct;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
public class PartidaService {

    private final BarcoRepository barcoRepo;
    private final PartidaRepository partidaRepo;
    private final MapaRepository mapaRepo;
    private final CeldaRepository celdaRepo;

    // emisores SSE por partida
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    public PartidaService(BarcoRepository barcoRepo,
                          PartidaRepository partidaRepo,
                          MapaRepository mapaRepo,
                          CeldaRepository celdaRepo) {
        this.barcoRepo = barcoRepo;
        this.partidaRepo = partidaRepo;
        this.mapaRepo = mapaRepo;
        this.celdaRepo = celdaRepo;
    }

    @PostConstruct
    public void startTicker() {
        // tick cada 500ms
        scheduler.scheduleAtFixedRate(this::tickAll, 500, 500, TimeUnit.MILLISECONDS);
    }

    public Partida createPartida(String nombre) {
        Partida p = new Partida(nombre == null ? "Partida" : nombre);
        p.setActiva(true);
        return partidaRepo.save(p);
    }

    public List<Partida> listPartidas() {
        return partidaRepo.findAll();
    }

    public SseEmitter registerEmitter(Long partidaId) {
        SseEmitter emitter = new SseEmitter(0L); // sin timeout
        emitters.computeIfAbsent(partidaId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> emitters.getOrDefault(partidaId, new CopyOnWriteArrayList<>()).remove(emitter));
        emitter.onTimeout(() -> emitters.getOrDefault(partidaId, new CopyOnWriteArrayList<>()).remove(emitter));
        return emitter;
    }

    private void tickAll() {
        // Tomamos el primer mapa disponible (si tienes varios adaptamos por partida)
        Optional<Mapa> maybeMapa = mapaRepo.findAll().stream().findFirst();
        Mapa mapa = maybeMapa.orElse(null);

        int mapWidth = resolveMapWidth(mapa);
        int mapHeight = resolveMapHeight(mapa);

        List<Barco> barcos = barcoRepo.findAll();
        boolean changed = false;

        // construir mapa de ocupación para detectar colisiones simultáneas
        Map<String, Barco> ocupacion = new HashMap<>();
        for (Barco b : barcos) {
            ocupacion.put(key(b.getPosX(), b.getPosY()), b);
        }

        // calcular movimientos propuestos
        List<Runnable> applyMoves = new ArrayList<>();

        for (Barco b : barcos) {
            try {
                int proposedX = safeInt(b.getPosX()) + safeInt(b.getVelocidadX());
                int proposedY = safeInt(b.getPosY()) + safeInt(b.getVelocidadY());

                // límites usando dimensiones resueltas
                final int nx = Math.min(Math.max(proposedX, 0), mapWidth > 0 ? mapWidth - 1 : proposedX);
                final int ny = Math.min(Math.max(proposedY, 0), mapHeight > 0 ? mapHeight - 1 : proposedY);

                // comprobación celda (pared) -> ahora usando búsqueda segura por reflexión
                boolean blockedByCell = false;
                if (mapa != null) {
                    Optional<Celda> oc = findCelda(mapa, nx, ny);
                    if (oc.isPresent()) {
                        Celda c = oc.get();
                        if (c.getTipo() != null && "PARED".equals(c.getTipo().name())) {
                            blockedByCell = true;
                        }
                    }
                }

                // comprobación colisión: si otra embarcación ocupa la casilla destino
                Barco other = ocupacion.get(key(nx, ny));
                boolean collision = (other != null && !other.getId().equals(b.getId()));

                if (!blockedByCell && !collision) {
                    // programar la aplicación del movimiento
                    applyMoves.add(() -> {
                        b.setPosX(nx);
                        b.setPosY(ny);
                        barcoRepo.save(b);
                    });
                    // actualizar ocupación provisional (evita múltiples tomar la misma celda)
                    ocupacion.remove(key(b.getPosX(), b.getPosY()));
                    ocupacion.put(key(nx, ny), b);
                    changed = true;
                } else {
                    // movimiento bloqueado: detener velocidad (opcional)
                    if (collision || blockedByCell) {
                        // detener el barco en su lugar (evita seguir intentando)
                        if (safeInt(b.getVelocidadX()) != 0 || safeInt(b.getVelocidadY()) != 0) {
                            b.setVelocidadX(0);
                            b.setVelocidadY(0);
                            barcoRepo.save(b);
                        }
                    }
                }

            } catch (Exception ex) {
                // ignorar barcos mal formados
            }
        }

        // aplicar movimientos programados (ya validados)
        for (Runnable r : applyMoves) r.run();

        if (changed) {
            Map<String, Object> state = Map.of(
                    "barcos", barcoRepo.findAll().stream().map(this::toMap).collect(Collectors.toList()),
                    "ts", System.currentTimeMillis()
            );
            emitToAll(state);
        }
    }

    private int safeInt(Integer v) {
        return v == null ? 0 : v;
    }

    private String key(Integer x, Integer y) {
        return (x == null ? 0 : x) + ":" + (y == null ? 0 : y);
    }

    private Map<String, Object> toMap(Barco b) {
        Map<String, Object> m = new HashMap<>();
        try {
            m.put("id", b.getId());
            m.put("posX", b.getPosX());
            m.put("posY", b.getPosY());
            m.put("velX", b.getVelocidadX());
            m.put("velY", b.getVelocidadY());
            if (b.getJugador() != null) m.put("jugadorId", b.getJugador().getId());
            if (b.getModelo() != null) m.put("modeloId", b.getModelo().getId());
        } catch (Exception ignored) {}
        return m;
    }

    private void emitToAll(Object payload) {
        for (Long pid : emitters.keySet()) {
            emitToPid(pid, payload);
        }
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

    // API para mover un barco (llamada desde frontend)
    public Optional<Barco> updateBarcoPos(Long barcoId, Integer x, Integer y) {
        return barcoRepo.findById(barcoId).map(b -> {
            if (x != null) b.setPosX(x);
            if (y != null) b.setPosY(y);
            return barcoRepo.save(b);
        });
    }

    public Optional<Barco> updateBarcoVel(Long barcoId, Integer vx, Integer vy) {
        return barcoRepo.findById(barcoId).map(b -> {
            if (vx != null) b.setVelocidadX(vx);
            if (vy != null) b.setVelocidadY(vy);
            return barcoRepo.save(b);
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