package com.erp.accounting.repository;

import com.erp.accounting.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByTenantId(UUID tenantId);
    List<Invoice> findByTenantIdAndStatus(UUID tenantId, String status);
    List<Invoice> findByTenantIdAndCustomerId(UUID tenantId, UUID customerId);
    Optional<Invoice> findByTenantIdAndInvoiceNumber(UUID tenantId, String invoiceNumber);
}
