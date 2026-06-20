# Warehouse/Inventory Data Model — Real Examples from Satek

This document describes the 4-level product classification hierarchy used in the Satek system, with real data from the PostgreSQL dump (`all_databases_2025-04-17.sql.gz`, database `satek`). The hierarchy goes from broadest category down to a specific inventoried item in a store.

---

## Hierarchy Overview

```
WareType  (e.g. "اقلام آزمایشگاهی" — Laboratory Equipment)
    │
    ├── WareClass  (e.g. "خون شناسی" — Hematology)
    │
    ├── WareGroup  (e.g. "کیت" — Kit)
    │
    └── WareModel  (e.g. "کیت هموگلوبین" — Hemoglobin Kit)
            │
            └── Ware  (e.g. "کیت هموگلوبین زیست شیمی" — ZistShimi brand)
                    │
                    └── Stuff  (100 units of above, priced at 1,352 Toman, at Store X)
```

---

## 1. WareType — Top-Level Category

The broadest classification. A **WareType** groups products by their general domain.

| Column | Example |
|--------|---------|
| `name` | اقلام آزمایشگاهی |
| `enName` | labratory equipments |

**Other types in the system:** تجهیزات و لوازم دندانپزشکی (Dental), مواد غذایی (Food), بهداشت و زیبایی (Beauty), ابزار و ملزومات (Tools), لوازم تحریر و اداری (Stationery), نظافت و شستشو (Cleaning), مادر و کودک (Mother & Child), خوار و بار (Grocery).

**Relations:**
- `WareType` → has many `WareClass` records
- `WareType` → has many `WareGroup` records
- `WareType` → has many `WareModel` records (denormalized)
- `WareType` → has many `Ware` records (denormalized)
- `Store` ↔ `WareType` (M:N via junction table `site_ware_types_ware_type`) — stores declare which ware types they support
- `Guild` ↔ `WareType` (M:N via `guild_ware_types_ware_type`)

---

## 2. WareClass — Second-Level Classification

A **WareClass** is a subcategory within a WareType, representing a scientific or functional domain.

| Column | Example |
|--------|---------|
| `name` | خون شناسی |
| `enName` | hematology |
| `wareTypeId` | → اقلام آزمایشگاهی |

**All classes under "اقلام آزمایشگاهی":**

| Name | enName |
|------|--------|
| خون شناسی | Hematology |
| انعقادی | Coagulation |
| بیوشیمی | Biochemistry |
| سم شناسی | Toxicology |
| بیوشیمی ادرار | Urinary Biochemistry |
| انگل شناسی | Parasitology |
| پاتولوژی و سیتولوژی | Pathology & Cytology |
| میکروب شناسی | Bacteriology |
| هورمون شناسی | Hormoneology |
| سرم شناسی | Serology |

**Relations:**
- `WareClass` → belongs to `WareType`
- `WareClass` ↔ `WareGroup` (M:N via `ClassGroup` join table) — a class can contain multiple groups, and a group can belong to multiple classes
- `WareClass` → has many `WareModel` records (denormalized)
- `WareClass` → has many `Ware` records (denormalized)

---

## 3. WareGroup — Third-Level Classification

A **WareGroup** represents the *form* or *type* of product (e.g., kit, vial, solution), orthogonal to the scientific domain.

| Column | Example |
|--------|---------|
| `name` | کیت |
| `enName` | kit |
| `wareTypeId` | → اقلام آزمایشگاهی |

**All groups under "اقلام آزمایشگاهی":**

| Name | enName | Description |
|------|--------|-------------|
| کیت | Kit | Pre-packaged test kits (reagents + instructions) |
| ویال | Vial | Glass/plastic vials |
| رنگ | Color | Stains and dyes (e.g., Giemsa) |
| لام | Lam | Microscope slides |
| نوار | Tape | Test strips |
| لوله | Tube | Test tubes |
| دیسک | Disk | Discs (e.g., antibiotic discs) |
| لایز | Lyse | Lysis solutions |
| محلول | Solution | Liquid reagents and buffers |
| کنترل | Control | Quality control materials |
| سرم کنترل | Control Serum | Serum-based controls |
| کنترل خون | Blood Control | Blood-based controls |
| اقلام مصرفی | Consumables | General consumables |
| اقلام مصرفی دستگاه | Device Consumables | Machine-specific consumables |
| دیسک آنتی بیوگرام | Anti-biogram Disk | Antibiotic sensitivity discs |
| محیط کشت | Growth Medium | Culture media |

