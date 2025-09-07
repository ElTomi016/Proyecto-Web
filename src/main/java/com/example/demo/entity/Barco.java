package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
public class Barco {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int posX;
    private int posY;
    private int velocidadX;
    private int velocidadY;

    @ManyToOne
    @JoinColumn(name = "jugador_id")
    private Jugador jugador;

    @ManyToOne
    @JoinColumn(name = "modelo_id")
    private ModeloBarco modelo;

    // getters y setters
}
