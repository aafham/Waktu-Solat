/**
 * Month starts transcribed from the JAKIM tables published by Mufti Wilayah
 * Persekutuan, visually checked on 2026-09-23. Only the printed civil dates
 * (2025-01-01 through 2026-12-31) are labelled official by the engine.
 * These are Malaysia's published calendar dates, not an astronomical model or
 * a claim that every moon-sighting-dependent observance has been proclaimed.
 */
export const CALENDAR_SOURCES = Object.freeze({
  2025: Object.freeze({
    type: "official",
    label: "JAKIM — Takwim Malaysia 2025",
    url: "https://www.muftiwp.gov.my/images/falak/takwim/tarikh_penting/Takwim_2025M_1446-1447H.pdf",
  }),
  2026: Object.freeze({
    type: "official",
    label: "JAKIM — Takwim Malaysia 2026",
    url: "https://www.muftiwp.gov.my/images/falak/takwim/tarikh_penting/Takwim_Hijri_Miladi_2026.pdf",
  }),
});

export const OFFICIAL_MONTH_STARTS = Object.freeze(
  [
    [1446, 7, "2025-01-01"],
    [1446, 8, "2025-01-31"],
    [1446, 9, "2025-03-02"],
    [1446, 10, "2025-03-31"],
    [1446, 11, "2025-04-29"],
    [1446, 12, "2025-05-29"],
    [1447, 1, "2025-06-27"],
    [1447, 2, "2025-07-26"],
    [1447, 3, "2025-08-25"],
    [1447, 4, "2025-09-23"],
    [1447, 5, "2025-10-23"],
    [1447, 6, "2025-11-22"],
    [1447, 7, "2025-12-22"],
    [1447, 8, "2026-01-20"],
    [1447, 9, "2026-02-19"],
    [1447, 10, "2026-03-21"],
    [1447, 11, "2026-04-19"],
    [1447, 12, "2026-05-18"],
    [1448, 1, "2026-06-17"],
    [1448, 2, "2026-07-16"],
    [1448, 3, "2026-08-14"],
    [1448, 4, "2026-09-13"],
    [1448, 5, "2026-10-12"],
    [1448, 6, "2026-11-11"],
    [1448, 7, "2026-12-11"],
  ].map(Object.freeze),
);

export const IMPORTANT_DATES_SOURCE = Object.freeze({
  label: "JAKIM — Tarikh Penting Islam 2026",
  url: "https://www.muftiwp.gov.my/images/falak/takwim/tarikh_penting/TARIKH_Penting_Islam_2026.pdf",
});

// The 19 March proclamation confirms the calendar's Eid date for Malaysia.
export const DECLARED_DATES = Object.freeze({
  "eidFitr:1447": Object.freeze({
    date: "2026-03-21",
    source: Object.freeze({
      type: "official",
      label: "Penyimpan Mohor Besar Raja-Raja — 19 Mac 2026",
      url: "https://dmedia.penerangan.gov.my/upload/sm/19032026.1309983745.pdf",
    }),
  }),
});
