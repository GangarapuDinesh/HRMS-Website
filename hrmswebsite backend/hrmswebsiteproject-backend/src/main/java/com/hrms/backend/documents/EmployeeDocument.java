package com.hrms.backend.documents;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
@Entity
@Table(name = "employee_documents")
public class EmployeeDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
    @Column(nullable = false, length = 200)
    private String originalFileName;
    @Column(nullable = false, length = 255)
    private String storedFileName;
    @Column(nullable = false, length = 100)
    private String documentType;
    @Column(nullable = false, length = 100)
    private String contentType;
    @Column(nullable = false)
    private Long fileSize;
    @Column(nullable = false)
    private LocalDateTime uploadedAt;
    public EmployeeDocument() {
    }
    @PrePersist
    public void beforeSave() {
        if (uploadedAt == null) {
            uploadedAt = LocalDateTime.now();
        }
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
    public String getOriginalFileName() {
        return originalFileName;
    }
    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }
    public String getStoredFileName() {
        return storedFileName;
    }
    public void setStoredFileName(String storedFileName) {
        this.storedFileName = storedFileName;
    }
    public String getDocumentType() {
        return documentType;
    }
    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }
    public String getContentType() {
        return contentType;
    }
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
    public Long getFileSize() {
        return fileSize;
    }
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }
    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
