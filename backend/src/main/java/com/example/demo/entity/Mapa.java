package com.example.demo.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Mapa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int filas;
    private int columnas;

    @OneToMany(mappedBy = "mapa", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Celda> celdas = new ArrayList<>();

    public Mapa() {}

    public Mapa(int filas, int columnas) {
        this.filas = filas;
        this.columnas = columnas;
    }

    // getters y setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public int getFilas() { return filas; }
    public void setFilas(int filas) { this.filas = filas; }
    public int getColumnas() { return columnas; }
    public void setColumnas(int columnas) { this.columnas = columnas; }
    public List<Celda> getCeldas() { return celdas; }
    public void setCeldas(List<Celda> celdas) { this.celdas = celdas; }
}
