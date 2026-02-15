package com.erp.accounting.repository;

import com.erp.accounting.entity.ChartOfAccounts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChartOfAccountsRepository extends JpaRepository<ChartOfAccounts, UUID> {
    List<ChartOfAccounts> findByTenantId(UUID tenantId);
    List<ChartOfAccounts> findByTenantIdAndAccountType(UUID tenantId, String accountType);
    Optional<ChartOfAccounts> findByTenantIdAndAccountCode(UUID tenantId, String accountCode);
}
