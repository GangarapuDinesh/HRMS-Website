package com.hrms.backend.auth;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.hrms.backend.auth.passwordreset.PasswordResetEmailService;
import com.hrms.backend.auth.passwordreset.PasswordResetToken;
import com.hrms.backend.auth.passwordreset.PasswordResetTokenRepository;
import com.hrms.backend.employee.Employee;
import com.hrms.backend.employee.EmployeeRepository;
import com.hrms.backend.user.User;
import com.hrms.backend.user.UserRepository;
@Service
public class AuthService {
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordResetEmailService passwordResetEmailService;
    private final SecureRandom secureRandom = new SecureRandom();
    public AuthService(UserRepository userRepository,EmployeeRepository employeeRepository,PasswordEncoder passwordEncoder,JwtService jwtService,PasswordResetTokenRepository passwordResetTokenRepository,PasswordResetEmailService passwordResetEmailService) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordResetEmailService = passwordResetEmailService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,"An account with this email already exists");
        }
        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole("EMPLOYEE");
        user = userRepository.save(user);
        if (!employeeRepository.existsByEmailIgnoreCase(email)) {
            Employee employee = new Employee();
            employee.setFullName(user.getFullName());
            employee.setEmail(email);
            employee.setEmploymentStatus("ACTIVE");
            employee.setJoiningDate(LocalDate.now());
            employeeRepository.save(employee);
        }
        return createResponse(user);
    }
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(email).filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .filter(User::isEnabled)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid email or password, or account is inactive"));
        String requestedRole = normalizeRole(request.role());
        String actualRole = normalizeRole(user.getRole());
        if (requestedRole == null || !isSupportedRole(requestedRole)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid account role");
        }
        if (!requestedRole.equals(actualRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"The selected role does not match your account role");
        }
        return createResponse(user);
    }
    @Transactional
    public PasswordResetResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(email).filter(User::isEnabled).orElse(null);
        if (user != null) {
            passwordResetTokenRepository.deleteAllByUserId(user.getId());
            byte[] tokenBytes = new byte[32];
            secureRandom.nextBytes(tokenBytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
            PasswordResetToken resetToken = new PasswordResetToken(token,user,LocalDateTime.now().plusMinutes(15));
            passwordResetTokenRepository.save(resetToken);
            passwordResetEmailService.sendResetEmail(user.getEmail(), token);
        }
        return new PasswordResetResponse("If an active account exists for that email, a password reset link will be sent.");
    }
    @Transactional
    public PasswordResetResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token().trim()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,"The reset link is invalid or has expired. Request a new link."));
        if (resetToken.isUsed() || !resetToken.getExpiresAt().isAfter(LocalDateTime.now()) || !resetToken.getUser().isEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"The reset link is invalid or has expired. Request a new link.");
        }
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        return new PasswordResetResponse("Your password has been reset successfully. You can now log in.");
    }
    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        return role.trim().toUpperCase(Locale.ROOT).replace(' ', '_').replace('-', '_');
    }
    private boolean isSupportedRole(String role) {
        return role.equals("ADMIN")|| role.equals("HR_MANAGER") || role.equals("TEAM_LEADER") || role.equals("EMPLOYEE");
    }
    private AuthResponse createResponse(User user) {
        String token = jwtService.generateToken(user.getEmail(),user.getId(),user.getRole());
        Long employeeId = employeeRepository.findByEmailIgnoreCase(user.getEmail()).map(Employee::getId).orElse(null);
        return new AuthResponse(token,user.getId(),employeeId,user.getFullName(),user.getEmail(),user.getRole());
    }
}