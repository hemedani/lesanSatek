# ════════════════════════════════════════════════════════════════
# LesanSatek Backend - Full E2E Test Suite
# ════════════════════════════════════════════════════════════════
# 115 test steps
# Run: hurl --test --variables-file vars.env e2e.hurl
# ════════════════════════════════════════════════════════════════

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


POST {{serverAddress}}/state/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "تهران",
      "enName": "Tehran",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/city/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "تهران",
      "enName": "Tehran",
      "stateId": "{stateId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/organization/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "سازمان نمونه",
      "enName": "Sample Organization",
      "description": "Test organization for E2E",
      "activeRoleId": "{roleId}",
      "state": "{stateId}",
      "city": "{cityId}"
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


POST {{serverAddress}}/user/updateUserRelations
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{ghostId}",
      "activeRoleId": "{roleId}",
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد خرید",
      "enName": "Procurement Unit",
      "description": "Main purchasing unit",
      "type": "General",
      "organizationId": "{orgId}",
      "headId": "{userId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
procurementUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "انبار مرکزی",
      "enName": "Central Warehouse",
      "description": "Main warehouse",
      "type": "Warehouse",
      "organizationId": "{orgId}",
      "headId": "{userId}"
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


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد مالی",
      "enName": "Finance Unit",
      "description": "Financial management",
      "type": "Administration",
      "organizationId": "{orgId}",
      "headId": "{userId}"
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


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد تولید",
      "enName": "Production Unit",
      "description": "Production management",
      "type": "Production",
      "organizationId": "{orgId}",
      "headId": "{prodHeadId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
productionUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد لجستیک",
      "enName": "Logistics Unit",
      "description": "Logistics management",
      "type": "Logistics",
      "organizationId": "{orgId}",
      "headId": "{logHeadId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
logisticsUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد فناوری اطلاعات",
      "enName": "IT Unit",
      "description": "Information technology",
      "type": "Expert",
      "organizationId": "{orgId}",
      "headId": "{itHeadId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
itUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد منابع انسانی",
      "enName": "HR Unit",
      "description": "Human resources",
      "type": "Administration",
      "organizationId": "{orgId}",
      "headId": "{hrHeadId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
hrUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد حقوقی",
      "enName": "Legal Unit",
      "description": "Legal affairs",
      "type": "General",
      "organizationId": "{orgId}",
      "headId": "{legalHeadId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
legalUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد تحقیق و توسعه",
      "enName": "R&D Unit",
      "description": "Research and development",
      "type": "Expert",
      "organizationId": "{orgId}",
      "headId": "{rdHeadId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
rdUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "آزمایشگاه هماتولوژی",
      "enName": "Hematology Lab",
      "description": "Hematology testing",
      "type": "Expert",
      "organizationId": "{orgId}",
      "headId": "{unitheadUserId}",
      "parentUnitId": "{unitId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
hematolabUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "آزمایشگاه میکروبیولوژی",
      "enName": "Microbiology Lab",
      "description": "Microbiology testing",
      "type": "Expert",
      "organizationId": "{orgId}",
      "headId": "{unitheadUserId}",
      "parentUnitId": "{unitId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
microlabUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "آزمایشگاه پاتولوژی",
      "enName": "Pathology Lab",
      "description": "Pathology testing",
      "type": "Expert",
      "organizationId": "{orgId}",
      "headId": "{unitheadUserId}",
      "parentUnitId": "{unitId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
patholabUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "انبار سرد",
      "enName": "Cold Storage",
      "description": "Cold storage facility",
      "type": "Warehouse",
      "organizationId": "{orgId}",
      "headId": "{warehouseHeadId}",
      "parentUnitId": "{warehouseUnitId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
coldstoreUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد تدارکات داخلی",
      "enName": "Internal Procurement",
      "description": "Internal procurement",
      "type": "Logistics",
      "organizationId": "{orgId}",
      "headId": "{logHeadId}",
      "parentUnitId": "{unitId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
internalprocUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد تضمین کیفیت",
      "enName": "Quality Assurance",
      "description": "Quality assurance",
      "type": "General",
      "organizationId": "{orgId}",
      "headId": "{prodHeadId}",
      "parentUnitId": "{prodUnitId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
qaUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد پشتیبانی فنی",
      "enName": "Technical Support",
      "description": "Technical support",
      "type": "General",
      "organizationId": "{orgId}",
      "headId": "{itHeadId}",
      "parentUnitId": "{itUnitId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
techsupportUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/unit/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "واحد حسابرسی داخلی",
      "enName": "Internal Audit",
      "description": "Internal audit",
      "type": "Administration",
      "organizationId": "{orgId}",
      "headId": "{finHeadId}",
      "parentUnitId": "{financeUnitId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
internalauditUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/user/addUser
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "first_name": "علی",
      "last_name": "محمدی",
      "email": "ali@lesansatek.com",
      "password": "password123",
      "mobile": "09120000004",
      "gender": "Male",
      "isActive": true,
      "is_verified": true,
      "roles": [
        {
          "name": "Manager"
        }
      ],
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200
[Captures]
prodheadId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/user/addUser
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "first_name": "محمد",
      "last_name": "رضایی",
      "email": "mohammad@lesansatek.com",
      "password": "password123",
      "mobile": "09120000005",
      "gender": "Male",
      "isActive": true,
      "is_verified": true,
      "roles": [
        {
          "name": "Manager"
        }
      ],
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200
[Captures]
logheadId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/user/addUser
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "first_name": "زهرا",
      "last_name": "احمدی",
      "email": "zahra@lesansatek.com",
      "password": "password123",
      "mobile": "09120000006",
      "gender": "Male",
      "isActive": true,
      "is_verified": true,
      "roles": [
        {
          "name": "Manager"
        }
      ],
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200
[Captures]
itheadId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/user/addUser
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "first_name": "نرگس",
      "last_name": "کریمی",
      "email": "narges@lesansatek.com",
      "password": "password123",
      "mobile": "09120000007",
      "gender": "Male",
      "isActive": true,
      "is_verified": true,
      "roles": [
        {
          "name": "Manager"
        }
      ],
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200
[Captures]
hrheadId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/user/addUser
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "first_name": "فرهاد",
      "last_name": "نوروزی",
      "email": "farhad@lesansatek.com",
      "password": "password123",
      "mobile": "09120000008",
      "gender": "Male",
      "isActive": true,
      "is_verified": true,
      "roles": [
        {
          "name": "Manager"
        }
      ],
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200
[Captures]
legalheadId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/user/addUser
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "first_name": "پریسا",
      "last_name": "صادقی",
      "email": "parisa@lesansatek.com",
      "password": "password123",
      "mobile": "09120000009",
      "gender": "Male",
      "isActive": true,
      "is_verified": true,
      "roles": [
        {
          "name": "Manager"
        }
      ],
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200
[Captures]
rdheadId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/user/addUser
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "first_name": "رضا",
      "last_name": "احمدی",
      "email": "reza@lesansatek.com",
      "password": "password123",
      "mobile": "09120000001",
      "gender": "Male",
      "isActive": true,
      "is_verified": true,
      "roles": [
        {
          "name": "UnitHead",
          "scopeType": "unit",
          "scopeId": "{unitId}"
        }
      ],
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200
[Captures]
unitheadUserId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/user/addUser
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "first_name": "مریم",
      "last_name": "حسینی",
      "email": "maryam@lesansatek.com",
      "password": "password123",
      "mobile": "09120000002",
      "gender": "Female",
      "isActive": true,
      "is_verified": true,
      "roles": [
        {
          "name": "Ordinary"
        }
      ],
      "features": [
        {
          "feature": "canManageBudget"
        }
      ],
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200
[Captures]
financeUserId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/user/addUser
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "first_name": "سارا",
      "last_name": "کریمی",
      "email": "sara@lesansatek.com",
      "password": "password123",
      "mobile": "09120000003",
      "gender": "Female",
      "isActive": true,
      "is_verified": true,
      "roles": [
        {
          "name": "Ordinary"
        }
      ],
      "features": [
        {
          "feature": "canRespondToTender"
        }
      ],
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200
[Captures]
vendorUserId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/user/addUser
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "first_name": "حسین",
      "last_name": "کاظمی",
      "email": "hossein@lesansatek.com",
      "password": "password123",
      "mobile": "09120000010",
      "gender": "Male",
      "isActive": true,
      "is_verified": true,
      "roles": [
        {
          "name": "UnitHead",
          "scopeType": "unit",
          "scopeId": "{warehouseUnitId}"
        }
      ],
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200
[Captures]
warehouseHeadId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/user/addUser
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "first_name": "فاطمه",
      "last_name": "موسوی",
      "email": "fatemeh@lesansatek.com",
      "password": "password123",
      "mobile": "09120000011",
      "gender": "Female",
      "isActive": true,
      "is_verified": true,
      "roles": [
        {
          "name": "UnitHead",
          "scopeType": "unit",
          "scopeId": "{financeUnitId}"
        }
      ],
      "organization": "{orgId}"
    },
    "get": {
      "_id": 1
    }
  }
}

