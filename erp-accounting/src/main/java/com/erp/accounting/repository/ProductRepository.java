package com.erp.accounting.repository;

import com.erp.accounting.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByTenantId(UUID tenantId);
    Optional<Product> findByTenantIdAndProductCode(UUID tenantId, String productCode);
}
