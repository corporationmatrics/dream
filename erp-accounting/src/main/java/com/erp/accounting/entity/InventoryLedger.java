package com.erp.accounting.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "inventory_ledger")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryLedger {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID ledgerId;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "product_id", nullable = false)
    private UUID productId;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime transactionDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType;
    
    @Column(nullable = false)
    private Integer quantityIn = 0;
    
    @Column(nullable = false)
    private Integer quantityOut = 0;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal unitCost;
    
    @Column(length = 100)
    private String batchNumber;
    
    @Column
    private LocalDate expiryDate;
    
    @Column(length = 100)
    private String referenceId;
    
    @Column(length = 50)
    private String referenceType;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
