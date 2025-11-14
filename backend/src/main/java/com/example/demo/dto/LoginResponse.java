package com.example.demo.dto;

public record LoginResponse(String token, String username, String role, Long jugadorId) { }
