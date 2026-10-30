
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
@RequestMapping("/api/performance/reviews")
public class PerformanceReviewController {

    private final PerformanceReviewService reviewService;
    private final EmployeeRepository employeeRepository;

    public PerformanceReviewController(
            PerformanceReviewService reviewService,
            EmployeeRepository employeeRepository) {
        this.reviewService = reviewService;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public List<ReviewResponse> getAllReviews() {
        return reviewService.getAllReviews().stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/employee/{employeeId}")
    public List<ReviewResponse> getEmployeeReviews(
            @PathVariable Long employeeId,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required.");
        }

        boolean staffAccess = hasAnyRole(
                authentication,
                "ROLE_ADMIN",
                "ROLE_HR_MANAGER",
                "ROLE_TEAM_LEADER"
        );

        if (!staffAccess) {
            boolean employeeAccess = hasAnyRole(
                    authentication,
                    "ROLE_EMPLOYEE"
            );

            if (!employeeAccess) {
                throw new AccessDeniedException(
                        "You are not allowed to view these reviews."
                );
            }

            Employee employee = employeeRepository
                    .findByEmailIgnoreCase(authentication.getName())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Employee record not found for your account."
                    ));

            if (!employee.getId().equals(employeeId)) {
                throw new AccessDeniedException(
                        "You can only view your own performance reviews."
                );
            }
        }

        return reviewService.getEmployeeReviews(employeeId).stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public ReviewResponse getReview(@PathVariable Long id) {
        return toResponse(reviewService.getReview(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public ReviewResponse createReview(
            @RequestParam Long employeeId,
            @RequestBody ReviewRequest request,
            Authentication authentication) {

        PerformanceReview review = toEntity(request);

        return toResponse(reviewService.createReview(
                employeeId,
                review,
                authentication.getName()
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public ReviewResponse updateReview(
            @PathVariable Long id,
            @RequestBody ReviewRequest request) {

        return toResponse(
                reviewService.updateReview(id, toEntity(request))
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public void deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
    }

    private boolean hasAnyRole(
            Authentication authentication,
            String... roles) {

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> {
                    for (String role : roles) {
                        if (role.equals(authority.getAuthority())) {
                            return true;
                        }
                    }
                    return false;
                });
    }

    private PerformanceReview toEntity(ReviewRequest request) {
        PerformanceReview review = new PerformanceReview();
        review.setRating(request.rating());
        review.setStrengths(request.strengths());
        review.setAreasForImprovement(request.areasForImprovement());
        review.setGoals(request.goals());
        review.setFeedback(request.feedback());
        review.setReviewDate(request.reviewDate());
        review.setStatus(request.status());
        return review;
    }

    private ReviewResponse toResponse(PerformanceReview review) {
        return new ReviewResponse(
                review.getId(),
                review.getEmployee().getId(),
                review.getEmployee().getFullName(),
                review.getReviewerEmail(),
                review.getRating(),
                review.getStrengths(),
                review.getAreasForImprovement(),
                review.getGoals(),
                review.getFeedback(),
                review.getReviewDate(),
                review.getStatus(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }

    public record ReviewRequest(
            Integer rating,
            String strengths,
            String areasForImprovement,
            String goals,
            String feedback,
            LocalDate reviewDate,
            String status) {
    }

    public record ReviewResponse(
            Long id,
            Long employeeId,
            String employeeName,
            String reviewerEmail,
            Integer rating,
            String strengths,
            String areasForImprovement,
            String goals,
            String feedback,
            LocalDate reviewDate,
            String status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }
}
