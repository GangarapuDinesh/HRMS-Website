package com.hrms.backend.payroll;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.hrms.backend.employee.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
@Entity
@Table(
    name = "payroll",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_employee_payroll_month",
            columnNames = {"employee_id", "salary_month", "salary_year"}
        )
    }
)
public class Payroll {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
    @Column(name = "salary_month", nullable = false)
    private Integer salaryMonth;
    @Column(name = "salary_year", nullable = false)
    private Integer salaryYear;
    @Column(name = "basic_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal basicSalary;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal allowances = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal deductions = BigDecimal.ZERO;
    @Column(name = "net_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal netSalary;
    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "PENDING";
    @Column(name = "generated_at", insertable = false, updatable = false)
    private LocalDateTime generatedAt;
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    public Payroll() {
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Employee getEmployee() {
        return employee;
    }
    public void setEmployee(Employee employee) {
        this.employee = employee;
    }
    public Integer getSalaryMonth() {
        return salaryMonth;
    }
    public void setSalaryMonth(Integer salaryMonth) {
        this.salaryMonth = salaryMonth;
    }
    public Integer getSalaryYear() {
        return salaryYear;
    }
   public void setSalaryYear(Integer salaryYear) {
        this.salaryYear = salaryYear;
    }
    public BigDecimal getBasicSalary() {
        return basicSalary;
    }
    public void setBasicSalary(BigDecimal basicSalary) {
        this.basicSalary = basicSalary;
    }
    public BigDecimal getAllowances() {
        return allowances;
    }
    public void setAllowances(BigDecimal allowances) {
        this.allowances = allowances;
    }
    public BigDecimal getDeductions() {
        return deductions;
    }
    public void setDeductions(BigDecimal deductions) {
        this.deductions = deductions;
    }
    public BigDecimal getNetSalary() {
        return netSalary;
    }
    public void setNetSalary(BigDecimal netSalary) {
        this.netSalary = netSalary;
    }
    public String getPaymentStatus() {
        return paymentStatus;
    }
    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }
    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
    public LocalDateTime getPaidAt() {
        return paidAt;
    }
    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }
}
