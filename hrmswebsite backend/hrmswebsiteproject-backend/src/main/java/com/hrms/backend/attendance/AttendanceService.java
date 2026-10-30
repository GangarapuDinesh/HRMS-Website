package com.hrms.backend.attendance;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.hrms.backend.employee.Employee;
import com.hrms.backend.employee.EmployeeRepository;
@Service
@Transactional
public class AttendanceService {
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    public AttendanceService(AttendanceRepository attendanceRepository,EmployeeRepository employeeRepository) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
    }
    public Attendance checkIn(Long employeeId) {
        Employee employee = getActiveEmployee(employeeId);
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today).orElse(null);
        if (attendance != null) {
            if (attendance.getCheckIn() != null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Employee has already checked in today");
            }
        } else {
            attendance = new Attendance();
            attendance.setEmployeeId(employee.getId());
            attendance.setAttendanceDate(today);
        }
        attendance.setCheckIn(LocalDateTime.now());
        attendance.setCheckOut(null);
        attendance.setStatus("PRESENT");
        return attendanceRepository.save(attendance);
    }
    public Attendance checkOut(Long employeeId) {
        Employee employee = getActiveEmployee(employeeId);
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(employee.getId(), today)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"No attendance record found for today"));
        if (attendance.getCheckIn() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Employee must check in before checking out");
        }
        if (attendance.getCheckOut() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Employee has already checked out today");
        }
        attendance.setCheckOut(LocalDateTime.now());
        return attendanceRepository.save(attendance);
    }
    @Transactional(readOnly = true)
    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll(Sort.by(Sort.Direction.DESC, "attendanceDate"));
    }
    @Transactional(readOnly = true)
    public Attendance getAttendanceById(Long id) {
        return attendanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Attendance record not found"));
    }
    @Transactional(readOnly = true)
    public List<Attendance> getEmployeeAttendance(Long employeeId) {
        getEmployeeById(employeeId);
        return attendanceRepository.findByEmployeeIdOrderByAttendanceDateDesc(employeeId);
    }
    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceBetweenDates(Long employeeId,LocalDate startDate,LocalDate endDate) {
        getEmployeeById(employeeId);
        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Provide a valid start date and end date");
        }
        return attendanceRepository.findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(employeeId, startDate, endDate);
    }
    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceByDate(LocalDate date) {
        if (date == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Attendance date is required");
        }
        return attendanceRepository.findByAttendanceDate(date);
    }
    @Transactional(readOnly = true)
    public long getPresentDays(Long employeeId) {
        getEmployeeById(employeeId);
        return attendanceRepository.countByEmployeeIdAndStatusIgnoreCase(employeeId, "PRESENT");
    }
    private Employee getEmployeeById(Long employeeId) {
        if (employeeId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Employee ID is required");
        }
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Employee not found"));
    }
    private Employee getActiveEmployee(Long employeeId) {
        Employee employee = getEmployeeById(employeeId);
        if (!"ACTIVE".equalsIgnoreCase(employee.getEmploymentStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Only active employees can record attendance");
        }
        return employee;
    }
}
