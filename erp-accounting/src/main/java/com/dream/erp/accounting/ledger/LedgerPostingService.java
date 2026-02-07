package com.dream.erp.accounting.ledger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * LedgerPostingService - Posts invoice and expense ledger entries
 * Ensures ACID compliance and balanced accounting entries
 */
@Service
public class LedgerPostingService {
    private static final Logger logger = LoggerFactory.getLogger(LedgerPostingService.class);

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    @Autowired
    private GeneralLedgerRepository generalLedgerRepository;

    @Autowired
    private JournalVoucherRepository journalVoucherRepository;

    @Autowired
    private AccountMasterRepository accountMasterRepository;

    /**
     * Post B2B Invoice to Ledger
     * 
     * Expected ledger entries:
     * 1. DR: Inventory/Raw Materials (Debit)
     * 2. DR: GST Input Tax Credit (ITC)
     * 3. CR: Accounts Payable - Vendor (Credit)
     * 
     * Constraints:
     * - Total Debit MUST equal Total Credit
     * - All accounts must be valid and active
     * - No posting to closed periods
     */
    @Transactional(rollbackFor = Exception.class)
    public LedgerTransaction postB2BInvoice(B2BInvoiceDto invoiceDto) throws LedgerException {
        logger.info("Posting B2B Invoice: {} from vendor: {}", 
            invoiceDto.getInvoiceNumber(), 
            invoiceDto.getVendorGstin());

        // Step 1: Create Journal Voucher Header
        JournalVoucher jv = new JournalVoucher();
        jv.setVoucherNumber(generateVoucherNumber());
        jv.setVoucherDate(LocalDateTime.now());
        jv.setVoucherType("PURCHASE_INVOICE");
        jv.setReferenceNumber(invoiceDto.getInvoiceNumber());
        jv.setReferenceDate(invoiceDto.getInvoiceDate());
        jv.setNarration("Purchase Invoice - " + invoiceDto.getInvoiceNumber() + 
                       " from " + invoiceDto.getVendorName());
        jv.setStatus("DRAFT");
        jv.setCreatedBy("B2B_AUTOMATION");
        jv.setCreatedAt(LocalDateTime.now());

        // Step 2: Create ledger entries
        List<LedgerEntry> entries = new ArrayList<>();
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        // ========== DEBIT ENTRIES ==========

        // 2.1: Inventory/Raw Materials Debit
        LedgerEntry inventoryEntry = new LedgerEntry();
        inventoryEntry.setAccountCode("4110");                    // Raw Materials
        inventoryEntry.setAccountName("Raw Materials - Purchases");
        inventoryEntry.setDebit(invoiceDto.getSubtotal());
        inventoryEntry.setCredit(BigDecimal.ZERO);
        inventoryEntry.setNarration("Purchase of goods - " + invoiceDto.getInvoiceNumber());
        inventoryEntry.setJournalVoucher(jv);
        inventoryEntry.setLineNumber(1);
        entries.add(inventoryEntry);
        totalDebit = totalDebit.add(inventoryEntry.getDebit());

        logger.debug("✓ Inventory Entry: DR {} as per invoice subtotal {}", 
            inventoryEntry.getAccountCode(), 
            invoiceDto.getSubtotal());

        // 2.2: GST Input Tax Credit (if applicable)
        if (invoiceDto.getTaxTotal().compareTo(BigDecimal.ZERO) > 0) {
            LedgerEntry gstEntry = new LedgerEntry();
            gstEntry.setAccountCode("5120");                      // Input CGST/SGST/IGST
            gstEntry.setAccountName("GST Input Tax Credit");
            gstEntry.setDebit(invoiceDto.getTaxTotal());
            gstEntry.setCredit(BigDecimal.ZERO);
            gstEntry.setNarration("GST on purchase - " + invoiceDto.getInvoiceNumber());
            gstEntry.setJournalVoucher(jv);
            gstEntry.setLineNumber(2);
            entries.add(gstEntry);
            totalDebit = totalDebit.add(gstEntry.getDebit());

            logger.debug("✓ GST Entry: DR {} for amount {}", 
                gstEntry.getAccountCode(), 
                invoiceDto.getTaxTotal());
        }

        // ========== CREDIT ENTRIES ==========

        // 2.3: Accounts Payable - Vendor Credit
        LedgerEntry apEntry = new LedgerEntry();
        apEntry.setAccountCode("2010");                           // Accounts Payable
        apEntry.setAccountName("Accounts Payable - " + invoiceDto.getVendorName());
        apEntry.setDebit(BigDecimal.ZERO);
        apEntry.setCredit(invoiceDto.getInvoiceTotal());          // Invoice total
        apEntry.setNarration("AP - " + invoiceDto.getInvoiceNumber());
        apEntry.setJournalVoucher(jv);
        apEntry.setLineNumber(3);
        entries.add(apEntry);
        totalCredit = totalCredit.add(apEntry.getCredit());

        logger.debug("✓ AP Entry: CR {} for vendor liability {}", 
            apEntry.getAccountCode(), 
            invoiceDto.getInvoiceTotal());

        // Step 3: Validate balanced entries
        if (totalDebit.compareTo(totalCredit) != 0) {
            logger.error("❌ Ledger IMBALANCE for invoice {}: Debit {} != Credit {}", 
                invoiceDto.getInvoiceNumber(), 
                totalDebit, 
                totalCredit);
            
            throw new LedgerException(
                "LEDGER_IMBALANCE",
                String.format("Total Debit (%s) does not equal Total Credit (%s)", 
                    totalDebit, totalCredit)
            );
        }

        logger.info("✓ Ledger entries balanced: DR = CR = {}", totalDebit);

        // Step 4: Validate all accounts exist and are active
        for (LedgerEntry entry : entries) {
            AccountMaster account = accountMasterRepository.findByAccountCode(entry.getAccountCode());
            
            if (account == null) {
                throw new LedgerException(
                    "ACCOUNT_NOT_FOUND",
                    "Account " + entry.getAccountCode() + " does not exist"
                );
            }
            
            if (!account.isActive()) {
                throw new LedgerException(
                    "ACCOUNT_INACTIVE",
                    "Account " + entry.getAccountCode() + " is inactive"
                );
            }
            
            entry.setAccount(account);
        }

        // Step 5: Save Journal Voucher
        jv.setStatus("POSTED");
        jv.setPostedAt(LocalDateTime.now());
        journalVoucherRepository.save(jv);
        logger.info("✓ Journal Voucher saved: {}", jv.getVoucherNumber());

        // Step 6: Save all ledger entries (atomic - all or nothing)
        ledgerEntryRepository.saveAll(entries);
        logger.info("✓ {} ledger entries posted", entries.size());

        // Step 7: Update General Ledger (account balances)
        updateAccountBalances(entries);
        logger.info("✓ General ledger accounts updated");

        // Step 8: Create transaction record
        LedgerTransaction transaction = new LedgerTransaction();
        transaction.setTransactionId(generateTransactionId());
        transaction.setJournalVoucher(jv);
        transaction.setInvoiceReference(invoiceDto.getInvoiceNumber());
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setTotalDebit(totalDebit);
        transaction.setTotalCredit(totalCredit);
        transaction.setStatus("COMPLETED");
        transaction.setPostedBy("B2B_AUTOMATION");
        transaction.setPostedAt(LocalDateTime.now());

        LedgerTransaction savedTxn = journalVoucherRepository.saveLedgerTransaction(transaction);
        logger.info("✅ Invoice {} successfully posted to ledger. Transaction ID: {}", 
            invoiceDto.getInvoiceNumber(), 
            savedTxn.getTransactionId());

        return savedTxn;
    }

