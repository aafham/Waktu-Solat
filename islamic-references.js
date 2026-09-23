/**
 * Brief educational notes, paraphrased from the linked Quran, hadith and
 * Malaysian religious authorities. The Mawlid observance is distinguished
 * from the historically disputed exact birth date.
 */
const bilingual = (ms, en) => ({ ms, en });
const source = (label, url) => ({ label, url });
const verse = (label, path) => source(label, `https://quran.com/${path}`);
const hadith = (label, path) => source(label, `https://sunnah.com/${path}`);
const q = {
  kaaba: verse("Al-Baqarah 2:127", "al-baqarah/127"),
  muhammad: verse("Al-Ahzab 33:40", "al-ahzab/40"),
};
const mondayBirth = hadith("Sahih Muslim 1162e", "muslim:1162e");
const ashuraRescue = hadith("Sahih al-Bukhari 2004", "bukhari:2004");
const mawlidDiscussion = source(
  "Mufti WP · Bayan Linnas 80",
  "https://www.muftiwp.gov.my/en/artikel/bayan-linnas/1048-bayan-linnas-siri-ke-80-hukum-menyambut-maulid-al-rasul",
);
const malaysiaCalendar = source(
  "JAKIM · Tarikh penting Islam",
  "https://www.e-solat.gov.my/index.php?pageId=26&siteId=24",
);

export const MUHAMMAD_REFERENCE = {
  id: "muhammad",
  name: bilingual("Muhammad ﷺ", "Muhammad ﷺ"),
  quran: [q.muhammad],
  birth: bilingual(
    "Hari Isnin disebut dalam Sahih Muslim 1162e. Tarikh hari dan bulan yang tepat diperselisihkan; 12 Rabiulawal ialah tarikh Maulidur Rasul dalam takwim Malaysia.",
    "Monday is stated in Sahih Muslim 1162e. The exact calendar date is disputed; 12 Rabiulawal is Malaysia’s Mawlid observance.",
  ),
  note: bilingual(
    "Al-Quran menyebut baginda sebagai Rasul Allah dan penutup para nabi. Malaysia memperingati Maulidur Rasul pada 12 Rabiulawal; tarikh peringatan ini tidak menghapuskan perbezaan pendapat tentang tarikh lahir sejarah.",
    "The Quran identifies him as Allah’s Messenger and the seal of the prophets. Malaysia observes Mawlid on 12 Rabiulawal; this observance does not resolve the historical disagreement about the exact birth date.",
  ),
  sources: [q.muhammad, mondayBirth, mawlidDiscussion, malaysiaCalendar],
};

const localArafah = source(
  "Mufti WP · Penentuan hari Arafah",
  "https://www.muftiwp.gov.my/ms/artikel/irsyad-hukum/edisi-haji-korban/5329-irsyad-al-fatwa-haji-dan-korban-siri-ke-61-polemik-masyarakat-terhadap-penentuan-hari-wukuf-di-arafah",
);
const tashriq = source(
  "Mufti WP · Puasa hari Tasyriq",
  "https://www.muftiwp.gov.my/en/artikel/irsyad-fatwa/irsyad-fatwa-haji-korban-cat/5937-irsyad-hukum-khas-haji-dan-korban-siri-ke-94-persoalan-tentang-puasa-pada-hari-hari-tasyriq",
);
const pilgrimage = hadith("Sahih Muslim 1218a · Haji Nabi", "muslim:1218a");
function guide(id, ms, en, noteMs, noteEn, sources) {
  return {
    id,
    name: bilingual(ms, en),
    note: bilingual(noteMs, noteEn),
    sources,
  };
}

