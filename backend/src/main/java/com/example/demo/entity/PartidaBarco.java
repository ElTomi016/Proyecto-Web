package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "partida_barco", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"partida_id", "barco_id"})
})
public class PartidaBarco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partida_id")
    private Partida partida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barco_id")
    private Barco barco;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    public PartidaBarco() {}

    public PartidaBarco(Partida partida, Barco barco, Integer orden) {
        this.partida = partida;
        this.barco = barco;
        this.orden = orden;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Partida getPartida() { return partida; }
    public void setPartida(Partida partida) { this.partida = partida; }
    public Barco getBarco() { return barco; }
    public void setBarco(Barco barco) { this.barco = barco; }
    public Integer getOrden() { return orden; }
    public void setOrden(Integer orden) { this.orden = orden; }
}
