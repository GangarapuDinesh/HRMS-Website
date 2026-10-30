
package com.hrms.backend.chat;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository
        extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage>
    findBySenderEmailIgnoreCaseAndRecipientEmailIgnoreCaseOrSenderEmailIgnoreCaseAndRecipientEmailIgnoreCaseOrderBySentAtAsc(
            String senderEmail1,
            String recipientEmail1,
            String senderEmail2,
            String recipientEmail2
    );

    long countByRecipientEmailIgnoreCaseAndSenderEmailIgnoreCaseAndReadFalse(
            String recipientEmail,
            String senderEmail
    );
}
