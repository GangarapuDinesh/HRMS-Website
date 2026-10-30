
package com.hrms.backend.mail;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class SmtpEmailService {

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public SmtpEmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    public void sendEmail(
            String recipientEmail,
            String subject,
            String body,
            String senderEmail) {

        if (!StringUtils.hasText(recipientEmail)) {
            throw new IllegalArgumentException(
                    "Recipient email is required."
            );
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(recipientEmail.trim());
        message.setSubject(subject);
        message.setText(
                "You have received a message through HRMS.\n\n"
                        + "From: " + senderEmail + "\n\n"
                        + body
        );

        mailSender.send(message);
    }
}
