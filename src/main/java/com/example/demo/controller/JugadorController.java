package com.example.demo.controller;

import com.example.demo.entity.Jugador;
import com.example.demo.repository.JugadorRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;


@Controller
@RequestMapping("/jugadores")
public class JugadorController {
    private final JugadorRepository jugadorRepo;

    public JugadorController(JugadorRepository jugadorRepo) {
        this.jugadorRepo = jugadorRepo;
    }

    @GetMapping
    public String listar(Model model) {
        model.addAttribute("jugadores", jugadorRepo.findAll());
        return "jugadores/lista";
    }

    @GetMapping("/nuevo")
    public String formulario(Model model) {
        model.addAttribute("jugador", new Jugador());
        return "jugadores/formulario";
    }

    @PostMapping
    public String guardar(@ModelAttribute Jugador jugador) {
        jugadorRepo.save(jugador);
        return "redirect:/jugadores";
    }

    @GetMapping("/{id}/editar")
    public String editar(@PathVariable Long id, Model model) {
        Jugador jugador = jugadorRepo.findById(id).orElseThrow();
        model.addAttribute("jugador", jugador);
        return "jugadores/formulario";
    }

    @PostMapping("/{id}")
    public String actualizar(@PathVariable Long id, @ModelAttribute Jugador jugador) {
        jugador.setId(id);
        jugadorRepo.save(jugador);
        return "redirect:/jugadores";
    }

    @GetMapping("/{id}/eliminar")
    public String eliminar(@PathVariable Long id) {
        jugadorRepo.deleteById(id);
        return "redirect:/jugadores";
    }
}
