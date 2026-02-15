package com.erp.accounting.repository;

import com.erp.accounting.entity.InventoryLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryLedgerRepository extends JpaRepository<InventoryLedger, UUID> {
    List<InventoryLedger> findByTenantId(UUID tenantId);
    List<InventoryLedger> findByTenantIdAndProductId(UUID tenantId, UUID productId);
}
