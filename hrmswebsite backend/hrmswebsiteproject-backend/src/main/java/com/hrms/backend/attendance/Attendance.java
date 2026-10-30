package com.hrms.backend.attendance;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
@Entity
@Table( name = "attendance",uniqueConstraints = {
        @UniqueConstraint(name = "uk_attendance_employee_date",columnNames = {"employee_id", "attendance_date"})})
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotNull(message = "Employee ID is required")
    @Column(name = "employee_id", nullable = false)
    private Long employeeId;
    @NotNull(message = "Attendance date is required")
    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;
    @Column(name = "check_in")
    private LocalDateTime checkIn;
    @Column(name = "check_out")
    private LocalDateTime checkOut;
    @Pattern(regexp = "PRESENT|ABSENT|HALF_DAY|ON_LEAVE",message = "Invalid attendance status")
    @Column(nullable = false, length = 20)
    private String status = "PRESENT";
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    public Attendance() {
    }
    @PrePersist
    protected void onCreate() {
        normalizeStatus();
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (attendanceDate == null) {
            attendanceDate = LocalDate.now();
        }
   }
    @PreUpdate
    protected void onUpdate() {
        normalizeStatus();
    }
    private void normalizeStatus() {
        if (status == null || status.isBlank()) {
            status = "PRESENT";
        } else {
            status = status.trim().toUpperCase(Locale.ROOT);
        }
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Long getEmployeeId() {
        return employeeId;
    }
    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }
    public LocalDate getAttendanceDate() {
        return attendanceDate;
    }
    public void setAttendanceDate(LocalDate attendanceDate) {
        this.attendanceDate = attendanceDate;
    }
    public LocalDateTime getCheckIn() {
        return checkIn;
    }
    public void setCheckIn(LocalDateTime checkIn) {
        this.checkIn = checkIn;
    }
    public LocalDateTime getCheckOut() {
        return checkOut;
    }
    public void setCheckOut(LocalDateTime checkOut) {
        this.checkOut = checkOut;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