HTTP 200
[Captures]
finHeadId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/manufacturer/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "تولیدکننده نمونه",
      "enName": "Sample Manufacturer",
      "country": "Iran",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/wareType/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "تجهیزات آزمایشگاهی",
      "enName": "Laboratory Equipment",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/wareClass/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "هماتولوژی",
      "enName": "Hematology",
      "wareTypeId": "{wareTypeId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/wareGroup/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "کیت",
      "enName": "Kit",
      "wareTypeId": "{wareTypeId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/wareGroup/updateRelations
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{wareGroupId}",
      "activeRoleId": "{roleId}",
      "wareClassIds": [
        "{wareClassId}"
      ]
    },
    "get": {
      "_id": 1,
      "wareClasses": {
        "_id": 1
      }
    }
  }
}

HTTP 200

POST {{serverAddress}}/wareModel/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "کیت TSH",
      "enName": "TSH Kit",
      "wareTypeId": "{wareTypeId}",
      "wareClassId": "{wareClassId}",
      "wareGroupId": "{wareGroupId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/ware/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "کیت TSH زیشیمی",
      "enName": "TSH Kit ZistShimi",
      "brand": "ZistShimi",
      "price": 2500000,
      "manufacturerId": "{mfrId}",
      "wareTypeId": "{wareTypeId}",
      "wareClassId": "{wareClassId}",
      "wareGroupId": "{wareGroupId}",
      "wareModelId": "{wareModelId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/store/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "فروشگاه نمونه",
      "address": "Tehran, Iran",
      "cityId": "{cityId}",
      "stateId": "{stateId}",
      "storeHeadId": "{userId}",
      "economicCode": "123456789",
      "postalCode": "1234567890",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/stuff/add
token: "{token}"
{
  "details": {
    "set": {
      "inventoryNo": 1001,
      "price": 2800000,
      "hasAbsolutePrice": true,
      "wareId": "{wareId}",
      "storeId": "{storeId}",
      "wareTypeId": "{wareTypeId}",
      "wareClassId": "{wareClassId}",
      "wareGroupId": "{wareGroupId}",
      "wareModelId": "{wareModelId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/process/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "فرآیند خرید عمومی سازمان",
      "description": "General org-wide procurement workflow",
      "organization": "{orgId}"
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
processGeneralId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید درخواست",
      "description": "Procurement reviews",
      "stepType": "Approval",
      "order": 1,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{unitId}"
          ]
        }
      ],
      "processId": "{processGeneralId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepGeneral1Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید انبار",
      "description": "Warehouse confirms",
      "stepType": "Approval",
      "order": 2,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{warehouseUnitId}"
          ]
        }
      ],
      "processId": "{processGeneralId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepGeneral2Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید مالی",
      "description": "Finance approves",
      "stepType": "Approval",
      "order": 3,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{financeUnitId}"
          ]
        }
      ],
      "processId": "{processGeneralId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepGeneral3Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/process/activateProcess
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{processGeneralId}",
      "activeRoleId": "{roleId}"
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