**Relations:**
- `WareGroup` → belongs to `WareType`
- `WareGroup` ↔ `WareClass` (M:N via `ClassGroup` join table)
- `WareGroup` → has many `WareModel` records (denormalized)
- `WareGroup` → has many `Ware` records (denormalized)

---

## 4. ClassGroup — M:N Join Between WareClass and WareGroup

The `ClassGroup` join table allows a **WareClass** to span multiple **WareGroup** types and vice versa. For example, the "Hematology" class can have kits (کیت), solutions (محلول), slides (لام), etc. And the "Kit" group can appear under Hematology, Biochemistry, Coagulation, etc.

| Column | Example |
|--------|---------|
| `wareClassId` | → خون شناسی (Hematology) |
| `wareGroupId` | → کیت (Kit) |

> **Note:** In the satek dataset, the `class_group` table had no rows — the M:N relationships were handled through the WareModel → WareClass + WareGroup direct links instead.

---

## 5. WareModel — Fourth-Level Specific Model

A **WareModel** represents a specific *product model* that combines a class, a group, and a type. It is the description of what the product *is* before adding a manufacturer/brand.

| Column | Example |
|--------|---------|
| `name` | کیت هموگلوبین |
| `enName` | kit hmoglobin |
| `wareTypeId` | → اقلام آزمایشگاهی |
| `wareClassId` | → خون شناسی (Hematology) |
| `wareGroupId` | → کیت (Kit) |

**Example models from the data:**

| Name | Class | Group |
|------|-------|-------|
| کیت هموگلوبین | Hematology | Kit |
| ویال ESR دستگاهی ۱۲۰۰۶/۱ عددی | Hematology | Vial |
| رنگ گیمسا | Hematology | Color/Stain |
| محلول ابزوتون سیسمکس 4 لیتری | Hematology | Solution |
| لایز ۰/۵ لیتری | Hematology | Lyse |
| کیت گروه خونی | Hematology | Kit |
| کیت G6PD | Hematology | Kit |
| کیت PT | Coagulation | Kit |
| کیت PTT | Coagulation | Kit |
| ویال PT و PTT ۱۵۰۰ عددی | Coagulation | Vial |
| محلول کلرور كلسيم | Coagulation | Solution |
| کیت دیازیم-آنزیماتیک A1C | Biochemistry | Kit |
| کیت تروپونین آلفا ۲۵ تستی | Biochemistry | Kit |
| سرم کنترل Biorex A1C | Biochemistry | Control Serum |
| سرم کنترل Trulab N | Biochemistry | Control Serum |

**Relations:**
- `WareModel` → belongs to `WareType`)
- `WareModel` → belongs to `WareClass`
- `WareModel` → belongs to `WareGroup`
- `WareModel` → has many `Ware` records
- `WareModel` → has many `Stuff` records (denormalized)
- `Store` ↔ `WareModel` (via `allowedWareModelIds` text field on Store — CSV of model UUIDs)
- `Unit` ↔ `WareModel` (via `req_allow_ware_model` — units can request allowance of new models)

---

## 6. Ware — Actual Product (Brand + Model + Manufacturer)

A **Ware** is a real product listing in the system — it combines a **WareModel** with a specific **Manufacturer** and **Brand**. This is what buyers search for and purchase.

| Column | Example |
|--------|---------|
| `name` | کیت هموگلوبین زیست شیمی |
| `enName` | kit hmoglobin zist shimi |
| `brand` | زیست شیمی |
| `price` | 2103 (base system price in Tomans) |
| `manufacturername` | زیست شیمی |
| `orderedNumber` | 0 (total times ordered) |
| `irc` | 12345678910 (Iranian Registration Code) |
| `umdns` | NULL (Universal Medical Device Nomenclature) |
| `gtin` | NULL (Global Trade Item Number) |
| `manufacturerId` | → زیست شیمی (ZistShimi) |
| `wareTypeId` | → اقلام آزمایشگاهی |
| `wareClassId` | → خون شناسی (Hematology) |
| `wareGroupId` | → کیت (Kit) |
| `wareModelId` | → کیت هموگلوبین (Hemoglobin Kit) |
| `photoUrl` | NULL |

**Example wares from the data:**

