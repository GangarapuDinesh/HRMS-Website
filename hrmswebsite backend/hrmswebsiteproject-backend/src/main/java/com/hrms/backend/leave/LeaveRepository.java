package com.hrms.backend.leave;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface LeaveRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployee_IdOrderByAppliedAtDesc(Long employeeId);
    List<LeaveRequest> findByStatusOrderByAppliedAtDesc(String status);
    List<LeaveRequest> findAllByOrderByAppliedAtDesc();
    long countByEmployee_IdAndStatus(Long employeeId, String status);
    List<LeaveRequest> findByEmployee_IdAndStatusOrderByAppliedAtDesc(
           Long employeeId, String status);
    List<LeaveRequest> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(
            LocalDate endDate, LocalDate startDate);
}
