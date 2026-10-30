package com.hrms.backend.notification;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
@Service
public class NotificationService {
    private static final String DESTINATION = "/queue/notifications";
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    public NotificationService(SimpMessagingTemplate messagingTemplate, NotificationRepository notificationRepository) {
        this.messagingTemplate = messagingTemplate;
        this.notificationRepository = notificationRepository;
    }
    @Transactional
    public void notifyUser(
            String recipientEmail,
            String type,
            String title,
            String message,
            String senderEmail,
            String targetUrl) {
        if (!StringUtils.hasText(recipientEmail)) {
            throw new IllegalArgumentException("Recipient email is required");
        }
        if (!StringUtils.hasText(type)
                || !StringUtils.hasText(title)
                || !StringUtils.hasText(message)) {
            throw new IllegalArgumentException(
                    "Notification type, title, and message are required");
        }

        String recipient = recipientEmail.trim().toLowerCase(Locale.ROOT);

        Notification savedNotification = new Notification();
        savedNotification.setRecipientEmail(recipient);
        savedNotification.setType(type.trim());
        savedNotification.setTitle(title.trim());
        savedNotification.setMessage(message.trim());
        savedNotification.setSenderEmail(senderEmail);
        savedNotification.setTargetUrl(targetUrl);
        savedNotification.setRead(false);

        savedNotification = notificationRepository.save(savedNotification);

        NotificationMessage liveNotification = new NotificationMessage(
                savedNotification.getType(),
                savedNotification.getTitle(),
                savedNotification.getMessage(),
                savedNotification.getSenderEmail(),
                savedNotification.getTargetUrl());

        liveNotification.setCreatedAt(savedNotification.getCreatedAt());

        messagingTemplate.convertAndSendToUser(recipient,DESTINATION,liveNotification);
    }
    public List<Notification> getHistory(String email) {
        return notificationRepository.findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(normalizeEmail(email));
    }
    public long getUnreadCount(String email) {
        return notificationRepository.countByRecipientEmailIgnoreCaseAndReadFalse(normalizeEmail(email));
    }
    @Transactional
    public boolean markAsRead(Long id, String email) {
        Notification notification = notificationRepository.findByIdAndRecipientEmailIgnoreCase(id, normalizeEmail(email)).orElse(null);
        if (notification == null) {
            return false;
        }
        notification.setRead(true);
        notificationRepository.save(notification);
        return true;
    }
    @Transactional
    public boolean deleteNotification(Long id, String email) {
        Notification notification = notificationRepository
                .findByIdAndRecipientEmailIgnoreCase(id, normalizeEmail(email))
                .orElse(null);
        if (notification == null) {
            return false;
        }
        notificationRepository.delete(notification);
        return true;
    }
    @Transactional
    public long deleteAllNotifications(String email) {
        return notificationRepository
                .deleteByRecipientEmailIgnoreCase(normalizeEmail(email));
    }
    public void notifyUsers(
            Collection<String> recipientEmails,
            String type,
            String title,
            String message,
            String senderEmail,
            String targetUrl) {
        if (recipientEmails == null) {
            return;
        }
        recipientEmails.stream()
                .filter(StringUtils::hasText)
                .map(this::normalizeEmail)
                .distinct()
                .forEach(email -> notifyUser(
                        email, type, title, message, senderEmail, targetUrl));
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Email is required");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
