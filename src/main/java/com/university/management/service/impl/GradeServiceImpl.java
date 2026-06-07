package com.university.management.service.impl;

import com.university.management.dto.GradeAssignRequest;
import com.university.management.dto.GradeDto;
import com.university.management.entity.Course;
import com.university.management.entity.Grade;
import com.university.management.entity.Role;
import com.university.management.entity.User;
import com.university.management.exception.ResourceNotFoundException;
import com.university.management.exception.ValidationException;
import com.university.management.repository.CourseRepository;
import com.university.management.repository.GradeRepository;
import com.university.management.repository.UserRepository;
import com.university.management.service.GradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GradeServiceImpl implements GradeService {

    private final GradeRepository gradeRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    @Override
    @Transactional
    public GradeDto assignGrade(GradeAssignRequest request) {
        User student = userRepository.findById(request.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + request.studentId()));

        if (student.getRole() != Role.STUDENT) {
            throw new ValidationException("User with id " + request.studentId() + " is not a STUDENT");
        }

        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.courseId()));

        Grade grade = Grade.builder()
                .student(student)
                .course(course)
                .score(request.score())
                .build();

        grade = gradeRepository.save(grade);
        return toDto(grade);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GradeDto> getMyGrades(Long studentId) {
        return gradeRepository.findByStudentId(studentId).stream()
                .map(this::toDto)
                .toList();
    }

    private GradeDto toDto(Grade grade) {
        return new GradeDto(
                grade.getId(),
                grade.getStudent().getId(),
                grade.getStudent().getEmail(),
                grade.getCourse().getId(),
                grade.getCourse().getName(),
                grade.getScore()
        );
    }
}
