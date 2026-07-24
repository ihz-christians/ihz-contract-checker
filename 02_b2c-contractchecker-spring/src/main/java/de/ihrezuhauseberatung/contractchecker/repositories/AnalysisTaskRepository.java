package de.ihrezuhauseberatung.contractchecker.repositories;

import de.ihrezuhauseberatung.contractchecker.models.AnalysisTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnalysisTaskRepository extends JpaRepository<AnalysisTask, UUID> {
    Optional<AnalysisTask> findByContractId(UUID contractId);
}
