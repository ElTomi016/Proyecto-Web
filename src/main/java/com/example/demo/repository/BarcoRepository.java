package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Barco;

public interface BarcoRepository extends JpaRepository<Barco, Long>{
    
}
