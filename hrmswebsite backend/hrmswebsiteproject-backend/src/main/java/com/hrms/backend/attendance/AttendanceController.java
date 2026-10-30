package com.hrms.backend.attendance;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.hrms.backend.employee.EmployeeIdentityService;
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    private final AttendanceService attendanceService;
    private final EmployeeIdentityService employeeIdentityService;
    public AttendanceController(AttendanceService attendanceService,EmployeeIdentityService employeeIdentityService) {
        this.attendanceService = attendanceService;
        this.employeeIdentityService = employeeIdentityService;
    }
    @PostMapping("/check-in/{employeeId}")
    public Attendance checkIn(@PathVariable Long employeeId,Authentication authentication) {
        requireOwnEmployeeOrHr(employeeId, authentication);
        return attendanceService.checkIn(employeeId);
    }
    @PostMapping("/check-out/{employeeId}")
    public Attendance checkOut(@PathVariable Long employeeId,Authentication authentication) {
        requireOwnEmployeeOrHr(employeeId, authentication);
        return attendanceService.checkOut(employeeId);
    }
    @GetMapping
    public List<Attendance> getAllAttendance(Authentication authentication) {
        requireHrRole(authentication);
        return attendanceService.getAllAttendance();
    }
    @GetMapping("/{id}")
    public Attendance getAttendanceById(@PathVariable Long id,Authentication authentication) {
        requireHrRole(authentication);
        return attendanceService.getAttendanceById(id);
    }
    @GetMapping("/employee/{employeeId}")
    public List<Attendance> getEmployeeAttendance(
            @PathVariable Long employeeId,
            Authentication authentication) {
        requireOwnEmployeeOrHr(employeeId, authentication);
        return attendanceService.getEmployeeAttendance(employeeId);
    }
    @GetMapping("/employee/{employeeId}/range")
    public List<Attendance> getAttendanceBetweenDates(
            @PathVariable Long employeeId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            Authentication authentication) {
        requireOwnEmployeeOrHr(employeeId, authentication);
        return attendanceService.getAttendanceBetweenDates(
                employeeId, startDate, endDate);
    }
    @GetMapping("/date/{date}")
    public List<Attendance> getAttendanceByDate(
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,
            Authentication authentication) {
        requireHrRole(authentication);
        return attendanceService.getAttendanceByDate(date);
    }
    @GetMapping("/employee/{employeeId}/present-days")
    public long getPresentDays(
            @PathVariable Long employeeId,
            Authentication authentication) {
        requireOwnEmployeeOrHr(employeeId, authentication);
        return attendanceService.getPresentDays(employeeId);
    }
    private void requireOwnEmployeeOrHr(
            Long employeeId,
            Authentication authentication) {
        requireAuthenticated(authentication);
        if (hasHrAccess(authentication)) {
            return;
        }
        if (!hasRole(authentication, "EMPLOYEE")
                && !hasRole(authentication, "TEAM_LEADER")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Access denied");
        }
        Long currentEmployeeId = employeeIdentityService.getCurrentEmployeeId();
        if (!currentEmployeeId.equals(employeeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"You can access only your own attendance records");
        }
    }
    private void requireHrRole(Authentication authentication) {
        requireAuthenticated(authentication);
        if (!hasHrAccess(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"HR staff or administrators only");
        }
    }
    private void requireAuthenticated(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Authentication required");
        }
    }
    private boolean hasHrAccess(Authentication authentication) {
        return hasRole(authentication, "ADMIN") || hasRole(authentication, "HR_MANAGER");
    }
    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(authority -> authority.equals("ROLE_" + role) || authority.equals(role));
    }
}
