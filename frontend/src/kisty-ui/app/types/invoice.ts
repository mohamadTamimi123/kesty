export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  project?: {
    id: string;
    title: string;
    description: string;
  };
  quoteId: string;
  quote?: {
    id: string;
    price: number;
    deliveryTimeDays: number | null;
  };
  supplierId: string;
  supplier?: {
    id: string;
    fullName: string;
    workshopName?: string;
  };
  customerId: string;
  customer?: {
    id: string;
    fullName: string;
  };
  amount: number;
  tax?: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceData {
  projectId: string;
  quoteId: string;
  notes?: string;
}

export interface InvoiceStats {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
}

