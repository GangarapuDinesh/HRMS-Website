
package com.hrms.backend.performance;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.hrms.backend.employee.Employee;
import com.hrms.backend.employee.EmployeeRepository;

@RestController
@RequestMapping("/api/performance/tasks")
public class EmployeeTaskController {

    private final EmployeeTaskService taskService;
    private final EmployeeRepository employeeRepository;

    public EmployeeTaskController(
            EmployeeTaskService taskService,
            EmployeeRepository employeeRepository) {
        this.taskService = taskService;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public List<TaskResponse> getAllTasks() {
        return taskService.getAllTasks()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/my")
    public List<TaskResponse> getMyTasks(Authentication authentication) {
        requireAuthentication(authentication);

        Employee employee = getAuthenticatedEmployee(authentication);

        return taskService.getEmployeeTasks(employee.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/employee/{employeeId}")
    public List<TaskResponse> getEmployeeTasks(
            @PathVariable Long employeeId,
            Authentication authentication) {

        requireAuthentication(authentication);

        if (hasAnyRole(authentication, "ROLE_ADMIN", "ROLE_HR_MANAGER")) {
            return taskService.getEmployeeTasks(employeeId)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (hasAnyRole(authentication, "ROLE_TEAM_LEADER")) {
            return taskService.getEmployeeTasks(employeeId)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        Employee employee = getAuthenticatedEmployee(authentication);

        if (!employee.getId().equals(employeeId)) {
            throw new AccessDeniedException(
                    "You can only view your own tasks.");
        }

        return taskService.getEmployeeTasks(employeeId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public TaskResponse getTask(
            @PathVariable Long id,
            Authentication authentication) {

        requireAuthentication(authentication);

        EmployeeTask task = taskService.getTask(id);

        if (!canManageTasks(authentication)
                && !isTaskOwner(authentication, task)) {
            throw new AccessDeniedException(
                    "You are not allowed to view this task.");
        }

        return toResponse(task);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public TaskResponse createTask(
            @RequestParam Long employeeId,
            @RequestBody TaskRequest request,
            Authentication authentication) {

        EmployeeTask task = toEntity(request);

        return toResponse(taskService.createTask(
                employeeId,
                task,
                authentication.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public TaskResponse updateTask(
            @PathVariable Long id,
            @RequestBody TaskRequest request) {

        return toResponse(
                taskService.updateTask(id, toEntity(request)));
    }

    @PutMapping("/{id}/progress")
    public TaskResponse updateProgress(
            @PathVariable Long id,
            @RequestBody ProgressRequest request,
            Authentication authentication) {

        requireAuthentication(authentication);

        EmployeeTask task = taskService.getTask(id);

        if (!isTaskOwner(authentication, task)) {
            throw new AccessDeniedException(
                    "You can only update your own task progress.");
        }

        return toResponse(taskService.updateProgress(
                id,
                request.progress(),
                request.submissionNotes()));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public TaskResponse reviewTask(
            @PathVariable Long id,
            @RequestBody ReviewTaskRequest request,
            Authentication authentication) {

        EmployeeTask task = taskService.getTask(id);

        if (task.getEmployee().getEmail()
                .equalsIgnoreCase(authentication.getName())) {
            throw new AccessDeniedException(
                    "You cannot review your own task.");
        }

        return toResponse(taskService.reviewTask(
                id,
                request.decision(),
                request.reviewerFeedback(),
                request.performanceRating(),
                authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
    }

    private EmployeeTask toEntity(TaskRequest request) {
        EmployeeTask task = new EmployeeTask();
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
        return task;
    }

    private TaskResponse toResponse(EmployeeTask task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getEmployee().getId(),
                task.getEmployee().getFullName(),
                task.getAssignedByEmail(),
                task.getPriority(),
                task.getDueDate(),
                task.getStatus(),
                task.getProgress(),
                task.getSubmissionNotes(),
                task.getReviewerFeedback(),
                task.getPerformanceRating(),
                task.getReviewedByEmail(),
                task.getSubmittedAt(),
                task.getReviewedAt(),
                task.getCreatedAt(),
                task.getUpdatedAt());
    }

    private void requireAuthentication(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required.");
        }
    }

    private Employee getAuthenticatedEmployee(Authentication authentication) {
        return employeeRepository
                .findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Employee record not found for your account."));
    }

    private boolean isTaskOwner(
            Authentication authentication,
            EmployeeTask task) {

        return hasAnyRole(authentication, "ROLE_EMPLOYEE")
                && task.getEmployee().getEmail()
                        .equalsIgnoreCase(authentication.getName());
    }

    private boolean canManageTasks(Authentication authentication) {
        return hasAnyRole(
                authentication,
                "ROLE_ADMIN",
                "ROLE_HR_MANAGER",
                "ROLE_TEAM_LEADER");
    }

    private boolean hasAnyRole(
            Authentication authentication,
            String... roles) {

        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority -> {
                    for (String role : roles) {
                        if (role.equals(authority.getAuthority())) {
                            return true;
                        }
                    }
                    return false;
                });
    }

    public record TaskRequest(
            String title,
            String description,
            String priority,
            LocalDate dueDate) {
    }

    public record ProgressRequest(
            Integer progress,
            String submissionNotes) {
    }

    public record ReviewTaskRequest(
            String decision,
            String reviewerFeedback,
            Integer performanceRating) {
    }

    public record TaskResponse(
            Long id,
            String title,
            String description,
            Long employeeId,
            String employeeName,
            String assignedByEmail,
            String priority,
            LocalDate dueDate,
            String status,
            Integer progress,
            String submissionNotes,
            String reviewerFeedback,
            Integer performanceRating,
            String reviewedByEmail,
            LocalDateTime submittedAt,
            LocalDateTime reviewedAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }
}
