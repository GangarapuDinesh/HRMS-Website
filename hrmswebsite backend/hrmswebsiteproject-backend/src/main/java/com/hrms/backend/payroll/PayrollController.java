package com.hrms.backend.payroll;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.hrms.backend.employee.EmployeeIdentityService;
@RestController
@RequestMapping("/api/payroll")
public class PayrollController {
    private final PayrollService payrollService;
    private final EmployeeIdentityService employeeIdentityService;
    public PayrollController(PayrollService payrollService,EmployeeIdentityService employeeIdentityService) {
        this.payrollService = payrollService;
        this.employeeIdentityService = employeeIdentityService;
    }
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public Payroll createPayroll(@RequestBody Map<String, Object> request) {
        Long employeeId = getLong(request, "employeeId");
        Integer salaryMonth = getInteger(request, "salaryMonth");
        Integer salaryYear = getInteger(request, "salaryYear");
        BigDecimal basicSalary = getDecimal(request, "basicSalary");
        BigDecimal allowances = getDecimal(request, "allowances");
        BigDecimal deductions = getDecimal(request, "deductions");

        return payrollService.createPayroll(
                employeeId,
                salaryMonth,
                salaryYear,
                basicSalary,
                allowances,
                deductions
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public List<Payroll> getPayrolls(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        if (month != null || year != null) {
            if (month == null || year == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Both month and year are required");
            }
            return payrollService.getPayrollsByMonth(month, year);
        }
        if (status != null && !status.isBlank()) {
            return payrollService.getPayrollsByStatus(status);
        }
        return payrollService.getAllPayrolls();
    }
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public List<Payroll> getMyPayrolls() {
        Long employeeId = employeeIdentityService.getCurrentEmployeeId();
        return payrollService.getEmployeePayrolls(employeeId);
    }
    @PatchMapping("/{id}/paid")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public Payroll markAsPaid(@PathVariable Long id) {
        return payrollService.markAsPaid(id);
    }
    @PatchMapping("/{id}/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public Payroll markAsPending(@PathVariable Long id) {
        return payrollService.markAsPending(id);
    }
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public Map<String, Long> getPayrollSummary() {
        Map<String, Long> summary = new LinkedHashMap<>();
        summary.put("total", (long) payrollService.getAllPayrolls().size());
        summary.put("pending", payrollService.countByStatus("PENDING"));
        summary.put("paid", payrollService.countByStatus("PAID"));
        return summary;
    }
    private Long getLong(Map<String, Object> request, String field) {
        Object value = request.get(field);
        if (value == null || value.toString().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,field + " is required");
        }
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,field + " must be a valid number");
        }
    }
    private Integer getInteger(Map<String, Object> request, String field) {
        Object value = request.get(field);
        if (value == null || value.toString().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,field + " is required");
        }
        try {
            return Integer.valueOf(value.toString());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,field + " must be a valid integer");
        }
    }
    private BigDecimal getDecimal(Map<String, Object> request, String field) {
        Object value = request.get(field);
        if (value == null || value.toString().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,field + " is required");
        }
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,field + " must be a valid amount");
        }
    }
}
