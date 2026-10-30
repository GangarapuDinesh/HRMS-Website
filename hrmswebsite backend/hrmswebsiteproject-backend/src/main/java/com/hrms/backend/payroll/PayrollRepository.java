package com.hrms.backend.payroll;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    List<Payroll> findAllByOrderBySalaryYearDescSalaryMonthDesc();
    List<Payroll> findByEmployee_IdOrderBySalaryYearDescSalaryMonthDesc(Long employeeId);
    List<Payroll> findByPaymentStatusOrderBySalaryYearDescSalaryMonthDesc(String paymentStatus);
    List<Payroll> findBySalaryMonthAndSalaryYearOrderByEmployee_FullNameAsc(
        Integer salaryMonth,
        Integer salaryYear
    );
    Optional<Payroll> findByEmployee_IdAndSalaryMonthAndSalaryYear(
        Long employeeId,
        Integer salaryMonth,
        Integer salaryYear
    );
    boolean existsByEmployee_IdAndSalaryMonthAndSalaryYear(
        Long employeeId,
        Integer salaryMonth,
        Integer salaryYear
    );
    long countByPaymentStatus(String paymentStatus);

    List<Payroll> findByEmployee_IdAndPaymentStatusOrderBySalaryYearDescSalaryMonthDesc(
        Long employeeId,
        String paymentStatus
    );
}
