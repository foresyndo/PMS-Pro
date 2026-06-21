import {
  UserProfile,
  Property,
  Unit,
  Tenant,
  Reservation,
  Contract,
  Invoice,
  PaymentLog,
  Expense,
  MaintenanceTicket,
  InventoryItem,
  NotificationLog,
  ReportSnapshot,
  Lead
} from "./types";

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: "u-admin",
    name: "Sahrul Viona (Owner)",
    email: "sahrul.viona12@gmail.com",
    phone: "081234567890",
    role: "Owner",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    uid: "u-manager",
    name: "Andi Wijaya",
    email: "manager@pmspro.com",
    phone: "08122334455",
    role: "Manager",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    uid: "u-recep",
    name: "Siti Rahma",
    email: "receptionist@pmspro.com",
    phone: "08577889900",
    role: "Receptionist",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    uid: "u-finance",
    name: "Budi Santoso",
    email: "finance@pmspro.com",
    phone: "08991122334",
    role: "Finance",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    uid: "u-staff",
    name: "Eko Prasetyo",
    email: "maintenance@pmspro.com",
    phone: "08775544332",
    role: "Staff Maintenance",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"
  },
  {
    uid: "u-marketing",
    name: "Riana Putri",
    email: "sales@pmspro.com",
    phone: "08126688220",
    role: "Marketing/Sales",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
  },
  {
    uid: "u-tenant1",
    name: "Rian Aditya",
    email: "rian@gmail.com",
    phone: "083811223344",
    role: "Tenant/Penyewa",
    isActive: true,
    avatarUrl: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&auto=format&fit=crop&q=80"
  }
];

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: "prop-1",
    name: "Hotel Mentari Indah",
    type: "Hotel",
    address: "Jl. Sunset Road No. 88, Kuta, Bali",
    landArea: 1500,
    buildingArea: 2500,
    floorsCount: 4,
    buildYear: 2021,
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "prop-2",
    name: "Kost Singgah Sini Eksklusif",
    type: "Kost",
    address: "Jl. Dago Asri No. 12, Coblong, Bandung",
    landArea: 400,
    buildingArea: 750,
    floorsCount: 3,
    buildYear: 2023,
    imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "prop-3",
    name: "Apartemen Senopati Luxury",
    type: "Apartement",
    address: "Kav 18-20, Jl. Bojonegoro, Kebayoran Baru, Jakarta Selatan",
    landArea: 5000,
    buildingArea: 35000,
    floorsCount: 25,
    buildYear: 2019,
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "prop-4",
    name: "Villa Serene Sunset",
    type: "Villa",
    address: "Jl. Pemelisan Agung, Ungasan, Kuta Selatan, Bali",
    landArea: 800,
    buildingArea: 350,
    floorsCount: 2,
    buildYear: 2022,
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&auto=format&fit=crop&q=80"
  }
];

