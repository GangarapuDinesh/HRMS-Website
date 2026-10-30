
package com.hrms.backend.performance;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PerformanceReviewRepository
        extends JpaRepository<PerformanceReview, Long> {

    List<PerformanceReview> findByEmployee_IdOrderByReviewDateDesc(Long employeeId);

    List<PerformanceReview> findAllByOrderByReviewDateDesc();

    List<PerformanceReview> findByReviewerEmailIgnoreCaseOrderByReviewDateDesc(
            String reviewerEmail);
}
