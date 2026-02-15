package com.erp.accounting.controller;

import com.erp.accounting.entity.*;
import com.erp.accounting.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("REST Controller Integration Tests")
class RestControllerTests {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private ChartOfAccountsRepository chartOfAccountsRepository;
    
    @Autowired
    private JournalEntryRepository journalEntryRepository;
    
    private UUID testTenantId;
    private UUID testAccountId;
    
    @BeforeEach
    void setUp() {
        // Create test tenant
        Tenant tenant = Tenant.builder()
            .tenantId(UUID.randomUUID())
            .businessName("Test Company")
            .businessType(BusinessType.RETAILER)
            .gstin("27AAPCS1234H1Z0")
            .currency("INR")
            .countryCode("IN")
            .isActive(true)
            .build();
        
        Tenant saved = tenantRepository.save(tenant);
        testTenantId = saved.getTenantId();
        
        // Create test chart of accounts
        ChartOfAccounts account = ChartOfAccounts.builder()
            .accountId(UUID.randomUUID())
            .tenantId(testTenantId)
            .accountCode("1010")
            .accountName("Cash")
            .accountType(AccountType.ASSET)
            .isActive(true)
            .build();
        
        ChartOfAccounts savedAccount = chartOfAccountsRepository.save(account);
        testAccountId = savedAccount.getAccountId();
    }
    
    // ========================================================================
    // TENANT ENDPOINT TESTS
    // ========================================================================
    
