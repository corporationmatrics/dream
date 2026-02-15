package com.erp.accounting.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.*;
import java.time.*;
import java.util.*;
import java.math.BigDecimal;

/**
 * 1. TENANTS - Multi-tenancy root entity
 */
@Entity
@Table(name = "tenants", indexes = {
    @Index(name = "idx_tenants_gstin", columnList = "gstin"),
    @Index(name = "idx_tenants_active", columnList = "is_active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID tenantId;
    
    @Column(nullable = false, length = 255)
    private String businessName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BusinessType businessType; // BusinessType enum value
    
    @Column(length = 100)
    private String businessCategory;
    
    @Column(nullable = false, unique = true, length = 15)
    private String gstin;
    
    @Column(length = 10)
    private String pan;
    
    @Column(length = 21)
    private String cin;
    
    @Column(columnDefinition = "JSONB")
    private Map<String, Object> address;
    
    @Column(length = 20)
    private String phone;
    
    @Column(length = 255)
    private String email;
    
    @Column(length = 255)
    private String website;
    
    @Column
    private LocalDate fiscalYearStart;
    
    @Column(length = 3, nullable = false)
    private String currency = "INR";
    
    @Column(length = 2, nullable = false)
    private String countryCode = "IN";
    
    @Column(length = 100, nullable = false)
    private String timezone = "Asia/Kolkata";
    

    
    @Enumerated(EnumType.STRING)
    private ValuationMethod inventoryValuationMethod; // ValuationMethod enum value
    
    @Column
    private BigDecimal reorderThreshold;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Relationships disabled for now to avoid circular dependency issues    
    // @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL, orphanRemoval = true)
    // private Set<User> users = new HashSet<>();
}
