package com.hrms.backend.notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
   List<Notification> findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(
            String recipientEmail);
    long countByRecipientEmailIgnoreCaseAndReadFalse(String recipientEmail);
    Optional<Notification> findByIdAndRecipientEmailIgnoreCase(Long id,String recipientEmail);
    long deleteByRecipientEmailIgnoreCase(String recipientEmail);
}
