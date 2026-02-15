package com.erp.accounting.repository;

import com.erp.accounting.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    List<User> findByTenantIdAndRole(UUID tenantId, String role);
    Optional<User> findByTenantIdAndEmail(UUID tenantId, String email);
    Optional<User> findByKeycloakId(String keycloakId);
}
