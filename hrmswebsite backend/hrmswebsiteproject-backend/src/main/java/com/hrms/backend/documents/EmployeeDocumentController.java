package com.hrms.backend.documents;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.hrms.backend.employee.Employee;
import com.hrms.backend.employee.EmployeeRepository;
@RestController
@RequestMapping("/api/documents")
public class EmployeeDocumentController {
    private final EmployeeDocumentService documentService;
    private final EmployeeRepository employeeRepository;
    private static final Set<String> PRIVILEGED_ROLES = Set.of("ROLE_ADMIN","ROLE_HR","ROLE_HR_MANAGER");
    public EmployeeDocumentController(EmployeeDocumentService documentService,EmployeeRepository employeeRepository) {
        this.documentService = documentService;
        this.employeeRepository = employeeRepository;
    }
    @PostMapping(
        value = "/employees/{employeeId}",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<DocumentResponse> uploadDocument(
            @PathVariable Long employeeId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            Authentication authentication) {
        requireEmployeeAccess(employeeId, authentication);
        EmployeeDocument saved = documentService.upload(employeeId, file, documentType);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }
    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<List<DocumentResponse>> getEmployeeDocuments(
            @PathVariable Long employeeId,
            Authentication authentication) {
        requireEmployeeAccess(employeeId, authentication);
        List<DocumentResponse> documents = documentService.getEmployeeDocuments(employeeId).stream().map(this::toResponse).toList();
        return ResponseEntity.ok(documents);
    }
   @GetMapping("/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long documentId,
            Authentication authentication) {
        EmployeeDocument document = documentService.getDocument(documentId);
        requireEmployeeAccess(document.getEmployee().getId(), authentication);
        Path filePath = documentService.getStoredFilePath(document);
        Resource resource = new FileSystemResource(filePath);
        String safeFileName = document.getOriginalFileName()
            .replace("\"", "")
            .replace("\r", "")
            .replace("\n", "");
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment()
                    .filename(safeFileName)
                    .build()
                    .toString()
            )
            .contentLength(document.getFileSize())
            .body(resource);
    }
    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long documentId,
            Authentication authentication) {
        EmployeeDocument document = documentService.getDocument(documentId);
        requireEmployeeAccess(document.getEmployee().getId(), authentication);
        documentService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }
    private void requireEmployeeAccess(Long employeeId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }
        boolean privileged = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(PRIVILEGED_ROLES::contains);
        if (privileged) {
            return;
        }
        String email = authentication.getName();
        Employee currentEmployee = employeeRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,"Your account is not linked to an employee record." ));
        if (!currentEmployee.getId().equals(employeeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"You can access only your own employee documents.");
        }
    }
    private DocumentResponse toResponse(EmployeeDocument document) {
        return new DocumentResponse(
            document.getId(),
            document.getEmployee().getId(),
            document.getOriginalFileName(),
            document.getDocumentType(),
            document.getContentType(),
            document.getFileSize(),
            document.getUploadedAt()
        );
    }
    public record DocumentResponse(
        Long id,
        Long employeeId,
        String originalFileName,
        String documentType,
        String contentType,
        Long fileSize,
        java.time.LocalDateTime uploadedAt
    ) {}
}
