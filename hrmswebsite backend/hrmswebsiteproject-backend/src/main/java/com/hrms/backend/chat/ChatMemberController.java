
package com.hrms.backend.chat;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.backend.user.User;
import com.hrms.backend.user.UserRepository;

@RestController
@RequestMapping("/api/chat")
public class ChatMemberController {

    private final UserRepository userRepository;

    public ChatMemberController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/members")
    public List<ChatMemberResponse> getMembers(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Please log in to access chat."
            );
        }

        String currentEmail = authentication.getName();

        return userRepository
                .findAllByEnabledTrueOrderByFullNameAsc()
                .stream()
                .filter(user -> !user.getEmail().equalsIgnoreCase(currentEmail))
                .map(ChatMemberResponse::fromUser)
                .toList();
    }
}
