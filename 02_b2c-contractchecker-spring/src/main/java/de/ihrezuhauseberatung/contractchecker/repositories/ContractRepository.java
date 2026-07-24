package de.ihrezuhauseberatung.contractchecker.repositories;

import de.ihrezuhauseberatung.contractchecker.models.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {
    List<Contract> findByUserId(UUID userId);
}
