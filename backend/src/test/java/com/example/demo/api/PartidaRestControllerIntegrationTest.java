package com.example.demo.api;

import com.example.demo.entity.*;
import com.example.demo.entity.Celda.Tipo;
import com.example.demo.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("integration-testing")
class PartidaRestControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BarcoRepository barcoRepository;
    @Autowired
    private JugadorRepository jugadorRepository;
    @Autowired
    private ModeloBarcoRepository modeloBarcoRepository;
    @Autowired
    private UserAccountRepository userAccountRepository;
    @Autowired
    private PartidaRepository partidaRepository;
    @Autowired
    private PartidaBarcoRepository partidaBarcoRepository;
    @Autowired
    private MapaRepository mapaRepository;
    @Autowired
    private CeldaRepository celdaRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String ADMIN_USERNAME = "admin_it";
    private static final String ADMIN_PASSWORD = "adminPass123!";
    private static final String PLAYER1_USERNAME = "player1";
    private static final String PLAYER1_PASSWORD = "player1Pass!";
    private static final String PLAYER2_USERNAME = "player2";
    private static final String PLAYER2_PASSWORD = "player2Pass!";

    private Jugador jugador1;
    private Jugador jugador2;
    private Barco barcoJugador1;
    private Barco barcoJugador2;
    private Mapa mapa;
    private ModeloBarco modelo;

    @BeforeEach
    void setUp() {
        partidaBarcoRepository.deleteAll();
        partidaRepository.deleteAll();
        barcoRepository.deleteAll();
        userAccountRepository.deleteAll();
        jugadorRepository.deleteAll();
        modeloBarcoRepository.deleteAll();
        celdaRepository.deleteAll();
        mapaRepository.deleteAll();

        mapa = new Mapa();
        mapa.setNombre("Mapa Integración");
        mapa.setFilas(12);
        mapa.setColumnas(12);
        mapa = mapaRepository.save(mapa);

        createCelda(1, 1, Tipo.PARTIDA);
        createCelda(1, 2, Tipo.PARTIDA);
        createCelda(10, 1, Tipo.META);
        createCelda(5, 5, Tipo.AGUA);

        modelo = modeloBarcoRepository.save(new ModeloBarco("Modelo IT", "Cyan"));

        jugador1 = jugadorRepository.save(new Jugador("Jugador Uno", "uno@example.com"));
        jugador2 = jugadorRepository.save(new Jugador("Jugador Dos", "dos@example.com"));

        createAccount(ADMIN_USERNAME, ADMIN_PASSWORD, Role.ADMIN, null);
        createAccount(PLAYER1_USERNAME, PLAYER1_PASSWORD, Role.JUGADOR, jugador1);
        createAccount(PLAYER2_USERNAME, PLAYER2_PASSWORD, Role.JUGADOR, jugador2);

        barcoJugador1 = createBoatFor(jugador1, 1, 1);
        barcoJugador2 = createBoatFor(jugador2, 2, 2);
    }

    @Test
    @DisplayName("POST /api/partidas crea partida con orden y metadatos")
    void createMatchAsAdminReturnsOrder() throws Exception {
        String adminToken = authenticate(ADMIN_USERNAME, ADMIN_PASSWORD);

        mockMvc.perform(post("/api/partidas")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "Partida Integración",
                                "barcos", List.of(barcoJugador1.getId(), barcoJugador2.getId()),
                                "mapaId", mapa.getId()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.order", hasSize(2)))
                .andExpect(jsonPath("$.mapaId").value(mapa.getId()));
    }

    @Test
    @DisplayName("Jugador queda limitado a su propio barco al crear partida")
    void playerRequestWithForeignBoatGetsSanitized() throws Exception {
        String playerToken = authenticate(PLAYER1_USERNAME, PLAYER1_PASSWORD);

        mockMvc.perform(post("/api/partidas")
                        .header("Authorization", bearer(playerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "Partida inválida",
                                "barcos", List.of(barcoJugador2.getId()),
                                "mapaId", mapa.getId()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.order", hasSize(1)))
                .andExpect(jsonPath("$.order[0]").value(barcoJugador1.getId()));
    }

    @Test
    @DisplayName("Sólo el barco en turno puede mover y los giros invalidos fallan")
    void playerCanMoveOnlyOnTurn() throws Exception {
        String adminToken = authenticate(ADMIN_USERNAME, ADMIN_PASSWORD);
        String player1Token = authenticate(PLAYER1_USERNAME, PLAYER1_PASSWORD);
        String player2Token = authenticate(PLAYER2_USERNAME, PLAYER2_PASSWORD);
        Long partidaId = createMatch(adminToken);

        // jugador2 intenta mover su barco fuera de turno
        mockMvc.perform(put("/api/partidas/barcos/{barcoId}/vel", barcoJugador2.getId())
                        .header("Authorization", bearer(player2Token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("vx", 1, "vy", 0))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("turno")));

        // jugador1 mueve correctamente su barco
        mockMvc.perform(put("/api/partidas/barcos/{barcoId}/vel", barcoJugador1.getId())
                        .header("Authorization", bearer(player1Token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("vx", 1, "vy", 0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.velocidadX").value(1));

        // mismo jugador intenta mover de nuevo inmediatamente
        mockMvc.perform(put("/api/partidas/barcos/{barcoId}/vel", barcoJugador1.getId())
                        .header("Authorization", bearer(player1Token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("vx", 1, "vy", 0))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("turno")));

        // jugador2 no puede controlar barco ajeno
        mockMvc.perform(put("/api/partidas/barcos/{barcoId}/vel", barcoJugador1.getId())
                        .header("Authorization", bearer(player2Token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("vx", 1, "vy", 0))))
                .andExpect(status().isForbidden());

        // estado debe reflejar turno y orden
        mockMvc.perform(get("/api/partidas/{id}/state", partidaId)
                        .header("Authorization", bearer(player1Token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.order", hasSize(2)))
                .andExpect(jsonPath("$.currentTurnBoatId").value(barcoJugador2.getId()));
    }

    @Test
    @DisplayName("PUT velocidad rechaza incrementos mayores a 1 por eje")
    void updateVelocityRejectsOutOfRangeDelta() throws Exception {
        String adminToken = authenticate(ADMIN_USERNAME, ADMIN_PASSWORD);
        String player1Token = authenticate(PLAYER1_USERNAME, PLAYER1_PASSWORD);
        createMatch(adminToken);

        mockMvc.perform(put("/api/partidas/barcos/{barcoId}/vel", barcoJugador1.getId())
                        .header("Authorization", bearer(player1Token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("vx", 5, "vy", 0))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("velocidad")));
    }

    @Test
    @DisplayName("Sólo admin puede reasignar posición manualmente")
    void adminCanUpdatePositionWhilePlayersCannot() throws Exception {
        String adminToken = authenticate(ADMIN_USERNAME, ADMIN_PASSWORD);
        String playerToken = authenticate(PLAYER1_USERNAME, PLAYER1_PASSWORD);
        createMatch(adminToken);

        mockMvc.perform(put("/api/partidas/barcos/{barcoId}/pos", barcoJugador1.getId())
                        .header("Authorization", bearer(playerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("x", 4, "y", 4))))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/partidas/barcos/{barcoId}/pos", barcoJugador1.getId())
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("x", 4, "y", 4))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.posX").value(4))
                .andExpect(jsonPath("$.posY").value(4));
    }

    private void createCelda(int x, int y, Tipo tipo) {
        Celda celda = new Celda();
        celda.setX(x);
        celda.setY(y);
        celda.setTipo(tipo);
        celda.setMapa(mapa);
        celdaRepository.save(celda);
    }

    private void createAccount(String username, String rawPassword, Role role, Jugador jugador) {
        UserAccount account = new UserAccount();
        account.setUsername(username);
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setRole(role);
        account.setJugador(jugador);
        userAccountRepository.save(account);
    }

    private Barco createBoatFor(Jugador owner, int posX, int posY) {
        Barco barco = new Barco();
        barco.setJugador(owner);
        barco.setModelo(modelo);
        barco.setPosX(posX);
        barco.setPosY(posY);
        barco.setVelocidadX(0);
        barco.setVelocidadY(0);
        return barcoRepository.save(barco);
    }

    private String authenticate(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", username,
                                "password", password
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("token").asText();
    }

    private Long createMatch(String adminToken) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/partidas")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "Partida Test",
                                "barcos", List.of(barcoJugador1.getId(), barcoJugador2.getId()),
                                "mapaId", mapa.getId()
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("id").asLong();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
