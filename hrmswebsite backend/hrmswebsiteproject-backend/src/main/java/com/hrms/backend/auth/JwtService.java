package com.hrms.backend.auth;
import java.util.Date;
import java.util.Locale;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMs;
    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("JWT secret is missing. Configure app.jwt.secret.");
        }
        if (expirationMs <= 0) {
            throw new IllegalArgumentException("JWT expiration must be greater than zero.");
        }
        try {
            this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret.trim()));
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("Invalid JWT secret. Provide a Base64-encoded secret " + "with at least 32 decoded bytes for HS256.",ex);
        }
        this.expirationMs = expirationMs;
    }
    public String generateToken(String email,Long userId,String role) {
        Date now = new Date();
        String normalizedRole = role == null
                ? ""
                : role.trim().toUpperCase(Locale.ROOT);
        if (email == null || email.isBlank() || userId == null
                || !normalizedRole.matches("ADMIN|HR_MANAGER|TEAM_LEADER|EMPLOYEE")) {
            throw new IllegalArgumentException("Cannot generate JWT: invalid user information or role.");
        }
        return Jwts.builder()
                .subject(email.trim().toLowerCase(Locale.ROOT))
                .claim("userId", userId)
                .claim("role", normalizedRole)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }
    public Claims validateAndGetClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
