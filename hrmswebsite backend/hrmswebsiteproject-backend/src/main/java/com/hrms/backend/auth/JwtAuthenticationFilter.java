package com.hrms.backend.auth;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtService jwtService;
    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/api/auth") || path.startsWith("/api/auth/") || (path.equals("/api/health") && "GET".equalsIgnoreCase(request.getMethod()));
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getServletPath();
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = header.substring(7).trim();
        if (token.isEmpty()) {
            sendUnauthorized(response, "Bearer token is empty");
            return;
        }
        try {
            Claims claims = jwtService.validateAndGetClaims(token);
            String email = claims.getSubject();
            String role = claims.get("role", String.class);
            if (email == null || email.isBlank() || role == null || role.isBlank()) {
                sendUnauthorized(response, "JWT subject or role is missing");
                return;
            }
            String normalizedRole = role.trim().toUpperCase(Locale.ROOT);
            if (!normalizedRole.matches("ADMIN|HR_MANAGER|TEAM_LEADER|EMPLOYEE")) {
                sendUnauthorized(response, "JWT contains an invalid role");
                return;
            }
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(email,null,List.of(new SimpleGrantedAuthority("ROLE_" + normalizedRole)));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            logger.debug("JWT authentication successful: path={}, role={}",path,normalizedRole);
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            logger.warn("JWT validation failed: path={}, errorType={}",path,ex.getClass().getSimpleName());
            sendUnauthorized(response, "Invalid or expired JWT");
            return;
        }
        filterChain.doFilter(request, response);
    }
    private void sendUnauthorized(HttpServletResponse response,String message) throws IOException {
        SecurityContextHolder.clearContext();
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                "{\"message\":\"" + message + "\"}"
        );
    }
}
