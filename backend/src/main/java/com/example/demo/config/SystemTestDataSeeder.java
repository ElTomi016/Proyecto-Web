package com.example.demo.config;

import com.example.demo.entity.Celda;
import com.example.demo.entity.Mapa;
import com.example.demo.entity.Role;
import com.example.demo.entity.UserAccount;
import com.example.demo.repository.CeldaRepository;
import com.example.demo.repository.MapaRepository;
import com.example.demo.repository.UserAccountRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
@Profile("systemtest")
public class SystemTestDataSeeder {

    private static final String[] DEFAULT_MAP = {
            "############",
            "#S.......M.#",
            "#..####....#",
            "#..#..#....#",
            "#..#..####.#",
            "#..........#",
            "############"
    };

    private final MapaRepository mapaRepository;
    private final CeldaRepository celdaRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public SystemTestDataSeeder(MapaRepository mapaRepository,
                                CeldaRepository celdaRepository,
                                UserAccountRepository userAccountRepository,
                                PasswordEncoder passwordEncoder) {
        this.mapaRepository = mapaRepository;
        this.celdaRepository = celdaRepository;
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    @Transactional
    public void seed() {
        seedMap();
        seedAdmin();
    }

    private void seedMap() {
        if (mapaRepository.count() > 0) {
            return;
        }
        Mapa mapa = new Mapa("Circuito de Sistema", DEFAULT_MAP.length, DEFAULT_MAP[0].length());
        mapa = mapaRepository.save(mapa);

        List<Celda> celdas = new ArrayList<>();
        for (int y = 0; y < DEFAULT_MAP.length; y++) {
            String row = DEFAULT_MAP[y];
            for (int x = 0; x < row.length(); x++) {
                char symbol = row.charAt(x);
                Celda.Tipo tipo = switch (symbol) {
                    case '#', 'X' -> Celda.Tipo.PARED;
                    case 'S' -> Celda.Tipo.PARTIDA;
                    case 'M' -> Celda.Tipo.META;
                    default -> Celda.Tipo.AGUA;
                };
                celdas.add(new Celda(x, y, tipo, mapa));
            }
        }
        celdaRepository.saveAll(celdas);
    }

    private void seedAdmin() {
        UserAccount admin = userAccountRepository.findByUsername("admin")
                .orElseGet(() -> new UserAccount("admin", null, Role.ADMIN, null));
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(Role.ADMIN);
        admin.setJugador(null);
        userAccountRepository.save(admin);
    }
}
