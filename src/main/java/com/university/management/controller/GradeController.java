package com.university.management.controller;

import com.university.management.dto.GradeAssignRequest;
import com.university.management.dto.GradeDto;
import com.university.management.security.CustomUserDetails;
import com.university.management.service.GradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    @PostMapping
    @PreAuthorize("hasRole('LECTOR')")
    public ResponseEntity<GradeDto> assignGrade(@Valid @RequestBody GradeAssignRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gradeService.assignGrade(request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<GradeDto>> getMyGrades() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long studentId = userDetails.getUser().getId();
        return ResponseEntity.ok(gradeService.getMyGrades(studentId));
    }
}
