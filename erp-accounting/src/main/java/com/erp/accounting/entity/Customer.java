package com.erp.accounting.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID customerId;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false, length = 255)
    private String customerName;
    
    @Column(nullable = false, length = 50)
    private String customerType;
    
    @Column(length = 20)
    private String phone;
    
    @Column(length = 255)
    private String email;
    
    @Column(length = 15)
    private String gstin;
    
    @Column(columnDefinition = "JSONB")
    private Map<String, Object> billingAddress;
    
    @Column(columnDefinition = "JSONB")
    private Map<String, Object> shippingAddress;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal creditLimit = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal creditUsed = BigDecimal.ZERO;
    
    @Column(nullable = false)
    private Boolean gstApplicable = true;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
