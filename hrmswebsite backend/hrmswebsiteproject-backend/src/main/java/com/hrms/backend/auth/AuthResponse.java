package com.hrms.backend.auth;

public record AuthResponse(String token,Long userId,Long employeeId,String fullName,String email,String role) {}
