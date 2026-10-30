package com.hrms.backend.auth.passwordreset;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public PasswordResetEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendResetEmail(String email, String token) {
        String resetLink = frontendUrl.replaceAll("/+$", "")
                + "/?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("HRMS Password Reset");
        message.setText(
                "Hello,\n\n"
                + "We received a request to reset your HRMS password.\n\n"
                + "Use the link below to create a new password:\n"
                + resetLink + "\n\n"
                + "This link expires in 15 minutes and can only be used once.\n"
                + "If you did not request this change, you can ignore this email."
        );

        mailSender.send(message);
    }
}