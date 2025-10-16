package com.example.demo.dto;

public record BarcoDto(
        Long id,
        Long jugadorId,
        String jugadorNombre,
        Long modeloId,
        String modeloNombre,
        Integer posX,
        Integer posY,
        Integer velocidadX,
        Integer velocidadY
) {}