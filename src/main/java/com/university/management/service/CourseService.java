package com.university.management.service;

import com.university.management.dto.CourseCreateRequest;
import com.university.management.dto.CourseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CourseService {

    CourseDto createCourse(CourseCreateRequest request);

    Page<CourseDto> getAllCourses(Pageable pageable);

    void enrollCourse(Long studentId, Long courseId);

    java.util.List<CourseDto> getMyCourses(Long studentId);

    CourseDto updateCourseLector(Long courseId, Long lectorId);

    CourseDto removeCourseLector(Long courseId);

    void deleteCourse(Long courseId);
}
