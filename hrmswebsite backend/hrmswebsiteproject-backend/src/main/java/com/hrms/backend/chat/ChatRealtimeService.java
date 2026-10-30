
package com.hrms.backend.chat;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class ChatRealtimeService {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatRealtimeService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendMessageToRecipient(ChatMessage message) {
        messagingTemplate.convertAndSendToUser(message.getRecipientEmail(),"/queue/chat",message);
    }
    public void sendMessageToSender(ChatMessage message) {
        messagingTemplate.convertAndSendToUser(message.getSenderEmail(),"/queue/chat", message);
    }
}
