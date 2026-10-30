package com.hrms.backend.chat;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final ChatRealtimeService chatRealtimeService;

    public ChatController(
            ChatService chatService,
            ChatRealtimeService chatRealtimeService) {
        this.chatService = chatService;
        this.chatRealtimeService = chatRealtimeService;
    }

    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(
            @RequestBody SendChatMessageRequest request,
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        try {
            ChatMessage message = chatService.sendMessage(
                    authentication.getName(),
                    request.getRecipientEmail(),
                    request.getContent()
            );

            chatRealtimeService.sendMessageToRecipient(message);
            chatRealtimeService.sendMessageToSender(message);

            return ResponseEntity.status(HttpStatus.CREATED).body(message);

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/messages")
    public ResponseEntity<?> getConversation(
            @RequestParam String memberEmail,
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        try {
            List<ChatMessage> messages = chatService.getConversation(
                    authentication.getName(),
                    memberEmail
            );

            return ResponseEntity.ok(messages);

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/unread/{senderEmail}")
    public ResponseEntity<?> getUnreadCount(
            @PathVariable String senderEmail,
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in again."));
        }

        try {
            long unreadCount = chatService.getUnreadCount(
                    authentication.getName(),
                    senderEmail
            );

            return ResponseEntity.ok(
                    Map.of("unreadCount", unreadCount)
            );

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", exception.getMessage()));
        }
    }

    public static class SendChatMessageRequest {

        private String recipientEmail;
        private String content;

        public SendChatMessageRequest() {
        }

        public String getRecipientEmail() {
            return recipientEmail;
        }

        public void setRecipientEmail(String recipientEmail) {
            this.recipientEmail = recipientEmail;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}