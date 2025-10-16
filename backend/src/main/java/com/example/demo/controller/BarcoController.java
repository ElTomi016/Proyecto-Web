package com.example.demo.controller;

import com.example.demo.dto.BarcoDto;
import com.example.demo.repository.BarcoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/barcos")
@CrossOrigin(origins = {"http://127.0.0.1:4200", "http://localhost:4200"})
public class BarcoController {

    private final BarcoRepository barcoRepository;

    public BarcoController(BarcoRepository barcoRepository) {
        this.barcoRepository = barcoRepository;
    }

    @GetMapping
    public List<BarcoDto> list() {
        return barcoRepository.findAllDto();
    }
}
