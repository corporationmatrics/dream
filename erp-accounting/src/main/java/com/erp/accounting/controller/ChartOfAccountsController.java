package com.erp.accounting.controller;

import com.erp.accounting.entity.ChartOfAccounts;
import com.erp.accounting.repository.ChartOfAccountsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chart-of-accounts")
@RequiredArgsConstructor
public class ChartOfAccountsController {
    private final ChartOfAccountsRepository chartOfAccountsRepository;
    
    @GetMapping
    public ResponseEntity<List<ChartOfAccounts>> getAllAccounts(@RequestParam(required = false) UUID tenantId) {
        if (tenantId != null) {
            return ResponseEntity.ok(chartOfAccountsRepository.findByTenantId(tenantId));
        }
        return ResponseEntity.ok(chartOfAccountsRepository.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ChartOfAccounts> getAccountById(@PathVariable UUID id) {
        return chartOfAccountsRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<ChartOfAccounts> createAccount(@RequestBody ChartOfAccounts account) {
        ChartOfAccounts saved = chartOfAccountsRepository.save(account);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
