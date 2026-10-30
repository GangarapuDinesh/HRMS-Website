package com.hrms.backend.leave;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.hrms.backend.employee.Employee;
import com.hrms.backend.employee.EmployeeRepository;
@Service
public class LeaveService {
    private final LeaveRepository leaveRepository;
    private final EmployeeRepository employeeRepository;
    public LeaveService(LeaveRepository leaveRepository,EmployeeRepository employeeRepository) {
        this.leaveRepository = leaveRepository;
        this.employeeRepository = employeeRepository;
    }
    @Transactional
    public LeaveRequest applyForLeave(Long employeeId,String leaveType,LocalDate startDate,LocalDate endDate,String reason) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        if (leaveType == null || leaveType.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Leave type is required");
        }
        if (startDate == null || endDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start date and end date are required");
        }
        if (startDate.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Past dates cannot be requested");
        }
        if (endDate.isBefore(startDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date cannot be before start date");
        }
        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reason is required");
        }
        LeaveRequest leave = new LeaveRequest();
        leave.setEmployee(employee);
        leave.setLeaveType(leaveType.trim());
        leave.setStartDate(startDate);
        leave.setEndDate(endDate);
        int totalDays = Math.toIntExact(ChronoUnit.DAYS.between(startDate, endDate) + 1);
        leave.setTotalDays(totalDays);
        leave.setReason(reason.trim());
        leave.setStatus("PENDING");
        return leaveRepository.save(leave);
    }
    @Transactional(readOnly = true)
    public List<LeaveRequest> getEmployeeLeaves(Long employeeId) {
        return leaveRepository
                .findByEmployee_IdOrderByAppliedAtDesc(employeeId);
    }
    @Transactional(readOnly = true)
    public List<LeaveRequest> getAllLeaves() {
        return leaveRepository.findAllByOrderByAppliedAtDesc();
    }
   @Transactional(readOnly = true)
    public List<LeaveRequest> getLeavesByStatus(String status) {
        validateStatus(status);
        return leaveRepository.findByStatusOrderByAppliedAtDesc(status.toUpperCase());
    }
    @Transactional
    public LeaveRequest reviewLeave(Long leaveId,String decision,String reviewedBy,String reviewComment) {
        LeaveRequest leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave request not found"));
        if (!"PENDING".equalsIgnoreCase(leave.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Only pending leave requests can be reviewed");
        }
        if (decision == null || (!decision.equalsIgnoreCase("APPROVED") && !decision.equalsIgnoreCase("REJECTED"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Decision must be APPROVED or REJECTED");
        }
        leave.setStatus(decision.toUpperCase());
        leave.setReviewedBy(reviewedBy);
        leave.setReviewedAt(LocalDateTime.now());
        leave.setReviewComment(reviewComment);
        return leaveRepository.save(leave);
    }
    @Transactional(readOnly = true)
    public long countEmployeeLeaves(Long employeeId, String status) {
        validateStatus(status);
        return leaveRepository.countByEmployee_IdAndStatus(employeeId, status.toUpperCase());
    }
    private void validateStatus(String status) {
        if (status == null || (!status.equalsIgnoreCase("PENDING") && !status.equalsIgnoreCase("APPROVED") && !status.equalsIgnoreCase("REJECTED"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Status must be PENDING, APPROVED, or REJECTED");
        }
    }
}
