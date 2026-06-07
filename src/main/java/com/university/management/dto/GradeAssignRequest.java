package com.university.management.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GradeAssignRequest(
        @NotNull(message = "Student ID is required")
        Long studentId,

        @NotNull(message = "Course ID is required")
        Long courseId,

        @Min(value = 0, message = "Score must be at least 0")
        @Max(value = 100, message = "Score must be at most 100")
        int score
) {}