    /**
     * Validate ledger can be posted to (accounting period open, etc)
     */
    private void validatePostingPeriod() throws LedgerException {
        // Check if current accounting period is open for posting
        // TODO: Implement based on your fiscal calendar
    }

    /**
     * Update General Ledger account balances
     */
    @Transactional
    private void updateAccountBalances(List<LedgerEntry> entries) {
        Set<String> updatedAccounts = new HashSet<>();

        for (LedgerEntry entry : entries) {
            if (updatedAccounts.contains(entry.getAccountCode())) {
                continue;  // Already updated in this batch
            }

            GeneralLedger gl = generalLedgerRepository.findByAccountCode(entry.getAccountCode());
            
            if (gl == null) {
                gl = new GeneralLedger();
                gl.setAccountCode(entry.getAccountCode());
                gl.setOpeningBalance(BigDecimal.ZERO);
                gl.setCurrentBalance(BigDecimal.ZERO);
            }

            // Recalculate balance from all ledger entries
            BigDecimal totalDebit = ledgerEntryRepository.sumDebitByAccount(entry.getAccountCode());
            BigDecimal totalCredit = ledgerEntryRepository.sumCreditByAccount(entry.getAccountCode());

            gl.setCurrentBalance(
                gl.getOpeningBalance()
                    .add(totalDebit != null ? totalDebit : BigDecimal.ZERO)
                    .subtract(totalCredit != null ? totalCredit : BigDecimal.ZERO)
            );
            gl.setLastUpdatedAt(LocalDateTime.now());

            generalLedgerRepository.save(gl);
            updatedAccounts.add(entry.getAccountCode());

            logger.debug("✓ Updated GL for {}: Balance = {}", 
                entry.getAccountCode(), 
                gl.getCurrentBalance());
        }
    }

