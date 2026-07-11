# ════════════════════════════════════════════════════════════════
# LesanSatek Backend - Full E2E Test Suite
# ════════════════════════════════════════════════════════════════
#
# Test order:
#   Phase 1 - Setup: tempUser, login, Organization, Unit, State, City
#   Phase 2 - Product hierarchy: WareType, WareClass, WareGroup, WareModel, Manufacturer, Ware
#   Phase 3 - Store & Stuff
#   Phase 4 - Process: Create, steps, activate
#   Phase 5 - Budget: FiscalYear, BudgetLine, BudgetAllocation
#   Phase 6 - Purchasing Flow: PR submit → decision chain → Tender → GoodsReceipt → Payment
#   Phase 7 - Inventory: add, adjust, transfer, consumption
#   Phase 8 - Cleanup: removes
#
# Run: hurl --test --variables-file vars.env e2e.hurl
# ════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════
# PHASE 1: SETUP
# ═══════════════════════════════════════════════

# ─── Create temp/ghost user ───
POST {{serverAddress}}/user/tempUser
{
    "details": {
        "set": {
            "first_name": "Admin",
            "last_name": "System",
            "email": "admin@lesansatek.com",
            "password": "password123",
            "mobile": "09120000000",
            "gender": "Male"
        },
        "get": {
            "_id": 1,
            "email": 1,
            "mobile": 1
        }
    }
}

HTTP 200
[Captures]
ghostId: jsonpath "$['body'][0]['_id']"
ghostEmail: jsonpath "$['body'][0]['email']"

# ─── Login ───
POST {{serverAddress}}/user/login
{
    "details": {
        "set": {
            "email": "admin@lesansatek.com",
            "password": "password123"
        },
        "get": {
            "token": 1,
            "user": {
                "_id": 1,
                "email": 1,
                "roles": 1
            }
        }
    }
}

HTTP 200
[Captures]
token: jsonpath "$['body']['token']"
userId: jsonpath "$['body']['user']['_id']"
roleId: jsonpath "$['body']['user']['roles'][0]['roleId']"

# ─── Create State ───
POST {{serverAddress}}/state/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "تهران",
            "enName": "Tehran"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
stateId: jsonpath "$['body'][0]['_id']"

# ─── Create City ───
POST {{serverAddress}}/city/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "تهران",
            "enName": "Tehran",
            "stateId": "{{stateId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
cityId: jsonpath "$['body'][0]['_id']"

# ─── Create Organization ───
POST {{serverAddress}}/organization/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "سازمان نمونه",
            "enName": "Sample Organization",
            "description": "Test organization for E2E",
            "state": "{{stateId}}",
            "city": "{{cityId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
orgId: jsonpath "$['body'][0]['_id']"

# ─── Update User: set organization ───
POST {{serverAddress}}/user/updateUserRelations
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{userId}}",
            "organization": "{{orgId}}"
        },
        "get": {
            "_id": 1
        }
    }
}

HTTP 200

# ─── Create Unit ───
POST {{serverAddress}}/unit/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "واحد خرید",
            "enName": "Procurement Unit",
            "description": "Main purchasing unit",
            "type": "General",
            "organizationId": "{{orgId}}",
            "headId": "{{userId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
unitId: jsonpath "$['body'][0]['_id']"

# ─── Create Warehouse Unit ───
POST {{serverAddress}}/unit/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "انبار مرکزی",
            "enName": "Central Warehouse",
            "description": "Main warehouse",
            "type": "Warehouse",
            "organizationId": "{{orgId}}",
            "warehouseCapacity": 5000,
            "hasColdStorage": true,
            "headId": "{{userId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
warehouseUnitId: jsonpath "$['body'][0]['_id']"

# ─── Create Finance Unit ───
POST {{serverAddress}}/unit/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "واحد مالی",
            "enName": "Finance Unit",
            "description": "Financial management unit",
            "type": "Administration",
            "organizationId": "{{orgId}}",
            "headId": "{{userId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
financeUnitId: jsonpath "$['body'][0]['_id']"

# ═══════════════════════════════════════════════
# PHASE 2: PRODUCT HIERARCHY
# ═══════════════════════════════════════════════

# ─── Manufacturer ───
POST {{serverAddress}}/manufacturer/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "تولیدکننده نمونه",
            "enName": "Sample Manufacturer",
            "country": "Iran"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
