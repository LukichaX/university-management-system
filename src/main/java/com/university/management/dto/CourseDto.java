package com.university.management.dto;

public record CourseDto(
        Long id,
        String name,
        int credits,
        Long lectorId,
        String lectorEmail
) {}