export const INITIAL_UNITS: Unit[] = [
  // Hotel Mentari Indah Units
  {
    id: "unit-101",
    propertyId: "prop-1",
    unitNumber: "101",
    floor: 1,
    type: "Deluxe Single Room",
    size: 28,
    price: 650000, // Daily (simulated monthly equivalent in calculation)
    status: "Occupied",
    facilities: ["Wi-Fi", "AC", "TV Kabel", "Minibar", "Water Heater", "Breakfast"],
    imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "unit-102",
    propertyId: "prop-1",
    unitNumber: "102",
    floor: 1,
    type: "Deluxe Single Room",
    size: 28,
    price: 650000,
    status: "Maintenance",
    facilities: ["Wi-Fi", "AC", "TV Kabel", "Minibar", "Water Heater", "Breakfast"],
    imageUrl: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "unit-201",
    propertyId: "prop-1",
    unitNumber: "201",
    floor: 2,
    type: "Executive Suite",
    size: 45,
    price: 1200000,
    status: "Occupied",
    facilities: ["Wi-Fi", "AC", "Smart TV", "Bathtub", "Kitchenette", "Coffee Maker"],
    imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "unit-202",
    propertyId: "prop-1",
    unitNumber: "202",
    floor: 2,
    type: "Executive Suite",
    size: 45,
    price: 1200000,
    status: "Available",
    facilities: ["Wi-Fi", "AC", "Smart TV", "Bathtub", "Kitchenette", "Coffee Maker"],
    imageUrl: "https://images.unsplash.com/photo-1611891405120-44b20a324b42?w=500&auto=format&fit=crop&q=80"
  },

  // Kost Singgah Sini Units
  {
    id: "unit-k1",
    propertyId: "prop-2",
    unitNumber: "Room 01",
    floor: 1,
    type: "Kost Eksklusif Putra",
    size: 16,
    price: 2500000, // Monthly
    status: "Occupied",
    facilities: ["Kamar Mandi Dalam", "AC", "Kasur Springbed", "Meja Belajar", "Lemari Dua Pintu", "Wi-Fi"],
    imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "unit-k2",
    propertyId: "prop-2",
    unitNumber: "Room 02",
    floor: 1,
    type: "Kost Eksklusif Campur",
    size: 18,
    price: 2800000,
    status: "Reserved",
    facilities: ["Kamar Mandi Dalam", "AC", "TV", "Springbed Set", "Desk", "Wi-Fi"],
    imageUrl: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "unit-k3",
    propertyId: "prop-2",
    unitNumber: "Room 03",
    floor: 2,
    type: "Kost Eksklusif Campur",
    size: 18,
    price: 2800000,
    status: "Available",
    facilities: ["Kamar Mandi Dalam", "AC", "TV", "Springbed Set", "Desk", "Wi-Fi"],
    imageUrl: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "unit-k4",
    propertyId: "prop-2",
    unitNumber: "Room 04",
    floor: 2,
    type: "Kost Standard",
    size: 14,
    price: 1800000,
    status: "Cleaning",
    facilities: ["Kamar Mandi Luar", "AC", "Kasur Single", "Meja", "Wi-Fi"],
    imageUrl: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&auto=format&fit=crop&q=80"
  },

  // Apartemen Senopati Luxury
  {
    id: "unit-apt12a",
    propertyId: "prop-3",
    unitNumber: "12A-05",
    floor: 12,
    type: "2 Bedroom Condo",
    size: 75,
    price: 18500000, // Monthly
    status: "Occupied",
    facilities: ["Full Kitchen", "Balcony Skyline", "Washing Machine", "Fiber High-speed Wifi", "Pool Pass"],
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "unit-apt15b",
    propertyId: "prop-3",
    unitNumber: "15B-02",
    floor: 15,
    type: "Studio Deluxe",
    size: 42,
    price: 11000000,
    status: "Available",
    facilities: ["Queen Bed", "Kitchenette", "Wardrobe", "AC", "Smart TV", "City View Window"],
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80"
  },

  // Villa Serene Sunset
  {
    id: "unit-villa01",
    propertyId: "prop-4",
    unitNumber: "Villa 3-Bed Private",
    floor: 1,
    type: "Private Pool Villa",
    size: 350,
    price: 4500000, // Daily (Monthly equivalent used)
    status: "Occupied",
    facilities: ["Private Pool", "Garden", "Living Room Gazebo", "Surround Sound Home Theater", "BBQ Set", "Kitchen Specialist"],
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format&fit=crop&q=80"
  }
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: "t-1",
    name: "Rian Aditya",
    ktpNumber: "32731102940001",
    phone: "083811223344",
    address: "Jl. Margahayu Blok G No. 9, Bandung",
    jobTitle: "Software Engineer di GoTo",
    emergencyContact: {
      name: "Setyo Aditya",
      relation: "Orang Tua (Ayah)",
      phone: "081299887766"
    },
    createdAt: "2023-01-15T12:00:00Z"
  },
  {
    id: "t-2",
    name: "Jessica Lauren",
    ktpNumber: "3174092205960004",
    phone: "081288997766",
    address: "Kencana Loka Sektor VII, BSD City, Tangerang",
    jobTitle: "Investment Analyst di Mandiri Sekuritas",
    emergencyContact: {
      name: "Marcus Lauren",
      relation: "Kakak Kandung",
      phone: "081122445566"
    },
    createdAt: "2024-03-10T08:30:00Z"
  },
  {
    id: "t-3",
    name: "Danu Broto",
    ktpNumber: "33211504910003",
    phone: "085211002299",
    address: "Sleman Permai II, Ngaglik, Sleman, Yogyakarta",
    jobTitle: "Business Consultant",
    emergencyContact: {
      name: "Indah Broto",
      relation: "Istri",
      phone: "085211002277"
    },
    createdAt: "2024-05-01T15:10:00Z"
  }
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: "res-101",
    tenantId: "t-1",
    propertyId: "prop-2", // Kost
    unitId: "unit-k1",
    checkInDate: "2026-01-01",
    checkOutDate: "2026-12-31",
    deposit: 1000000,
    totalPrice: 30000000,
    paymentStatus: "Paid",
    status: "Checked In",
    createdAt: "2025-12-25T11:00:00Z"
  },
  {
    id: "res-102",
    tenantId: "t-2",
    propertyId: "prop-3", // Apartemen
    unitId: "unit-apt12a",
    checkInDate: "2026-03-15",
    checkOutDate: "2027-03-15",
    deposit: 15000000,
    totalPrice: 222000000,
    paymentStatus: "Paid",
    status: "Checked In",
    createdAt: "2026-03-01T10:00:00Z"
  },
  {
    id: "res-103",
    tenantId: "t-3",
    propertyId: "prop-1", // Hotel (harian dimodelkan reservasi panjang/aktif)
    unitId: "unit-101",
    checkInDate: "2026-06-18",
    checkOutDate: "2026-06-25",
    deposit: 500000,
    totalPrice: 4550000,
    paymentStatus: "Paid",
    status: "Checked In",
    createdAt: "2026-06-15T09:12:00Z"
  },
  {
    id: "res-104",
    tenantId: "t-2",
    propertyId: "prop-2",
    unitId: "unit-k2",
    checkInDate: "2026-07-01",
    checkOutDate: "2027-01-01",
    deposit: 1000000,
    totalPrice: 16800000,
    paymentStatus: "Unpaid",
    status: "Confirmed",
    createdAt: "2026-06-19T14:45:00Z"
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: "cnt-1",
    tenantId: "t-1",
    propertyId: "prop-2",
    unitId: "unit-k1",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    monthlyRent: 2500000,
    termsDescription: "Penyewa setuju untuk melakukan pembayaran kost paling lambat tanggal 5 setiap bulannya. Kerusakan interior akibat kelalaian penyewa wajib diganti mandiri. Hewan peliharaan dilarang.",
    tenantSignature: "MOCK_SIGN_RIAN_ADITYA_2026",
    ownerSignature: "MOCK_SIGN_SAHRUL_VIONA",
    createdAt: "2025-12-28T14:00:00Z"
  },
  {
    id: "cnt-2",
    tenantId: "t-2",
    propertyId: "prop-3",
    unitId: "unit-apt12a",
    startDate: "2026-03-15",
    endDate: "2027-03-15",
    monthlyRent: 18500000,
    termsDescription: "Biaya sewa bersih tidak termasuk Iuran Pengelolaan Lingkungan (IPL), listrik, air, dan internet. Deposit hangus apabila kontrak diputus sepihak sebelum 6 bulan masa hunian.",
    tenantSignature: "MOCK_SIGN_JESSICA_LAUREN",
    ownerSignature: "MOCK_SIGN_SAHRUL_VIONA",
    createdAt: "2026-03-12T10:15:00Z"
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "inv-201",
    tenantId: "t-1",
    propertyId: "prop-2",
    unitId: "unit-k1",
    invoiceNumber: "INV/PRO3/2026/06-001",
    items: [
      { id: "itm-1", description: "Biaya Sewa Unit Room 01 (Juni 2026)", amount: 2500000 },
      { id: "itm-2", description: "Biaya Air Flat", amount: 50000 },
      { id: "itm-3", description: "Surcharge Listrik (AC Berlebih)", amount: 150000 }
    ],
    subtotal: 2700000,
    tax: 0,
    totalAmount: 2700000,
    dueDate: "2026-06-05",
    status: "Paid",
    createdAt: "2026-06-01T07:00:00Z"
  },
  {
    id: "inv-202",
    tenantId: "t-2",
    propertyId: "prop-3",
    unitId: "unit-apt12a",
    invoiceNumber: "INV/PRO3/2026/06-002",
    items: [
      { id: "itm-4", description: "Biaya Sewa Unit Apt 12A-05 (Juni 2026)", amount: 18500000 },
      { id: "itm-5", description: "Iuran Pengelolaan Lingkungan & Kebersihan", amount: 850000 }
    ],
    subtotal: 19350000,
    tax: 193500, // 1% simulated tax
    totalAmount: 19543500,
    dueDate: "2026-06-15",
    status: "Paid",
    createdAt: "2026-06-01T07:10:00Z"
  },
  {
    id: "inv-203",
    tenantId: "t-1",
    propertyId: "prop-2",
    unitId: "unit-k1",
    invoiceNumber: "INV/PRO3/2026/07-001",
    items: [
      { id: "itm-6", description: "Tagihan Sewa Kamar Kost Room 01 (Juli 2026)", amount: 2500000 },
      { id: "itm-7", description: "Surcharge Utility Prabayar", amount: 100000 }
    ],
    subtotal: 2600000,
    tax: 0,
    totalAmount: 2600000,
    dueDate: "2026-07-05",
    status: "Unpaid",
    createdAt: "2026-06-20T08:00:00Z"
  }
];

