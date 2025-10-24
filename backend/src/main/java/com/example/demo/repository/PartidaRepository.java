package com.example.demo.repository;

import com.example.demo.entity.Partida;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PartidaRepository extends JpaRepository<Partida, Long> {
}