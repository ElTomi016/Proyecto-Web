package com.example.demo.security;

import com.example.demo.entity.Role;
import com.example.demo.entity.UserAccount;
import com.example.demo.repository.UserAccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class CurrentUserService {

    private final UserAccountRepository userAccountRepository;

    public CurrentUserService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    public Optional<UserAccount> getCurrentAccount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        String username = authentication.getName();
        if (username == null) {
            return Optional.empty();
        }
        return userAccountRepository.findByUsername(username);
    }

    public boolean hasRole(Role role) {
        return getCurrentAccount().map(account -> account.getRole() == role).orElse(false);
    }

    public Optional<Role> getRole() {
        return getCurrentAccount().map(UserAccount::getRole);
    }

    public Optional<com.example.demo.entity.Jugador> getJugador() {
        return getCurrentAccount().map(UserAccount::getJugador);
    }
}
