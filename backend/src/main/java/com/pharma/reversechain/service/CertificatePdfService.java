package com.pharma.reversechain.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.pharma.reversechain.entity.Batch;
import com.pharma.reversechain.entity.Organization;
import com.pharma.reversechain.entity.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CertificatePdfService {

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public InputStream generateCertificatePdf(
            UUID certificateId,
            Batch batch,
            Product product,
            Organization manufacturer,
            Organization wasteFacility,
            Integer quantityDestroyed,
            LocalDateTime destructionDate,
            String destructionMethod,
            String facilityLicense
    ) throws Exception {
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        
        try {
            PdfWriter.getInstance(document, outputStream);
            document.open();

            // Title
            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD);
            Paragraph title = new Paragraph("PHARMACEUTICAL DESTRUCTION CERTIFICATE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Certificate ID
            Font headerFont = new Font(Font.HELVETICA, 12, Font.BOLD);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL);
            
            Paragraph certId = new Paragraph("Certificate ID: " + certificateId.toString(), normalFont);
            certId.setAlignment(Element.ALIGN_CENTER);
            certId.setSpacingAfter(15);
            document.add(certId);

            // Horizontal line
            document.add(new Paragraph("___________________________________________________________________________"));
            document.add(Chunk.NEWLINE);

            // Batch Information Section
            document.add(new Paragraph("BATCH INFORMATION", headerFont));
            document.add(new Paragraph("Batch Number: " + batch.getBatchNumber(), normalFont));
            document.add(new Paragraph("Product: " + product.getProductName(), normalFont));
            document.add(new Paragraph("Manufacturer: " + manufacturer.getName(), normalFont));
            document.add(new Paragraph("Manufacturing Date: " + batch.getManufacturingDate().toString(), normalFont));
            document.add(new Paragraph("Expiry Date: " + batch.getExpiryDate().toString(), normalFont));
            document.add(Chunk.NEWLINE);

            // Destruction Information Section
            document.add(new Paragraph("DESTRUCTION DETAILS", headerFont));
            document.add(new Paragraph("Quantity Destroyed: " + quantityDestroyed + " " + (batch.getUnit() != null ? batch.getUnit() : "units"), normalFont));
            document.add(new Paragraph("Destruction Date: " + destructionDate.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME), normalFont));
            document.add(new Paragraph("Destruction Method: " + (destructionMethod != null ? destructionMethod : "Standard pharmaceutical waste disposal"), normalFont));
            document.add(Chunk.NEWLINE);

            // Facility Information Section
            document.add(new Paragraph("WASTE DISPOSAL FACILITY", headerFont));
            document.add(new Paragraph("Facility Name: " + wasteFacility.getName(), normalFont));
            document.add(new Paragraph("Facility License: " + (facilityLicense != null ? facilityLicense : "N/A"), normalFont));
            document.add(Chunk.NEWLINE);

            // Verification Section
            document.add(new Paragraph("VERIFICATION", headerFont));
            String verificationUrl = baseUrl + "/api/certificates/verify/" + certificateId.toString();
            document.add(new Paragraph("Verification URL: " + verificationUrl, normalFont));
            document.add(new Paragraph("Scan the QR code below to verify this certificate online:", normalFont));
            document.add(Chunk.NEWLINE);

            // Generate and add QR code
            BufferedImage qrImage = generateQRCode(verificationUrl, 200, 200);
            ByteArrayOutputStream qrOutputStream = new ByteArrayOutputStream();
            ImageIO.write(qrImage, "PNG", qrOutputStream);
            Image qrCodeImage = Image.getInstance(qrOutputStream.toByteArray());
            qrCodeImage.setAlignment(Element.ALIGN_CENTER);
            qrCodeImage.scaleToFit(150, 150);
            document.add(qrCodeImage);

            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            // Footer
            Font footerFont = new Font(Font.HELVETICA, 8, Font.ITALIC);
            Paragraph footer = new Paragraph(
                "This certificate is issued as proof of pharmaceutical product destruction and is recorded on a blockchain ledger for permanent verification. " +
                "Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                footerFont
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            log.info("Generated certificate PDF for certificateId: {}", certificateId);
            
            return new ByteArrayInputStream(outputStream.toByteArray());
            
        } catch (Exception e) {
            log.error("Error generating certificate PDF: {}", e.getMessage(), e);
            throw e;
        }
    }

    private BufferedImage generateQRCode(String data, int width, int height) throws Exception {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        
        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, width, height, hints);
        return MatrixToImageWriter.toBufferedImage(bitMatrix);
    }
}
