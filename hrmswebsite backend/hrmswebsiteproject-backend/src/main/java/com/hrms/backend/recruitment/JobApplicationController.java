
package com.hrms.backend.recruitment;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recruitment")
public class JobApplicationController {

    private final JobApplicationService applicationService;

    public JobApplicationController(JobApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication != null
            && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority ->
                    authority.equals("ROLE_" + role)
                    || authority.equals(role));
    }

    private boolean canManageApplications(Authentication authentication) {
        return hasRole(authentication, "ADMIN")
            || hasRole(authentication, "HR_MANAGER");
    }

    private Map<String, Object> toResponse(JobApplication application) {
        Map<String, Object> result = new LinkedHashMap<>();

        result.put("id", application.getId());
        result.put("status", application.getStatus());
        result.put("coverLetter", application.getCoverLetter());
        result.put("appliedAt", application.getAppliedAt());
        result.put("updatedAt", application.getUpdatedAt());

        result.put("applicantId", application.getApplicant().getId());
        result.put("applicantName", application.getApplicant().getFullName());
        result.put("applicantEmail", application.getApplicant().getEmail());

        result.put("jobId", application.getJobOpening().getId());
        result.put("jobTitle", application.getJobOpening().getTitle());
        result.put("department", application.getJobOpening().getDepartment());

        return result;
    }

    @PostMapping("/jobs/{jobId}/apply")
    public ResponseEntity<?> apply(
            @PathVariable Long jobId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Please log in to apply."));
        }

        try {
            String coverLetter = body == null ? null : body.get("coverLetter");

            JobApplication application = applicationService.apply(
                authentication.getName(), jobId, coverLetter);

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(application));

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/applications/my")
    public ResponseEntity<?> getMyApplications(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Please log in first."));
        }

        try {
            List<Map<String, Object>> result =
                applicationService.getMyApplications(authentication.getName())
                    .stream()
                    .map(this::toResponse)
                    .toList();

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/jobs/{jobId}/applications")
    public ResponseEntity<?> getApplicationsForJob(
            @PathVariable Long jobId,
            Authentication authentication) {

        if (!canManageApplications(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message",
                    "Only Admin or HR Manager can view applicants."));
        }

        try {
            List<Map<String, Object>> result =
                applicationService.getJobApplications(jobId)
                    .stream()
                    .map(this::toResponse)
                    .toList();

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", exception.getMessage()));
        }
    }

    @PatchMapping("/applications/{applicationId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long applicationId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        if (!canManageApplications(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message",
                    "Only Admin or HR Manager can update application status."));
        }

        try {
            JobApplication application = applicationService.updateStatus(
                applicationId, body.get("status"));

            return ResponseEntity.ok(toResponse(application));

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", exception.getMessage()));
        }
    }
}
