package com.hrms.backend.mail;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/mail")
public class InternalMailController {
    private final InternalMailService mailService;
    public InternalMailController(InternalMailService mailService) {
        this.mailService = mailService;
    }
    @PostMapping("/send")
    public ResponseEntity<?> sendMail(
            @RequestBody SendMailRequest request,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Please log in again."));
        }
        try {
            InternalMail mail = mailService.sendMail(
                    authentication.getName(),
                    request.getRecipientEmail(),
                    request.getSubject(),
                    request.getBody()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(mail);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", exception.getMessage()));
        }
    }
    @GetMapping("/inbox")
    public ResponseEntity<?> getInbox(Authentication authentication) {
        if (authentication == null
                || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Please log in again."));
        }
        List<InternalMail> mails = mailService.getInbox(authentication.getName());
        return ResponseEntity.ok(mails);
    }
    @GetMapping("/sent")
    public ResponseEntity<?> getSentMail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Please log in again."));
        }
        return ResponseEntity.ok(mailService.getSentMail(authentication.getName())
        );
    }
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id,Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Please log in again."));
        }
        try {
            return ResponseEntity.ok(mailService.markAsRead(id,authentication.getName()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", exception.getMessage()));
        } catch (SecurityException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", exception.getMessage()));
        }
    }
}