| Product Name | Manufacturer | Price | Model | Class |
|---|---|---|---|---|
| کیت هموگلوبین زیست شیمی | ZistShimi | 2,103 | Hemoglobin Kit | Hematology |
| ویال ESR دستگاهی ۱۲۰۰۶/۱ عددی بیوک | Byuk | 18,894 | ESR Vial 12006/1 | Hematology |
| رنگ گیمسا ارج | Arj | 7,967 | Giemsa Stain | Hematology |
| محلول ابزوتون سیسمکس 4 لیتری من | Man | 26,358 | CELLPACK Solution 4L | Hematology |
| لایز ۰/۵ لیتری من | Man | 12,805 | Lyse 0.5L | Hematology |
| لام نئوبار آینه ای نئوتوم | Neotom | 7,874 | Neubar Slide | Hematology |
| کیت گروه خونی سیناژن | Sinagen | 25,249 | Blood Group Kit | Hematology |
| کیت PT فیشر | Fisher | 7,471 | PT Kit | Coagulation |
| کیت PTT فیشر | Fisher | 16,433 | PTT Kit | Coagulation |
| کیت تروپونین آلفا ۲۵ تستی تویو | Toyo | 23,544 | Troponin Alpha 25-test | Biochemistry |
| سرم کنترل Trulab N پارس آزمون | Pars Azmoon | 28,172 | Control Serum Trulab N | Biochemistry |

**Relations:**
- `Ware` → belongs to `Manufacturer`
- `Ware` → belongs to `WareType` (denormalized)
- `Ware` → belongs to `WareClass` (denormalized)
- `Ware` → belongs to `WareGroup` (denormalized)
- `Ware` → belongs to `WareModel` (denormalized)
- `Ware` → has many `Stuff` records (inventory across stores)
- `Ware` → has many `Order` records
- `Ware` → has many `Offer` records

> **Why denormalized?** The hierarchy fields (wareTypeId through wareModelId) are stored directly on Ware for query efficiency — no joins needed to filter products by category at any level.

---

## 7. Stuff — Store Inventory

A **Stuff** record represents a specific quantity of a **Ware** available at a **Store** with its own pricing, expiration, and tracking info. This is the leaf node — the actual inventoried item.

| Column | Example |
|--------|---------|
| `inventoryNo` | 100 (units) |
| `price` | 1352 (selling price, Tomans) |
| `hasAbsolutePrice` | true |
| `pricePercentage` | NULL |
| `expiration` | 2027-03-25 |
| `barcode` | NULL |
| `qrc` | NULL |
| `isBarcodeSet` | false |
| `isQrcSet` | false |
| `isExpirationNear` | NULL |
| `availableLongPayment` | NULL |
| `wareId` | → کیت هموگلوبین زیست شیمی |
| `storeId` | → دانشگاه آزاد اسلامی (store for the university) |
| `wareTypeId` | → اقلام آزمایشگاهی (denormalized) |
| `wareClassId` | → خون شناسی (denormalized) |
| `wareGroupId` | → کیت (denormalized) |
| `wareModelId` | → کیت هموگلوبین (denormalized) |

**Pricing Logic:**

- `hasAbsolutePrice = true` → `Stuff.price` is used directly as the selling price
- `hasAbsolutePrice = false` → `Stuff.price` = Ware.price, and if `pricePercentage` is set, the actual price = `Ware.price * (1 + pricePercentage / 100)`

**Long Payment Pricing:**
Stuff can define per-month price percentages for installments:

| Column | Description |
|--------|-------------|
| `twoMonthPricePercent` | 2-month installment markup % |
| `threeMonthPricePercent` | 3-month installment markup % |
| ... | up to `twentyFourMonthPricePercent` |

Each month's price = `Ware.price * (1 + percent/100)` (or `Stuff.price` if `isExpirationNear`).

**Example stuff from the data (all at store b157ca64-..., the university store):**

| Ware | Inv# | Price | Abs? | Expiration |
|---|---|---|---|---|
| کیت هموگلوبین زیست شیمی | 100 | 1,352 | true | 2027-03-25 |
| رنگ گیمسا ارج | 100 | 1,863 | true | 2030-03-25 |
| لایز ۰/۵ لیتری من | 100 | 12,805 | false | 2022-03-25 |
| کیت گروه خونی سیناژن | 100 | 1,209 | true | 2027-03-25 |
| کیت PT فیشر | 100 | 7,471 | false | 2023-03-25 |
| کیت PTT فیشر | 100 | 16,433 | false | 2024-03-25 |
| کیت تروپونین آلفا ۲۵ تستی تویو | 100 | 23,544 | false | 2021-03-25 |
| سرم کنترل Trulab N پارس آزمون | 100 | 28,172 | false | 2026-03-25 |

