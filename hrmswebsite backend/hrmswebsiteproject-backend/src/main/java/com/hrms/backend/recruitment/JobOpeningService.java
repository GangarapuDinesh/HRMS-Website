
package com.hrms.backend.recruitment;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class JobOpeningService {

    private final JobOpeningRepository repository;

    public JobOpeningService(JobOpeningRepository repository) {
        this.repository = repository;
    }

    public JobOpening create(JobOpening job) {
        validate(job);

        job.setId(null);
        job.setStatus("OPEN");

        return repository.save(job);
    }

    @Transactional(readOnly = true)
    public List<JobOpening> getAll(String status, String department) {
        if (department != null && !department.isBlank()) {
            return repository.findByDepartmentIgnoreCaseOrderByCreatedAtDesc(
                    department.trim());
        }

        if (status != null && !status.isBlank()) {
            return repository.findByStatusIgnoreCaseOrderByCreatedAtDesc(
                    normalizeStatus(status));
        }

        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public JobOpening getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Job opening not found"));
    }

    public JobOpening update(Long id, JobOpening updated) {
        JobOpening existing = getById(id);

        validate(updated);

        existing.setTitle(updated.getTitle().trim());
        existing.setDepartment(updated.getDepartment().trim());
        existing.setLocation(updated.getLocation());
        existing.setEmploymentType(updated.getEmploymentType());
        existing.setDescription(updated.getDescription().trim());
        existing.setRequiredSkills(updated.getRequiredSkills());
        existing.setOpenings(updated.getOpenings());
        existing.setMinimumSalary(updated.getMinimumSalary());
        existing.setMaximumSalary(updated.getMaximumSalary());
        existing.setClosingDate(updated.getClosingDate());

        return repository.save(existing);
    }

    public JobOpening close(Long id) {
        JobOpening job = getById(id);
        job.setStatus("CLOSED");
        return repository.save(job);
    }

    public void delete(Long id) {
        JobOpening job = getById(id);
        repository.delete(job);
    }

    private void validate(JobOpening job) {
        if (job.getTitle() == null || job.getTitle().isBlank()
                || job.getDepartment() == null
                || job.getDepartment().isBlank()
                || job.getDescription() == null
                || job.getDescription().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Title, department, and description are required");
        }

        if (job.getOpenings() == null || job.getOpenings() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Number of openings must be at least 1");
        }

        if (job.getMinimumSalary() != null
                && job.getMinimumSalary() < 0
                || job.getMaximumSalary() != null
                && job.getMaximumSalary() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Salary cannot be negative");
        }

        if (job.getMinimumSalary() != null
                && job.getMaximumSalary() != null
                && job.getMinimumSalary() > job.getMaximumSalary()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Minimum salary cannot exceed maximum salary");
        }
    }

    private String normalizeStatus(String status) {
        String normalized = status.trim().toUpperCase(Locale.ROOT);

        if (!normalized.equals("OPEN") && !normalized.equals("CLOSED")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Status must be OPEN or CLOSED");
        }

        return normalized;
    }
}