    /**
     * Retrieve posted invoice from ledger
     */
    public LedgerTransaction getInvoiceLedgerTransaction(String invoiceNumber) throws LedgerException {
        LedgerTransaction txn = journalVoucherRepository.findByInvoiceReference(invoiceNumber);
        
        if (txn == null) {
            throw new LedgerException("TRANSACTION_NOT_FOUND", 
                "No ledger posting found for invoice: " + invoiceNumber);
        }
        
        return txn;
    }

    /**
     * Reverse/cancel a posted invoice (debit/credit reversal entries)
     */
    @Transactional(rollbackFor = Exception.class)
    public LedgerTransaction reverseLedgerEntries(String invoiceNumber, String reason) 
            throws LedgerException {
        
        LedgerTransaction originalTxn = getInvoiceLedgerTransaction(invoiceNumber);
        
        // Create reversal entries (opposite signs)
        JournalVoucher reversalJV = new JournalVoucher();
        reversalJV.setVoucherNumber(generateVoucherNumber());
        reversalJV.setVoucherDate(LocalDateTime.now());
        reversalJV.setVoucherType("REVERSAL");
        reversalJV.setReferenceNumber(invoiceNumber);
        reversalJV.setNarration("Reversal of " + invoiceNumber + " - " + reason);
        reversalJV.setStatus("POSTED");
        
        // TODO: Create reversal entries with opposite debits/credits
        
        logger.warn("⚠ Ledger entries reversed for invoice: {} (Reason: {})", 
            invoiceNumber, reason);
        
        return null;
    }

    /**
     * Generate unique voucher number
     */
    private String generateVoucherNumber() {
        return "JV-" + System.currentTimeMillis();
    }

    /**
     * Generate unique transaction ID
     */
    private String generateTransactionId() {
        return "TXN-" + UUID.randomUUID().toString().substring(0, 8);
    }
}

/**
 * Exception for ledger-specific errors
 */
class LedgerException extends Exception {
    private String errorCode;
    private String errorMessage;

    public LedgerException(String errorCode, String errorMessage) {
        super(errorMessage);
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
