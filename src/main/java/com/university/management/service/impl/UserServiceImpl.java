package com.university.management.service.impl;

import com.university.management.dto.UserDto;
import com.university.management.entity.Role;
import com.university.management.entity.User;
import com.university.management.repository.UserRepository;
import com.university.management.service.UserService;
import lombok.RequiredArgsConstructor;
import com.university.management.exception.ResourceNotFoundException;
import com.university.management.exception.ValidationException;
import com.university.management.security.CustomUserDetails;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (userDetails.getUser().getId().equals(userId)) {
            throw new ValidationException("Cannot delete yourself");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.LECTOR) {
            user.getCourses().forEach(c -> c.setLector(null));
        }

        userRepository.delete(user);
    }
}
