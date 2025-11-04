package com.example.demo.repository;

import com.example.demo.entity.PartidaBarco;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PartidaBarcoRepository extends JpaRepository<PartidaBarco, Long> {
    List<PartidaBarco> findByPartidaIdOrderByOrdenAsc(Long partidaId);

    @Query("select pb.barco.id from PartidaBarco pb where pb.partida.id = :partidaId order by pb.orden asc")
    List<Long> findBoatIdsByPartida(@Param("partidaId") Long partidaId);

    @Query("select pb.partida.id from PartidaBarco pb where pb.barco.id = :barcoId")
    Optional<Long> findPartidaIdByBarco(@Param("barcoId") Long barcoId);

    @Modifying
    void deleteByPartidaId(Long partidaId);

    @Modifying
    void deleteByBarcoId(Long barcoId);
}
