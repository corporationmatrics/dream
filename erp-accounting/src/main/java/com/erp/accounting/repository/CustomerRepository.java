package com.erp.accounting.repository;

import com.erp.accounting.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    List<Customer> findByTenantId(UUID tenantId);
    Optional<Customer> findByTenantIdAndGstin(UUID tenantId, String gstin);
}
