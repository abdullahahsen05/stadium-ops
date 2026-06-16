export type UserRole = "Project Manager" | "Site Engineer" | "Finance Officer" | "Procurement Officer" | "Viewer";

export type Zone =
  | "North Stand" | "South Stand" | "East Stand" | "West Stand"
  | "VIP Pavilion" | "Player Tunnel" | "Main Pitch" | "Parking Area"
  | "Floodlight Zone" | "Drainage Zone" | "Concourse Level" | "Media Box";

export type MaterialCategory =
  | "Concrete" | "Steel" | "Electrical" | "Drainage" | "Seating"
  | "Lighting" | "Glass" | "Finishing" | "Aggregates" | "Miscellaneous";

export interface Material {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  unitCost: number;
  primaryVendorId: string;
  zone: Zone;
  lastUpdated: string;
}

export type VendorStatus = "Active" | "On Hold" | "Blacklisted";

export interface Vendor {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: VendorStatus;
  totalPOValue: number;
  pendingInvoiceAmount: number;
  totalDeliveries: number;
  onTimeDeliveries: number;
  rating: number;
  joinedDate: string;
}

export type POStatus = "Draft" | "Sent" | "Partial" | "Delivered" | "Cancelled" | "Completed";

export interface PurchaseOrderItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unitCost: number;
  deliveredQty: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  zone: Zone;
  status: POStatus;
  createdDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes: string;
  sentDate?: string;
  completedDate?: string;
}

export type DeliveryStatus = "Scheduled" | "In Transit" | "Partial" | "Delivered" | "Delayed" | "Rejected";
export type ConditionStatus = "Good" | "Damaged" | "Partial";

export interface Delivery {
  id: string;
  deliveryNumber: string;
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  materialId: string;
  materialName: string;
  orderedQty: number;
  deliveredQty: number;
  receivedDate: string;
  expectedDate: string;
  receivedBy: string;
  zone: Zone;
  condition: ConditionStatus;
  status: DeliveryStatus;
  notes: string;
}

export type InvoiceStatus = "Pending" | "Approved" | "Rejected" | "Paid" | "Overdue";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  poId: string;
  poNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes: string;
  approvedDate?: string;
  rejectedDate?: string;
  rejectionReason?: string;
}

export type PaymentMethod = "Bank Transfer" | "Cheque" | "Online" | "Cash";

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  notes: string;
}

export type DisposalStatus = "Pending" | "Scheduled" | "Removed" | "Disposed";
export type DebrisType = "Concrete Waste" | "Steel Scrap" | "Mixed Construction Waste" | "Soil" | "Formwork Timber" | "Packaging" | "Hazardous" | "Electrical Waste";

export interface DebrisRecord {
  id: string;
  debrisNumber: string;
  type: DebrisType;
  quantity: number;
  unit: string;
  zone: Zone;
  removalVendor: string;
  removalDate: string;
  cost: number;
  disposalStatus: DisposalStatus;
  notes: string;
}

export type AlertPriority = "Critical" | "High" | "Medium" | "Low";
export type AlertStatus = "Open" | "Acknowledged" | "Resolved";
export type AlertType =
  | "low_stock" | "critical_stock" | "overdue_invoice" | "due_soon_invoice"
  | "delayed_delivery" | "vendor_hold" | "payment_overdue" | "debris_overdue";

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  description: string;
  relatedModule: string;
  relatedId: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
}

export type ActivityModule =
  | "Inventory" | "Purchase Order" | "Delivery" | "Invoice"
  | "Payment" | "Vendor" | "Debris" | "Alert" | "Settings";

export type ActivityAction =
  | "created" | "updated" | "deleted" | "approved" | "rejected"
  | "paid" | "received" | "acknowledged" | "resolved" | "sent" | "reset";

export interface Activity {
  id: string;
  module: ActivityModule;
  action: ActivityAction;
  description: string;
  referenceId: string;
  referenceNumber: string;
  performedBy: string;
  role: UserRole;
  timestamp: string;
}

export interface AppState {
  materials: Material[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  deliveries: Delivery[];
  invoices: Invoice[];
  payments: Payment[];
  debris: DebrisRecord[];
  alerts: Alert[];
  activity: Activity[];
}
