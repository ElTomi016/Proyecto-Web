package com.example.demo.repository;

import com.example.demo.dto.BarcoDto;
import com.example.demo.entity.Barco;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BarcoRepository extends JpaRepository<Barco, Long> {

    // Proyección directa a DTO con LEFT JOIN para no romper si faltan relaciones
    @Query("""
           select new com.example.demo.dto.BarcoDto(
               b.id,
               j.id,
               j.nombre,
               m.id,
               m.nombreModelo,
               b.posX,
               b.posY,
               b.velocidadX,
               b.velocidadY
           )
           from Barco b
           left join b.jugador j
           left join b.modelo m
           """)
    List<BarcoDto> findAllDto();
}
