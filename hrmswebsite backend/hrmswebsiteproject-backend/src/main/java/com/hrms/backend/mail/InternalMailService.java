package com.hrms.backend.mail;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import com.hrms.backend.notification.NotificationService;
@Service
public class InternalMailService {
    private final InternalMailRepository mailRepository;
    private final NotificationService notificationService;
    private final SmtpEmailService smtpEmailService;
    public InternalMailService(InternalMailRepository mailRepository,NotificationService notificationService,SmtpEmailService smtpEmailService) {
        this.mailRepository = mailRepository;
        this.notificationService = notificationService;
        this.smtpEmailService = smtpEmailService;
    }
    @Transactional
    public InternalMail sendMail(String senderEmail,String recipientEmail,String subject,String body) {
        String sender = normalizeEmail(senderEmail);
        String recipient = normalizeEmail(recipientEmail);
        if (sender.equals(recipient)) {
            throw new IllegalArgumentException("You cannot send mail to yourself." );
        }
        if (!StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("Mail subject is required.");
        }
        if (subject.trim().length() > 200) {
            throw new IllegalArgumentException("Mail subject cannot exceed 200 characters.");
        }
        if (!StringUtils.hasText(body)) {
            throw new IllegalArgumentException("Mail body is required.");
        }
        InternalMail mail = new InternalMail();
        mail.setSenderEmail(sender);
        mail.setRecipientEmail(recipient);
        mail.setSubject(subject.trim());
        mail.setBody(body.trim());
        mail.setRead(false);
        InternalMail savedMail = mailRepository.save(mail);
        try {
            smtpEmailService.sendEmail(recipient,savedMail.getSubject(),savedMail.getBody(),sender);
        } catch (RuntimeException exception) {
            System.err.println("Internal mail was saved, but SMTP delivery failed: " + exception.getMessage());
        }
        try {
            notificationService.notifyUser(recipient,"MAIL","New HRMS Mail","You received a new mail: " + savedMail.getSubject(),sender,  "/mail");
        } catch (RuntimeException exception) {
            System.err.println( "Mail was saved, but notification could not be sent: " + exception.getMessage() );
        }
        return savedMail;
    }
    @Transactional(readOnly = true)
    public List<InternalMail> getInbox(String email) {
        return mailRepository
                .findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(normalizeEmail(email));
    }
    @Transactional(readOnly = true)
    public List<InternalMail> getSentMail(String email) {
        return mailRepository.findBySenderEmailIgnoreCaseOrderByCreatedAtDesc(normalizeEmail(email));
    }
    @Transactional
    public InternalMail markAsRead(Long id, String recipientEmail) {
        String recipient = normalizeEmail(recipientEmail);
        InternalMail mail = mailRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mail not found." ));
        if (!mail.getRecipientEmail().equalsIgnoreCase(recipient)) {
            throw new SecurityException("You are not allowed to access this message.");
        }
        mail.setRead(true);
        return mailRepository.save(mail);
    }
    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("A valid email address is required.");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
