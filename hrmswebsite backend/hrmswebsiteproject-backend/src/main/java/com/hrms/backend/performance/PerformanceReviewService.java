
package com.hrms.backend.performance;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.hrms.backend.employee.Employee;
import com.hrms.backend.employee.EmployeeRepository;

@Service
public class PerformanceReviewService {

    private final PerformanceReviewRepository reviewRepository;
    private final EmployeeRepository employeeRepository;

    public PerformanceReviewService(
            PerformanceReviewRepository reviewRepository,
            EmployeeRepository employeeRepository) {
        this.reviewRepository = reviewRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<PerformanceReview> getAllReviews() {
        return reviewRepository.findAllByOrderByReviewDateDesc();
    }

    @Transactional(readOnly = true)
    public List<PerformanceReview> getEmployeeReviews(Long employeeId) {
        return reviewRepository.findByEmployee_IdOrderByReviewDateDesc(employeeId);
    }

    @Transactional(readOnly = true)
    public PerformanceReview getReview(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Performance review not found"));
    }

    @Transactional
    public PerformanceReview createReview(
            Long employeeId, PerformanceReview request, String reviewerEmail) {

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Employee not found"));

        validateReview(request);

        request.setEmployee(employee);
        request.setReviewerEmail(reviewerEmail);
        request.setStatus(normalizeStatus(request.getStatus()));

        return reviewRepository.save(request);
    }

    @Transactional
    public PerformanceReview updateReview(Long id, PerformanceReview request) {
        PerformanceReview existing = getReview(id);

        validateReview(request);

        existing.setRating(request.getRating());
        existing.setStrengths(request.getStrengths());
        existing.setAreasForImprovement(request.getAreasForImprovement());
        existing.setGoals(request.getGoals());
        existing.setFeedback(request.getFeedback());
        existing.setReviewDate(request.getReviewDate());
        existing.setStatus(normalizeStatus(request.getStatus()));

        return reviewRepository.save(existing);
    }

    @Transactional
    public void deleteReview(Long id) {
        PerformanceReview review = getReview(id);
        reviewRepository.delete(review);
    }

    private void validateReview(PerformanceReview review) {
        if (review.getRating() == null
                || review.getRating() < 1
                || review.getRating() > 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }

        normalizeStatus(review.getStatus());
    }

    private String normalizeStatus(String status) {
        String value = (status == null || status.isBlank())
                ? "DRAFT" : status.trim().toUpperCase();

        if (!List.of("DRAFT", "SUBMITTED", "COMPLETED").contains(value)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid review status");
        }

        return value;
    }
}
