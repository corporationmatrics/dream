package com.erp.accounting.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "invoice_lines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceLine {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID lineId;
    
    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;
    
    @Column(name = "product_id", nullable = false)
    private UUID productId;
    
    @Column(nullable = false)
    private Integer lineNumber;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal lineTotal;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal gstRate;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal gstAmount;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