**Relations:**
- `Stuff` → belongs to `Ware`
- `Stuff` → belongs to `Store` (via `storeId`)
- `Stuff` → belongs to `WareType` (denormalized)
- `Stuff` → belongs to `WareClass` (denormalized)
- `Stuff` → belongs to `WareGroup` (denormalized)
- `Stuff` → belongs to `WareModel` (denormalized)
- `Stuff` → has many `Order` records
- `Stuff` → has many `Offer` records

---

## 8. Manufacturer — Product Producer

A **Manufacturer** is the company that produces the ware.

| Column | Example |
|--------|---------|
| `name` | زیست شیمی |
| `enName` | ZistShimi |
| `country` | Iran |

**All manufacturers in the satek database (39 total):**

ZistShimi, Byuk, Arj, Man, Neotom, Labex, STARLAB, Sinagen, Farzaneh Arman, Monobind, Saba kit, Lio, Bahar Afshan, Pastor Anistito, Pastor, Payazist Arayeh, Biorex, Darman kav, Pars Azmoon, Bionic, Hanan Teb Pars, Kimiya Pajuhan, Bahar Afshan (dup), Toyo, Padtan Teb, Kian Kaveh, Rooz Azmoon, Atlas, Mojalleli, Pip, Conda, Bionova, Zist Rouyesh, Merk, Diapro, Fisher, Farzaneh Arman (dup), Pishtaz, Calbiotech, Bioactive, Aria Mabna, Ideal, Monobind (dup), Autobio, Pishgaman Sanjesh, ASKU, Anisan, Glass, Voco test, QC lab, FarazBin, Harir, Meykadeh Qazvin, Meybod, Bionova (dup), Mark Beta, Nexin, Easy Open, Diazym, Vidas, Arian Navid Pishtaz Irani, Supa

---

## 9. Store — Seller Entity

A **Store** represents a seller (organization, university, or unit) in the system. In the satek data, the hierarchy is:

```
دانشگاه آزاد اسلامی (Islamic Azad University) — type: University
  └── واحد تهران مرکزی (Central Tehran Branch) — type: Organization
        ├── واحد رادیولوژی (Radiology Unit) — type: Unit
        ├── واحد سیتی اسکن (CT Scan Unit) — type: Unit
        ├── MRI واحد — type: Unit
        ├── واحد جراحی عمومی (General Surgery) — type: Unit
        ├── واحد چشم (Ophthalmology) — type: Unit
        ├── واحد کودکان و نوزادان (Pediatrics) — type: Unit
        ├── واحد اورولوژی (Urology) — type: Unit
        ├── واحد فک صورت (Maxillofacial) — type: Unit
        ├── واحد جراحی پلاستیک (Plastic Surgery) — type: Unit
        ├── واحد توراکس (Thorax) — type: Unit
        ├── واحد زنان و لاپاروسکوپی (OB/GYN & Laparoscopy) — type: Unit
        ├── واحد درمانگاه قلب (Cardiology Clinic) — type: Unit
        └── ...
```

**Store fields include:** name, address, location, contact, city, state, logo, ceoname, workingHours, delivery settings, status, score, sales stats, storeHead, and extended details (bank info, certificates, legal info).

---

## Summary: Entity Relationships

```
Manufacturer ──< Ware                                        
                  │                                           
                  ├──> WareType (denormalized)                 
                  ├──> WareClass (denormalized)   ──< ClassGroup >── WareGroup
                  ├──> WareGroup (denormalized)                
                  ├──> WareModel (denormalized)                
                  │                                           
                  └──< Stuff ──> Store                         
                         │                                    
                         ├──> WareType (denormalized)          
                         ├──> WareClass (denormalized)         
                         ├──> WareGroup (denormalized)         
                         └──> WareModel (denormalized)         
```

- **WareType, WareClass, WareGroup, WareModel** form a 4-level classification hierarchy.
- **ClassGroup** is the M:N join (unused in this dataset — hierarchy via direct references instead).
- **Ware** is the actual product (WareModel + Manufacturer).
- **Stuff** is the inventory record (Ware + Store + pricing).
- **Store** relates to WareType (supported categories) and WareModel (allowed models).
- All hierarchy IDs are **denormalized** on Ware and Stuff to enable efficient filtering without joins.
