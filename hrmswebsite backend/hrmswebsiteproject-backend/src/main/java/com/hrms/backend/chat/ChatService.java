package com.hrms.backend.chat;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import com.hrms.backend.user.User;
import com.hrms.backend.user.UserRepository;
@Service
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    public ChatService(ChatMessageRepository chatMessageRepository,UserRepository userRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
    }
    @Transactional
    public ChatMessage sendMessage(String senderEmail,String recipientEmail,String content) {
        String sender = normalizeEmail(senderEmail);
        String recipient = normalizeEmail(recipientEmail);
        if (sender.equals(recipient)) {
            throw new IllegalArgumentException("You cannot send a message to yourself.");
        }
        validateMember(sender);
        validateMember(recipient);
        if (!StringUtils.hasText(content)) {
            throw new IllegalArgumentException("Message cannot be empty." );
        }
        String messageContent = content.trim();
        if (messageContent.length() > 5000) {
            throw new IllegalArgumentException(
                    "Message cannot exceed 5000 characters."
            );
        }
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setSenderEmail(sender);
        chatMessage.setRecipientEmail(recipient);
        chatMessage.setContent(messageContent);
        chatMessage.setRead(false);
        return chatMessageRepository.save(chatMessage);
    }
    @Transactional
    public List<ChatMessage> getConversation(String currentEmail,String otherEmail) {
        String current = normalizeEmail(currentEmail);
        String other = normalizeEmail(otherEmail);
        if (current.equals(other)) {
            throw new IllegalArgumentException("You cannot open a conversation with yourself.");
        }
        validateMember(current);
        validateMember(other);
        List<ChatMessage> messages =  chatMessageRepository
                        .findBySenderEmailIgnoreCaseAndRecipientEmailIgnoreCaseOrSenderEmailIgnoreCaseAndRecipientEmailIgnoreCaseOrderBySentAtAsc(
                                current,
                                other,
                                other,
                                current
                        );

        for (ChatMessage message : messages) {
            if (message.getRecipientEmail().equalsIgnoreCase(current)
                    && !message.isRead()) {
                message.setRead(true);
            }
        }

        return chatMessageRepository.saveAll(messages);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(
            String currentEmail,
            String senderEmail) {

        String current = normalizeEmail(currentEmail);
        String sender = normalizeEmail(senderEmail);

        validateMember(current);
        validateMember(sender);
        return chatMessageRepository
                .countByRecipientEmailIgnoreCaseAndSenderEmailIgnoreCaseAndReadFalse(
                        current,
                        sender
                );
    }

    private User validateMember(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Chat member was not found."
                ));

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("This member's account is disabled."
            );
        }

        return user;
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("A valid email address is required.");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
