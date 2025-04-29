package com.ssafy.baperang.domain.school.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "school")
@EntityListeners(AuditingEntityListener.class)
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "school_pk")
    private Long id;

    @Column(name = "school_name", nullable = false, length = 20)
    private String schoolName;

    @Column(name = "city", nullable = false, length = 20)
    private String city;

    @CreatedDate
    @Column(name = "create_at", nullable = false)
    private LocalDateTime creatAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updateAt;

    @Builder
    public School(String schoolName, String city) {
        this.schoolName = schoolName;
        this.city = city;
    }
}