export const INITIAL_PAYMENTS: PaymentLog[] = [
  {
    id: "pay-1",
    invoiceId: "inv-201",
    amount: 2700000,
    paymentDate: "2026-06-04T10:15:00Z",
    method: "Transfer",
    transactionNumber: "TRF/BCA/940292-12",
    proofUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "pay-2",
    invoiceId: "inv-202",
    amount: 19543500,
    paymentDate: "2026-06-14T11:45:00Z",
    method: "Transfer",
    transactionNumber: "TRF/MANDIRI/33829-AB",
    proofUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&auto=format&fit=crop&q=80"
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    propertyId: "prop-1", // Hotel
    category: "Electricity",
    amount: 8500000,
    expenseDate: "2026-06-10",
    description: "Pembayaran tagihan listrik PLN regional Kuta Juni 2026",
    createdBy: "Budi Santoso"
  },
  {
    id: "exp-2",
    propertyId: "prop-2", // Kost
    category: "Internet",
    amount: 550000,
    expenseDate: "2026-06-12",
    description: "Langganan internet fiber Biznet 150 Mbps untuk area komunal kost",
    createdBy: "Budi Santoso"
  },
  {
    id: "exp-3",
    propertyId: "prop-1", // Hotel
    category: "Maintenance",
    amount: 1200000,
    expenseDate: "2026-06-14",
    description: "Perbaikan pipa pembuangan air kotor di lobi utama",
    createdBy: "Eko Prasetyo"
  },
  {
    id: "exp-4",
    propertyId: "prop-2", // Kost
    category: "Salary",
    amount: 3200000,
    expenseDate: "2026-06-15",
    description: "Gaji Petugas Kebersihan Malam Kost (M. Somad)",
    createdBy: "Budi Santoso"
  }
];

