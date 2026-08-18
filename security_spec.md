# Security Specification & Threat Model

## 1. Data Invariants
- **Public Beat Catalog (`/beats/{beatId}`)**:
  - Anyone (authenticated or unauthenticated) can read and stream beats in the catalog to preview songs, browse genres, and initiate license purchases.
  - Beat creation, modification, and deletion are strictly validated against schema boundaries, preventing malformed types, arbitrary huge strings, and unauthorized schema injection.
  - Updates must preserve core integrity and must satisfy type and string length boundaries.
- **Store Settings (`/settings/{settingId}`)**:
  - Anyone can read active payment options and producer contact details.
  - Updates are restricted and must satisfy strict schema formatting.
- **Purchased Licenses (`/purchases/{purchaseId}`)**:
  - Customers can create a purchase record with order details upon completing checkout.
  - Purchase records cannot be arbitrarily overwritten or deleted to ensure contract immutability.

## 2. The "Dirty Dozen" Payloads (Exploit & Boundary Tests)
1. **Payload 1 (Ghost Field Injection)**: Attempt to inject `isAdmin: true` or `verified: true` into a beat document. *(Denied)*
2. **Payload 2 (ID Poisoning Attack)**: Attempt to write to `/beats/` with a 2KB junk character ID. *(Denied: ID size must be <= 128 and match regex)*
3. **Payload 3 (Denial of Wallet - Extreme String)**: Attempt to set `title` with a 50KB string. *(Denied: title length must be <= 150)*
4. **Payload 4 (Negative BPM)**: Attempt to set `bpm` to `-120`. *(Denied: bpm must be > 0 and <= 350)*
5. **Payload 5 (Malformed Array Types)**: Attempt to supply `tags` with non-string elements. *(Denied: tags must be array with string items)*
6. **Payload 6 (Invalid Genre)**: Attempt to set `genre` to a 500-character arbitrary string. *(Denied: genre size <= 50)*
7. **Payload 7 (Negative Price)**: Attempt to set `tierPrices.basic` to a negative number. *(Denied: prices must be positive numbers)*
8. **Payload 8 (Orphaned Write / Invalid Collection)**: Attempt to write to `/admin_secrets/passwords`. *(Denied: Catch-all deny)*
9. **Payload 9 (Purchase Record Tampering)**: Attempt to delete a completed legal contract in `/purchases/{purchaseId}`. *(Denied: Delete not allowed)*
10. **Payload 10 (Settings Poisoning)**: Attempt to inject executable script tags into `paypalBaseUrl`. *(Denied: size <= 200 and format checks)*
11. **Payload 11 (Corrupted Plays Counter)**: Attempt to set `plays` to a string or negative value. *(Denied: must be number >= 0)*
12. **Payload 12 (Blanket Query Scraping)**: Attempt to perform unbounded malformed batch writes across unindexed collections. *(Denied)*
