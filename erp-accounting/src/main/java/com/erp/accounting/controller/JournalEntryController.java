package com.erp.accounting.controller;

import com.erp.accounting.entity.JournalEntry;
import com.erp.accounting.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/journal-entries")
@RequiredArgsConstructor
public class JournalEntryController {
    private final JournalEntryRepository journalEntryRepository;
    
    @GetMapping
    public ResponseEntity<List<JournalEntry>> getAllJournalEntries(@RequestParam(required = false) UUID tenantId) {
        if (tenantId != null) {
            return ResponseEntity.ok(journalEntryRepository.findByTenantId(tenantId));
        }
        return ResponseEntity.ok(journalEntryRepository.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<JournalEntry> getJournalEntryById(@PathVariable UUID id) {
        return journalEntryRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<JournalEntry> createJournalEntry(@RequestBody JournalEntry entry) {
        JournalEntry saved = journalEntryRepository.save(entry);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
