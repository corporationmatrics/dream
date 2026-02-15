package com.erp.accounting.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID productId;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false, length = 100)
    private String productCode;
    
    @Column(nullable = false, length = 255)
    private String productName;
    
    @Column(columnDefinition = "TEXT")
    private String productDescription;
    
    @Column(length = 100)
    private String category;
    
    @Column(nullable = false, length = 10)
    private String hsnCode;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal costPrice;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal sellingPrice;
    
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal gstRate;
    
    @Column(length = 20, nullable = false)
    private String unitOfMeasure = "PIECE";
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
