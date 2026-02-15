package com.erp.accounting.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "general_ledger")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneralLedger {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID glId;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "account_id", nullable = false)
    private UUID accountId;
    
    @Column(nullable = false)
    private LocalDate transactionDate;
    
    @Column(nullable = false)
    private LocalDate postingDate = LocalDate.now();
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BalanceType entryType;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
    @Column(length = 500)
    private String description;
    
    @Column(nullable = false)
    private Boolean isPosted = false;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