    @Test
    @DisplayName("GET /api/v1/tenants - List all tenants")
    void testGetAllTenants() throws Exception {
        mockMvc.perform(get("/api/v1/tenants")
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
            .andExpect(jsonPath("$[0].tenantId").exists())
            .andExpect(jsonPath("$[0].businessName").exists());
    }
    
    @Test
    @DisplayName("GET /api/v1/tenants/{id} - Get tenant by ID")
    void testGetTenantById() throws Exception {
        mockMvc.perform(get("/api/v1/tenants/" + testTenantId)
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tenantId").value(testTenantId.toString()))
            .andExpect(jsonPath("$.businessName").value("Test Company"));
    }
    
    @Test
    @DisplayName("POST /api/v1/tenants - Create new tenant")
    void testCreateTenant() throws Exception {
        Tenant newTenant = Tenant.builder()
            .businessName("New Test Tenant")
            .businessType(BusinessType.MANUFACTURER)
            .gstin("27AAPCS5678H1Z0")
            .currency("INR")
            .build();
        
        mockMvc.perform(post("/api/v1/tenants")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(newTenant)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.businessName").value("New Test Tenant"))
            .andExpect(jsonPath("$.gstin").value("27AAPCS5678H1Z0"));
    }
    
    // ========================================================================
    // JOURNAL ENTRY ENDPOINT TESTS
    // ========================================================================
    
    @Test
    @DisplayName("GET /api/v1/journal-entries - List all journal entries")
    void testGetAllJournalEntries() throws Exception {
        mockMvc.perform(get("/api/v1/journal-entries")
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", isA(java.util.List.class)));
    }
    
    @Test
    @DisplayName("GET /api/v1/journal-entries?tenantId={id} - Filter by tenant")
    void testGetJournalEntriesByTenant() throws Exception {
        mockMvc.perform(get("/api/v1/journal-entries")
            .param("tenantId", testTenantId.toString())
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", isA(java.util.List.class)));
    }
    
    @Test
    @DisplayName("POST /api/v1/journal-entries - Create journal entry")
    void testCreateJournalEntry() throws Exception {
        JournalEntry entry = JournalEntry.builder()
            .journalId(UUID.randomUUID())
            .tenantId(testTenantId)
            .entryNumber("JE-2026-0001")
            .entryDate(LocalDate.now())
            .description("Opening balance")
            .status(JournalStatus.DRAFT)
            .totalDebit(BigDecimal.ZERO)
            .totalCredit(BigDecimal.ZERO)
            .isBalanced(false)
            .build();
        
        mockMvc.perform(post("/api/v1/journal-entries")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(entry)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.entryNumber").value("JE-2026-0001"))
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }
    
    // ========================================================================
    // CHART OF ACCOUNTS ENDPOINT TESTS
    // ========================================================================
    
    @Test
    @DisplayName("GET /api/v1/chart-of-accounts - List all accounts")
    void testGetAllChartOfAccounts() throws Exception {
        mockMvc.perform(get("/api/v1/chart-of-accounts")
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }
    
    @Test
    @DisplayName("GET /api/v1/chart-of-accounts?tenantId={id} - Filter by tenant")
    void testGetChartOfAccountsByTenant() throws Exception {
        mockMvc.perform(get("/api/v1/chart-of-accounts")
            .param("tenantId", testTenantId.toString())
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", isA(java.util.List.class)))
            .andExpect(jsonPath("$[0].accountName").value("Cash"));
    }
    
    @Test
    @DisplayName("POST /api/v1/chart-of-accounts - Create account")
    void testCreateChartOfAccounts() throws Exception {
        ChartOfAccounts newAccount = ChartOfAccounts.builder()
            .tenantId(testTenantId)
            .accountCode("1020")
            .accountName("Bank Account")
            .accountType(AccountType.ASSET)
            .isActive(true)
            .build();
        
        mockMvc.perform(post("/api/v1/chart-of-accounts")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(newAccount)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accountName").value("Bank Account"));
    }
    
    // ========================================================================
    // GENERAL LEDGER ENDPOINT TESTS
    // ========================================================================
    
    @Test
    @DisplayName("GET /api/v1/general-ledger - List GL records")
    void testGetGeneralLedger() throws Exception {
        mockMvc.perform(get("/api/v1/general-ledger")
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", isA(java.util.List.class)));
    }
    
    @Test
    @DisplayName("GET /api/v1/general-ledger?tenantId={id} - Filter GL by tenant")
    void testGetGeneralLedgerByTenant() throws Exception {
        mockMvc.perform(get("/api/v1/general-ledger")
            .param("tenantId", testTenantId.toString())
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", isA(java.util.List.class)));
    }
    
    // ========================================================================
    // INVOICE ENDPOINT TESTS
    // ========================================================================
    
    @Test
    @DisplayName("GET /api/v1/invoices - List all invoices")
    void testGetAllInvoices() throws Exception {
        mockMvc.perform(get("/api/v1/invoices")
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", isA(java.util.List.class)));
    }
    
    @Test
    @DisplayName("GET /api/v1/invoices?tenantId={id} - Filter invoices by tenant")
    void testGetInvoicesByTenant() throws Exception {
        mockMvc.perform(get("/api/v1/invoices")
            .param("tenantId", testTenantId.toString())
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", isA(java.util.List.class)));
    }
    
    // ========================================================================
    // INVENTORY ENDPOINT TESTS
    // ========================================================================
    
    @Test
    @DisplayName("GET /api/v1/inventory/balance - Get inventory balances")
    void testGetInventoryBalance() throws Exception {
        mockMvc.perform(get("/api/v1/inventory/balance")
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", isA(java.util.List.class)));
    }
    
    @Test
    @DisplayName("GET /api/v1/inventory/movements - Get inventory movements")
    void testGetInventoryMovements() throws Exception {
        mockMvc.perform(get("/api/v1/inventory/movements")
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", isA(java.util.List.class)));
    }
    
    // ========================================================================
    // HEALTH ENDPOINT TESTS
    // ========================================================================
    
    @Test
    @DisplayName("GET /api/v1/health - Service health check")
    void testHealth() throws Exception {
        mockMvc.perform(get("/api/v1/health")
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.service").value("Accounting Service"))
            .andExpect(jsonPath("$.version").exists());
    }
    
    // ========================================================================
    // ERROR HANDLING TESTS
    // ========================================================================
    
    @Test
    @DisplayName("GET /api/v1/tenants/{invalid-id} - Returns 404 for invalid ID")
    void testGetTenantByInvalidId() throws Exception {
        mockMvc.perform(get("/api/v1/tenants/" + UUID.randomUUID())
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }
    
    @Test
    @DisplayName("GET /api/v1/journal-entries/{invalid-id} - Returns 404 for invalid ID")
    void testGetJournalEntryByInvalidId() throws Exception {
        mockMvc.perform(get("/api/v1/journal-entries/" + UUID.randomUUID())
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }
}