mfrId: jsonpath "$['body'][0]['_id']"

# ─── WareType ───
POST {{serverAddress}}/wareType/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "تجهیزات آزمایشگاهی",
            "enName": "Laboratory Equipment"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
wareTypeId: jsonpath "$['body'][0]['_id']"

# ─── WareClass ───
POST {{serverAddress}}/wareClass/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "هماتولوژی",
            "enName": "Hematology",
            "wareTypeId": "{{wareTypeId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
wareClassId: jsonpath "$['body'][0]['_id']"

# ─── WareGroup ───
POST {{serverAddress}}/wareGroup/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "کیت",
            "enName": "Kit",
            "wareTypeId": "{{wareTypeId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
wareGroupId: jsonpath "$['body'][0]['_id']"

# ─── Link WareGroup to WareClass (M:N) ───
POST {{serverAddress}}/wareGroup/updateRelations
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{wareGroupId}}",
            "wareClassIds": ["{{wareClassId}}"]
        },
        "get": {
            "_id": 1,
            "wareClasses": { "_id": 1 }
        }
    }
}

HTTP 200

# ─── WareModel ───
POST {{serverAddress}}/wareModel/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "کیت TSH",
            "enName": "TSH Kit",
            "wareTypeId": "{{wareTypeId}}",
            "wareClassId": "{{wareClassId}}",
            "wareGroupId": "{{wareGroupId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
wareModelId: jsonpath "$['body'][0]['_id']"

# ─── Ware ───
POST {{serverAddress}}/ware/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "کیت TSH زیشیمی",
            "enName": "TSH Kit ZistShimi",
            "brand": "ZistShimi",
            "price": 2500000,
            "manufacturerId": "{{mfrId}}",
            "wareTypeId": "{{wareTypeId}}",
            "wareClassId": "{{wareClassId}}",
            "wareGroupId": "{{wareGroupId}}",
            "wareModelId": "{{wareModelId}}"
        },
        "get": {
            "_id": 1,
            "name": 1,
            "price": 1
        }
    }
}

HTTP 200
[Captures]
wareId: jsonpath "$['body'][0]['_id']"
warePrice: jsonpath "$['body'][0]['price']"

# ═══════════════════════════════════════════════
# PHASE 3: STORE & STUFF
# ═══════════════════════════════════════════════

# ─── Store ───
POST {{serverAddress}}/store/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "فروشگاه نمونه",
            "address": "Tehran, Iran",
            "cityId": "{{cityId}}",
            "stateId": "{{stateId}}",
            "storeHeadId": "{{userId}}",
            "economicCode": "123456789",
            "postalCode": "1234567890"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
storeId: jsonpath "$['body'][0]['_id']"

# ─── Stuff ───
POST {{serverAddress}}/stuff/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "inventoryNo": 1001,
            "price": 2800000,
            "hasAbsolutePrice": true,
            "wareId": "{{wareId}}",
            "storeId": "{{storeId}}",
            "wareTypeId": "{{wareTypeId}}",
            "wareClassId": "{{wareClassId}}",
            "wareGroupId": "{{wareGroupId}}",
            "wareModelId": "{{wareModelId}}"
        },
        "get": {
            "_id": 1,
            "price": 1
        }
    }
}

HTTP 200
[Captures]
stuffId: jsonpath "$['body'][0]['_id']"
stuffPrice: jsonpath "$['body'][0]['price']"

# ═══════════════════════════════════════════════
# PHASE 4: PROCESS BUILDER
# ═══════════════════════════════════════════════

# ─── Create Process ───
POST {{serverAddress}}/process/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "فرآیند خرید نمونه",
            "description": "Standard procurement workflow",
            "organizationId": "{{orgId}}"
        },
        "get": {
            "_id": 1,
            "name": 1,
            "status": 1,
            "version": 1
        }
    }
}

HTTP 200
[Captures]
processId: jsonpath "$['body'][0]['_id']"

# ─── Step 1: Requester Approval (unit: procurement) ───
POST {{serverAddress}}/processStep/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "تأیید درخواست",
            "description": "Request is reviewed by procurement unit",
            "stepType": "Approval",
            "order": 1,
            "required": true,
            "groupsOperator": "AND",
            "assigneeGroups": [{
                "operator": "AND",
                "unitIds": ["{{unitId}}"]
            }],
            "processId": "{{processId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
