package com.university.management.service.impl;

import com.university.management.dto.CourseCreateRequest;
import com.university.management.dto.CourseDto;
import com.university.management.entity.Course;
import com.university.management.entity.Role;
import com.university.management.entity.User;
import com.university.management.exception.ResourceNotFoundException;
import com.university.management.exception.ValidationException;
import com.university.management.repository.CourseRepository;
import com.university.management.repository.UserRepository;
import com.university.management.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CourseDto createCourse(CourseCreateRequest request) {
        User lector = null;

        if (request.lectorId() != null) {
            lector = userRepository.findById(request.lectorId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.lectorId()));

            if (lector.getRole() != Role.LECTOR) {
                throw new ValidationException("User with id " + request.lectorId() + " is not a LECTOR");
            }
        }

        Course course = Course.builder()
                .name(request.name())
                .credits(request.credits())
                .lector(lector)
                .build();

        course = courseRepository.save(course);
        return toDto(course);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CourseDto> getAllCourses(Pageable pageable) {
        return courseRepository.findAll(pageable).map(this::toDto);
    }

    @Override
    @Transactional
    public void enrollCourse(Long studentId, Long courseId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        if (student.getRole() != Role.STUDENT) {
            throw new ValidationException("User is not a STUDENT");
        }
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        
        if (!student.getEnrolledCourses().contains(course)) {
            student.getEnrolledCourses().add(course);
            userRepository.save(student);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<CourseDto> getMyCourses(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        return student.getEnrolledCourses().stream().map(this::toDto).toList();
    }

    @Override
    @Transactional
    public CourseDto updateCourseLector(Long courseId, Long lectorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        User lector = userRepository.findById(lectorId)
                .orElseThrow(() -> new ResourceNotFoundException("Lector not found"));
        if (lector.getRole() != Role.LECTOR) {
            throw new ValidationException("User is not a LECTOR");
        }
        course.setLector(lector);
        return toDto(courseRepository.save(course));
    }

    @Override
    @Transactional
    public CourseDto removeCourseLector(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        course.setLector(null);
        return toDto(courseRepository.save(course));
    }

    private CourseDto toDto(Course course) {
        User lector = course.getLector();
        return new CourseDto(
                course.getId(),
                course.getName(),
                course.getCredits(),
                lector != null ? lector.getId() : null,
                lector != null ? lector.getEmail() : null
        );
    }
}
