package com.university.management.dto;

public record GradeDto(
        Long id,
        Long studentId,
        String studentEmail,
        Long courseId,
        String courseName,
        int score
) {}