step1Id: jsonpath "$['body'][0]['_id']"

# ─── Step 2: Warehouse Check ───
POST {{serverAddress}}/processStep/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "تأیید انبار",
            "description": "Warehouse confirms stock level",
            "stepType": "Approval",
            "order": 2,
            "required": true,
            "groupsOperator": "AND",
            "assigneeGroups": [{
                "operator": "AND",
                "unitIds": ["{{warehouseUnitId}}"]
            }],
            "processId": "{{processId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
step2Id: jsonpath "$['body'][0]['_id']"

# ─── Step 3: Finance Approval ───
POST {{serverAddress}}/processStep/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "تأیید مالی",
            "description": "Finance approves budget",
            "stepType": "Approval",
            "order": 3,
            "required": true,
            "groupsOperator": "AND",
            "assigneeGroups": [{
                "operator": "AND",
                "unitIds": ["{{financeUnitId}}"]
            }],
            "processId": "{{processId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
step3Id: jsonpath "$['body'][0]['_id']"

# ─── Activate Process ───
POST {{serverAddress}}/process/activateProcess
token: "{{token}}"
{
    "details": {
        "set": {
            "_id": "{{processId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "status": 1,
            "version": 1,
            "isActive": 1
        }
    }
}

HTTP 200

# ═══════════════════════════════════════════════
# PHASE 5: BUDGET SETUP
# ═══════════════════════════════════════════════

# ─── Fiscal Year ───
POST {{serverAddress}}/fiscalYear/add
token: "{{token}}"
{
    "details": {
        "set": {
            "name": "سال مالی 1405",
            "startDate": "2026-03-21",
            "endDate": "2027-03-20",
            "isActive": true,
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
fiscalYearId: jsonpath "$['body'][0]['_id']"

# ─── Budget Line ───
POST {{serverAddress}}/budgetLine/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "code": "BUD-001",
            "title": "بودجه خرید تجهیزات",
            "description": "Laboratory equipment budget",
            "fiscalYearId": "{{fiscalYearId}}",
            "organizationId": "{{orgId}}"
        },
        "get": {
            "_id": 1,
            "code": 1,
            "totalAllocated": 1,
            "remainingBudget": 1
        }
    }
}

HTTP 200
[Captures]
budgetLineId: jsonpath "$['body'][0]['_id']"

# ─── Budget Allocation ───
POST {{serverAddress}}/budgetAllocation/add
token: "{{token}}"
{
    "details": {
        "set": {
            "amount": 100000000,
            "description": "Annual allocation for lab equipment",
            "allocatedAt": "2026-03-21",
            "budgetLineId": "{{budgetLineId}}",
            "allocatedById": "{{userId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "amount": 1
        }
    }
}

HTTP 200
[Captures]
allocationId: jsonpath "$['body'][0]['_id']"

# ═══════════════════════════════════════════════
# PHASE 6: PURCHASING FLOW
# ═══════════════════════════════════════════════

# ─── PR: Submit ───
POST {{serverAddress}}/purchasingRequest/submit
token: "{{token}}"
{
    "details": {
        "set": {
            "title": "خرید کیت TSH",
            "description": "Urgent requst for TSH kits",
            "estimatedAmount": 50000000,
            "quantity": 10,
            "processId": "{{processId}}",
            "wareModelId": "{{wareModelId}}",
            "requestingUnitId": "{{unitId}}",
            "budgetLineId": "{{budgetLineId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "title": 1,
            "status": 1,
            "currentStep": 1
        }
    }
}

HTTP 200
[Captures]
prId: jsonpath "$['body'][0]['_id']"

# ─── Check Store Availability ───
POST {{serverAddress}}/purchasingRequest/checkStoreAvailability
token: "{{token}}"
{
    "details": {
        "set": {
            "purchasingRequestId": "{{prId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "price": 1,
            "store": { "_id": 1, "name": 1 }
        }
    }
}

HTTP 200

# ─── Path A: Assign Store (creates PurchaseOrderItem) ───
POST {{serverAddress}}/purchasingRequest/assignStore
token: "{{token}}"
{
    "details": {
        "set": {
            "_id": "{{prId}}",
            "assignedFromId": "{{storeId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "purchaseOrderItems": {
                "_id": 1,
                "status": 1,
                "quantity": 1,
                "unitPrice": 1
            }
        }
    }
}

