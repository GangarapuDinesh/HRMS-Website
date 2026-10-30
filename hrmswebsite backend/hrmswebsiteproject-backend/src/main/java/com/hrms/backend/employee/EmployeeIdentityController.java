package com.hrms.backend.employee;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/employee-identity")
public class EmployeeIdentityController {
    private final EmployeeIdentityService employeeIdentityService;
    public EmployeeIdentityController(EmployeeIdentityService employeeIdentityService) {
        this.employeeIdentityService = employeeIdentityService;
    }
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> getCurrentEmployee() {
        Employee employee = employeeIdentityService.getCurrentEmployee();
        return Map.of(
                "employeeId", employee.getId(),
                "fullName", employee.getFullName(),
                "email", employee.getEmail(),
                "employmentStatus", employee.getEmploymentStatus()
        );
    }
}
