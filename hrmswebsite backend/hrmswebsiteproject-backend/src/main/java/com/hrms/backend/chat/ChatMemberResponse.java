
package com.hrms.backend.chat;

import com.hrms.backend.user.User;

public class ChatMemberResponse {

    private Long id;
    private String fullName;
    private String email;
    private String role;

    public ChatMemberResponse() {
    }

    public ChatMemberResponse(
            Long id,
            String fullName,
            String email,
            String role) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
    }

    public static ChatMemberResponse fromUser(User user) {
        return new ChatMemberResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }
}
