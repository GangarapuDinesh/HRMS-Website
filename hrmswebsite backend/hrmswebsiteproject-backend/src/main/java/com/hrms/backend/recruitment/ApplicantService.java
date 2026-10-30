
package com.hrms.backend.recruitment;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ApplicantService {

    private final ApplicantRepository repository;

    private static final Set<String> VALID_STATUSES = Set.of(
            "APPLIED",
            "SHORTLISTED",
            "INTERVIEW",
            "SELECTED",
            "REJECTED",
            "HIRED"
    );

    public ApplicantService(ApplicantRepository repository) {
        this.repository = repository;
    }

    public Applicant create(Applicant applicant) {
        validateApplicant(applicant);

        applicant.setId(null);
        applicant.setStatus("APPLIED");

        return repository.save(applicant);
    }

    @Transactional(readOnly = true)
    public List<Applicant> getAll(
            String status,
            Long jobOpeningId) {

        if (status != null && !status.isBlank()) {
            String normalizedStatus = normalizeStatus(status);

            if (jobOpeningId != null) {
                return repository.findByJobOpeningIdOrderByCreatedAtDesc(
                        jobOpeningId
                ).stream()
                 .filter(a -> normalizedStatus.equals(a.getStatus()))
                 .toList();
            }

            return repository.findByStatusIgnoreCaseOrderByCreatedAtDesc(
                    normalizedStatus);
        }

        if (jobOpeningId != null) {
            return repository.findByJobOpeningIdOrderByCreatedAtDesc(
                    jobOpeningId);
        }

        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Applicant getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Applicant not found"
                ));
    }

    public Applicant update(Long id, Applicant updated) {
        Applicant existing = getById(id);

        validateApplicant(updated);

        existing.setFullName(updated.getFullName().trim());
        existing.setEmail(updated.getEmail().trim());
        existing.setPhone(updated.getPhone());
        existing.setJobOpeningId(updated.getJobOpeningId());
        existing.setHighestQualification(
                updated.getHighestQualification());
        existing.setExperience(updated.getExperience());
        existing.setResumeUrl(updated.getResumeUrl());
        existing.setAppliedDate(updated.getAppliedDate());
        existing.setNotes(updated.getNotes());

        return repository.save(existing);
    }

    public Applicant updateStatus(Long id, String status) {
        Applicant applicant = getById(id);

        applicant.setStatus(normalizeStatus(status));

        return repository.save(applicant);
    }

    public void delete(Long id) {
        Applicant applicant = getById(id);
        repository.delete(applicant);
    }

    private void validateApplicant(Applicant applicant) {
        if (applicant.getFullName() == null
                || applicant.getFullName().isBlank()
                || applicant.getEmail() == null
                || applicant.getEmail().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Applicant name and email are required"
            );
        }

        if (!applicant.getEmail().trim().matches(
                "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please enter a valid email address"
            );
        }
    }

    private String normalizeStatus(String status) {
        String normalized = status.trim().toUpperCase(Locale.ROOT);

        if (!VALID_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid applicant status. Allowed values: "
                            + VALID_STATUSES
            );
        }

        return normalized;
    }
}
