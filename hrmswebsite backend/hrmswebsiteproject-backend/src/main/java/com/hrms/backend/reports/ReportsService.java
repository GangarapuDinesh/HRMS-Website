
package com.hrms.backend.reports;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import com.hrms.backend.attendance.Attendance;
import com.hrms.backend.attendance.AttendanceRepository;
import com.hrms.backend.leave.LeaveRepository;
import com.hrms.backend.leave.LeaveRequest;
import com.hrms.backend.payroll.Payroll;
import com.hrms.backend.payroll.PayrollRepository;
import com.hrms.backend.reports.dto.ReportsSummaryDTO;
@Service
public class ReportsService {

    private final AttendanceRepository attendanceRepository;
    private final LeaveRepository leaveRepository;
    private final PayrollRepository payrollRepository;

    public ReportsService(
            AttendanceRepository attendanceRepository,
            LeaveRepository leaveRepository,
            PayrollRepository payrollRepository) {
        this.attendanceRepository = attendanceRepository;
        this.leaveRepository = leaveRepository;
        this.payrollRepository = payrollRepository;
    }

    public ReportsSummaryDTO getSummary(LocalDate startDate, LocalDate endDate) {

        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "Start date must be before or equal to end date");
        }

        ReportsSummaryDTO summary = new ReportsSummaryDTO();
        summary.setStartDate(startDate);
        summary.setEndDate(endDate);

        Map<String, Long> attendanceCounts = new LinkedHashMap<>();
        attendanceCounts.put("PRESENT", 0L);
        attendanceCounts.put("ABSENT", 0L);
        attendanceCounts.put("HALF_DAY", 0L);
        attendanceCounts.put("ON_LEAVE", 0L);

        var attendanceRecords = attendanceRepository
                .findByAttendanceDateBetween(startDate, endDate);

        for (Attendance record : attendanceRecords) {
            String status = normalize(record.getStatus());
            attendanceCounts.merge(status, 1L, Long::sum);
        }

        summary.setAttendance(attendanceCounts);
        summary.setAttendanceRecords(attendanceRecords.size());

        Map<String, Long> leaveCounts = new LinkedHashMap<>();
        leaveCounts.put("PENDING", 0L);
        leaveCounts.put("APPROVED", 0L);
        leaveCounts.put("REJECTED", 0L);

        var leaveRecords = leaveRepository.findAll();

        long leaveRequestCount = 0;

        for (LeaveRequest record : leaveRecords) {
            if (record.getStartDate() == null || record.getEndDate() == null) {
                continue;
            }

            boolean overlaps = !record.getStartDate().isAfter(endDate)
                    && !record.getEndDate().isBefore(startDate);

            if (overlaps) {
                leaveRequestCount++;
                String status = normalize(record.getStatus());
                leaveCounts.merge(status, 1L, Long::sum);
            }
        }

        summary.setLeave(leaveCounts);
        summary.setLeaveRequests(leaveRequestCount);

        BigDecimal totalBasicSalary = BigDecimal.ZERO;
        BigDecimal totalAllowances = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;
        BigDecimal totalNetSalary = BigDecimal.ZERO;

        long payrollCount = 0;
        long paidCount = 0;
        long pendingCount = 0;

        YearMonth firstMonth = YearMonth.from(startDate);
        YearMonth lastMonth = YearMonth.from(endDate);

        for (Payroll payroll : payrollRepository.findAll()) {
            if (payroll.getSalaryMonth() == null
                    || payroll.getSalaryYear() == null) {
                continue;
            }

            YearMonth payrollMonth;

            try {
                payrollMonth = YearMonth.of(
                        payroll.getSalaryYear(), payroll.getSalaryMonth());
            } catch (java.time.DateTimeException exception) {
                continue;
            }

            if (payrollMonth.isBefore(firstMonth)
                    || payrollMonth.isAfter(lastMonth)) {
                continue;
            }

            payrollCount++;

            totalBasicSalary = totalBasicSalary.add(
                    valueOrZero(payroll.getBasicSalary()));

            totalAllowances = totalAllowances.add(
                    valueOrZero(payroll.getAllowances()));

            totalDeductions = totalDeductions.add(
                    valueOrZero(payroll.getDeductions()));

            totalNetSalary = totalNetSalary.add(
                    valueOrZero(payroll.getNetSalary()));

            String status = normalize(payroll.getPaymentStatus());

            if ("PAID".equals(status)) {
                paidCount++;
            } else if ("PENDING".equals(status)) {
                pendingCount++;
            }
        }

        summary.setTotalBasicSalary(totalBasicSalary);
        summary.setTotalAllowances(totalAllowances);
        summary.setTotalDeductions(totalDeductions);
        summary.setTotalNetSalary(totalNetSalary);
        summary.setPayrollRecords(payrollCount);
        summary.setPaidPayrollRecords(paidCount);
        summary.setPendingPayrollRecords(pendingCount);

        return summary;
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return "UNKNOWN";
        }

        return value.trim().toUpperCase(Locale.ROOT);
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