HTTP 200
[Captures]
poItemId: jsonpath "$['body'][0]['purchaseOrderItems'][0]['_id']"

# ─── Step 1 Approval: Procurement Approves ───
POST {{serverAddress}}/stepApproval/submitDecision
token: "{{token}}"
{
    "details": {
        "set": {
            "purchasingRequestId": "{{prId}}",
            "processStepId": "{{step1Id}}",
            "unitId": "{{unitId}}",
            "status": "approved",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "status": 1
        }
    }
}

HTTP 200

# ─── Step 2: Warehouse Check ───
# First check warehouse
POST {{serverAddress}}/purchasingRequest/warehouseCheck
token: "{{token}}"
{
    "details": {
        "set": {
            "purchasingRequestId": "{{prId}}",
            "warehouseUnitId": "{{warehouseUnitId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "status": 1,
            "currentStep": 1
        }
    }
}

HTTP 200

# ─── Step 2: Warehouse approves ───
POST {{serverAddress}}/stepApproval/submitDecision
token: "{{token}}"
{
    "details": {
        "set": {
            "purchasingRequestId": "{{prId}}",
            "processStepId": "{{step2Id}}",
            "unitId": "{{warehouseUnitId}}",
            "status": "approved",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "status": 1
        }
    }
}

HTTP 200

# ─── Step 3: Finance approves ───
POST {{serverAddress}}/stepApproval/submitDecision
token: "{{token}}"
{
    "details": {
        "set": {
            "purchasingRequestId": "{{prId}}",
            "processStepId": "{{step3Id}}",
            "unitId": "{{financeUnitId}}",
            "status": "approved",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "status": 1
        }
    }
}

HTTP 200

# ─── Get History ───
POST {{serverAddress}}/purchasingRequest/getHistory
token: "{{token}}"
{
    "details": {
        "set": {
            "_id": "{{prId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {}
    }
}

HTTP 200

# ─── Get PR status (should be Approved) ───
POST {{serverAddress}}/purchasingRequest/get
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{prId}}"
        },
        "get": {
            "_id": 1,
            "title": 1,
            "status": 1,
            "currentStep": 1
        }
    }
}

HTTP 200
[Asserts]
jsonpath "$['body'][0]['status']" == "Approved"

# ─── Goods Receipt ───
POST {{serverAddress}}/goodsReceipt/add
token: "{{token}}"
{
    "details": {
        "set": {
            "receiptNumber": "GR-001",
            "description": "First goods receipt",
            "receivedAt": "2026-04-01",
            "items": [{
                "purchaseOrderItemId": "{{poItemId}}",
                "wareModelId": "{{wareModelId}}",
                "quantityReceived": 10,
                "quantityAccepted": 10,
                "quantityRejected": 0
            }],
            "purchasingRequestId": "{{prId}}",
            "receivedById": "{{userId}}",
            "receivingUnitId": "{{warehouseUnitId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "receiptNumber": 1,
            "status": 1
        }
    }
}

HTTP 200
[Captures]
goodsReceiptId: jsonpath "$['body'][0]['_id']"

# ─── Check PR after goods receipt ───
POST {{serverAddress}}/purchasingRequest/get
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{prId}}"
        },
        "get": {
            "_id": 1,
            "status": 1,
            "paymentOrders": { "_id": 1, "status": 1, "amount": 1 }
        }
    }
}

HTTP 200

# ─── Check auto-created PaymentOrder ───
POST {{serverAddress}}/paymentOrder/gets
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "filters": { "purchasingRequestId": "{{prId}}" }
        },
        "get": {
            "_id": 1,
            "title": 1,
            "status": 1,
            "amount": 1
        }
    }
}

HTTP 200
[Captures]
paymentOrderId: jsonpath "$['body'][0]['_id']"

# ─── Mark Payment as Paid ───
POST {{serverAddress}}/paymentOrder/markPaid
token: "{{token}}"
{
    "details": {
        "set": {
            "_id": "{{paymentOrderId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "status": 1,
            "paidAt": 1
        }
    }
}

HTTP 200

# ═══════════════════════════════════════════════
# PHASE 7: INVENTORY
# ═══════════════════════════════════════════════

