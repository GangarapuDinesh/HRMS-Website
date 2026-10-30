package com.hrms.backend.department;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
@Service
@Transactional
public class DepartmentService {
    private final DepartmentRepository departmentRepository;
    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }
    @Transactional(readOnly = true)
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }
    @Transactional(readOnly = true)
    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found" ));
    }
    public Department createDepartment(Department department) {
        validateDepartment(department);
        departmentRepository.findByNameIgnoreCase(department.getName())
            .ifPresent(existing -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT,"A department with this name already exists");
            });
        department.setId(null);
        return departmentRepository.save(department);
    }
    public Department updateDepartment(Long id, Department updated) {
        Department existing = getDepartmentById(id);
        validateDepartment(updated);
        departmentRepository.findByNameIgnoreCase(updated.getName())
            .filter(department -> !department.getId().equals(id))
            .ifPresent(department -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Another department already uses this name");
            });
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setStatus(updated.getStatus());
        return departmentRepository.save(existing);
    }
    public void deleteDepartment(Long id) {
        Department department = getDepartmentById(id);
        departmentRepository.delete(department);
    }
    @Transactional(readOnly = true)
    public List<Department> searchDepartments(String name) {
        if (name == null || name.isBlank()) {
            return getAllDepartments();
        }
        return departmentRepository.findByNameContainingIgnoreCase(name.trim());
    }
    @Transactional(readOnly = true)
    public List<Department> getDepartmentsByStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department status is required");
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!normalized.equals("ACTIVE") && !normalized.equals("INACTIVE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be ACTIVE or INACTIVE");
        }
        return departmentRepository.findByStatusIgnoreCase(normalized);
    }
    private void validateDepartment(Department department) {
        if (department == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department details are required");
        }
        if (department.getName() != null) {
            department.setName(department.getName().trim());
        }
        if (department.getDescription() != null) {
            department.setDescription(department.getDescription().trim());
        }
        if (department.getStatus() == null || department.getStatus().isBlank()) {
            department.setStatus("ACTIVE");
        } else {
            department.setStatus(
                department.getStatus().trim().toUpperCase(Locale.ROOT)
            );
        }
        if (department.getName() == null || department.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department name is required");
        }
        if (!department.getStatus().equals("ACTIVE") && !department.getStatus().equals("INACTIVE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Status must be ACTIVE or INACTIVE");
        }
    }
}
