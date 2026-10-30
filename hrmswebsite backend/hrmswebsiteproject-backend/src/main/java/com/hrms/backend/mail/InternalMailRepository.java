package com.hrms.backend.mail;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface InternalMailRepository
        extends JpaRepository<InternalMail, Long> {
    List<InternalMail> findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(String recipientEmail);
    List<InternalMail> findBySenderEmailIgnoreCaseOrderByCreatedAtDesc(String senderEmail);
    boolean existsByIdAndRecipientEmailIgnoreCase(Long id,String recipientEmail);
}