# ─── Add Inventory ───
POST {{serverAddress}}/inventory/add
token: "{{token}}"
{
    "details": {
        "set": {
            "wareModelId": "{{wareModelId}}",
            "unitId": "{{warehouseUnitId}}",
            "quantity": 50,
            "minQuantity": 10,
            "maxQuantity": 200,
            "location": "Shelf A-12",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "quantity": 1,
            "minQuantity": 1
        }
    }
}

HTTP 200
[Captures]
inventoryId: jsonpath "$['body'][0]['_id']"

# ─── Inventory Adjust ───
POST {{serverAddress}}/inventory/adjust
token: "{{token}}"
{
    "details": {
        "set": {
            "_id": "{{inventoryId}}",
            "quantity": 45,
            "description": "Manual adjustment: found 5 damaged units",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "quantity": 1
        }
    }
}

HTTP 200

# ─── Check StockMovement was created ───
POST {{serverAddress}}/stockMovement/gets
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}"}
    },
    "get": {
        "_id": 1,
        "reason": 1,
        "quantity": 1,
        "balanceBefore": 1,
        "balanceAfter": 1
    }
}

HTTP 200

# ─── Consumption ───
POST {{serverAddress}}/consumptionRecord/add
token: "{{token}}"
{
    "details": {
        "set": {
            "wareModelId": "{{wareModelId}}",
            "quantity": 5,
            "consumedAt": "2026-04-02",
            "reason": "Routine lab testing",
            "unitId": "{{unitId}}",
            "consumedById": "{{userId}}",
            "inventoryId": "{{inventoryId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "quantity": 1,
            "reason": 1
        }
    }
}

HTTP 200

# ─── Transfer Inventory ───
POST {{serverAddress}}/inventory/transfer
token: "{{token}}"
{
    "details": {
        "set": {
            "fromUnitId": "{{warehouseUnitId}}",
            "toUnitId": "{{unitId}}",
            "wareModelId": "{{wareModelId}}",
            "quantity": 10,
            "description": "Transfer to procurement for testing",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "fromUnit": { "_id": 1 },
            "toUnit": { "_id": 1 },
            "quantity": 1
        }
    }
}

HTTP 200

# ═══════════════════════════════════════════════
# PHASE 8: TENDER PATH (Path B)
# ═══════════════════════════════════════════════

# ─── New PR for Tender path ───
POST {{serverAddress}}/purchasingRequest/submit
token: "{{token}}"
{
    "details": {
        "set": {
            "title": "خرید کیت TSH - مناقصه",
            "description": "Tender-based procurement",
            "quantity": 20,
            "processId": "{{processId}}",
            "wareModelId": "{{wareModelId}}",
            "requestingUnitId": "{{unitId}}",
            "budgetLineId": "{{budgetLineId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "title": 1,
            "status": 1
        }
    }
}

HTTP 200
[Captures]
prTenderId: jsonpath "$['body'][0]['_id']"

# ─── Create Tender ───
POST {{serverAddress}}/tender/add
token: "{{token}}"
{
    "details": {
        "set": {
            "title": "مناقصه خرید کیت TSH",
            "description": "Open tender for TSH kits",
            "deadline": "2026-05-01",
            "purchasingRequestId": "{{prTenderId}}",
            "createdById": "{{userId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "title": 1,
            "status": 1
        }
    }
}

HTTP 200
[Captures]
tenderId: jsonpath "$['body'][0]['_id']"

# ─── Link Store to Tender as assigned vendor ───
POST {{serverAddress}}/tender/updateRelations
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{tenderId}}",
            "assignedVendorsId": "{{storeId}}"
        },
        "get": {
            "_id": 1,
            "assignedVendors": { "_id": 1, "name": 1 }
        }
    }
}

HTTP 200

# ─── Submit Tender Offer ───
POST {{serverAddress}}/tenderOffer/submit
token: "{{token}}"
{
    "details": {
        "set": {
            "price": 2500000,
            "deliveryTime": 7,
            "paymentTerms": "30 days",
            "submittedAt": "2026-04-10",
            "tenderId": "{{tenderId}}",
            "storeId": "{{storeId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "price": 1,
            "status": 1
        }
    }
}

HTTP 200
[Captures]
offerId: jsonpath "$['body'][0]['_id']"

