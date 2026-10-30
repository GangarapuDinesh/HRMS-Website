package com.hrms.backend.employee;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
@Service
@Transactional
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }
    @Transactional(readOnly = true)
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }
    @Transactional(readOnly = true)
    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Employee not found with ID: " + id));
    }
    public Employee createEmployee(Employee employee) {
        normalizeEmployee(employee);
        if (employeeRepository.existsByEmailIgnoreCase(employee.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,"An employee with this email already exists");
        }
        employee.setId(null);
        return employeeRepository.save(employee);
    }
    public Employee updateEmployee(Long id, Employee updatedEmployee) {
        Employee existingEmployee = getEmployeeById(id);
        normalizeEmployee(updatedEmployee);
        employeeRepository.findByEmailIgnoreCase(updatedEmployee.getEmail())
            .filter(employee -> !employee.getId().equals(id))
            .ifPresent(employee -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Another employee already uses this email");
            });
        existingEmployee.setFullName(updatedEmployee.getFullName());
        existingEmployee.setEmail(updatedEmployee.getEmail());
        existingEmployee.setPhone(updatedEmployee.getPhone());
        existingEmployee.setDepartment(updatedEmployee.getDepartment());
        existingEmployee.setDesignation(updatedEmployee.getDesignation());
        existingEmployee.setEmploymentStatus(
            updatedEmployee.getEmploymentStatus()
        );
        existingEmployee.setJoiningDate(updatedEmployee.getJoiningDate());
        return employeeRepository.save(existingEmployee);
    }
    public void deleteEmployee(Long id) {
        Employee employee = getEmployeeById(id);
        employeeRepository.delete(employee);
    }
    @Transactional(readOnly = true)
    public List<Employee> searchEmployees(String name) {
        if (name == null || name.isBlank()) {
            return getAllEmployees();
        }
        return employeeRepository.findByFullNameContainingIgnoreCase(
            name.trim()
        );
    }
    @Transactional(readOnly = true)
    public List<Employee> getEmployeesByDepartment(String department) {
        if (department == null || department.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Department is required");
        }
        return employeeRepository.findByDepartmentIgnoreCase(department.trim());
    }
    @Transactional(readOnly = true)
    public List<Employee> getEmployeesByStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Employment status is required");
        }
        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        if (!List.of("ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED").contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid employment status");
        }
        return employeeRepository.findByEmploymentStatusIgnoreCase(normalizedStatus);
    }
    private void normalizeEmployee(Employee employee) {
        if (employee == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Employee details are required");
        }
        if (employee.getFullName() != null) {
            employee.setFullName(employee.getFullName().trim());
        }
        if (employee.getEmail() != null) {
            employee.setEmail(employee.getEmail().trim().toLowerCase(Locale.ROOT));
        }
        if (employee.getPhone() != null) {
            employee.setPhone(employee.getPhone().trim());
        }
        if (employee.getDepartment() != null) {
            employee.setDepartment(employee.getDepartment().trim());
        }
        if (employee.getDesignation() != null) {
            employee.setDesignation(employee.getDesignation().trim());
        }
        if (employee.getEmploymentStatus() != null) {
            employee.setEmploymentStatus(employee.getEmploymentStatus().trim().toUpperCase(Locale.ROOT));
        }
    }
}
