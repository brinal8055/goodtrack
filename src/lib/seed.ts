import type { TextileTrackData } from "@/lib/types";

const demoPasswordHashes = {
  admin: "sha256$textiletrack-admin-demo$39a092951ab3d5dbb3da2fabaea55080c5f3608818fccf329a9b7dd91d584794",
  entry: "sha256$textiletrack-entry-demo$302570aeb308274d52a6b2dfd44857da508c171bf2751bd694b3d9b5116b6e8b",
  godown: "sha256$textiletrack-godown-demo$82ec45f605ed489596cfac19596a30694191323cb1b0eaa02c89377a20b42364",
  process: "sha256$textiletrack-process-demo$906144b23366b35abb814de0cdbf01b5fc4f1f886ed7dc63d08a8a1e69a1dac1",
  billing: "sha256$textiletrack-billing-demo$30f746c504ff9ff216c5d44de1a123f4be4258d3a3bea97341c09181f86ca29f"
};

function isoDaysAgo(days: number, hour = 9, minute = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function isoHoursAgo(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

export function createSeedData(): TextileTrackData {
  return {
    settings: {
      companyName: "TextileTrack Factory",
      companyAddress: "Plot 18, Industrial Estate, Surat, Gujarat",
      gstNumber: "24AAACT1234A1Z5",
      lotPrefix: "LOT-",
      nextLotNumber: 1028,
      invoicePrefix: "INV",
      nextInvoiceNumber: 4,
      stuckThresholdHours: 48,
      billingOverdueDays: 7
    },
    users: [
      {
        id: "user-admin",
        name: "Aarav Owner",
        email: "admin@textiletrack.test",
        passwordHash: demoPasswordHashes.admin,
        role: "ADMIN",
        isActive: true,
        lastLogin: isoHoursAgo(2),
        createdAt: isoDaysAgo(60)
      },
      {
        id: "user-entry",
        name: "Nisha Entry",
        email: "entry@textiletrack.test",
        passwordHash: demoPasswordHashes.entry,
        role: "ENTRY_OPERATOR",
        isActive: true,
        lastLogin: isoDaysAgo(1),
        createdAt: isoDaysAgo(45)
      },
      {
        id: "user-godown",
        name: "Manoj Godown",
        email: "godown@textiletrack.test",
        passwordHash: demoPasswordHashes.godown,
        role: "GODOWN",
        isActive: true,
        lastLogin: isoHoursAgo(5),
        createdAt: isoDaysAgo(42)
      },
      {
        id: "user-process",
        name: "Ravi Dyeing",
        email: "process@textiletrack.test",
        passwordHash: demoPasswordHashes.process,
        role: "PROCESSING",
        isActive: true,
        lastLogin: isoHoursAgo(1),
        createdAt: isoDaysAgo(40)
      },
      {
        id: "user-billing",
        name: "Meera Billing",
        email: "billing@textiletrack.test",
        passwordHash: demoPasswordHashes.billing,
        role: "BILLING",
        isActive: true,
        lastLogin: isoDaysAgo(2),
        createdAt: isoDaysAgo(38)
      }
    ],
    dealers: [
      {
        id: "dealer-sunrise",
        name: "Sunrise Mills",
        contactPerson: "Ketan Shah",
        phone: "+91 98765 43001",
        email: "accounts@sunrisemills.test",
        address: "Ring Road Textile Market, Surat",
        gstin: "24ABCDE1234F1Z2",
        createdAt: isoDaysAgo(120),
        updatedAt: isoDaysAgo(5)
      },
      {
        id: "dealer-riverbend",
        name: "Riverbend Fabrics",
        contactPerson: "Priya Mehta",
        phone: "+91 98765 43002",
        email: "orders@riverbend.test",
        address: "Udhna Industrial Area, Surat",
        gstin: "24LMNOP4567G1Z7",
        createdAt: isoDaysAgo(98),
        updatedAt: isoDaysAgo(3)
      },
      {
        id: "dealer-kohinoor",
        name: "Kohinoor Textiles",
        contactPerson: "Hamid Khan",
        phone: "+91 98765 43003",
        address: "Pandol Textile Market, Surat",
        createdAt: isoDaysAgo(76),
        updatedAt: isoDaysAgo(8)
      },
      {
        id: "dealer-orbit",
        name: "Orbit Prints",
        contactPerson: "Bhavesh Patel",
        phone: "+91 98765 43004",
        email: "billing@orbitprints.test",
        address: "Sachin GIDC, Surat",
        gstin: "24QRST7890H1Z4",
        createdAt: isoDaysAgo(51),
        updatedAt: isoDaysAgo(1)
      }
    ],
    godowns: [
      {
        id: "godown-main",
        name: "Main Godown",
        location: "North Block",
        sections: [
          { sectionName: "A-01", capacity: 5000 },
          { sectionName: "A-12", capacity: 4000 },
          { sectionName: "B-04", capacity: 3500 }
        ],
        createdAt: isoDaysAgo(140)
      },
      {
        id: "godown-finished",
        name: "Finished Goods",
        location: "Dispatch Bay",
        sections: [
          { sectionName: "F-02", capacity: 2500 },
          { sectionName: "F-09", capacity: 2500 }
        ],
        createdAt: isoDaysAgo(110)
      }
    ],
    processTemplates: [
      {
        id: "template-dark",
        name: "Dark Color Dyeing",
        description: "Two dyeing rounds followed by drying, finishing, packing, and dispatch.",
        createdAt: isoDaysAgo(100),
        steps: [
          { stepNumber: 1, stepName: "Raw Material Received", stepType: "RAW_MATERIAL_RECEIVED" },
          { stepNumber: 2, stepName: "Godown Storage", stepType: "GODOWN_STORAGE" },
          { stepNumber: 3, stepName: "Dyeing Round 1", stepType: "DYEING" },
          { stepNumber: 4, stepName: "Dyeing Round 2", stepType: "DYEING" },
          { stepNumber: 5, stepName: "Drying", stepType: "DRYING" },
          { stepNumber: 6, stepName: "Finishing", stepType: "FINISHING" },
          { stepNumber: 7, stepName: "Packing", stepType: "PACKING" },
          { stepNumber: 8, stepName: "Dispatch", stepType: "DISPATCH" }
        ]
      },
      {
        id: "template-light",
        name: "Light Shade Process",
        description: "Single dyeing cycle with standard finishing.",
        createdAt: isoDaysAgo(92),
        steps: [
          { stepNumber: 1, stepName: "Raw Material Received", stepType: "RAW_MATERIAL_RECEIVED" },
          { stepNumber: 2, stepName: "Godown Storage", stepType: "GODOWN_STORAGE" },
          { stepNumber: 3, stepName: "Dyeing", stepType: "DYEING" },
          { stepNumber: 4, stepName: "Drying", stepType: "DRYING" },
          { stepNumber: 5, stepName: "Finishing", stepType: "FINISHING" },
          { stepNumber: 6, stepName: "Packing", stepType: "PACKING" },
          { stepNumber: 7, stepName: "Dispatch", stepType: "DISPATCH" }
        ]
      }
    ],
    lots: [
      {
        id: "lot-1027",
        lotNumber: "LOT-1027",
        dealerId: "dealer-orbit",
        materialType: "Rayon",
        quantity: 900,
        unit: "Meters",
        challanNumber: "DC-7781",
        vehicleNumber: "GJ-05-CD-7781",
        receivedAt: isoHoursAgo(4),
        rate: 38,
        rateUnit: "per meter",
        godownId: "godown-main",
        rackSection: "B-04",
        processTemplateId: "template-light",
        currentStepIndex: 1,
        currentStatus: "RECEIVED",
        remarks: "Urgent shade approval expected tomorrow.",
        createdBy: "user-entry",
        createdAt: isoHoursAgo(4),
        updatedAt: isoHoursAgo(4)
      },
      {
        id: "lot-1026",
        lotNumber: "LOT-1026",
        dealerId: "dealer-riverbend",
        materialType: "Linen Blend",
        quantity: 1200,
        unit: "Meters",
        challanNumber: "RB-4109",
        vehicleNumber: "GJ-16-AA-4109",
        receivedAt: isoDaysAgo(5),
        rate: 54,
        rateUnit: "per meter",
        godownId: "godown-finished",
        rackSection: "F-02",
        processTemplateId: "template-light",
        currentStepIndex: 7,
        currentStatus: "READY_FOR_DISPATCH",
        createdBy: "user-entry",
        createdAt: isoDaysAgo(5),
        updatedAt: isoHoursAgo(8)
      },
      {
        id: "lot-1025",
        lotNumber: "LOT-1025",
        dealerId: "dealer-kohinoor",
        materialType: "Polyester",
        quantity: 640,
        unit: "Kg",
        challanNumber: "KTX-9921",
        receivedAt: isoDaysAgo(1),
        rate: 82,
        rateUnit: "per kg",
        godownId: "godown-main",
        rackSection: "A-01",
        processTemplateId: "template-dark",
        currentStepIndex: 2,
        currentStatus: "IN_GODOWN",
        createdBy: "user-entry",
        createdAt: isoDaysAgo(1),
        updatedAt: isoHoursAgo(18)
      },
      {
        id: "lot-1024",
        lotNumber: "LOT-1024",
        dealerId: "dealer-sunrise",
        materialType: "Cotton",
        quantity: 1800,
        unit: "Meters",
        challanNumber: "SM-2218",
        vehicleNumber: "GJ-05-BR-2218",
        receivedAt: isoDaysAgo(6),
        rate: 42,
        rateUnit: "per meter",
        godownId: "godown-main",
        rackSection: "A-12",
        processTemplateId: "template-dark",
        currentStepIndex: 4,
        currentStatus: "IN_PROCESS",
        remarks: "Shade correction running in second round.",
        createdBy: "user-entry",
        createdAt: isoDaysAgo(6),
        updatedAt: isoHoursAgo(54)
      },
      {
        id: "lot-1019",
        lotNumber: "LOT-1019",
        dealerId: "dealer-sunrise",
        materialType: "Cotton",
        quantity: 1500,
        unit: "Meters",
        challanNumber: "SM-2177",
        vehicleNumber: "GJ-05-AZ-2177",
        receivedAt: isoDaysAgo(14),
        rate: 41,
        rateUnit: "per meter",
        godownId: "godown-finished",
        rackSection: "F-09",
        processTemplateId: "template-light",
        currentStepIndex: 7,
        currentStatus: "DISPATCHED",
        createdBy: "user-entry",
        createdAt: isoDaysAgo(14),
        updatedAt: isoDaysAgo(3)
      },
      {
        id: "lot-1014",
        lotNumber: "LOT-1014",
        dealerId: "dealer-riverbend",
        materialType: "Viscose",
        quantity: 1100,
        unit: "Meters",
        challanNumber: "RB-4021",
        vehicleNumber: "GJ-01-TR-4021",
        receivedAt: isoDaysAgo(20),
        rate: 47,
        rateUnit: "per meter",
        godownId: "godown-finished",
        rackSection: "F-02",
        processTemplateId: "template-dark",
        currentStepIndex: 8,
        currentStatus: "COMPLETED",
        createdBy: "user-entry",
        createdAt: isoDaysAgo(20),
        updatedAt: isoDaysAgo(2)
      }
    ],
    stageUpdates: [
      {
        id: "stage-1027-1",
        lotId: "lot-1027",
        stepNumber: 1,
        stepName: "Raw Material Received",
        status: "COMPLETED",
        quantityDone: 900,
        quantityPending: 0,
        updatedBy: "user-entry",
        remarks: "Initial inward entry completed.",
        timestamp: isoHoursAgo(4)
      },
      {
        id: "stage-1024-1",
        lotId: "lot-1024",
        stepNumber: 1,
        stepName: "Raw Material Received",
        status: "COMPLETED",
        quantityDone: 1800,
        quantityPending: 0,
        updatedBy: "user-entry",
        timestamp: isoDaysAgo(6)
      },
      {
        id: "stage-1024-2",
        lotId: "lot-1024",
        stepNumber: 2,
        stepName: "Godown Storage",
        status: "COMPLETED",
        quantityDone: 1800,
        quantityPending: 0,
        updatedBy: "user-godown",
        timestamp: isoDaysAgo(5)
      },
      {
        id: "stage-1024-3",
        lotId: "lot-1024",
        stepNumber: 3,
        stepName: "Dyeing Round 1",
        status: "COMPLETED",
        quantityDone: 1800,
        quantityPending: 0,
        updatedBy: "user-process",
        remarks: "First round completed, shade slightly light.",
        timestamp: isoDaysAgo(4)
      },
      {
        id: "stage-1024-4",
        lotId: "lot-1024",
        stepNumber: 4,
        stepName: "Dyeing Round 2",
        status: "STARTED",
        quantityDone: 950,
        quantityPending: 850,
        updatedBy: "user-process",
        remarks: "Second round in progress.",
        timestamp: isoHoursAgo(54)
      }
    ],
    bills: [
      {
        id: "bill-1019",
        lotId: "lot-1019",
        dealerId: "dealer-sunrise",
        materialCost: 61500,
        dyeingCost: 18000,
        finishingCost: 7500,
        packingCost: 2400,
        additionalCharges: 1600,
        additionalChargesDescription: "Shade matching",
        totalAmount: 91000,
        paidAmount: 0,
        paymentStatus: "PENDING",
        invoiceNumber: "INV-2026-0001",
        invoiceDate: isoDaysAgo(3),
        challanDetails: "DO-1019",
        dispatchDate: isoDaysAgo(3),
        vehicleNumber: "GJ-05-AZ-2177",
        transporterName: "Patel Roadlines",
        createdBy: "user-billing",
        createdAt: isoDaysAgo(3),
        updatedAt: isoDaysAgo(3)
      },
      {
        id: "bill-1014",
        lotId: "lot-1014",
        dealerId: "dealer-riverbend",
        materialCost: 51700,
        dyeingCost: 14000,
        finishingCost: 6800,
        packingCost: 1900,
        additionalCharges: 0,
        totalAmount: 74400,
        paidAmount: 74400,
        paymentStatus: "PAID",
        invoiceNumber: "INV-2026-0002",
        invoiceDate: isoDaysAgo(2),
        challanDetails: "DO-1014",
        dispatchDate: isoDaysAgo(2),
        vehicleNumber: "GJ-01-TR-4021",
        transporterName: "Speedline Logistics",
        createdBy: "user-billing",
        createdAt: isoDaysAgo(2),
        updatedAt: isoDaysAgo(2)
      }
    ],
    alerts: [
      {
        id: "alert-stuck-1024",
        type: "LOT_STUCK",
        lotId: "lot-1024",
        message: "LOT-1024 has been in Dyeing Round 2 for more than 48 hours.",
        isRead: false,
        createdAt: isoHoursAgo(5)
      },
      {
        id: "alert-ready-1026",
        type: "DISPATCH_READY",
        lotId: "lot-1026",
        message: "LOT-1026 is ready for dispatch.",
        isRead: false,
        createdAt: isoHoursAgo(8)
      },
      {
        id: "alert-billing-1019",
        type: "BILLING_OVERDUE",
        lotId: "lot-1019",
        message: "LOT-1019 is dispatched and still has pending billing collection.",
        isRead: true,
        createdAt: isoDaysAgo(1)
      }
    ],
    activityLogs: [
      {
        id: "activity-1",
        actorId: "user-process",
        actorName: "Ravi Dyeing",
        action: "started LOT-1024 Dyeing Round 2",
        entityType: "LOT",
        entityId: "lot-1024",
        createdAt: isoHoursAgo(54)
      },
      {
        id: "activity-2",
        actorId: "user-billing",
        actorName: "Meera Billing",
        action: "raised invoice INV-2026-0001 for LOT-1019",
        entityType: "BILL",
        entityId: "bill-1019",
        createdAt: isoDaysAgo(3)
      },
      {
        id: "activity-3",
        actorId: "user-entry",
        actorName: "Nisha Entry",
        action: "created new lot LOT-1027 for Orbit Prints",
        entityType: "LOT",
        entityId: "lot-1027",
        createdAt: isoHoursAgo(4)
      },
      {
        id: "activity-4",
        actorId: "user-process",
        actorName: "Ravi Dyeing",
        action: "completed packing for LOT-1026",
        entityType: "LOT",
        entityId: "lot-1026",
        createdAt: isoHoursAgo(8)
      }
    ]
  };
}