export const FASTING_REFERENCES = [
  guide(
    "mondayThursday",
    "Isnin & Khamis",
    "Mondays & Thursdays",
    "Puasa sunat mingguan. Tanda ini tidak digunakan pada Aidilfitri, Aidiladha atau hari Tasyriq; Ramadan ditandakan sebagai puasa wajib.",
    "Weekly voluntary fasts. These reminders are omitted on Eid and Tashriq days; Ramadan is marked as obligatory fasting.",
    [hadith("Jami‘ at-Tirmidhi 747 · Hasan", "tirmidhi:747")],
  ),
  guide(
    "whiteDays",
    "Ayyam al-Bid · 13, 14 & 15",
    "White days · 13th, 14th & 15th",
    "Puasa sunat tiga hari pertengahan bulan Hijrah. Pada Zulhijah, 13 haribulan ialah hari Tasyriq dan tidak ditandakan sebagai puasa sunat.",
    "Voluntary fasting on the three middle dates of the Hijri month. The 13th of Dhu al-Hijjah is a Tashriq day and is excluded from fasting reminders.",
    [hadith("Sunan Abi Dawud 2449 · Sahih", "abudawud:2449"), tashriq],
  ),
  guide(
    "sixShawwal",
    "Enam hari Syawal",
    "Six days of Shawwal",
    "Pilih enam hari dalam Syawal selepas 1 Syawal. Boleh dilakukan berasingan; kalendar tidak menetapkan enam tarikh tertentu untuk anda.",
    "Choose six days in Shawwal after Eid on the 1st. They may be separate days; the calendar does not assign six fixed dates.",
    [
      hadith("Sahih Muslim 1164a", "muslim:1164a"),
      source(
        "Mufti WP · Puasa enam Syawal",
        "https://www.muftiwp.gov.my/en/artikel/al-kafi-li-al-fatawi/3502-al-kafi-1298-niat-untuk-puasa-enam-syawal-jika-tiada-open-house",
      ),
    ],
  ),
  guide(
    "arafah",
    "Awal Zulhijah & Arafah",
    "Early Dhu al-Hijjah & Arafah",
    "Puasa sunat pada sembilan hari awal Zulhijah, terutama 9 Zulhijah bagi yang tidak menunaikan haji. Puasa Arafah di Malaysia mengikut tarikh tempatan; jemaah haji mengikuti panduan manasik mereka.",
    "Voluntary fasts during the first nine days of Dhu al-Hijjah, especially the 9th for non-pilgrims. Malaysia’s Arafah fast follows the local date; pilgrims follow their Hajj guidance.",
    [
      hadith("Sahih Muslim 1162a", "muslim:1162a"),
      localArafah,
      source(
        "Mufti WP · Hari puasa sunat",
        "https://www.muftiwp.gov.my/index.php/en/artikel/irsyad-fatwa/irsyad-fatwa-khas-ramadhan-cat/1963-hari-yang-afdhal-puasa-sunat",
      ),
    ],
  ),
  guide(
    "ashura",
    "Tasu‘a & Asyura",
    "Tasu‘a & Ashura",
    "Tasu‘a pada 9 Muharam dan Asyura pada 10 Muharam. Hadis menggalakkan berpuasa hari kesembilan bersama Asyura. Kisah Musa berkaitan penyelamatan, bukan hari lahir.",
    "Tasu‘a is the 9th and Ashura the 10th of Muharram. Hadith encourages fasting the 9th with Ashura. The account of Musa concerns rescue, not a birthday.",
    [hadith("Sahih Muslim 1134a", "muslim:1134a"), ashuraRescue],
  ),
  guide(
    "lastTenRamadan",
    "Sepuluh malam terakhir Ramadan",
    "Last ten nights of Ramadan",
    "Cari Lailatulqadar pada malam-malam ganjil dalam sepuluh malam terakhir. Tiada satu malam dipastikan oleh kalendar ini; malam Hijrah bermula selepas Maghrib sebelumnya.",
    "Seek Laylat al-Qadr on the odd nights of Ramadan’s final ten nights. This calendar does not identify one night as certain; a Hijri night begins after the preceding sunset.",
    [hadith("Sahih al-Bukhari 2017", "bukhari:2017")],
  ),
  guide(
    "noFasting",
    "Aidilfitri, Aidiladha & Tasyriq",
    "Eid & Tashriq days",
    "Jangan lakukan puasa sunat pada 1 Syawal atau 10–13 Zulhijah, walaupun bertembung Isnin, Khamis atau hari putih. Urusan dam haji mempunyai perincian khusus dan perlu dirujuk kepada pembimbing haji.",
    "Do not observe voluntary fasts on 1 Shawwal or 10–13 Dhu al-Hijjah, even when they coincide with Monday, Thursday or a white day. Hajj compensation has specific rulings to discuss with a pilgrimage guide.",
    [
      hadith("Sahih al-Bukhari 1990", "bukhari:1990"),
      hadith("Sahih Muslim 1141a", "muslim:1141a"),
      hadith("Sahih al-Bukhari 1997–1998", "bukhari:1997"),
      tashriq,
    ],
  ),
  guide(
    "nisfuShaaban",
    "Nisfu Syaaban",
    "Mid-Sha‘ban",
    "Malam 15 Syaaban bermula selepas Maghrib pada 14 Syaaban. Sumber Mufti WP membincangkan kelebihan malamnya dan amalan umum; kalendar ini tidak menetapkan puasa khas atau ritual tertentu.",
    "The night of 15 Sha‘ban begins after sunset on the 14th. Mufti WP discusses the night and general worship; this calendar does not prescribe a special fast or fixed ritual.",
    [
      source(
        "Mufti WP · Irsyad al-Hadith 70",
        "https://muftiwp.gov.my/ms/artikel/irsyad-al-hadith/1121-irsyad-al-hadith-siri-ke-70-kelebihan-malam-nisfu-sya-ban",
      ),
      source(
        "Mufti Johor · Takwim Februari 2026",
        "https://mufti.johor.gov.my/webv2/wp-content/uploads/2025/12/TAKWIM-MILADI-2026-5.pdf",
      ),
    ],
  ),
];

