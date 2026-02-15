package com.erp.accounting.controller;

import com.erp.accounting.entity.GeneralLedger;
import com.erp.accounting.repository.GeneralLedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/general-ledger")
@RequiredArgsConstructor
public class GeneralLedgerController {
    private final GeneralLedgerRepository generalLedgerRepository;
    
    @GetMapping
    public ResponseEntity<List<GeneralLedger>> getGeneralLedger(@RequestParam(required = false) UUID tenantId) {
        if (tenantId != null) {
            return ResponseEntity.ok(generalLedgerRepository.findByTenantId(tenantId));
        }
        return ResponseEntity.ok(generalLedgerRepository.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<GeneralLedger> getGLRecord(@PathVariable UUID id) {
        return generalLedgerRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
