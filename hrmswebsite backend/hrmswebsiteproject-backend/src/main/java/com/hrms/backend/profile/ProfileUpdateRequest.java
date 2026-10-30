package com.hrms.backend.profile;

public record ProfileUpdateRequest(
        String fullName,
        String email,
        String phone,
        String jobTitle,
        String department,
        String location
) {
}