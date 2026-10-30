package com.hrms.backend.profile;

import java.time.LocalDateTime;

public record ProfileResponse(
        Long id,
        String fullName,
        String email,
        String role,
        String phone,
        String jobTitle,
        String department,
        String location,
        String profilePhoto,
        LocalDateTime createdAt,
        String token
) {
}