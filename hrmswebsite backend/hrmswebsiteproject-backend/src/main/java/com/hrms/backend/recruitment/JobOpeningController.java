
package com.hrms.backend.recruitment;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recruitment/jobs")
public class JobOpeningController {

    private final JobOpeningService service;

    public JobOpeningController(JobOpeningService service) {
        this.service = service;
    }

    @GetMapping
    public List<JobOpening> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department) {
        return service.getAll(status, department);
    }

    @GetMapping("/{id}")
    public JobOpening getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public JobOpening create(@Valid @RequestBody JobOpening job) {
        return service.create(job);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public JobOpening update(
            @PathVariable Long id,
            @Valid @RequestBody JobOpening job) {
        return service.update(id, job);
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public JobOpening close(@PathVariable Long id) {
        return service.close(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
