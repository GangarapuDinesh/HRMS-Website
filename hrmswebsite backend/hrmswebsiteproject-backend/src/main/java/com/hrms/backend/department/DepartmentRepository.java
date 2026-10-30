package com.hrms.backend.department;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface DepartmentRepository
        extends JpaRepository<Department, Long> {
    Optional<Department> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    List<Department> findByStatusIgnoreCase(String status);
    List<Department> findByNameContainingIgnoreCase(String name);
}
