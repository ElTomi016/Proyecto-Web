package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class Celda {

    public enum Tipo { AGUA, PARED, PARTIDA, META }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int x;
    private int y;

    @Enumerated(EnumType.STRING)
    private Tipo tipo;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "mapa_id")
    private Mapa mapa;

    public Celda() {}

    public Celda(int x, int y, Tipo tipo, Mapa mapa) {
        this.x = x; this.y = y; this.tipo = tipo; this.mapa = mapa;
    }

    // getters y setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public int getX() { return x; }
    public void setX(int x) { this.x = x; }
    public int getY() { return y; }
    public void setY(int y) { this.y = y; }
    public Tipo getTipo() { return tipo; }
    public void setTipo(Tipo tipo) { this.tipo = tipo; }
    public Mapa getMapa() { return mapa; }
    public void setMapa(Mapa mapa) { this.mapa = mapa; }
}