POST {{serverAddress}}/process/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "فرآیند خرید واحد خرید",
      "description": "Procurement unit-specific workflow",
      "organizationId": "{orgId}",
      "unitId": "{unitId}"
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
processUnitId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید درخواست",
      "description": "Procurement reviews",
      "stepType": "Approval",
      "order": 1,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{unitId}"
          ]
        }
      ],
      "processId": "{processUnitId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepUnit1Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید انبار",
      "description": "Warehouse confirms",
      "stepType": "Approval",
      "order": 2,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{warehouseUnitId}"
          ]
        }
      ],
      "processId": "{processUnitId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepUnit2Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید مالی",
      "description": "Finance approves",
      "stepType": "Approval",
      "order": 3,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{financeUnitId}"
          ]
        }
      ],
      "processId": "{processUnitId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepUnit3Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/process/activateProcess
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{processUnitId}",
      "activeRoleId": "{roleId}"
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

POST {{serverAddress}}/process/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "فرآیند خرید انبار مرکزی",
      "description": "Warehouse-specific workflow",
      "organizationId": "{orgId}",
      "unitId": "{warehouseUnitId}"
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
processWarehouseId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید انبار",
      "description": "Warehouse reviews",
      "stepType": "Approval",
      "order": 1,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{warehouseUnitId}"
          ]
        }
      ],
      "processId": "{processWarehouseId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepWarehouse1Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید مالی",
      "description": "Finance approves",
      "stepType": "Approval",
      "order": 2,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{financeUnitId}"
          ]
        }
      ],
      "processId": "{processWarehouseId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepWarehouse2Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/process/activateProcess
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{processWarehouseId}",
      "activeRoleId": "{roleId}"
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

POST {{serverAddress}}/process/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "فرآیند خرید واحد مالی",
      "description": "Finance-specific workflow",
      "organizationId": "{orgId}",
      "unitId": "{financeUnitId}"
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
processFinanceId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید مالی",
      "description": "Finance approves",
      "stepType": "Approval",
      "order": 1,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{financeUnitId}"
          ]
        }
      ],
      "processId": "{processFinanceId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepFinance1Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/process/activateProcess
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{processFinanceId}",
      "activeRoleId": "{roleId}"
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

POST {{serverAddress}}/process/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "فرآیند خرید تجهیزات آزمایشگاهی",
      "description": "Laboratory equipment procurement",
      "organizationId": "{orgId}",
      "wareTypeId": "{wareTypeId}"
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
processWaretypeId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید درخواست",
      "description": "Procurement reviews",
      "stepType": "Approval",
      "order": 1,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{unitId}"
          ]
        }
      ],
      "processId": "{processWaretypeId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepWaretype1Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید مالی",
      "description": "Finance approves",
      "stepType": "Approval",
      "order": 2,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{financeUnitId}"
          ]
        }
      ],
      "processId": "{processWaretypeId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepWaretype2Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/process/activateProcess
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{processWaretypeId}",
      "activeRoleId": "{roleId}"
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

POST {{serverAddress}}/process/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "فرآیند خرید هماتولوژی",
      "description": "Hematology procurement",
      "organizationId": "{orgId}",
      "wareClassId": "{wareClassId}"
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
processWareclassId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید درخواست",
      "description": "Procurement approves",
      "stepType": "Approval",
      "order": 1,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{unitId}"
          ]
        }
      ],
      "processId": "{processWareclassId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepWareclass1Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/process/activateProcess
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{processWareclassId}",
      "activeRoleId": "{roleId}"
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