export const HAJJ_REFERENCES = [
  guide(
    "localDates",
    "Takwim Malaysia & tarikh haji",
    "Malaysia’s calendar & Hajj dates",
    "Tarikh Masihi dalam kalendar ini mengikut takwim Malaysia. Wukuf dan perjalanan haji sebenar mengikut pengisytiharan Arab Saudi serta arahan Tabung Haji; tarikh Masihinya boleh berbeza.",
    "This calendar’s civil dates follow Malaysia. Actual wuquf and Hajj arrangements follow Saudi Arabia’s declaration and Tabung Haji guidance; their civil dates can differ.",
    [localArafah],
  ),
  guide(
    "tarwiyah",
    "8 Zulhijah · Tarwiyah",
    "8 Dhu al-Hijjah · Tarwiyah",
    "Riwayat Jabir tentang haji Nabi menyebut perjalanan ke Mina pada hari Tarwiyah. Ini ialah penanda manasik haji, bukan tarikh kelahiran seorang nabi.",
    "Jabir’s account of the Prophet’s Hajj describes going to Mina on Tarwiyah. This is a pilgrimage milestone, not a prophet’s birthday.",
    [pilgrimage],
  ),
  guide(
    "wuquf",
    "9 Zulhijah · Wukuf di Arafah",
    "9 Dhu al-Hijjah · Wuquf at Arafah",
    "Wukuf ialah kemuncak manasik pada hari Arafah. Jemaah mengikut tarikh Saudi dan pembimbing haji; penanda 9 Zulhijah Malaysia digunakan untuk rujukan tempatan.",
    "Wuquf is the central Hajj observance on Arafah. Pilgrims follow Saudi dates and their Hajj guide; Malaysia’s 9 Dhu al-Hijjah marker serves local observance.",
    [pilgrimage, localArafah],
  ),
  guide(
    "sacrifice",
    "10 Zulhijah · Aidiladha",
    "10 Dhu al-Hijjah · Eid al-Adha",
    "Hari raya korban dan permulaan waktu korban mengikut syaratnya. Dalam panduan Mufti WP, waktu korban berlanjutan sehingga berakhir 13 Zulhijah.",
    "The festival of sacrifice and the beginning of its prescribed period. Mufti WP explains that the sacrifice period continues until the end of 13 Dhu al-Hijjah.",
    [
      source(
        "Mufti WP · Waktu korban",
        "https://www.muftiwp.gov.my/en/artikel/irsyad-fatwa/irsyad-fatwa-haji-korban-cat/1065-irsyad-al-fatwa-haji-dan-korban-siri-15-waktu-terbaik-melakukan-korban?templateStyle=17",
      ),
    ],
  ),
  guide(
    "tashriq",
    "11–13 Zulhijah · Tasyriq",
    "11–13 Dhu al-Hijjah · Tashriq",
    "Hari-hari mengingati Allah, makan dan minum. Pelaksanaan manasik bagi jemaah mengikut panduan haji; hari-hari ini tidak ditandakan sebagai puasa sunat.",
    "Days for remembering Allah, eating and drinking. Pilgrims follow their Hajj guidance for the rites; these days are excluded from voluntary fasting reminders.",
    [tashriq, hadith("Sahih Muslim 1141a", "muslim:1141a")],
  ),
  guide(
    "ibrahimIsmail",
    "Ibrahim, Ismail & Kaabah",
    "Ibrahim, Ismail & the Kaaba",
    "Al-Baqarah mengaitkan Ibrahim dan Ismail dengan asas Kaabah. As-Saffat menceritakan ujian pengorbanan Ibrahim. Ayat-ayat ini tidak memberikan tarikh tahunan kelahiran atau peristiwa tersebut.",
    "Al-Baqarah connects Ibrahim and Ismail with the Kaaba’s foundations. As-Saffat recounts Ibrahim’s test of sacrifice. These verses supply no annual birthday or dated anniversary for those events.",
    [q.kaaba, verse("As-Saffat 37:102–107", "as-saffat/102")],
  ),
];
