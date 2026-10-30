package com.hrms.backend.documents;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface EmployeeDocumentRepository
        extends JpaRepository<EmployeeDocument, Long> {
    List<EmployeeDocument> findByEmployee_IdOrderByUploadedAtDesc(
            Long employeeId);
    Optional<EmployeeDocument> findByIdAndEmployee_Id(
            Long id, Long employeeId);
}