# ─── Close Tender ───
POST {{serverAddress}}/tender/close
token: "{{token}}"
{
    "details": {
        "set": {
            "_id": "{{tenderId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "status": 1
        }
    }
}

HTTP 200

# ─── Award Tender ───
POST {{serverAddress}}/tender/award
token: "{{token}}"
{
    "details": {
        "set": {
            "_id": "{{tenderId}}",
            "winningOfferId": "{{offerId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "status": 1,
            "offers": { "_id": 1, "status": 1 }
        }
    }
}

HTTP 200

# ═══════════════════════════════════════════════
# PHASE 9: TAGS & FILE
# ═══════════════════════════════════════════════

# ─── Tag ───
POST {{serverAddress}}/tag/add
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "name": "فوری",
            "color": "#FF0000",
            "description": "Urgent items"
        },
        "get": {
            "_id": 1,
            "name": 1
        }
    }
}

HTTP 200
[Captures]
tagId: jsonpath "$['body'][0]['_id']"

# ─── Tag Gets ───
POST {{serverAddress}}/tag/gets
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}"}
    },
    "get": {
        "_id": 1,
        "name": 1
    }
}

HTTP 200

# ═══════════════════════════════════════════════
# PHASE 10: DUPLICATE PROCESS
# ═══════════════════════════════════════════════

# ─── Duplicate Process ───
POST {{serverAddress}}/process/duplicateProcess
token: "{{token}}"
{
    "details": {
        "set": {
            "_id": "{{processId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "name": 1,
            "status": 1,
            "version": 1,
            "steps": { "_id": 1, "name": 1, "order": 1 }
        }
    }
}

HTTP 200
[Captures]
dupProcessId: jsonpath "$['body'][0]['_id']"

# ─── Get Budget Report ───
POST {{serverAddress}}/budgetLine/getBudgetReport
token: "{{token}}"
{
    "details": {
        "set": {
            "fiscalYearId": "{{fiscalYearId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {}
    }
}

HTTP 200

# ═══════════════════════════════════════════════
# PHASE 11: REMOVES (Cleanup)
# ═══════════════════════════════════════════════

# ─── Remove PurchaseOrderItem ───
POST {{serverAddress}}/purchasingRequest/removeFromPurchase
token: "{{token}}"
{
    "details": {
        "set": {
            "_id": "{{prId}}",
            "purchaseOrderItemId": "{{poItemId}}",
            "activeRoleId": "{{roleId}}"
        },
        "get": {
            "_id": 1,
            "purchaseOrderItems": { "_id": 1 }
        }
    }
}

HTTP 200

# ─── Remove Process ───
POST {{serverAddress}}/process/remove
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{dupProcessId}}"
        },
        "get": {
            "_id": 1
        }
    }
}

HTTP 200

# ─── Remove Store ───
POST {{serverAddress}}/store/remove
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{storeId}}"
        },
        "get": {
            "_id": 1
        }
    }
}

HTTP 200

# ─── Remove Ware ───
POST {{serverAddress}}/ware/remove
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{wareId}}"
        },
        "get": {
            "_id": 1
        }
    }
}

HTTP 200

# ─── Remove WareModel ───
POST {{serverAddress}}/wareModel/remove
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{wareModelId}}"
        },
        "get": {
            "_id": 1
        }
    }
}

HTTP 200

# ─── Remove WareGroup ───
POST {{serverAddress}}/wareGroup/remove
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{wareGroupId}}"
        },
        "get": {
            "_id": 1
        }
    }
}

HTTP 200

# ─── Remove WareClass ───
POST {{serverAddress}}/wareClass/remove
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{wareClassId}}"
        },
        "get": {
            "_id": 1
        }
    }
}

HTTP 200

# ─── Remove WareType ───
POST {{serverAddress}}/wareType/remove
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{wareTypeId}}"
        },
        "get": {
            "_id": 1
        }
    }
}

HTTP 200

# ─── Remove Manufacturer ───
POST {{serverAddress}}/manufacturer/remove
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{mfrId}}"
        },
        "get": {
            "_id": 1
        }
    }
}

HTTP 200

# ─── Remove Unit ───
POST {{serverAddress}}/unit/remove
token: "{{token}}"
{
    "details": {
        "set": {
            "activeRoleId": "{{roleId}}",
            "_id": "{{financeUnitId}}"
        },
        "get": {
            "_id": 1
        }
    }
}

HTTP 200