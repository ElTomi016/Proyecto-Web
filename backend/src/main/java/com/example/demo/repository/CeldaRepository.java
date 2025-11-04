package com.example.demo.repository;

import com.example.demo.entity.Celda;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CeldaRepository extends JpaRepository<Celda, Long> {
    List<Celda> findByMapaId(Long mapaId);
    List<Celda> findByMapaIdAndTipoOrderByYAscXAsc(Long mapaId, Celda.Tipo tipo);
    Optional<Celda> findByMapaIdAndXAndY(Long mapaId, int x, int y);
}
