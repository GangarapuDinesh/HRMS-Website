package com.hrms.backend.employee;
import java.time.LocalDate;
import java.util.Locale;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
@Entity
@Table(name = "employees")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String fullName;
    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    @Column(nullable = false, unique = true, length = 150)
    private String email;
    @Pattern(
        regexp = "^$|^[0-9+()\\- ]{7,20}$",
        message = "Enter a valid phone number"
    )
    @Size(max = 20)
    @Column(length = 20)
    private String phone;
    @Size(max = 100)
    @Column(length = 100)
    private String department;
    @Size(max = 100)
    @Column(length = 100)
    private String designation;
    @NotBlank(message = "Employment status is required")
    @Pattern(
        regexp = "ACTIVE|INACTIVE|ON_LEAVE|TERMINATED",
        message = "Invalid employment status"
    )
    @Column(nullable = false, length = 30)
    private String employmentStatus = "ACTIVE";
    private LocalDate joiningDate;
    public Employee() {
    }
    @PrePersist
    @PreUpdate
    public void normalizeFields() {
        if (email != null) {
            email = email.trim().toLowerCase(Locale.ROOT);
        }
        if (fullName != null) {
            fullName = fullName.trim();
        }
        if (employmentStatus == null || employmentStatus.isBlank()) {
            employmentStatus = "ACTIVE";
        } else {
            employmentStatus = employmentStatus.trim()
                    .toUpperCase(Locale.ROOT);
        }
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getFullName() {
        return fullName;
    }
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getPhone() {
        return phone;
    }
    public void setPhone(String phone) {
        this.phone = phone;
    }
    public String getDepartment() {
        return department;
    }
    public void setDepartment(String department) {
        this.department = department;
    }
    public String getDesignation() {
        return designation;
    }
    public void setDesignation(String designation) {
        this.designation = designation;
    }
    public String getEmploymentStatus() {
        return employmentStatus;
    }
    public void setEmploymentStatus(String employmentStatus) {
        this.employmentStatus = employmentStatus;
    }
    public LocalDate getJoiningDate() {
        return joiningDate;
    }
    public void setJoiningDate(LocalDate joiningDate) {
        this.joiningDate = joiningDate;
    }
}
