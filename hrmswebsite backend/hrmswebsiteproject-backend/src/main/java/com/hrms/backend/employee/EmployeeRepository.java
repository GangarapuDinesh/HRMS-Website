package com.hrms.backend.employee;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmail(String email);
    Optional<Employee> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<Employee> findByDepartmentIgnoreCase(String department);
    List<Employee> findByEmploymentStatusIgnoreCase(String employmentStatus);
    List<Employee> findByFullNameContainingIgnoreCase(String fullName);
}
