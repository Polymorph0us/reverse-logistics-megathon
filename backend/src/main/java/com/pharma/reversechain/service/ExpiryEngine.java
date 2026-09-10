package com.pharma.reversechain.service;

import com.pharma.reversechain.entity.MedicinePassport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class ExpiryEngine {

    @Value("${app.expiry.threshold.days:30}")
    private int expiringSoonThresholdDays;

    /**
     * Determines the display status for accessibility-first responses based on expiry and generic status.
     */
    public String calculateDisplayStatus(MedicinePassport passport) {
        if ("DESTROYED".equals(passport.getStatus()) || "INVALID".equals(passport.getStatus())) {
            return "Destroyed";
        }
        
        LocalDate today = LocalDate.now();
        if (passport.getExpiryDate() != null) {
            long daysUntilExpiry = ChronoUnit.DAYS.between(today, passport.getExpiryDate());
            if (daysUntilExpiry < 0) {
                return "Expired";
            } else if (daysUntilExpiry <= expiringSoonThresholdDays) {
                return "Expiring Soon";
            }
        }
        return mapToReadableStatus(passport.getStatus());
    }

    /**
     * Calculates an accessibility-friendly message regarding the expiry logic.
     */
    public String calculateExpiryMessage(MedicinePassport passport) {
        if (passport.getExpiryDate() == null) {
            return "No expiry date recorded.";
        }
        
        LocalDate today = LocalDate.now();
        long daysUntilExpiry = ChronoUnit.DAYS.between(today, passport.getExpiryDate());

        if (daysUntilExpiry < 0) {
            return passport.getCurrentQuantity() + " units expired " + Math.abs(daysUntilExpiry) + " days ago.";
        } else if (daysUntilExpiry <= expiringSoonThresholdDays) {
            return passport.getCurrentQuantity() + " units expire in " + daysUntilExpiry + " days.";
        }
        
        return passport.getCurrentQuantity() + " units are valid.";
    }

    private String mapToReadableStatus(String status) {
        if (status == null) return "Unknown";
        switch (status) {
            case "IN_TRANSIT": return "In Transit";
            case "AT_RETAILER": return "At Pharmacy/Retailer";
            case "RETURNED": return "Return Requested";
            case "AT_DISTRIBUTOR": return "At Distributor";
            case "CONSOLIDATED": return "Consolidated in Master Consignment";
            case "AT_MANUFACTURER": return "At Manufacturer";
            case "SCHEDULED_FOR_DISPOSAL": return "Scheduled For Disposal";
            default:
                // format snake case or camel case to title case
                String lower = status.replace("_", " ").toLowerCase();
                String[] words = lower.split(" ");
                StringBuilder sb = new StringBuilder();
                for (String w : words) {
                    if (w.length() > 0) {
                        sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1)).append(" ");
                    }
                }
                return sb.toString().trim();
        }
    }
}
