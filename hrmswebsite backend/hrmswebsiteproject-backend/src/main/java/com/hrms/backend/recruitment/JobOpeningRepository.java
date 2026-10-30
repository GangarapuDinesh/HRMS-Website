
package com.hrms.backend.recruitment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobOpeningRepository
        extends JpaRepository<JobOpening, Long> {

    List<JobOpening> findAllByOrderByCreatedAtDesc();

    List<JobOpening> findByStatusIgnoreCaseOrderByCreatedAtDesc(
            String status);

    List<JobOpening> findByDepartmentIgnoreCaseOrderByCreatedAtDesc(
            String department);
}
