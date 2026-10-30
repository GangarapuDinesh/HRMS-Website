package com.hrms.backend.department;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    private final DepartmentService departmentService;
    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }
    @GetMapping
    public List<Department> getAllDepartments() {
        return departmentService.getAllDepartments();
    }
    @GetMapping("/{id}")
    public Department getDepartmentById(@PathVariable Long id) {
        return departmentService.getDepartmentById(id);
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Department createDepartment(
            @Valid @RequestBody Department department) {
        return departmentService.createDepartment(department);
    }
    @PutMapping("/{id}")
    public Department updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody Department department) {
        return departmentService.updateDepartment(id, department);
    }
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
    }
    @GetMapping("/search")
    public List<Department> searchDepartments(
            @RequestParam(required = false) String name) {
        return departmentService.searchDepartments(name);
    }
    @GetMapping("/status")
    public List<Department> getDepartmentsByStatus(
            @RequestParam String value) {
        return departmentService.getDepartmentsByStatus(value);
    }
}
