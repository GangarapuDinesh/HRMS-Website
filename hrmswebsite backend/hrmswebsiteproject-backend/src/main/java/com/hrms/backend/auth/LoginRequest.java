
package com.hrms.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    String email,

    @NotBlank(message = "Password is required")
    String password,

    @NotBlank(message = "Please select your account role")
    String role

) {
}
