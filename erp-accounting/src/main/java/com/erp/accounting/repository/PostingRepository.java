package com.erp.accounting.repository;

import com.erp.accounting.entity.Posting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PostingRepository extends JpaRepository<Posting, UUID> {
    List<Posting> findByJournalId(UUID journalId);
    List<Posting> findByAccountId(UUID accountId);
}
