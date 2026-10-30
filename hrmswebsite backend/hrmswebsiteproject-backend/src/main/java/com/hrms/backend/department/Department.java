package com.hrms.backend.department;
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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
@Entity
@Table(name = "departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank(message = "Department name is required")
    @Size(max = 100, message = "Department name cannot exceed 100 characters")
    @Column(nullable = false, unique = true, length = 100)
    private String name;
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Column(length = 500)
    private String description;
    @NotBlank(message = "Department status is required")
    @Pattern(regexp = "ACTIVE|INACTIVE",
             message = "Status must be ACTIVE or INACTIVE")
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    public Department() {
    }
    @PrePersist
    protected void onCreate() {
        normalizeFields();
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
    @PreUpdate
    protected void onUpdate() {
        normalizeFields();
    }
    private void normalizeFields() {
        if (name != null) {
            name = name.trim();
        }
        if (description != null) {
            description = description.trim();
        }
       if (status != null) {
            status = status.trim().toUpperCase(Locale.ROOT);
        }
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
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
