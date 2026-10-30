package com.hrms.backend.profile;

import java.util.Base64;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.hrms.backend.auth.JwtService;
import com.hrms.backend.user.User;
import com.hrms.backend.user.UserRepository;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private static final long MAX_PHOTO_SIZE = 2 * 1024 * 1024;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public ProfileController(
            UserRepository userRepository,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ProfileResponse getMyProfile(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return toResponse(user, null);
    }

    @PutMapping("/me")
    @Transactional
    public ProfileResponse updateMyProfile(
            Authentication authentication,
            @RequestBody ProfileUpdateRequest request) {

        User user = getAuthenticatedUser(authentication);

        if (request.fullName() == null || request.fullName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Full name is required"
            );
        }

        String fullName = request.fullName().trim();

        if (fullName.length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Full name must not exceed 100 characters"
            );
        }

        if (request.email() == null || request.email().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email is required"
            );
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (email.length() > 150 || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Enter a valid email address"
            );
        }

        boolean emailChanged = !email.equalsIgnoreCase(user.getEmail());

        if (emailChanged &&
                userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This email is already used by another account"
            );
        }

        validateLength(request.phone(), 30, "Phone");
        validateLength(request.jobTitle(), 100, "Job title");
        validateLength(request.department(), 100, "Department");
        validateLength(request.location(), 150, "Location");

        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(clean(request.phone()));
        user.setJobTitle(clean(request.jobTitle()));
        user.setDepartment(clean(request.department()));
        user.setLocation(clean(request.location()));

        User savedUser = userRepository.save(user);

        String refreshedToken = emailChanged
                ? jwtService.generateToken(
                        savedUser.getEmail(),
                        savedUser.getId(),
                        savedUser.getRole()
                )
                : null;

        return toResponse(savedUser, refreshedToken);
    }

    @PostMapping(
            value = "/me/photo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Transactional
    public ProfileResponse uploadPhoto(
            Authentication authentication,
            @RequestPart("photo") MultipartFile photo) {

        User user = getAuthenticatedUser(authentication);

        if (photo == null || photo.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select a photo"
            );
        }

        if (photo.getSize() > MAX_PHOTO_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Photo size must not exceed 2 MB"
            );
        }

        String contentType = photo.getContentType();

        if (contentType == null ||
                !ALLOWED_IMAGE_TYPES.contains(
                        contentType.toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only JPG, PNG and WebP photos are supported"
            );
        }

        try {
            user.setProfilePhoto(photo.getBytes());
            user.setProfilePhotoContentType(contentType);
            User savedUser = userRepository.save(user);

            return toResponse(savedUser, null);
        } catch (java.io.IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unable to read the uploaded photo"
            );
        }
    }

    @DeleteMapping("/me/photo")
    @Transactional
    public ProfileResponse deletePhoto(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);

        user.setProfilePhoto(null);
        user.setProfilePhotoContentType(null);

        User savedUser = userRepository.save(user);

        return toResponse(savedUser, null);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null ||
                authentication.getName() == null ||
                authentication.getName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in again"
            );
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Your account could not be found. Please log in again"
                ));
    }

    private ProfileResponse toResponse(User user, String token) {
        String photoData = null;

        if (user.getProfilePhoto() != null &&
                user.getProfilePhotoContentType() != null) {
            photoData = "data:"
                    + user.getProfilePhotoContentType()
                    + ";base64,"
                    + Base64.getEncoder().encodeToString(
                            user.getProfilePhoto()
                    );
        }

        return new ProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getPhone(),
                user.getJobTitle(),
                user.getDepartment(),
                user.getLocation(),
                photoData,
                user.getCreatedAt(),
                token
        );
    }

    private void validateLength(
            String value,
            int maxLength,
            String fieldName) {

        if (value != null && value.trim().length() > maxLength) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " must not exceed " + maxLength + " characters"
            );
        }
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}