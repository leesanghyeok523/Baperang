package com.ssafy.baperang.domain.menu.entity;

import java.time.LocalDate;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.ssafy.baperang.domain.school.entity.School;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "menu")
@EntityListeners(AuditingEntityListener.class)
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_pk")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_pk", nullable = false)
    private School school;

    @Column(name = "menu_date", nullable = false)
    private LocalDate menuDate;

    @Column(name = "menu_name", nullable = false, columnDefinition = "TEXT")
    private String menuName;

    @Column(name = "amount")
    private Integer amount;

    @Column(name = "favorite")
    private Float favorite;

    @Column(name = "votes")
    private Integer votes;

    @Builder
    public Menu(School school, LocalDate menuDate, String menuName, Integer amount, Float favorite, Integer votes) {
        this.school = school;
        this.menuDate = menuDate;
        this.menuName = menuName;
        this.amount = amount != null ? amount : 0;
        this.favorite = favorite != null ? favorite : 0.0f;
        this.votes = votes != null ? votes : 0;
    }

    // 메뉴 내용이 변경될 경우 사용
    public void updateMenuName(String menuName) {
        this.menuName = menuName;
    }

    // 선호도 변경시 사용
    public void updateFavorite(Float favorite) {
       this.favorite = favorite;
   }

    public void updateAmount(Integer amount) {this.amount = amount;}
    
    /**
     * 만족도 투표 추가 메서드
     * @param satisfactionScore 만족도 점수
     */
    public void addVote(int satisfactionScore) {
        this.votes = (this.votes != null) ? this.votes + 1 : 1;
        float currentFavorite = (this.favorite != null) ? this.favorite : 0.0f;
        this.favorite = currentFavorite + satisfactionScore;
    }
    
    /**
     * 총 투표수 반환
     * @return 투표수
     */
    public int getVoteCount() {
        return (this.votes != null) ? this.votes : 0;
    }
    
    /**
     * 총 선호도 점수 반환
     * @return 선호도 총점
     */
    public int getTotalFavorite() {
        return (this.favorite != null) ? Math.round(this.favorite) : 0;
    }
}
