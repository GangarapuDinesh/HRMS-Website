package com.hrms.backend.payroll;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.hrms.backend.employee.Employee;
import com.hrms.backend.employee.EmployeeRepository;
@Service
@Transactional
public class PayrollService {
    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;
    public PayrollService(
            PayrollRepository payrollRepository,
            EmployeeRepository employeeRepository) {
        this.payrollRepository = payrollRepository;
        this.employeeRepository = employeeRepository;
    }
    public Payroll createPayroll(
            Long employeeId,
            Integer salaryMonth,
            Integer salaryYear,
            BigDecimal basicSalary,
            BigDecimal allowances,
            BigDecimal deductions) {
        if (employeeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee ID is required");
        }
        if (salaryMonth == null || salaryMonth < 1 || salaryMonth > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Salary month must be between 1 and 12");
        }
        if (salaryYear == null || salaryYear < 2000 || salaryYear > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid salary year");
        }
        validateAmount(basicSalary, "Basic salary");
        validateAmount(allowances, "Allowances");
        validateAmount(deductions, "Deductions");

        if (basicSalary.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Basic salary must be greater than zero");
        }
        if (allowances == null) {
            allowances = BigDecimal.ZERO;
        }
        if (deductions == null) {
            deductions = BigDecimal.ZERO;
        }
        BigDecimal netSalary = basicSalary
                .add(allowances)
                .subtract(deductions)
                .setScale(2, RoundingMode.HALF_UP);
        if (netSalary.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Deductions cannot exceed basic salary plus allowances");
        }
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        if (payrollRepository.existsByEmployee_IdAndSalaryMonthAndSalaryYear(
                employeeId, salaryMonth, salaryYear)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Payroll already exists for this employee and month");
        }
        Payroll payroll = new Payroll();
        payroll.setEmployee(employee);
        payroll.setSalaryMonth(salaryMonth);
        payroll.setSalaryYear(salaryYear);
        payroll.setBasicSalary(basicSalary.setScale(2, RoundingMode.HALF_UP));
        payroll.setAllowances(allowances.setScale(2, RoundingMode.HALF_UP));
        payroll.setDeductions(deductions.setScale(2, RoundingMode.HALF_UP));
        payroll.setNetSalary(netSalary);
        payroll.setPaymentStatus("PENDING");
        return payrollRepository.save(payroll);
    }
    @Transactional(readOnly = true)
    public List<Payroll> getAllPayrolls() {
        return payrollRepository.findAllByOrderBySalaryYearDescSalaryMonthDesc();
    }
    @Transactional(readOnly = true)
    public List<Payroll> getEmployeePayrolls(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found");
        }
        return payrollRepository.findByEmployee_IdOrderBySalaryYearDescSalaryMonthDesc(employeeId);
    }
    @Transactional(readOnly = true)
    public List<Payroll> getPayrollsByStatus(String status) {
        String normalizedStatus = validatePaymentStatus(status);
        return payrollRepository.findByPaymentStatusOrderBySalaryYearDescSalaryMonthDesc(normalizedStatus);
    }
    @Transactional(readOnly = true)
    public List<Payroll> getPayrollsByMonth(Integer month, Integer year) {
        if (month == null || month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Month must be between 1 and 12");
        }
        if (year == null || year < 2000 || year > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid salary year");
        }
        return payrollRepository.findBySalaryMonthAndSalaryYearOrderByEmployee_FullNameAsc(month, year);
    }
    public Payroll markAsPaid(Long payrollId) {
        Payroll payroll = payrollRepository.findById(payrollId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll record not found"));

        if ("PAID".equalsIgnoreCase(payroll.getPaymentStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This payroll has already been marked as paid");
        }
        payroll.setPaymentStatus("PAID");
        payroll.setPaidAt(LocalDateTime.now());
        return payrollRepository.save(payroll);
    }
    public Payroll markAsPending(Long payrollId) {
        Payroll payroll = payrollRepository.findById(payrollId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payroll record not found"));
        payroll.setPaymentStatus("PENDING");
        payroll.setPaidAt(null);
        return payrollRepository.save(payroll);
    }
    @Transactional(readOnly = true)
    public long countByStatus(String status) {
        return payrollRepository.countByPaymentStatus(validatePaymentStatus(status));
    }
    private void validateAmount(BigDecimal amount, String fieldName) {
        if (amount == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException( HttpStatus.BAD_REQUEST, fieldName + " cannot be negative");
        }
    }
    private String validatePaymentStatus(String status) {
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment status is required");
        }
        String normalized = status.trim().toUpperCase();
        if (!normalized.equals("PENDING") && !normalized.equals("PAID")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Payment status must be PENDING or PAID");
        }
        return normalized;
    }
}
