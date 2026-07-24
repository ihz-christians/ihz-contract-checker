package de.ihrezuhauseberatung.contractchecker.repositories;

import de.ihrezuhauseberatung.contractchecker.models.LegalAction;
import de.ihrezuhauseberatung.contractchecker.models.LegalActionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LegalActionRepository extends JpaRepository<LegalAction, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM LegalAction l WHERE l.status = :status ORDER BY l.createdAt ASC LIMIT 10")
    List<LegalAction> findTop10ByStatusWithLock(@Param("status") LegalActionStatus status);

    List<LegalAction> findByContractIdOrderByCreatedAtDesc(UUID contractId);
}
