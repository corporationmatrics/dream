package com.erp.accounting.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID invoiceId;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(name = "customer_id", nullable = false)
    private UUID customerId;
    
    @Column(nullable = false, length = 50)
    private String invoiceNumber;
    
    @Column(nullable = false)
    private LocalDate invoiceDate = LocalDate.now();
    
    @Column
    private LocalDate dueDate;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotal;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal cgstAmount = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal sgstAmount = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal igstAmount = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal totalTax = BigDecimal.ZERO;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status; // InvoiceStatus enum
    
    @Column(precision = 15, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal outstanding;
    
    @Column(nullable = false)
    private Boolean isPosted = false;
    
    @Column
    private LocalDateTime postedAt;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
