package com.university.management.service;

import com.university.management.dto.AuthResponse;
import com.university.management.dto.LoginRequest;
import com.university.management.dto.RegisterRequest;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);
}
