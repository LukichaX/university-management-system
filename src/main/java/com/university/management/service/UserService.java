package com.university.management.service;

import com.university.management.dto.UserDto;
import com.university.management.entity.Role;

import java.util.List;

public interface UserService {
    List<UserDto> getUsersByRole(Role role);

    void deleteUser(Long userId);
}
