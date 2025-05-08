package com.ssafy.baperang.domain.menunutrient.entity;

import com.ssafy.baperang.domain.menu.entity.Menu;
import com.ssafy.baperang.domain.nutrient.entity.Nutrient;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "menu_nutrient")
@EntityListeners(AuditingEntityListener.class)
public class MenuNutrient {

    @EmbeddedId
    private MenuNutrientId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("menuId")
    @JoinColumn(name = "menu_pk")
    private Menu menu;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("nutrientId")
    @JoinColumn(name = "nutrient_pk")
    private Nutrient nutrient;

    @Column(name = "amount", nullable = false)
    private Float amount;

    @Builder
    public MenuNutrient(Menu menu, Nutrient nutrient, Float amount) {
        this.id = new MenuNutrientId(menu.getId(), nutrient.getId());
        this.menu = menu;
        this.nutrient = nutrient;
        this.amount = amount;
    }

    @Embeddable
    @Getter
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    public static class MenuNutrientId implements java.io.Serializable {

        @Column(name = "menu_pk")
        private Long menuId;

        @Column(name = "nutrient_pk")
        private Long nutrientId;

        public MenuNutrientId(Long menuId, Long nutrientId) {
            this.menuId = menuId;
            this.nutrientId = nutrientId;
        }

        // equals와 hashCode 메서드 오버라이드
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MenuNutrientId that = (MenuNutrientId) o;

            if (!menuId.equals(that.menuId)) return false;
            return nutrientId.equals(that.nutrientId);
        }

        @Override
        public int hashCode() {
            int result = menuId.hashCode();
            result = 31 * result + nutrientId.hashCode();
            return result;
        }
    }
}
