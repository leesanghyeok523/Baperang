package com.ssafy.baperang.domain.inventory.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;

@Getter
@Entity
@Table(name = "inventory")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_pk")
    private Long id;

    @Column(name = "inventory_date", nullable = false)
    private LocalDate inventoryDate;

    @Column(name = "product_name", nullable = false)
    private String productName ;

    @Column(name = "vendor", nullable = false)
    private String vendor;

    @Column(name = "price", nullable = false)
    private Integer price;

    @Column(name = "order_quantity", nullable = false)
    private Integer orderQuantity;

    @Column(name = "use_quantity", nullable = false)
    private Integer useQuantity;

    @Builder
    public Inventory(LocalDate inventoryDate, String productName, String vendor, Integer price,
                     Integer orderQuantity, Integer useQuantity) {
        this.inventoryDate = inventoryDate;
        this.productName = productName;
        this.vendor = vendor;
        this.price = price;
        this.orderQuantity = orderQuantity;
        this.useQuantity = useQuantity;
    }

    public void updateInventoryDate(LocalDate inventoryDate) {
        this.inventoryDate = inventoryDate;
    }

    public void updateProductName(String productName) {
        this.productName = productName;
    }

    public void updateVendor(String vendor) {
        this.vendor = vendor;
    }

    public void updatePrice(Integer price) {
        this.price = price;
    }

    public void updateOrderQuantity(Integer orderQuantity) {
        this.orderQuantity = orderQuantity;
    }

    public void updateUseQuantity(Integer useQuantity) {
        this.useQuantity = useQuantity;
    }
}
