package com.hrms.backend.employee;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
@Service
public class EmployeeIdentityService {
    private final EmployeeRepository employeeRepository;
    public EmployeeIdentityService(
            EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }
    @Transactional(readOnly = true)
    public Employee getCurrentEmployee() {
        Authentication authentication =  SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Please log in again.");
        }
        Object principal = authentication.getPrincipal();
        String authenticatedEmail;
        if (principal instanceof UserDetails) {
           authenticatedEmail = ((UserDetails) principal).getUsername();
        } else {
            authenticatedEmail = principal.toString();
        }
        if (authenticatedEmail == null || authenticatedEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Unable to identify the logged-in account.");
        }
        final String email = authenticatedEmail.trim().toLowerCase(Locale.ROOT);
        return employeeRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,"No employee record matches the authenticated " + "email: " + email));
    }
    @Transactional(readOnly = true)
    public Long getCurrentEmployeeId() {
        return getCurrentEmployee().getId();
    }
}
