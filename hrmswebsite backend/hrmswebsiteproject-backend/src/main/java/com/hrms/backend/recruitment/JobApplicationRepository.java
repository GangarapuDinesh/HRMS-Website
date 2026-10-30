
package com.hrms.backend.recruitment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobApplicationRepository
        extends JpaRepository<JobApplication, Long> {

    boolean existsByApplicant_IdAndJobOpening_Id(
        Long applicantId,
        Long jobOpeningId
    );

    List<JobApplication> findByApplicant_IdOrderByAppliedAtDesc(
        Long applicantId
    );

    List<JobApplication> findByJobOpening_IdOrderByAppliedAtDesc(
        Long jobOpeningId
    );
}
