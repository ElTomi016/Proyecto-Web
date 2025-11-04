package com.example.demo.dto;

import java.util.List;

public record PartidaCreateRequest(String nombre, List<Long> barcos) {}
