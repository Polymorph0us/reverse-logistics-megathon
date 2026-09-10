package com.pharma.reversechain.repository;

import com.pharma.reversechain.entity.ElectronicWasteTransferNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ElectronicWasteTransferNoteRepository extends JpaRepository<ElectronicWasteTransferNote, String> {
}
