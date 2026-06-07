package com.university.management.repository;

import com.university.management.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GradeRepository extends JpaRepository<Grade, Long> {

    List<Grade> findByStudentId(Long studentId);

    java.util.Optional<Grade> findByStudentIdAndCourseId(Long studentId, Long courseId);
}
