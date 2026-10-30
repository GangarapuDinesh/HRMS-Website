package com.hrms.backend.user;

import java.time.LocalDateTime;
import java.util.Locale;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 30)
    private String role = "EMPLOYEE";

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(length = 30)
    private String phone;

    @Column(length = 100)
    private String jobTitle;

    @Column(length = 100)
    private String department;

    @Column(length = 150)
    private String location;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] profilePhoto;

    @Column(length = 100)
    private String profilePhotoContentType;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        normalizeFields();

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void onUpdate() {
        normalizeFields();
    }

    private void normalizeFields() {
        if (email != null) {
            email = email.trim().toLowerCase(Locale.ROOT);
        }

        if (fullName != null) {
            fullName = fullName.trim();
        }

        if (role == null || role.isBlank()) {
            role = "EMPLOYEE";
        } else {
            role = role.trim().toUpperCase(Locale.ROOT);
        }

        if (phone != null) {
            phone = phone.trim();
        }

        if (jobTitle != null) {
            jobTitle = jobTitle.trim();
        }

        if (department != null) {
            department = department.trim();
        }

        if (location != null) {
            location = location.trim();
        }
    }

    public Long getId() {
        return id;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public byte[] getProfilePhoto() {
        return profilePhoto;
    }

    public void setProfilePhoto(byte[] profilePhoto) {
        this.profilePhoto = profilePhoto;
    }

    public String getProfilePhotoContentType() {
        return profilePhotoContentType;
    }

    public void setProfilePhotoContentType(String profilePhotoContentType) {
        this.profilePhotoContentType = profilePhotoContentType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}