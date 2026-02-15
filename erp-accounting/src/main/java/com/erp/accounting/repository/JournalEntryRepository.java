package com.erp.accounting.repository;

import com.erp.accounting.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {
    List<JournalEntry> findByTenantId(UUID tenantId);
    List<JournalEntry> findByTenantIdAndStatus(UUID tenantId, String status);
}
