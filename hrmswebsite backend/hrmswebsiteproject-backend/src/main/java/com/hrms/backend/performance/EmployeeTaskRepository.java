
package com.hrms.backend.performance;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeTaskRepository extends JpaRepository<EmployeeTask, Long> {

    List<EmployeeTask> findAllByOrderByCreatedAtDesc();

    List<EmployeeTask> findByEmployee_IdOrderByCreatedAtDesc(Long employeeId);

    List<EmployeeTask> findByAssignedByEmailIgnoreCaseOrderByCreatedAtDesc(
            String assignedByEmail);
}
