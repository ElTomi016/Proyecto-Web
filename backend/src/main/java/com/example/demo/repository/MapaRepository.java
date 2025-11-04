package com.example.demo.repository;

import com.example.demo.entity.Mapa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MapaRepository extends JpaRepository<Mapa, Long> {
    Optional<Mapa> findByNombre(String nombre);
}
