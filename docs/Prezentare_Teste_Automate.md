# AFSMS v1.0 — Teste Automate SW
## Prezentare Proiect — Testare Software

---

# Slide 1: Titlu

**Sistem Informatic pentru Managementul Automat al Studenților Facultății (AFSMS)**

Testare Software — Teste Automate

- Echipa: Sugubete Andrei, Maximilian Andrei, Mitrache Marian Nicușor
- Universitatea din Craiova — Facultatea ACE
- Data: Mai 2026

---

# Slide 2: Arhitectura Proiectului

```
┌──────────────────────┐     ┌──────────────────────┐
│    Frontend (React)   │────▶│   Backend (Express)   │
│    Vite + Tailwind    │     │     Node.js v22+      │
│    React Router       │     │     JWT Auth          │
└──────────────────────┘     └──────────┬───────────┘
                                        │
                              ┌─────────▼──────────┐
                              │   PostgreSQL RDBMS   │
                              │   + Audit Logging    │
                              └──────────────────────┘
```

**Stack tehnologic:**
- **Frontend:** React 19, Vite 7, Tailwind CSS 4, React Router 7
- **Backend:** Express 5, Node.js, JWT, Multer, PapaParse, XLSX, xml2js
- **Baza de date:** PostgreSQL cu suport tranzacțional complet
- **Email:** Nodemailer (Mock/SMTP/Microsoft Graph API)

---

# Slide 3: Framework de Testare

**Jest** — Framework-ul dedicat pentru JavaScript/Node.js

- ✅ Inclus nativ în ecosistemul Node.js
- ✅ Suport complet pentru mock-uri (jest.mock, jest.fn)
- ✅ Rulare paralelă a testelor
- ✅ Raportare coverage integrată
- ✅ Zero dependință de baza de date (toate testele mockuite)

**Comandă de rulare:**
```bash
cd backend && npm test -- --verbose --coverage
```

---

# Slide 4: Structura Fișierelor de Test

| # | Fișier | Teste | Modul SRS Acoperit |
|---|--------|-------|--------------------|
| 1 | `tests/core.test.js` | 8 | Audit Service + Auth Middleware |
| 2 | `src/services/__tests__/auditService.test.js` | 7 | Audit Service (CRUD) |
| 3 | `tests/errorHandler.test.js` | 6 | Validare & Error Handling |
| 4 | `tests/importService.test.js` | 3 | Import Date Academice |
| 5 | `tests/backupService.test.js` | 3 | Backup & Recovery |
| 6 | `tests/constants.test.js` | 4 | Cerințe Non-Funcționale |
| 7 | `tests/emailService.test.js` | 4 | Integrare Email/Outlook |
| | **TOTAL** | **35** | **7 module SRS** |

---

# Slide 5: Teste — Audit Service (REQ-AFSMS-51 → 57)

**Ce se testează:** Serviciul de audit logging — nucleul pentru trasabilitate și rollback

| Test | Cerință SRS | Rezultat |
|------|-------------|----------|
| `auditableInsert` — inserare + log | REQ-AFSMS-51, 52, 53 | ✅ PASS |
| `auditableUpdate` — snapshot before/after | REQ-AFSMS-54 | ✅ PASS |
| `auditableUpdate` — entitate inexistentă → 404 | REQ-AFSMS-54 | ✅ PASS |
| `auditableDelete` — ștergere + log stare anterioară | REQ-AFSMS-51, 52 | ✅ PASS |
| `auditableDelete` — entitate inexistentă → eroare | REQ-AFSMS-54 | ✅ PASS |
| `logAudit` — inserare corectă în AUDIT_LOG_ENTRY | REQ-AFSMS-51 | ✅ PASS |

**Tehnica de testare:** Mock DB cu `jest.mock` — verificare SQL queries + parametri

---

# Slide 6: Teste — Auth Middleware (REQ-AFSMS-11 → 15)

**Ce se testează:** Autentificare SSO + Autorizare bazată pe rol (RBAC)

| Test | Cerință SRS | Rezultat |
|------|-------------|----------|
| `requireAuth` — fără header → 401 | REQ-AFSMS-13 | ✅ PASS |
| `requireAuth` — format invalid → 401 | REQ-AFSMS-13 | ✅ PASS |
| `requireAuth` — token valid → next() + user setat | REQ-AFSMS-11 | ✅ PASS |
| `requireAuth` — token expirat/invalid → 403 | REQ-AFSMS-12 | ✅ PASS |
| `requireRole` — rol neautorizat → 403 + access denied | REQ-AFSMS-15 | ✅ PASS |
| `requireRole` — rol autorizat → next() | REQ-AFSMS-14 | ✅ PASS |

**Tehnica de testare:** JWT real generat cu `jsonwebtoken.sign()` pentru test pozitiv

---

# Slide 7: Teste — Error Handler (REQ-AFSMS-47 → 50)

**Ce se testează:** Mapare erori PostgreSQL → mesaje user-friendly + sugestii de rezoluție

