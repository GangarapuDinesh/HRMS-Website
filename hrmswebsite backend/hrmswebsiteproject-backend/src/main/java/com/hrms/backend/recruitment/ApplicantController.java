
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
@RequestMapping("/api/recruitment/applicants")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class ApplicantController {

    private final ApplicantService service;

    public ApplicantController(ApplicantService service) {
        this.service = service;
    }

    @GetMapping
    public List<Applicant> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long jobOpeningId) {

        return service.getAll(status, jobOpeningId);
    }

    @GetMapping("/{id}")
    public Applicant getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Applicant create(
            @Valid @RequestBody Applicant applicant) {

        return service.create(applicant);
    }

    @PutMapping("/{id}")
    public Applicant update(
            @PathVariable Long id,
            @Valid @RequestBody Applicant applicant) {

        return service.update(id, applicant);
    }

    @PatchMapping("/{id}/status")
    public Applicant updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return service.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
