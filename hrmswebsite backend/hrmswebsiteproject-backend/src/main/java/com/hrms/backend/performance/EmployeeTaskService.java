
package com.hrms.backend.performance;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.hrms.backend.employee.Employee;
import com.hrms.backend.employee.EmployeeRepository;

@Service
public class EmployeeTaskService {

    private final EmployeeTaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;

    public EmployeeTaskService(
            EmployeeTaskRepository taskRepository,
            EmployeeRepository employeeRepository) {
        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<EmployeeTask> getAllTasks() {
        return taskRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<EmployeeTask> getEmployeeTasks(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Employee not found");
        }

        return taskRepository.findByEmployee_IdOrderByCreatedAtDesc(employeeId);
    }

    @Transactional(readOnly = true)
    public List<EmployeeTask> getAssignedTasks(String assignedByEmail) {
        return taskRepository
                .findByAssignedByEmailIgnoreCaseOrderByCreatedAtDesc(
                        assignedByEmail);
    }

    @Transactional(readOnly = true)
    public EmployeeTask getTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Task not found"));
    }

    @Transactional
    public EmployeeTask createTask(
            Long employeeId,
            EmployeeTask request,
            String assignedByEmail) {

        validateTask(request);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Employee not found"));

        EmployeeTask task = new EmployeeTask();
        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        task.setEmployee(employee);
        task.setAssignedByEmail(assignedByEmail);
        task.setPriority(normalizePriority(request.getPriority()));
        task.setDueDate(request.getDueDate());
        task.setStatus("TODO");
        task.setProgress(0);

        return taskRepository.save(task);
    }

    @Transactional
    public EmployeeTask updateTask(
            Long id,
            EmployeeTask request) {

        EmployeeTask task = getTask(id);

        if ("SUBMITTED".equals(task.getStatus())
                || "APPROVED".equals(task.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Submitted or approved tasks cannot be edited this way");
        }

        validateTask(request);

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        task.setPriority(normalizePriority(request.getPriority()));
        task.setDueDate(request.getDueDate());

        return taskRepository.save(task);
    }

    @Transactional
    public EmployeeTask updateProgress(
            Long id,
            Integer progress,
            String submissionNotes) {

        EmployeeTask task = getTask(id);

        if ("SUBMITTED".equals(task.getStatus())
                || "APPROVED".equals(task.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This task cannot be updated in its current status");
        }

        if (progress == null || progress < 0 || progress > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Progress must be between 0 and 100");
        }

        task.setProgress(progress);
        task.setSubmissionNotes(submissionNotes);

        if (progress == 0) {
            task.setStatus("TODO");
        } else if (progress == 100) {
            task.setStatus("SUBMITTED");
            task.setSubmittedAt(LocalDateTime.now());
        } else {
            task.setStatus("IN_PROGRESS");
        }

        return taskRepository.save(task);
    }

    @Transactional
    public EmployeeTask reviewTask(
            Long id,
            String decision,
            String reviewerFeedback,
            Integer performanceRating,
            String reviewedByEmail) {

        EmployeeTask task = getTask(id);

        if (!"SUBMITTED".equals(task.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only submitted tasks can be reviewed");
        }

        String normalizedDecision = decision == null
                ? "" : decision.trim().toUpperCase();

        if (!List.of("APPROVED", "REVISION_REQUESTED")
                .contains(normalizedDecision)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Decision must be APPROVED or REVISION_REQUESTED");
        }

        if (performanceRating != null
                && (performanceRating < 1 || performanceRating > 5)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Performance rating must be between 1 and 5");
        }

        if ("APPROVED".equals(normalizedDecision)
                && performanceRating == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A performance rating is required for approval");
        }

        task.setStatus(normalizedDecision);
        task.setReviewerFeedback(reviewerFeedback);
        task.setPerformanceRating(performanceRating);
        task.setReviewedByEmail(reviewedByEmail);
        task.setReviewedAt(LocalDateTime.now());

        if ("REVISION_REQUESTED".equals(normalizedDecision)) {
            task.setProgress(Math.min(task.getProgress(), 99));
        }

        return taskRepository.save(task);
    }

    @Transactional
    public void deleteTask(Long id) {
        EmployeeTask task = getTask(id);
        taskRepository.delete(task);
    }

    private void validateTask(EmployeeTask task) {
        if (task.getTitle() == null || task.getTitle().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Task title is required");
        }

        if (task.getTitle().trim().length() > 200) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Task title cannot exceed 200 characters");
        }

        if (task.getDueDate() != null
                && task.getDueDate().isBefore(java.time.LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Due date cannot be in the past");
        }
    }

    private String normalizePriority(String priority) {
        String value = priority == null || priority.isBlank()
                ? "MEDIUM" : priority.trim().toUpperCase();

        if (!List.of("LOW", "MEDIUM", "HIGH", "URGENT").contains(value)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid task priority");
        }

        return value;
    }
}
