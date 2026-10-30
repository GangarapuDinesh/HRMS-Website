package com.hrms.backend.notification;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }
    @PostMapping("/test")
    public ResponseEntity<Map<String, String>> sendTestNotification(
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in to receive notifications."));
        }

        String email = authentication.getName();

        notificationService.notifyUser(
                email,
                "SYSTEM",
                "HRMS Notification Test",
                "Your real-time HRMS notifications are working!",
                "HRMS System",
                "/dashboard");

        return ResponseEntity.ok(
                Map.of("message", "Test notification sent to " + email));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getNotificationHistory(
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required."));
        }

        List<Notification> notifications = notificationService.getHistory(authentication.getName());

        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required."));
        }

        return ResponseEntity.ok(Map.of(
                "unreadCount",
                notificationService.getUnreadCount(authentication.getName())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required."));
        }

        boolean updated = notificationService.markAsRead(
                id, authentication.getName());

        if (!updated) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Notification not found."));
        }

        return ResponseEntity.ok(Map.of("message", "Notification marked as read."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required."));
        }

        boolean deleted = notificationService.deleteNotification(
                id, authentication.getName());

        if (!deleted) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Notification not found."));
        }

        return ResponseEntity.ok(Map.of("message", "Notification deleted."));
    }

    @DeleteMapping("/all")
    public ResponseEntity<?> deleteAllNotifications(
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required."));
        }

        long deletedCount = notificationService.deleteAllNotifications(
                authentication.getName());

        return ResponseEntity.ok(Map.of(
                "message", "All notifications deleted.",
                "deletedCount", deletedCount));
    }

    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && authentication.getName() != null
                && !authentication.getName().isBlank()
                && !"anonymousUser".equals(authentication.getName());
    }
}
