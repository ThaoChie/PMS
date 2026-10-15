package com.pms.backend.mapper;

import com.pms.backend.dto.UserResponse;
import com.pms.backend.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserResponse toResponse(User user) {
        return UserResponse.from(user);
    }
}
