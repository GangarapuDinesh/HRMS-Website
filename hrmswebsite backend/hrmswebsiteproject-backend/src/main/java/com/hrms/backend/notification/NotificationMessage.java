package com.hrms.backend.notification;
import java.time.LocalDateTime;
public class NotificationMessage {
    private String type;
    private String title;
    private String message;
    private String senderEmail;
    private LocalDateTime createdAt;
    private String targetUrl;
    public NotificationMessage() {
    }
    public NotificationMessage(
            String type,
            String title,
            String message,
            String senderEmail,
            String targetUrl) {
        this.type = type;
        this.title = title;
        this.message = message;
        this.senderEmail = senderEmail;
        this.targetUrl = targetUrl;
        this.createdAt = LocalDateTime.now();
    }
    public String getType() {
        return type;
    }
    public void setType(String type) {
        this.type = type;
    }
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    public String getSenderEmail() {
        return senderEmail;
    }
    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public String getTargetUrl() {
        return targetUrl;
    }
    public void setTargetUrl(String targetUrl) {
        this.targetUrl = targetUrl;
    }
}
