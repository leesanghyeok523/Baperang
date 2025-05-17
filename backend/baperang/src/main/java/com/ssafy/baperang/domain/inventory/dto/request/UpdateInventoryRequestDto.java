package com.ssafy.baperang.domain.inventory.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInventoryRequestDto {
    private LocalDate inventoryDate;
    private String productName;
    private String vendor;
    private Integer price;
    private Integer orderQuantity;
    private Integer useQuantity;

    public boolean NotNullField() {
        return inventoryDate != null ||
                productName != null ||
                vendor != null ||
                price != null||
                orderQuantity != null||
                useQuantity != null;
    }
}
