package com.erp.accounting.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "chart_of_accounts", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "account_code"})
}, indexes = {
    @Index(name = "idx_chart_tenant", columnList = "tenant_id"),
    @Index(name = "idx_chart_type", columnList = "account_type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChartOfAccounts {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID accountId;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false, length = 20)
    private String accountCode;
    
    @Column(nullable = false, length = 255)
    private String accountName;
    
    @Column(columnDefinition = "TEXT")
    private String accountDescription;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType accountType;
    
    @Column(length = 100)
    private String accountSubtype;
    
    @Column(nullable = false)
    private Boolean gstApplicable = false;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal defaultGstRate;
    
    @Column(nullable = false)
    private Boolean allowManualEntries = true;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column
    private LocalDateTime archivedAt;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
