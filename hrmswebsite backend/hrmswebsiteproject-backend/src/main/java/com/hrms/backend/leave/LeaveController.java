package com.hrms.backend.leave;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.hrms.backend.employee.EmployeeIdentityService;
@RestController
@RequestMapping("/api/leaves")
public class LeaveController {
    private final LeaveService leaveService;
    private final EmployeeIdentityService employeeIdentityService;
    public LeaveController(LeaveService leaveService,EmployeeIdentityService employeeIdentityService) {
        this.leaveService = leaveService;
        this.employeeIdentityService = employeeIdentityService;
    }
    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'TEAM_LEADER', 'HR_MANAGER', 'ADMIN')")
    public ResponseEntity<LeaveRequest> applyForLeave(@RequestBody Map<String, String> request) {
        Long employeeId = employeeIdentityService.getCurrentEmployeeId();
        LeaveRequest leave = leaveService.applyForLeave(employeeId,request.get("leaveType"),parseDate(request.get("startDate")),parseDate(request.get("endDate")),request.get("reason"));
        return ResponseEntity.status(HttpStatus.CREATED).body(leave);
    }
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'TEAM_LEADER', 'HR_MANAGER', 'ADMIN')")
    public ResponseEntity<List<LeaveRequest>> getMyLeaves() {
        Long employeeId = employeeIdentityService.getCurrentEmployeeId();
        return ResponseEntity.ok(leaveService.getEmployeeLeaves(employeeId));
    }
    @GetMapping
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    public ResponseEntity<List<LeaveRequest>> getAllLeaves(@RequestParam(required = false) String status) {
        List<LeaveRequest> leaves = (status == null || status.isBlank())
                ? leaveService.getAllLeaves()
                : leaveService.getLeavesByStatus(status);
        return ResponseEntity.ok(leaves);
    }
    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    public ResponseEntity<LeaveRequest> reviewLeave(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String decision = request.get("decision");
        String comment = request.get("comment");
        String reviewedBy = employeeIdentityService
                .getCurrentEmployee().getEmail();
        LeaveRequest leave = leaveService.reviewLeave(
                id, decision, reviewedBy, comment);
        return ResponseEntity.ok(leave);
    }
    @GetMapping("/my/counts")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'TEAM_LEADER', 'HR_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Long>> getMyLeaveCounts() {
        Long employeeId = employeeIdentityService.getCurrentEmployeeId();
        Map<String, Long> counts = Map.of("pending", leaveService.countEmployeeLeaves(employeeId, "PENDING"),"approved", leaveService.countEmployeeLeaves(employeeId, "APPROVED"),"rejected", leaveService.countEmployeeLeaves(employeeId, "REJECTED")
        );
        return ResponseEntity.ok(counts);
    }
    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,"Start date and end date are required");
        }
        try {
            return LocalDate.parse(value);
        } catch (java.time.format.DateTimeParseException ex) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Dates must use YYYY-MM-DD format");
        }
    }
}
