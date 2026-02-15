package com.erp.accounting.entity;

import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "inventory_balance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryBalance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID balanceId;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "product_id", nullable = false)
    private UUID productId;
    
    @Column(nullable = false)
    private Integer currentQuantity = 0;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal availableQuantity = BigDecimal.ZERO;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal reservedQuantity = BigDecimal.ZERO;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalValue = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal averageCost = BigDecimal.ZERO;
    
    @Column
    private LocalDate lastMovementDate;
    
    @Column
    private LocalDate nextReorderDate;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime lastUpdated;
}
