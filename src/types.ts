export type UserRole =
  | "Super Admin"
  | "Owner"
  | "Manager"
  | "Receptionist"
  | "Finance"
  | "Marketing/Sales"
  | "Staff Maintenance"
  | "Tenant/Penyewa"
  | "HR";

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
  email?: string;
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

export type WhatsAppStatus = "Belum Terkirim" | "Terkirim" | "Dibaca" | "Gagal";

export interface WhatsAppSchedulerLog {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  tenantName: string;
  tenantPhone: string;
  unitName: string;
  amount: number;
  dueDate: string;
  triggerType: "H-3 Reminder" | "H-7 Reminder" | "H-1 Reminder" | "Hari H" | "Manual Batch";
  executedAt: string;
  status: "Success" | "Failed" | "Queued";
  messagePreview: string;
}

export interface WhatsAppSchedulerConfig {
  isEnabled: boolean;
  daysBeforeDue: number; // default 3 for H-3
  scheduledTime: string; // e.g. "09:00"
  targetStatus: ("Unpaid" | "Overdue")[];
  autoMarkSent: boolean;
  customTemplate: string;
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
  whatsappStatus?: WhatsAppStatus;
  whatsappSentAt?: string;
  whatsappPhone?: string;
  createdAt: string;
}

export type PaymentMethod = "Transfer" | "Cash" | "QRIS" | "Payment Gateway" | "EDC" | "Credit Card";

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

export interface WorkChatMessage {
  id: string;
  senderName: string;
  senderRole: UserRole;
  channel: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: "Active" | "Inactive";
  joinedDate: string;
  salary: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: "Present" | "Absent" | "Late" | "Leave";
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: string; // e.g., "Juni 2026"
  basicSalary: number;
  allowance: number;
  deductions: number;
  netSalary: number;
  status: "Paid" | "Pending";
  paymentDate?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: "Annual" | "Sick" | "Maternity" | "Unpaid" | "Other";
  startDate: string;
  endDate: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

export type ShiftType = "Morning" | "Afternoon" | "Night" | "Off";

export interface ShiftSchedule {
  id: string;
  employeeId: string;
  date: string; // ISO Date string, e.g., "2026-07-01"
  shift: ShiftType;
  updatedAt?: string;
}

// ================= FINANCIAL & ACCOUNTING REPORT TYPES =================
export type AccountCategory = 
  | "Aset Lancar" 
  | "Aset Tetap" 
  | "Liabilitas Jangka Pendek" 
  | "Liabilitas Jangka Panjang" 
  | "Ekuitas" 
  | "Pendapatan" 
  | "HPP" 
  | "Beban Operasional" 
  | "Beban Lainnya";

export interface ChartOfAccount {
  code: string;
  name: string;
  category: AccountCategory;
  normalBalance: "Debit" | "Kredit";
  initialBalance: number;
  currentBalance: number;
  description?: string;
}

export interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  journalNumber: string;
  date: string;
  description: string;
  referenceType: "Invoice" | "Payment" | "Expense" | "Payroll" | "Manual" | "Transfer" | "Adjustment";
  referenceId?: string;
  lines: JournalEntryLine[];
  createdBy: string;
}

export interface VendorPayable {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  category: string;
  amount: number;
  paidAmount: number;
  invoiceDate: string;
  dueDate: string;
  status: "Unpaid" | "Partial" | "Paid" | "Overdue";
  notes?: string;
  paymentHistory?: {
    date: string;
    amount: number;
    method: string;
    refNumber: string;
  }[];
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  currentBalance: number;
  reconciledBalance: number;
  lastReconciledAt?: string;
  type: "Bank" | "Kas";
}

export interface BankMutation {
  id: string;
  accountId: string;
  date: string;
  description: string;
  type: "In" | "Out";
  amount: number;
  balanceAfter: number;
  reconciled: boolean;
  reference?: string;
}

export interface FinancialBudget {
  id: string;
  category: string;
  department: string;
  period: string; // e.g., "2026-09"
  budgetedAmount: number;
}

export interface FinancialClosingPeriod {
  periodKey: string;
  type: "Monthly" | "Annual";
  isLocked: boolean;
  closedAt?: string;
  closedBy?: string;
  netIncomeCalculated: number;
  notes?: string;
}

export interface FinancialAuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}



