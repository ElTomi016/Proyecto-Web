package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class Partida {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private Instant creada = Instant.now();
    private boolean activa = true;

    public Partida() {}
    public Partida(String nombre) { this.nombre = nombre; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Instant getCreada() { return creada; }
    public void setCreada(Instant creada) { this.creada = creada; }

    public boolean isActiva() { return activa; }
    public void setActiva(boolean activa) { this.activa = activa; }
}