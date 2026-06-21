export type UserRole =
  | "Super Admin"
  | "Owner"
  | "Manager"
  | "Receptionist"
  | "Finance"
  | "Marketing/Sales"
  | "Staff Maintenance"
  | "Tenant/Penyewa";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
}

export type PropertyType = "Hotel" | "Apartement" | "Kost" | "Villa" | "Gedung Komersial";

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address: string;
  landArea: number; // m2
  buildingArea: number; // m2
  floorsCount: number;
  buildYear: number;
  imageUrl?: string;
  documents?: string[];
}

export type UnitStatus = "Available" | "Reserved" | "Occupied" | "Maintenance" | "Cleaning";

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor: number;
  type: string; // Deluxe, Suite, Standard, Kost Campur, etc.
  size: number; // m2
  price: number; // per month
  status: UnitStatus;
  facilities: string[];
  imageUrl?: string;
  floorPlanUrl?: string;
}

export interface Tenant {
  id: string;
  name: string;
  ktpNumber: string;
  ktpUrl?: string;
  phone: string;
  address: string;
  jobTitle: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  createdAt: string;
}

export type ReservationStatus = "Pending" | "Confirmed" | "Checked In" | "Checked Out" | "Cancelled";
export type PaymentStatus = "Paid" | "Unpaid" | "Overdue";

export interface Reservation {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  checkInDate: string;
  checkOutDate: string;
  deposit: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  status: ReservationStatus;
  createdAt: string;
}

export interface Contract {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  termsDescription: string;
  tenantSignature?: string; // base64 or coordinates
  ownerSignature?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  dueDate: string;
  status: PaymentStatus;
  createdAt: string;
}

export type PaymentMethod = "Transfer" | "Cash" | "QRIS" | "Payment Gateway";

export interface PaymentLog {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  transactionNumber: string;
  proofUrl?: string;
}

export type ExpenseCategory = "Maintenance" | "Salary" | "Electricity" | "Water" | "Internet" | "Operasional";

export interface Expense {
  id: string;
  propertyId: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  description: string;
  createdBy: string;
}

export type MaintenancePriority = "Low" | "Medium" | "High" | "Critical";
export type MaintenanceStatus = "Open" | "Process" | "Completed";

export interface MaintenanceTicket {
  id: string;
  propertyId: string;
  unitId: string;
  reportedBy: string; // Tenant ID or Tenant Name
  description: string;
  imageUrl?: string;
  priority: MaintenancePriority;
  technician?: string;
  status: MaintenanceStatus;
  cost?: number;
  createdAt: string;
}

export type AssetCondition = "Good" | "Needs Repair" | "Broken";

export interface InventoryItem {
  id: string;
  propertyId: string;
  location: string; // "Room 101" or "Lobby"
  name: string;
  quantity: number;
  price: number;
  condition: AssetCondition;
}

export interface NotificationLog {
  id: string;
  title: string;
  message: string;
  category: "booking" | "payment" | "maintenance" | "contract" | "system";
  isRead: boolean;
  createdAt: string;
}

export interface ReportSnapshot {
  id: string;
  title: string;
  month: string;
  totalRevenue: number;
  totalExpense: number;
  avgOccupancy: number;
  notes: string;
  generatedBy: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string; // Instagram, Google, Referral
  status: "Prospect" | "Follow Up" | "Deal" | "Lost";
  notes: string;
  agentName: string;
  createdAt: string;
}
