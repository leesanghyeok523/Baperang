package com.ssafy.baperang.domain.student.entity;

import com.ssafy.baperang.domain.school.entity.School;
import jakarta.persistence.*;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;


@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "student")
@EntityListeners(AuditingEntityListener.class)
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_pk")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_pk", nullable = false)
    private School school;

    @Column(name = "student_name", nullable = false, length = 10)
    private String studentName;

    @Column(name = "grade", nullable = false)
    private Integer grade;

    @Column(name = "class", nullable = false)
    private Integer classNum;

    @Column(name = "number", nullable = false)
    private Integer number;

    @Column(name = "height", nullable = false)
    private Float height;

    @Column(name = "weight", nullable = false)
    private Float weight;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Builder
    public Student(String studentName, Integer grade, Integer classNum,
                   Float height, Float weight, School school, Integer number, LocalDate date, String content) {
        this.studentName = studentName;
        this.classNum = classNum;
        this.grade = grade;
        this.height = height;
        this.weight = weight;
        this.school = school;
        this.number = number;
        this.date = date;
        this.content = content;
    }
}
