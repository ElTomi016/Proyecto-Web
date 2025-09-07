package com.example.demo.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Jugador {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String email;

    @OneToMany(mappedBy = "jugador", cascade = CascadeType.ALL)
    private List<Barco> barcos;

    
}
