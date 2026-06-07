package com.university.management.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CourseCreateRequest(
        @NotBlank(message = "Course name is required")
        String name,

        @Min(value = 1, message = "Credits must be at least 1")
        int credits,

        Long lectorId
) {}
