package com.example.standupcheckin.controller;

import com.example.standupcheckin.common.Result;
import com.example.standupcheckin.dto.LoginRequest;
import com.example.standupcheckin.dto.LoginResponse;
import com.example.standupcheckin.dto.RegisterRequest;
import com.example.standupcheckin.entity.User;
import com.example.standupcheckin.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return Result.success(authService.login(request));
    }

    @PostMapping("/register")
    public Result<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return Result.success(authService.register(request));
    }

    @GetMapping("/me")
    public Result<LoginResponse.UserDTO> getCurrentUser(@AuthenticationPrincipal User user) {
        return Result.success(authService.getCurrentUser(user));
    }
}
