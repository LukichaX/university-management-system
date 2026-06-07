package com.university.management.service;

import com.university.management.dto.GradeAssignRequest;
import com.university.management.dto.GradeDto;

import java.util.List;

public interface GradeService {

    GradeDto assignGrade(GradeAssignRequest request);

    List<GradeDto> getMyGrades(Long studentId);
}
