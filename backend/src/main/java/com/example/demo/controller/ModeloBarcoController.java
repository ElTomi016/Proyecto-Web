package com.example.demo.controller;

import com.example.demo.entity.ModeloBarco;
import com.example.demo.repository.ModeloBarcoRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/modelos")
public class ModeloBarcoController {

    private final ModeloBarcoRepository modeloRepo;

    public ModeloBarcoController(ModeloBarcoRepository modeloRepo) {
        this.modeloRepo = modeloRepo;
    }

    @GetMapping
    public String listar(Model model) {
        model.addAttribute("modelos", modeloRepo.findAll());
        return "modelos/lista";
    }

    @GetMapping("/nuevo")
    public String formulario(Model model) {
        model.addAttribute("modelo", new ModeloBarco());
        return "modelos/formulario";
    }

    @PostMapping
    public String guardar(@ModelAttribute ModeloBarco modelo) {
        modeloRepo.save(modelo);
        return "redirect:/modelos";
    }

    @GetMapping("/{id}/editar")
    public String editar(@PathVariable Long id, Model model) {
        ModeloBarco modelo = modeloRepo.findById(id).orElseThrow();
        model.addAttribute("modelo", modelo);
        return "modelos/formulario";
    }

    @PostMapping("/{id}")
    public String actualizar(@PathVariable Long id, @ModelAttribute ModeloBarco modelo) {
        modelo.setId(id);
        modeloRepo.save(modelo);
        return "redirect:/modelos";
    }

    @GetMapping("/{id}/eliminar")
    public String eliminar(@PathVariable Long id) {
        modeloRepo.deleteById(id);
        return "redirect:/modelos";
    }
}
