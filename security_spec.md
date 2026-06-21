# Secure Security Specifications for Property Management System (PMS Pro)

## 0. INTRODUCTION
This spec details the strict identity boundaries and data structures of **PMS Pro**, a enterprise scale property management SaaS system. Role configurations are absolute, and operations are validated through Attribute-Based Access Control (ABAC).

## 1. DATA INVARIANTS
1. **Identitas Multi-Role:** Setiap user terdaftar di Firestore `/users/{uid}` dengan salah satu role dari: `Super Admin`, `Owner`, `Manager`, `Receptionist`, `Finance`, `Marketing/Sales`, `Staff Maintenance`, atau `Tenant/Penyewa`.
2. **Kamar (Units) Dependency:** Kamar tidak bisa dibuat tanpa memiliki relasi properti utama yang valid `/properties/{id}`.
3. **Masa Sewa & Durasi:** Pengajuan reservasi dan kontrak wajib melampirkan check-in/check-out atau tanggal mulai/selesai sewa yang valid secara temporal (CheckOut > CheckIn).
4. **Verifikasi Keuangan:** Pembayaran log `/payments/{id}` terikat langsung ke invoice `/invoices/{id}`.
5. **Kebersihan & Pelaporan:** Tiket perbaikan (maintenance) wajib memiliki prioritas (`Low`, `Medium`, `High`, `Critical`) dan default status saat awal dibuat berupa `Open`.

## 2. THE DIRTY DOZEN PAYLOADS (Vulnerabilities Blocked)
1. **Payload 1: Identity Spoofing (Owner hijack)** - Mencoba menset `ownerId` pada property baru dengan UID milik user berbeda.
2. **Payload 2: Role Escalation (Self-promotion)** - Mencoba mengupdate field `role` miliknya sendiri dari `Tenant/Penyewa` menjadi `Super Admin`.
3. **Payload 3: Negative Price (Financial Poisoning)** - Menyisipkan harga sewa kamar bernilai negatif atau nilai yang absurd (misal Rp -5.000.000 atau Rp 2Milyar per hari).
4. **Payload 4: Shadow Fields Insertion** - Menambahkan field tambahan seperti `isSystemVerified: true` pada model Unit.
5. **Payload 5: Unauthorized Invoice Status Override** - Penyewa mencoba merubah status invoice `/invoices/{id}` miliknya dari `Unpaid` menjadi `Paid` tanpa referensi objek pembayaran (Payment).
6. **Payload 6: Temporal Cross-over** - Reservasi dengan tanggal check-out mendahului tanggal check-in.
7. **Payload 7: Invalid Character Injection (ID Poisoning)** - Membuat ID properti dengan karakter liar untuk merusak parsing routing database.
8. **Payload 8: PII Leak Attempt** - Tenant mampir melihat data profile detail KTP penyewa lain.
9. **Payload 9: Orphan Write Contract** - Kontrak ditransaksikan tanpa validitas properti / kamar.
10. **Payload 10: Infinite List Flooding** - Mencoba melampirkan array fasilitas kamar dengan item tak terbatas (> 50 item) untuk melambungkan tagihan Firebase (Denial of Wallet).
11. **Payload 11: System Field Tampering** - User mencoba merubah analytical logs di `/reports` yang bernilai historis.
12. **Payload 12: Housekeeping Checklist Hijack** - Petugas Maintenance mengubah status unit menjadi `Cleaning` padahal role statusnya dibatasi.

## 3. FIRESTORE RULES IMPLEMENTATION (POLICIES)
These guidelines prevent unauthorized writes, self-promotions, and coordinate direct ID validation checks securely.
