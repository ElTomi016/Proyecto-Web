package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
public class Partida {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private Instant creada = Instant.now();
    private boolean activa = true;
    private Long ganadorBarcoId;
    private Instant finalizada;
    @JsonIgnore
    @OneToMany(mappedBy = "partida", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<PartidaBarco> barcos = new HashSet<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mapa_id")
    private Mapa mapa;

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

    public Set<PartidaBarco> getPartidaBarcos() { return barcos; }
    public void setPartidaBarcos(Set<PartidaBarco> barcos) { this.barcos = barcos; }

    public Long getGanadorBarcoId() { return ganadorBarcoId; }
    public void setGanadorBarcoId(Long ganadorBarcoId) { this.ganadorBarcoId = ganadorBarcoId; }

    public Instant getFinalizada() { return finalizada; }
    public void setFinalizada(Instant finalizada) { this.finalizada = finalizada; }

    public Mapa getMapa() { return mapa; }
    public void setMapa(Mapa mapa) { this.mapa = mapa; }
}
