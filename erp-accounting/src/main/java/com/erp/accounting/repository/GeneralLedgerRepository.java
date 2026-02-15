package com.erp.accounting.repository;

import com.erp.accounting.entity.GeneralLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface GeneralLedgerRepository extends JpaRepository<GeneralLedger, UUID> {
    List<GeneralLedger> findByTenantId(UUID tenantId);
    List<GeneralLedger> findByTenantIdAndAccountId(UUID tenantId, UUID accountId);
}
