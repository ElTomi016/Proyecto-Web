package com.example.demo.service;

import com.example.demo.entity.Jugador;
import com.example.demo.entity.Role;
import com.example.demo.entity.UserAccount;
import com.example.demo.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Helper service that guarantees every Jugador has a matching credential so
 * that UI scenarios (including automated tests) can log in with predictable data.
 */
@Service
public class JugadorAccountService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public JugadorAccountService(UserAccountRepository userAccountRepository,
                                 PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void ensureAccountFor(Jugador jugador) {
        if (jugador == null || jugador.getId() == null) {
            return;
        }
        String username = buildUsername(jugador.getId());
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseGet(UserAccount::new);
        account.setUsername(username);
        account.setPassword(passwordEncoder.encode(username + "123"));
        account.setRole(Role.JUGADOR);
        account.setJugador(jugador);
        userAccountRepository.save(account);
    }

    @Transactional
    public void removeAccountForJugadorId(Long jugadorId) {
        if (jugadorId == null) {
            return;
        }
        Optional<UserAccount> linked = userAccountRepository.findByJugadorId(jugadorId);
        if (linked.isPresent()) {
            userAccountRepository.delete(linked.get());
            return;
        }
        userAccountRepository.findByUsername(buildUsername(jugadorId))
                .ifPresent(userAccountRepository::delete);
    }

    private String buildUsername(Long jugadorId) {
        return "jugador" + jugadorId;
    }
}
