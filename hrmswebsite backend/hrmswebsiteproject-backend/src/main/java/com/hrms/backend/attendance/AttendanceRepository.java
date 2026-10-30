package com.hrms.backend.attendance;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);
    List<Attendance> findByEmployeeIdOrderByAttendanceDateDesc(Long employeeId);
    List<Attendance> findByAttendanceDate(LocalDate attendanceDate);
    List<Attendance> findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(
            Long employeeId, LocalDate startDate, LocalDate endDate);
    List<Attendance> findByAttendanceDateBetween(LocalDate startDate, LocalDate endDate);
    long countByEmployeeIdAndStatusIgnoreCase(Long employeeId, String status);
    boolean existsByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);
}
