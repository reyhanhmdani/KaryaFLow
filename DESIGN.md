# KaryaFlow — Design System Specification (DESIGN.md)

> **Role & Purpose:** Single Source of Truth (SSOT) untuk panduan visual, token warna, tipografi, dan micro-motion interaktif di seluruh halaman dan komponen KaryaFlow.

---

## 1. Design Philosophy: "Warm Atelier & Studio Ledger"

KaryaFlow mengusung estetika **Warm Studio Ledger** (hangat, terstruktur, dan editorial — tidak steril seperti template SaaS putih-abu standar):
* **No AI Slop:** Dilarang menggunakan emoji di UI buttons/headings, gradasi neon ungu/biru, drop shadow pekat (`shadow-2xl`), teks putih di atas tombol kuning, atau 4 kotak kartu identik berulang di setiap halaman.
* **Warm Tonal Depth & Architectural Dividers:** Kedalaman antarmuka dibangun lewat kontras kertas alabaster hangat (`#F6F4EE`), permukaan putih bersih (`#FFFFFF`), sumur pasir hangat (`#EDEAE1`), dan blok fokus obsidian (`#1B1C1E`), dipisahkan oleh garis hairline hangat (`#E2DED3`) dan **Metric Ribbon** terbagi.
* **High Contrast & Tactile Feedback:** Setiap elemen interaktif merespons tindakan user dengan *spring physics* alami (`motion/react`).

---

## 2. Color System: The 60-30-10 Architecture

| Proporsi | Peruntukan | Token CSS / Tailwind | Nilai Hex | Deskripsi & Aturan Penggunaan |
| :--- | :--- | :--- | :--- | :--- |
| **60% (Dominant)** | Canvas & Surface | `--canvas`<br>`--surface`<br>`--surface-subtle` | `#F6F4EE`<br>`#FFFFFF`<br>`#EDEAE1` | Kertas alabaster hangat sebagai kanvas ruang kerja, pure white untuk panel kerja utama, dan sand well untuk elemen inset. |
| **30% (Structure)** | Typography & Borders | `--primary-ink`<br>`--border-hairline` | `#1B1C1E`<br>`#E2DED3` | Obsidian ink hangat untuk judul, teks utama, panel fokus (login showcase, terminal clock), dan garis pemisah 1px. |
| **10% (Accent)** | Primary CTA & Highlights | `--accent`<br>`--accent-hover` | `#F7C331`<br>`#EAB31C` | Sunlit Amber untuk tombol aksi utama (*Clock In*, *Ajukan Cuti*, *Masuk ke workspace*) dan highlight aktif. |

### Aturan Ketat Kontras & Aksesibilitas (WCAG AAA)
* **Tombol Kuning (`#F7C331`):** WAJIB menggunakan teks gelap `text-[#1B1C1E] font-semibold`. Dilarang memakai teks putih di atas amber.
* **Semantic Status Pills:** Latar lembut + ring halus + dot 6px:
  * `PRESENT` / `APPROVED` / `PAID`: `bg-emerald-50 text-emerald-800 ring-emerald-600/20` (dot `bg-emerald-500`)
  * `LATE` / `PENDING` / `DRAFT`: `bg-amber-50 text-amber-800 ring-amber-600/20` (dot `bg-amber-500`)
  * `ABSENT` / `REJECTED`: `bg-rose-50 text-rose-800 ring-rose-600/20` (dot `bg-rose-500`)
  * `ON_LEAVE` / `PROCESSED`: `bg-blue-50 text-blue-800 ring-blue-600/20` (dot `bg-blue-500`)
  * `HR_ADMIN`: `bg-[#1B1C1E] text-[#F7C331] ring-[#1B1C1E]` (dot `bg-[#F7C331]`)
  * `EMPLOYEE`: `bg-[#EDEAE1] text-[#1B1C1E] ring-[#E2DED3]` (dot `bg-[#1B1C1E]`)

---

## 3. Typographic Architecture

KaryaFlow menggunakan tiga keluarga font yang saling melengkapi:

### A. Expressive Display Font: `Bricolage Grotesque` (`--font-display`, class `font-display`)
* Digunakan untuk Brand Mark, Page Titles (`H1` / `H2` dengan `clamp()` responsive scaling & `text-wrap: balance`), dan Card Titles (`H3`). Memberi karakter humanis yang hangat dan tidak kaku.

### B. Readable Interface Font: `Onest` (`--font-sans`)
* Digunakan untuk label, teks tabel, deskripsi (`leading-relaxed`), dan form inputs. Menggantikan font geometris kaku; utamakan **sentence-case** alih-alih ALL-CAPS di setiap label.

### C. Precision Numeric Font: `JetBrains Mono` (`--font-mono`, `.tabular-nums`)
* Eksklusif untuk nilai kuantitatif: nominal Rupiah, jam WIB, jarak meter & koordinat GPS, nomor slip gaji, dan skor KPI.

---

## 4. Strict Banned List (Anti-Patterns)
* Dilarang menggunakan emoji di UI (`👋`, `🏢`, `🏡`, `📡`, `🗺️`) — gunakan ikon `lucide-react`.
* Dilarang menggunakan font `Inter`, `Plus Jakarta Sans`, atau `Times New Roman`.
* Dilarang menggunakan pure black (`#000000`) atau gradasi neon ungu/biru.
* Dilarang mengulang pola 4 kotak stat kartu identik di setiap halaman — gunakan `MetricRibbon` atau komposisi asimetris.
