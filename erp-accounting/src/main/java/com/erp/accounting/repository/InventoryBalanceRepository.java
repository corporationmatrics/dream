package com.erp.accounting.repository;

import com.erp.accounting.entity.InventoryBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, UUID> {
    List<InventoryBalance> findByTenantId(UUID tenantId);
    Optional<InventoryBalance> findByTenantIdAndProductId(UUID tenantId, UUID productId);
}
