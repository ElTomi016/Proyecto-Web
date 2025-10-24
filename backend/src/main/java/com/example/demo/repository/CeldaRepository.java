package com.example.demo.repository;

import com.example.demo.entity.Celda;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CeldaRepository extends JpaRepository<Celda, Long> {
    // Se deja sin métodos derivados para evitar errores por nombres de propiedades diferentes
}
