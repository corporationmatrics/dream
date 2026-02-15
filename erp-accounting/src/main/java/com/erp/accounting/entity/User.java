package com.erp.accounting.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "email"})
}, indexes = {
    @Index(name = "idx_users_tenant", columnList = "tenant_id"),
    @Index(name = "idx_users_keycloak", columnList = "keycloak_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID userId;
    
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false, length = 100)
    private String firstName;
    
    @Column(length = 100)
    private String lastName;
    
    @Column(nullable = false, length = 255)
    private String email;
    
    @Column(length = 20)
    private String phone;
    
    @Column(length = 255)
    private String passwordHash;
    
    @Column(length = 255)
    private String keycloakId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;
    
    @Column(columnDefinition = "JSONB")
    private List<String> permissions = new ArrayList<>();
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column
    private LocalDateTime lastLogin;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
