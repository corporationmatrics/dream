package com.erp.accounting.controller;

import com.erp.accounting.entity.InventoryBalance;
import com.erp.accounting.entity.InventoryLedger;
import com.erp.accounting.repository.InventoryBalanceRepository;
import com.erp.accounting.repository.InventoryLedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryBalanceRepository inventoryBalanceRepository;
    private final InventoryLedgerRepository inventoryLedgerRepository;
    
    @GetMapping("/balance")
    public ResponseEntity<List<InventoryBalance>> getInventoryBalance(@RequestParam(required = false) UUID tenantId) {
        if (tenantId != null) {
            return ResponseEntity.ok(inventoryBalanceRepository.findByTenantId(tenantId));
        }
        return ResponseEntity.ok(inventoryBalanceRepository.findAll());
    }
    
    @GetMapping("/movements")
    public ResponseEntity<List<InventoryLedger>> getInventoryMovements(@RequestParam(required = false) UUID tenantId) {
        if (tenantId != null) {
            return ResponseEntity.ok(inventoryLedgerRepository.findByTenantId(tenantId));
        }
        return ResponseEntity.ok(inventoryLedgerRepository.findAll());
    }
}
