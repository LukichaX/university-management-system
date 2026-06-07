package com.university.management.service.impl;

import com.university.management.dto.UserDto;
import com.university.management.entity.Role;
import com.university.management.entity.User;
import com.university.management.repository.UserRepository;
import com.university.management.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getUsersByRole(Role role) {
        List<User> users = role != null ? userRepository.findByRole(role) : userRepository.findAll();
        return users.stream()
                .map(u -> new UserDto(u.getId(), u.getEmail(), u.getRole().name()))
                .toList();
    }
}