POST {{serverAddress}}/process/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "فرآیند خرید کیت",
      "description": "Kit procurement",
      "organizationId": "{orgId}",
      "wareGroupId": "{wareGroupId}"
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
processWaregroupId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید درخواست",
      "description": "Procurement reviews",
      "stepType": "Approval",
      "order": 1,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{unitId}"
          ]
        }
      ],
      "processId": "{processWaregroupId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepWaregroup1Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید انبار",
      "description": "Warehouse confirms",
      "stepType": "Approval",
      "order": 2,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{warehouseUnitId}"
          ]
        }
      ],
      "processId": "{processWaregroupId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepWaregroup2Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید مالی",
      "description": "Finance approves",
      "stepType": "Approval",
      "order": 3,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{financeUnitId}"
          ]
        }
      ],
      "processId": "{processWaregroupId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepWaregroup3Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/process/activateProcess
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{processWaregroupId}",
      "activeRoleId": "{roleId}"
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

POST {{serverAddress}}/process/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "فرآیند خرید کیت TSH",
      "description": "TSH Kit procurement",
      "organizationId": "{orgId}",
      "wareModelId": "{wareModelId}"
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
processWaremodelId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید درخواست",
      "description": "Procurement reviews",
      "stepType": "Approval",
      "order": 1,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{unitId}"
          ]
        }
      ],
      "processId": "{processWaremodelId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepWaremodel1Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/processStep/add
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "name": "تأیید مالی",
      "description": "Finance approves",
      "stepType": "Approval",
      "order": 2,
      "required": true,
      "groupsOperator": "AND",
      "assigneeGroups": [
        {
          "operator": "AND",
          "unitIds": [
            "{financeUnitId}"
          ]
        }
      ],
      "processId": "{processWaremodelId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
stepWaremodel2Id: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/process/activateProcess
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{processWaremodelId}",
      "activeRoleId": "{roleId}"
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

