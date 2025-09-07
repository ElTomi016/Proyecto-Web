package com.example.demo.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class ModeloBarco {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombreModelo;
    private String color;

    @OneToMany(mappedBy = "modelo", cascade = CascadeType.ALL)
    private List<Barco> barcos;

    // getters y setters
}
