package com.hrms.backend.documents;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.hrms.backend.employee.Employee;
import com.hrms.backend.employee.EmployeeRepository;
@Service
public class EmployeeDocumentService {
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "doc", "docx", "jpg", "jpeg", "png");
    private final EmployeeDocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;
    private final Path storageDirectory;
    public EmployeeDocumentService(
            EmployeeDocumentRepository documentRepository,
            EmployeeRepository employeeRepository,
            @Value("${hrms.document.storage-dir:${user.home}/hrms-documents}")
            String storageDirectory) {
        this.documentRepository = documentRepository;
        this.employeeRepository = employeeRepository;
        this.storageDirectory = Paths.get(storageDirectory)
                                     .toAbsolutePath()
                                     .normalize();
        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not initialize document storage.", ex);
        }
    }

    @Transactional
    public EmployeeDocument upload(
            Long employeeId,
            MultipartFile file,
            String documentType) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select a file.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"File size must not exceed 5 MB.");
        }
        if (!StringUtils.hasText(documentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document type is required.");
        }
        String originalName = StringUtils.cleanPath(
            file.getOriginalFilename() == null
                ? "document"
                : file.getOriginalFilename()
        );

        if (originalName.contains("..") ||
            originalName.contains("/") ||
            originalName.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name.");
        }
        String extension = getExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Allowed formats: PDF, DOC, DOCX, JPG, JPEG and PNG.");
        }
        String contentType = file.getContentType();
        if (!isAllowedContentType(extension, contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"The uploaded file type does not match an allowed format.");
        }
        Employee employee = employeeRepository.findById(employeeId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found."));
        String storedName = UUID.randomUUID() + "." + extension;
        Path destination = storageDirectory.resolve(storedName).normalize();
        if (!destination.startsWith(storageDirectory)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid storage path.");
        }
        try {
            Files.copy(file.getInputStream(),destination,StandardCopyOption.REPLACE_EXISTING);
            EmployeeDocument document = new EmployeeDocument();
            document.setEmployee(employee);
            document.setOriginalFileName(originalName);
            document.setStoredFileName(storedName);
            document.setDocumentType(documentType.trim());
            document.setContentType(contentType);
            document.setFileSize(file.getSize());
            return documentRepository.save(document);
        } catch (IOException ex) {
            try {
                Files.deleteIfExists(destination);
            } catch (IOException ignored) {
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Could not store the uploaded document.");
        }
    }
    @Transactional(readOnly = true)
    public List<EmployeeDocument> getEmployeeDocuments(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found.");
        }
        return documentRepository.findByEmployee_IdOrderByUploadedAtDesc(employeeId);
    }
    @Transactional(readOnly = true)
    public EmployeeDocument getDocument(Long documentId) {
        return documentRepository.findById(documentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found."));
    }
    public Path getStoredFilePath(EmployeeDocument document) {
        Path path = storageDirectory
            .resolve(document.getStoredFileName())
            .normalize();
        if (!path.startsWith(storageDirectory) || !Files.isRegularFile(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Stored file not found.");
        }
        return path;
    }
    @Transactional
    public void deleteDocument(Long documentId) {
        EmployeeDocument document = getDocument(documentId);
        Path path = getStoredFilePath(document);
        try {
            Files.delete(path);
            documentRepository.delete(document);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Could not delete the document.");
        }
    }
    private String getExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
    private boolean isAllowedContentType(String extension, String contentType) {
        if (contentType == null) {
            return false;
        }
        String type = contentType.toLowerCase(Locale.ROOT);
        return switch (extension) {
            case "pdf" -> type.equals("application/pdf");
            case "doc" -> type.equals("application/msword");
            case "docx" -> type.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            case "jpg", "jpeg" -> type.equals("image/jpeg");
            case "png" -> type.equals("image/png");
            default -> false;
        };
    }
}
