package com.university.management.controller;

import com.university.management.dto.CourseCreateRequest;
import com.university.management.dto.CourseDto;
import com.university.management.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.university.management.security.CustomUserDetails;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<Page<CourseDto>> getAllCourses(Pageable pageable) {
        return ResponseEntity.ok(courseService.getAllCourses(pageable));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseDto> createCourse(@Valid @RequestBody CourseCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(request));
    }

    @PostMapping("/{courseId}/enroll")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> enrollCourse(@PathVariable Long courseId) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        courseService.enrollCourse(userDetails.getUser().getId(), courseId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my-courses")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<java.util.List<CourseDto>> getMyCourses() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(courseService.getMyCourses(userDetails.getUser().getId()));
    }

    @PutMapping("/{courseId}/lector/{lectorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseDto> updateCourseLector(@PathVariable Long courseId, @PathVariable Long lectorId) {
        return ResponseEntity.ok(courseService.updateCourseLector(courseId, lectorId));
    }

    @DeleteMapping("/{courseId}/lector")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseDto> removeCourseLector(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.removeCourseLector(courseId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }
}
