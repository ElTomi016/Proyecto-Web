package com.example.demo.api;

import com.example.demo.entity.Barco;
import com.example.demo.entity.Jugador;
import com.example.demo.entity.ModeloBarco;
import com.example.demo.entity.Role;
import com.example.demo.entity.UserAccount;
import com.example.demo.repository.BarcoRepository;
import com.example.demo.repository.JugadorRepository;
import com.example.demo.repository.ModeloBarcoRepository;
import com.example.demo.repository.UserAccountRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("integration-testing")
class BarcoRestControllerIntegrationTest {

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
    private PasswordEncoder passwordEncoder;

    private Jugador jugador1;
    private Jugador jugador2;
    private ModeloBarco modelo;

    private static final String ADMIN_USERNAME = "admin-barco";
    private static final String ADMIN_PASSWORD = "adminPass123!";
    private static final String PLAYER_USERNAME = "player-barcos";
    private static final String PLAYER_PASSWORD = "playerPass!";
    private static final String PLAYER2_USERNAME = "player-b-two";
    private static final String PLAYER2_PASSWORD = "playerTwoPass!";

    @BeforeEach
    void setUp() {
        barcoRepository.deleteAll();
        userAccountRepository.deleteAll();
        jugadorRepository.deleteAll();
        modeloBarcoRepository.deleteAll();

        modelo = modeloBarcoRepository.save(new ModeloBarco("Modelo Azul", "Azul"));
        jugador1 = jugadorRepository.save(new Jugador("Jugador Uno", "uno@barco.test"));
        jugador2 = jugadorRepository.save(new Jugador("Jugador Dos", "dos@barco.test"));

        createAccount(ADMIN_USERNAME, ADMIN_PASSWORD, Role.ADMIN, null);
        createAccount(PLAYER_USERNAME, PLAYER_PASSWORD, Role.JUGADOR, jugador1);
        createAccount(PLAYER2_USERNAME, PLAYER2_PASSWORD, Role.JUGADOR, jugador2);
    }

    @Test
    @DisplayName("POST /api/barcos crea barco cuando lo hace un admin")
    void createBoatAsAdmin() throws Exception {
        String adminToken = authenticate(ADMIN_USERNAME, ADMIN_PASSWORD);

        mockMvc.perform(post("/api/barcos")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "posX", 3,
                                "posY", 4,
                                "velocidadX", 0,
                                "velocidadY", 0,
                                "jugadorId", jugador1.getId(),
                                "modeloId", modelo.getId()
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.jugador.id").value(jugador1.getId()));
    }

    @Test
    @DisplayName("POST /api/barcos es rechazado para jugadores")
    void createBoatAsPlayerForbidden() throws Exception {
        String playerToken = authenticate(PLAYER_USERNAME, PLAYER_PASSWORD);

        mockMvc.perform(post("/api/barcos")
                        .header("Authorization", bearer(playerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "posX", 1,
                                "posY", 1,
                                "velocidadX", 0,
                                "velocidadY", 0,
                                "jugadorId", jugador1.getId(),
                                "modeloId", modelo.getId()
                        ))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /api/barcos/{id} actualiza barco existente")
    void updateBoatAsAdmin() throws Exception {
        String adminToken = authenticate(ADMIN_USERNAME, ADMIN_PASSWORD);
        Barco existente = createBoat(jugador1, 1, 1);

        mockMvc.perform(put("/api/barcos/{id}", existente.getId())
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "posX", 6,
                                "posY", 7,
                                "jugadorId", jugador1.getId(),
                                "modeloId", modelo.getId()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.posX").value(6))
                .andExpect(jsonPath("$.posY").value(7));
    }

    @Test
    @DisplayName("PUT /api/barcos/{id} devuelve 404 si el barco no existe")
    void updateBoatNotFound() throws Exception {
        String adminToken = authenticate(ADMIN_USERNAME, ADMIN_PASSWORD);

        mockMvc.perform(put("/api/barcos/{id}", 9999)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "posX", 6,
                                "posY", 7
                        ))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/barcos/{id} elimina barco como admin")
    void deleteBoatAsAdmin() throws Exception {
        String adminToken = authenticate(ADMIN_USERNAME, ADMIN_PASSWORD);
        Barco existente = createBoat(jugador1, 3, 3);

        mockMvc.perform(delete("/api/barcos/{id}", existente.getId())
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());

        assertThat(barcoRepository.findById(existente.getId())).isEmpty();
    }

    @Test
    @DisplayName("DELETE /api/barcos/{id} está prohibido para jugadores")
    void deleteBoatAsPlayerForbidden() throws Exception {
        String playerToken = authenticate(PLAYER_USERNAME, PLAYER_PASSWORD);
        Barco existente = createBoat(jugador1, 3, 3);

        mockMvc.perform(delete("/api/barcos/{id}", existente.getId())
                        .header("Authorization", bearer(playerToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/barcos filtra barcos del jugador autenticado")
    void getBoatsAsPlayerReturnsOnlyOwned() throws Exception {
        String player1Token = authenticate(PLAYER_USERNAME, PLAYER_PASSWORD);
        createBoat(jugador1, 1, 1);
        createBoat(jugador1, 2, 2);
        createBoat(jugador2, 5, 5);

        MvcResult result = mockMvc.perform(get("/api/barcos")
                        .header("Authorization", bearer(player1Token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].jugador.id", everyItem(is(jugador1.getId().intValue()))))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(node).hasSize(2);
    }

    private void createAccount(String username, String rawPassword, Role role, Jugador jugador) {
        UserAccount account = new UserAccount();
        account.setUsername(username);
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setRole(role);
        account.setJugador(jugador);
        userAccountRepository.save(account);
    }

    private Barco createBoat(Jugador owner, int posX, int posY) {
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

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