export const INITIAL_MAINTENANCE: MaintenanceTicket[] = [
  {
    id: "maint-1",
    propertyId: "prop-2",
    unitId: "unit-k1",
    reportedBy: "Rian Aditya",
    description: "Pipa saluran shower kamar mandi merembes dan menetes sepanjang malam",
    priority: "High",
    technician: "Eko Prasetyo",
    status: "Process",
    cost: 150000,
    createdAt: "2026-06-19T09:00:00Z"
  },
  {
    id: "maint-2",
    propertyId: "prop-1",
    unitId: "unit-102",
    reportedBy: "Receptionist Siti",
    description: "AC Kamar 102 mengeluarkan suara berisik keras dan tidak dingin sama sekali",
    priority: "Medium",
    technician: "Eko Prasetyo",
    status: "Open",
    createdAt: "2026-06-20T11:30:00Z"
  },
  {
    id: "maint-3",
    propertyId: "prop-3",
    unitId: "unit-apt12a",
    reportedBy: "Jessica Lauren",
    description: "Engsel pintu laci dapur kitchen-set longgar dan terlepas",
    priority: "Low",
    technician: "Rizky (External Specialist)",
    status: "Completed",
    cost: 85000,
    createdAt: "2026-06-12T14:20:00Z"
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "invt-1",
    propertyId: "prop-1",
    location: "Kamar 101, 102, 201, 202",
    name: "Air Conditioner Daikin 1 PK",
    quantity: 12,
    price: 3800000,
    condition: "Good"
  },
  {
    id: "invt-2",
    propertyId: "prop-2",
    location: "Kamar Kost Utama",
    name: "Kasur Springbed Inoac 120x200",
    quantity: 8,
    price: 1650000,
    condition: "Good"
  },
  {
    id: "invt-3",
    propertyId: "prop-2",
    location: "Lobi & Dapur Bersama",
    name: "Kulkas Sharp 2 Pintu",
    quantity: 1,
    price: 3200000,
    condition: "Needs Repair"
  },
  {
    id: "invt-4",
    propertyId: "prop-1",
    location: "Resto Hotel",
    name: "Smart TV LG 43 Inch",
    quantity: 4,
    price: 4100000,
    condition: "Good"
  }
];

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [
  {
    id: "not-1",
    title: "Booking Baru Kost",
    message: "Reservasi baru diterima untuk Kost Singgah Sini Kamar Room 02 atas nama Jessica Lauren.",
    category: "booking",
    isRead: false,
    createdAt: "2026-06-19T14:45:00Z"
  },
  {
    id: "not-2",
    title: "Pembayaran Sukses",
    message: "Pembayaran Invoice INV/PRO3/2026/06-002 sebesar Rp 19.543.500 telah berhasil diterima via Bank Transfer.",
    category: "payment",
    isRead: true,
    createdAt: "2026-06-14T11:47:00Z"
  },
  {
    id: "not-3",
    title: "Tiket Perbaikan Dilaporkan",
    message: "Tenant Rian Aditya melaporkan gangguan: Pipa saluran shower merembes di Kamar Kost Room 01.",
    category: "maintenance",
    isRead: false,
    createdAt: "2026-06-19T09:05:00Z"
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "Fachry Hidayat",
    phone: "081928374823",
    source: "Instagram",
    status: "Follow Up",
    notes: "Minat sewa unit studio apartemen senopati bulanan, tanya ketersediaan parkir tambahan.",
    agentName: "Riana Putri",
    createdAt: "2026-06-19T10:00:00Z"
  },
  {
    id: "lead-2",
    name: "Amalia Siregar",
    phone: "085223399120",
    source: "Google Search",
    status: "Prospect",
    notes: "Mencari sewa villa harian untuk acara retreat gathering keluarga bali awal september.",
    agentName: "Riana Putri",
    createdAt: "2026-06-20T15:30:00Z"
  },
  {
    id: "lead-3",
    name: "Nanda Wardhana",
    phone: "083866771120",
    source: "Referral",
    status: "Deal",
    notes: "Setuju sewa kost Singgah sini, telah melakukan reservasi unit kamar Room 02.",
    agentName: "Siti Rahma",
    createdAt: "2026-06-18T11:20:00Z"
  }
];
