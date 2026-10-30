package com.hrms.backend.leave;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.hrms.backend.employee.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
@Entity
@Table(name = "leave_requests")
public class LeaveRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
    @Column(name = "leave_type", nullable = false, length = 50)
    private String leaveType;
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    @Column(name = "total_days", nullable = false)
    private Integer totalDays;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;
    @Column(nullable = false, length = 20)
    private String status = "PENDING";
    @Column(name = "applied_at", insertable = false, updatable = false)
    private LocalDateTime appliedAt;
    @Column(name = "reviewed_by", length = 150)
    private String reviewedBy;
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    @Column(name = "review_comment", columnDefinition = "TEXT")
    private String reviewComment;
    public LeaveRequest() {
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Employee getEmployee() {
        return employee;
    }
    public void setEmployee(Employee employee) {
        this.employee = employee;
    }
    public String getLeaveType() {
        return leaveType;
    }
    public void setLeaveType(String leaveType) {
        this.leaveType = leaveType;
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
    public Integer getTotalDays() {
        return totalDays;
    }
    public void setTotalDays(Integer totalDays) {
        this.totalDays = totalDays;
    }
    public String getReason() {
        return reason;
    }
    public void setReason(String reason) {
        this.reason = reason;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public LocalDateTime getAppliedAt() {
        return appliedAt;
    }
    public void setAppliedAt(LocalDateTime appliedAt) {
        this.appliedAt = appliedAt;
    }
    public String getReviewedBy() {
        return reviewedBy;
    }
    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }
    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }
    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
    public String getReviewComment() {
        return reviewComment;
    }
    public void setReviewComment(String reviewComment) {
        this.reviewComment = reviewComment;
    }
}
