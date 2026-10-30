
package com.hrms.backend.recruitment;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.backend.user.User;
import com.hrms.backend.user.UserRepository;

@Service
public class JobApplicationService {

    private final JobApplicationRepository applicationRepository;
    private final JobOpeningRepository jobOpeningRepository;
    private final UserRepository userRepository;

    private static final Set<String> ALLOWED_APPLICANT_ROLES =
        Set.of("EMPLOYEE", "TEAM_LEADER", "TEAMLEADER");

    private static final Set<String> ALLOWED_STATUSES =
        Set.of("PENDING", "UNDER_REVIEW", "SHORTLISTED", "REJECTED", "HIRED");

    public JobApplicationService(
            JobApplicationRepository applicationRepository,
            JobOpeningRepository jobOpeningRepository,
            UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.jobOpeningRepository = jobOpeningRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public JobApplication apply(
            String email,
            Long jobId,
            String coverLetter) {

        User applicant = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() ->
                new IllegalArgumentException("Logged-in user was not found."));

        String role = applicant.getRole() == null
            ? ""
            : applicant.getRole().trim().toUpperCase(Locale.ROOT);

        if (!ALLOWED_APPLICANT_ROLES.contains(role)) {
            throw new IllegalArgumentException(
                "Only employees and team leaders can apply for jobs.");
        }

        JobOpening job = jobOpeningRepository.findById(jobId)
            .orElseThrow(() ->
                new IllegalArgumentException("Job opening was not found."));

        if (!"OPEN".equalsIgnoreCase(job.getStatus())) {
            throw new IllegalArgumentException(
                "This job is closed and is no longer accepting applications.");
        }

        if (applicationRepository.existsByApplicant_IdAndJobOpening_Id(
                applicant.getId(), jobId)) {
            throw new IllegalArgumentException(
                "You have already applied for this job.");
        }

        if (coverLetter != null && coverLetter.length() > 2000) {
            throw new IllegalArgumentException(
                "Cover letter cannot exceed 2000 characters.");
        }

        JobApplication application = new JobApplication();
        application.setApplicant(applicant);
        application.setJobOpening(job);
        application.setCoverLetter(
            coverLetter == null ? null : coverLetter.trim());

        return applicationRepository.save(application);
    }

    @Transactional(readOnly = true)
    public List<JobApplication> getMyApplications(String email) {

        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() ->
                new IllegalArgumentException("Logged-in user was not found."));

        return applicationRepository
            .findByApplicant_IdOrderByAppliedAtDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public List<JobApplication> getJobApplications(Long jobId) {

        if (!jobOpeningRepository.existsById(jobId)) {
            throw new IllegalArgumentException("Job opening was not found.");
        }

        return applicationRepository
            .findByJobOpening_IdOrderByAppliedAtDesc(jobId);
    }

    @Transactional
    public JobApplication updateStatus(Long applicationId, String status) {

        JobApplication application = applicationRepository.findById(applicationId)
            .orElseThrow(() ->
                new IllegalArgumentException("Application was not found."));

        if (status == null) {
            throw new IllegalArgumentException(
                "Application status is required.");
        }

        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);

        if (!ALLOWED_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException(
                "Invalid status. Use PENDING, UNDER_REVIEW, SHORTLISTED, REJECTED, or HIRED.");
        }

        application.updateStatus(normalizedStatus);

        return applicationRepository.save(application);
    }
}
