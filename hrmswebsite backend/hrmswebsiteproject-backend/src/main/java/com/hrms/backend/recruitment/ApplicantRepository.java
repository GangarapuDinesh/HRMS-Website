
package com.hrms.backend.recruitment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicantRepository
        extends JpaRepository<Applicant, Long> {

    List<Applicant> findAllByOrderByCreatedAtDesc();

    List<Applicant> findByStatusIgnoreCaseOrderByCreatedAtDesc(
            String status);

    List<Applicant> findByJobOpeningIdOrderByCreatedAtDesc(
            Long jobOpeningId);

    List<Applicant> findByFullNameContainingIgnoreCase(
            String fullName);
}
