package com.hrms.backend.config;
import java.util.List;
import java.util.Locale;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import com.hrms.backend.auth.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
@Component
public class JwtStompChannelInterceptor implements ChannelInterceptor {
    private final JwtService jwtService;
    public JwtStompChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
   }
    @Override
    public Message<?> preSend(
            Message<?> message,
            MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message,StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }
        StompCommand command = accessor.getCommand();
        if (command == StompCommand.CONNECT) {
            authenticateConnection(accessor);
       } else if (command == StompCommand.SEND || command == StompCommand.SUBSCRIBE) {
            if (accessor.getUser() == null) {
                throw new IllegalArgumentException("Authentication required for WebSocket messaging");
            }
            String destination = accessor.getDestination();
            if (destination == null || destination.isBlank()) {
                throw new IllegalArgumentException("A WebSocket destination is required");
            }
            if (command == StompCommand.SEND && !destination.startsWith("/app/")) {
                throw new IllegalArgumentException("Messages must use an application destination");
            }
            if (command == StompCommand.SUBSCRIBE && !(destination.startsWith("/user/queue/") || destination.startsWith("/topic/"))) {
                throw new IllegalArgumentException("Subscription destination is not permitted");
            }
        }
        return message;
    }
    private void authenticateConnection(StompHeaderAccessor accessor) {
        String authorization = accessor.getFirstNativeHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("JWT bearer token is required for WebSocket connection");
        }
        String token = authorization.substring(7).trim();
        if (token.isEmpty()) {
            throw new IllegalArgumentException("JWT bearer token is empty");
        }
        try {
            Claims claims = jwtService.validateAndGetClaims(token);
            String email = claims.getSubject();
            String role = claims.get("role", String.class);
            if (email == null || email.isBlank() || role == null || role.isBlank()) {
                throw new IllegalArgumentException("JWT subject or role is missing");
            }
            String normalizedRole = role.trim().toUpperCase(Locale.ROOT);
            if (!normalizedRole.matches("ADMIN|HR_MANAGER|TEAM_LEADER|EMPLOYEE")) {
                throw new IllegalArgumentException("Invalid user role");
            }
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(email,null,List.of(new SimpleGrantedAuthority("ROLE_" + normalizedRole)));
            accessor.setUser(authentication);
        } catch (JwtException | IllegalArgumentException exception) {
            throw new IllegalArgumentException("WebSocket authentication failed",exception);
        }
    }
}