| Test | Cod PG | HTTP Status | Sugestie |
|------|--------|-------------|----------|
| unique_violation | 23505 | 409 Conflict | „Verifică nr. matricol/email" |
| foreign_key_violation | 23503 | 400 Bad Request | „Entitatea selectată e încă activă?" |
| check_violation | 23514 | 400 Bad Request | „Notele între 1 și 10" |
| not_null_violation | 23502 | 400 Bad Request | „Completează câmpurile obligatorii" |
| Custom app error (404) | — | 404 Not Found | Mesaj personalizat |
| Unknown error | — | 500 Internal Server Error | „Contactează administratorul" |

**Cerință SRS:** REQ-AFSMS-49 — „Sugestii de rezoluție pentru erori frecvente"

---

# Slide 8: Teste — Import Service (REQ-AFSMS-18, 22)

**Ce se testează:** Import bulk studenți din fișiere Excel/CSV/Text

| Test | Scenariu | Rezultat |
|------|----------|----------|
| Import valid — 2 studenți | `imported: 2, rejected: 0` | ✅ PASS |
| Câmpuri lipsă (nume/email gol) | `rejected: 3` + mesaje eroare | ✅ PASS |
| Nr. matricol duplicat (ON CONFLICT) | `rejected: 1` + „already exists" | ✅ PASS |

**Tehnica:** Mock `db.pool.connect()` → mock client cu BEGIN/INSERT/COMMIT

---

# Slide 9: Teste — Backup Service (REQ-AFSMS-56)

**Ce se testează:** Sistem de backup offline pentru recovery

| Test | Ce verifică | Rezultat |
|------|-------------|----------|
| Tabele critice acoperite | `student, grade, discipline, curriculum, user_account, audit_log_entry, role` ∈ TABLES_TO_BACKUP | ✅ PASS |
| Export JSON complet | Fișier scris cu `version`, `timestamp`, `data` | ✅ PASS |
| Înregistrare BACKUP_JOB | INSERT în tabel cu tip + locație | ✅ PASS |

**Cerință SRS:** NFR-AFSMS-SAFE-04 — „Backup offline pentru recovery după eșecuri"

---

# Slide 10: Teste — Constante NFR (NFR-AFSMS-PERF)

**Ce se testează:** Conformitatea configurației cu cerințele non-funcționale din SRS

| Test | Cerință | Valoare | Rezultat |
|------|---------|---------|----------|
| MAX_SIMULTANEOUS_USERS ≥ 200 | NFR-PERF-05 | 200 | ✅ PASS |
| MAX_REPORT_LOAD_TIME_MS ≤ 3000ms | NFR-PERF-09 | 3000 | ✅ PASS |
| DATA_RETENTION_YEARS_AUDIT = 5 | Secțiunea 6.1 | 5 | ✅ PASS |
| MIN_TEST_COVERAGE_PERCENT ≥ 80% | CODE-10 | 80 | ✅ PASS |

**De ce contează:** Aceste constante sunt folosite în scheduler, backup policy, și raportare.

---

# Slide 11: Teste — Email Service (REQ-AFSMS-44, 45)

**Ce se testează:** Factory pattern pentru selectarea providerului de email

| Test | EMAIL_PROVIDER | Provider Selectat | Rezultat |
|------|----------------|-------------------|----------|
| Default (nesetat) | — | Mock (Ethereal) | ✅ PASS |
| `graph` | graph | Microsoft Graph API | ✅ PASS |
| `smtp` | smtp | SMTP/Nodemailer | ✅ PASS |
| sendBulk funcțional | — | Mock + sendBulk() | ✅ PASS |

**Cerința SRS:** REQ-AFSMS-45 — „Integrare cu Microsoft Outlook"
**Cerința SRS:** REQ-AFSMS-44 — „Trimitere email la toți membrii unui grup"

---

# Slide 12: Rezultate Execuție

```
Test Suites: 7 passed, 7 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        1.084 s
```

**Screenshot:** (inserați aici screenshot-ul de la `npm test -- --verbose`)

Toate cele **35 teste** trec cu succes în **~1 secundă**, fără dependință de baza de date.

---

# Slide 13: Mapare Teste → Cerințe SRS

| Modul SRS | Cerințe Acoperite | # Teste |
|-----------|-------------------|---------|
| Audit Logging & Recovery | REQ-51, 52, 53, 54, 56 | 15 |
| Autentificare & Autorizare | REQ-11, 12, 13, 14, 15 | 6 |
| Validare & Error Handling | REQ-47, 48, 49, 50 | 6 |
| Import Date Academice | REQ-18, 19, 22 | 3 |
| Performanță (NFR) | NFR-PERF-05, 09 | 4 |
| Email / Grupuri | REQ-44, 45 | 4 |
| **Total** | **~20 cerințe SRS** | **35 teste** |

---

# Slide 14: Concluzii

✅ **35 teste automate** (depășind minimul de 15)

✅ **7 module SRS acoperite** — nu doar audit, ci și auth, import, backup, email, validare, NFR

✅ **Framework Jest** — dedicat JavaScript, zero configurare suplimentară

✅ **Zero dependință de DB** — toate testele folosesc mock-uri Jest

✅ **Execuție rapidă** — ~1 secundă pentru toate testele

✅ **Mapare directă** pe cerințele funcționale și non-funcționale din SRS v1.0

---

# Slide 15: Întrebări?

**Repository:** (link GitHub)

**Comandă de rulare:**
```bash
cd backend && npm test -- --verbose --coverage
```

Mulțumim!