POST {{serverAddress}}/fiscalYear/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "سال مالی 1405",
      "startDate": "2026-03-21",
      "endDate": "2027-03-20",
      "isActive": true,
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/budgetLine/add
token: "{token}"
{
  "details": {
    "set": {
      "code": "BUD-001",
      "title": "بودجه خرید تجهیزات",
      "description": "Laboratory equipment budget",
      "fiscalYearId": "{fiscalYearId}",
      "organizationId": "{orgId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/budgetAllocation/add
token: "{token}"
{
  "details": {
    "set": {
      "amount": 100000000,
      "description": "Annual allocation for lab equipment",
      "allocatedAt": "2026-03-21",
      "budgetLineId": "{budgetLineId}",
      "allocatedById": "{userId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/purchasingRequest/submit
token: "{token}"
{
  "details": {
    "set": {
      "title": "خرید کیت TSH",
      "description": "Urgent request for TSH kits",
      "estimatedAmount": 50000000,
      "quantity": 10,
      "wareModelId": "{wareModelId}",
      "requestingUnitId": "{unitId}",
      "budgetLineId": "{budgetLineId}",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "title": 1,
      "status": 1,
      "currentStep": 1,
      "process": {
        "_id": 1,
        "name": 1
      },
      "stepApprovals": {
        "_id": 1,
        "status": 1,
        "processStep": {
          "_id": 1
        },
        "unit": {
          "_id": 1
        }
      }
    }
  }
}

HTTP 200
[Captures]
prId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/purchasingRequest/checkStoreAvailability
token: "{token}"
{
  "details": {
    "set": {
      "purchasingRequestId": "{prId}",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "price": 1,
      "store": {
        "_id": 1,
        "name": 1
      }
    }
  }
}

HTTP 200

POST {{serverAddress}}/purchasingRequest/assignStore
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{prId}",
      "assignedFromId": "{storeId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/stepApproval/submitDecision
token: "{token}"
{
  "details": {
    "set": {
      "purchasingRequestId": "{prId}",
      "processStepId": "{stepUnit1Id}",
      "unitId": "{unitId}",
      "status": "approved",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "status": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/purchasingRequest/warehouseCheck
token: "{token}"
{
  "details": {
    "set": {
      "purchasingRequestId": "{prId}",
      "warehouseUnitId": "{warehouseUnitId}",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "status": 1,
      "currentStep": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/stepApproval/submitDecision
token: "{token}"
{
  "details": {
    "set": {
      "purchasingRequestId": "{prId}",
      "processStepId": "{stepUnit2Id}",
      "unitId": "{warehouseUnitId}",
      "status": "approved",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "status": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/stepApproval/submitDecision
token: "{token}"
{
  "details": {
    "set": {
      "purchasingRequestId": "{prId}",
      "processStepId": "{stepUnit3Id}",
      "unitId": "{financeUnitId}",
      "status": "approved",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "status": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/purchasingRequest/getHistory
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{prId}",
      "activeRoleId": "{roleId}"
    },
    "get": {}
  }
}

HTTP 200

POST {{serverAddress}}/goodsReceipt/add
token: "{token}"
{
  "details": {
    "set": {
      "receiptNumber": "GR-001",
      "description": "First goods receipt",
      "receivedAt": "2026-04-01",
      "items": [
        {
          "purchaseOrderItemId": "{poItemId}",
          "wareModelId": "{wareModelId}",
          "quantityReceived": 10,
          "quantityAccepted": 10,
          "quantityRejected": 0
        }
      ],
      "purchasingRequestId": "{prId}",
      "receivedById": "{userId}",
      "receivingUnitId": "{warehouseUnitId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/paymentOrder/gets
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/paymentOrder/markPaid
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{paymentOrderId}",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "status": 1,
      "paidAt": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/inventory/add
token: "{token}"
{
  "details": {
    "set": {
      "wareModelId": "{wareModelId}",
      "unitId": "{warehouseUnitId}",
      "quantity": 50,
      "minQuantity": 10,
      "maxQuantity": 200,
      "location": "Shelf A-12",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/inventory/adjust
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{inventoryId}",
      "quantity": 45,
      "description": "Manual adjustment: found 5 damaged units",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "quantity": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/stockMovement/gets
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "reason": 1,
      "quantity": 1,
      "balanceBefore": 1,
      "balanceAfter": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/consumptionRecord/add
token: "{token}"
{
  "details": {
    "set": {
      "wareModelId": "{wareModelId}",
      "quantity": 5,
      "consumedAt": "2026-04-02",
      "reason": "Routine lab testing",
      "unitId": "{unitId}",
      "consumedById": "{userId}",
      "inventoryId": "{inventoryId}",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "quantity": 1,
      "reason": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/inventory/transfer
token: "{token}"
{
  "details": {
    "set": {
      "fromUnitId": "{warehouseUnitId}",
      "toUnitId": "{unitId}",
      "wareModelId": "{wareModelId}",
      "quantity": 10,
      "description": "Transfer to procurement for testing",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "fromUnit": {
        "_id": 1
      },
      "toUnit": {
        "_id": 1
      },
      "quantity": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/purchasingRequest/submit
token: "{token}"
{
  "details": {
    "set": {
      "title": "خرید کیت TSH - مناقصه",
      "description": "Tender-based procurement",
      "quantity": 20,
      "wareModelId": "{wareModelId}",
      "requestingUnitId": "{unitId}",
      "budgetLineId": "{budgetLineId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/tender/add
token: "{token}"
{
  "details": {
    "set": {
      "title": "مناقصه خرید کیت TSH",
      "description": "Open tender for TSH kits",
      "deadline": "2026-05-01",
      "purchasingRequestId": "{prTenderId}",
      "createdById": "{userId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/tender/updateRelations
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{tenderId}",
      "activeRoleId": "{roleId}",
      "assignedVendorsId": "{storeId}"
    },
    "get": {
      "_id": 1,
      "assignedVendors": {
        "_id": 1,
        "name": 1
      }
    }
  }
}

HTTP 200

POST {{serverAddress}}/tenderOffer/submit
token: "{token}"
{
  "details": {
    "set": {
      "price": 2500000,
      "deliveryTime": 7,
      "paymentTerms": "30 days",
      "submittedAt": "2026-04-10",
      "tenderId": "{tenderId}",
      "storeId": "{storeId}",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/tender/close
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{tenderId}",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "status": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/tender/award
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{tenderId}",
      "winningOfferId": "{offerId}",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "status": 1,
      "offers": {
        "_id": 1,
        "status": 1
      }
    }
  }
}

HTTP 200

POST {{serverAddress}}/tag/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "فوری",
      "color": "#FF0000",
      "description": "Urgent items",
      "activeRoleId": "{roleId}"
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


POST {{serverAddress}}/process/duplicateProcess
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{processGeneralId}",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "name": 1,
      "status": 1,
      "version": 1,
      "steps": {
        "_id": 1,
        "name": 1,
        "order": 1
      }
    }
  }
}

HTTP 200
[Captures]
dupProcessId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/budgetLine/getBudgetReport
token: "{token}"
{
  "details": {
    "set": {
      "fiscalYearId": "{fiscalYearId}",
      "activeRoleId": "{roleId}"
    },
    "get": {}
  }
}

HTTP 200

POST {{serverAddress}}/user/updateUser
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{ghostId}",
      "activeRoleId": "{roleId}",
      "roles": [
        {
          "roleId": "{roleId}",
          "name": "Ordinary"
        },
        {
          "name": "Manager"
        }
      ]
    },
    "get": {
      "_id": 1,
      "roles": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/user/getMe
token: "{token}"
{
  "details": {
    "set": {},
    "get": {
      "_id": 1,
      "first_name": 1,
      "last_name": 1,
      "email": 1,
      "roles": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/store/update
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{storeId}",
      "activeRoleId": "{roleId}",
      "score": 4.5,
      "totalSoldAmount": 15000000,
      "totalSoldNum": 5
    },
    "get": {
      "_id": 1,
      "score": 1,
      "totalSoldAmount": 1,
      "totalSoldNum": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/stepApproval/gets
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "purchasingRequestId": "{prId}"
    },
    "get": {
      "_id": 1,
      "status": 1,
      "processStep": {
        "_id": 1,
        "name": 1
      },
      "unit": {
        "_id": 1,
        "name": 1
      },
      "decidedAt": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/budgetLine/gets
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "fiscalYearId": "{fiscalYearId}"
    },
    "get": {
      "_id": 1,
      "code": 1,
      "title": 1,
      "totalAllocated": 1,
      "totalSpent": 1,
      "remainingBudget": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/tenderOffer/gets
token: "{token}"
{
  "details": {
    "set": {
      "activeRoleId": "{roleId}",
      "tenderId": "{tenderId}"
    },
    "get": {
      "_id": 1,
      "price": 1,
      "status": 1,
      "store": {
        "_id": 1,
        "name": 1
      }
    }
  }
}

HTTP 200

POST {{serverAddress}}/consumptionRecord/add
token: "{token}"
{
  "details": {
    "set": {
      "wareModelId": "{wareModelId}",
      "quantity": 3,
      "consumedAt": "2026-04-03",
      "reason": "Quality control testing",
      "unitId": "{unitId}",
      "consumedById": "{userId}",
      "inventoryId": "{inventoryId}",
      "purchasingRequestId": "{prId}",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "quantity": 1,
      "reason": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/process/update
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{dupProcessId}",
      "activeRoleId": "{roleId}",
      "status": "Archived"
    },
    "get": {
      "_id": 1,
      "name": 1,
      "status": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/tag/add
token: "{token}"
{
  "details": {
    "set": {
      "name": "موقت",
      "color": "#00FF00",
      "description": "Temporary tag for removal test",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "_id": 1,
      "name": 1
    }
  }
}

HTTP 200
[Captures]
tempTagId: jsonpath "$['body'][0]['_id']"


POST {{serverAddress}}/tag/remove
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{tempTagId}",
      "activeRoleId": "{roleId}"
    },
    "get": {
      "success": 1
    }
  }
}

HTTP 200

POST {{serverAddress}}/ware/updateRelations
token: "{token}"
{
  "details": {
    "set": {
      "_id": "{wareId}",
      "activeRoleId": "{roleId}",
      "manufacturerId": "{mfrId}"
    },
    "get": {
      "_id": 1,
      "name": 1,
      "manufacturer": {
        "_id": 1,
        "name": 1
      }
    }
  }
}

HTTP 200
