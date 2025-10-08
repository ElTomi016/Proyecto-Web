package com.example.demo.controller;

import com.example.demo.entity.Barco;
import com.example.demo.entity.Jugador;
import com.example.demo.entity.ModeloBarco;
import com.example.demo.repository.BarcoRepository;
import com.example.demo.repository.JugadorRepository;
import com.example.demo.repository.ModeloBarcoRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/barcos")
public class BarcoController {

    private final BarcoRepository barcoRepo;
    private final JugadorRepository jugadorRepo;
    private final ModeloBarcoRepository modeloRepo;

    public BarcoController(BarcoRepository barcoRepo, JugadorRepository jugadorRepo, ModeloBarcoRepository modeloRepo) {
        this.barcoRepo = barcoRepo;
        this.jugadorRepo = jugadorRepo;
        this.modeloRepo = modeloRepo;
    }

    @GetMapping
    public String listar(Model model) {
        model.addAttribute("barcos", barcoRepo.findAll());
        return "barcos/lista";
    }

    @GetMapping("/nuevo")
    public String formulario(Model model) {
        model.addAttribute("barco", new Barco());
        model.addAttribute("jugadores", jugadorRepo.findAll());
        model.addAttribute("modelos", modeloRepo.findAll());
        model.addAttribute("selectedJugadorId", null);
        model.addAttribute("selectedModeloId", null);
        return "barcos/formulario";
    }

    @PostMapping
    public String guardar(@ModelAttribute Barco barco,
                          @RequestParam("jugadorId") Long jugadorId,
                          @RequestParam("modeloId") Long modeloId) {

        Jugador jugador = jugadorRepo.findById(jugadorId).orElseThrow();
        ModeloBarco modelo = modeloRepo.findById(modeloId).orElseThrow();
        barco.setJugador(jugador);
        barco.setModelo(modelo);
        barcoRepo.save(barco);
        return "redirect:/barcos";
    }

    @GetMapping("/{id}/editar")
    public String editar(@PathVariable Long id, Model model) {
        Barco barco = barcoRepo.findById(id).orElseThrow();
        model.addAttribute("barco", barco);
        model.addAttribute("jugadores", jugadorRepo.findAll());
        model.addAttribute("modelos", modeloRepo.findAll());
        model.addAttribute("selectedJugadorId", barco.getJugador() != null ? barco.getJugador().getId() : null);
        model.addAttribute("selectedModeloId", barco.getModelo() != null ? barco.getModelo().getId() : null);
        return "barcos/formulario";
    }

    @PostMapping("/{id}")
    public String actualizar(@PathVariable Long id,
                             @ModelAttribute Barco barco,
                             @RequestParam("jugadorId") Long jugadorId,
                             @RequestParam("modeloId") Long modeloId) {

        Jugador jugador = jugadorRepo.findById(jugadorId).orElseThrow();
        ModeloBarco modelo = modeloRepo.findById(modeloId).orElseThrow();
        barco.setId(id);
        barco.setJugador(jugador);
        barco.setModelo(modelo);
        barcoRepo.save(barco);
        return "redirect:/barcos";
    }

    @GetMapping("/{id}/eliminar")
    public String eliminar(@PathVariable Long id) {
        barcoRepo.deleteById(id);
        return "redirect:/barcos";
    }
}
