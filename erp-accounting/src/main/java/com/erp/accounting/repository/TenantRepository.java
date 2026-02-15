package com.erp.accounting.repository;

import com.erp.accounting.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findByGstin(String gstin);
    List<Tenant> findByIsActiveTrue();
}
