
package com.hrms.backend.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public class ReportsSummaryDTO {

    private LocalDate startDate;
    private LocalDate endDate;
    private Map<String, Long> attendance;
    private Map<String, Long> leave;
    private long attendanceRecords;
    private long leaveRequests;
    private BigDecimal totalBasicSalary;
    private BigDecimal totalAllowances;
    private BigDecimal totalDeductions;
    private BigDecimal totalNetSalary;
    private long payrollRecords;
    private long paidPayrollRecords;
    private long pendingPayrollRecords;

    public ReportsSummaryDTO() {
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Map<String, Long> getAttendance() {
        return attendance;
    }

    public void setAttendance(Map<String, Long> attendance) {
        this.attendance = attendance;
    }

    public Map<String, Long> getLeave() {
        return leave;
    }

    public void setLeave(Map<String, Long> leave) {
        this.leave = leave;
    }

    public long getAttendanceRecords() {
        return attendanceRecords;
    }

    public void setAttendanceRecords(long attendanceRecords) {
        this.attendanceRecords = attendanceRecords;
    }

    public long getLeaveRequests() {
        return leaveRequests;
    }

    public void setLeaveRequests(long leaveRequests) {
        this.leaveRequests = leaveRequests;
    }

    public BigDecimal getTotalBasicSalary() {
        return totalBasicSalary;
    }

    public void setTotalBasicSalary(BigDecimal totalBasicSalary) {
        this.totalBasicSalary = totalBasicSalary;
    }

    public BigDecimal getTotalAllowances() {
        return totalAllowances;
    }

    public void setTotalAllowances(BigDecimal totalAllowances) {
        this.totalAllowances = totalAllowances;
    }

    public BigDecimal getTotalDeductions() {
        return totalDeductions;
    }

    public void setTotalDeductions(BigDecimal totalDeductions) {
        this.totalDeductions = totalDeductions;
    }

    public BigDecimal getTotalNetSalary() {
        return totalNetSalary;
    }

    public void setTotalNetSalary(BigDecimal totalNetSalary) {
        this.totalNetSalary = totalNetSalary;
    }

    public long getPayrollRecords() {
        return payrollRecords;
    }

    public void setPayrollRecords(long payrollRecords) {
        this.payrollRecords = payrollRecords;
    }

    public long getPaidPayrollRecords() {
        return paidPayrollRecords;
    }

    public void setPaidPayrollRecords(long paidPayrollRecords) {
        this.paidPayrollRecords = paidPayrollRecords;
    }

    public long getPendingPayrollRecords() {
        return pendingPayrollRecords;
    }

    public void setPendingPayrollRecords(long pendingPayrollRecords) {
        this.pendingPayrollRecords = pendingPayrollRecords;
    }
}
