"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../../../components/Button";
import { Invoice, InvoiceStatus } from "../../../../types/invoice";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../../utils/logger";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
};

const getStatusBadge = (status: InvoiceStatus) => {
  switch (status) {
    case InvoiceStatus.PAID:
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-300 flex items-center gap-1">
          <CheckCircleIcon className="w-4 h-4" />
          پرداخت شده
        </span>
      );
    case InvoiceStatus.OVERDUE:
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium border border-red-300 flex items-center gap-1">
          <XCircleIcon className="w-4 h-4" />
          سررسید گذشته
        </span>
      );
    case InvoiceStatus.CANCELLED:
      return (
        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium border border-gray-300 flex items-center gap-1">
          لغو شده
        </span>
      );
    default:
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-300 flex items-center gap-1">
          <ClockIcon className="w-4 h-4" />
          در انتظار پرداخت
        </span>
      );
  }
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const { isAuthenticated } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;

      try {
        setIsLoading(true);
        const data = await apiClient.getInvoice(invoiceId);
        setInvoice(data);
      } catch (error) {
        logger.error("Error fetching invoice", error);
        toast.error("خطا در دریافت فاکتور");
        router.push("/dashboard/supplier/invoices");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && invoiceId) {
      fetchInvoice();
    }
  }, [isAuthenticated, invoiceId, router]);

  const handleDownloadInvoice = async () => {
    if (!invoiceId) return;

    try {
      const blob = await apiClient.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice?.invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("فاکتور با موفقیت دانلود شد");
    } catch (error) {
      logger.error("Error downloading invoice", error);
      toast.error("خطا در دانلود فاکتور");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/supplier/invoices"
          className="text-brand-medium-blue hover:text-brand-dark-blue mb-4 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          بازگشت به لیست فاکتورها
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
              فاکتور #{invoice.invoiceNumber}
            </h1>
            <p className="text-brand-medium-blue">
              {invoice.project?.title || 'پروژه'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(invoice.status)}
            <Button
              variant="primary"
              onClick={handleDownloadInvoice}
            >
              <DocumentArrowDownIcon className="w-5 h-5 ml-2" />
              دانلود PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supplier Info */}
          <div>
            <h3 className="text-lg font-semibold text-brand-dark-blue mb-4">اطلاعات تولیدکننده</h3>
            <div className="space-y-2 text-brand-medium-blue">
              <p>
                <span className="font-medium">نام:</span> {invoice.supplier?.workshopName || invoice.supplier?.fullName || '-'}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-semibold text-brand-dark-blue mb-4">اطلاعات مشتری</h3>
            <div className="space-y-2 text-brand-medium-blue">
              <p>
                <span className="font-medium">نام:</span> {invoice.customer?.fullName || '-'}
              </p>
            </div>
          </div>

          {/* Project Info */}
          <div>
            <h3 className="text-lg font-semibold text-brand-dark-blue mb-4">اطلاعات پروژه</h3>
            <div className="space-y-2 text-brand-medium-blue">
              <p>
                <span className="font-medium">عنوان:</span> {invoice.project?.title || '-'}
              </p>
              {invoice.quote?.deliveryTimeDays && (
                <p>
                  <span className="font-medium">زمان تحویل:</span> {invoice.quote.deliveryTimeDays} روز
                </p>
              )}
            </div>
          </div>

          {/* Invoice Info */}
          <div>
            <h3 className="text-lg font-semibold text-brand-dark-blue mb-4">اطلاعات فاکتور</h3>
            <div className="space-y-2 text-brand-medium-blue">
              <p>
                <span className="font-medium">تاریخ ایجاد:</span> {formatDate(invoice.createdAt)}
              </p>
              <p>
                <span className="font-medium">تاریخ سررسید:</span> {formatDate(invoice.dueDate)}
              </p>
              {invoice.paidAt && (
                <p>
                  <span className="font-medium">تاریخ پرداخت:</span> {formatDate(invoice.paidAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray p-6">
        <h3 className="text-lg font-semibold text-brand-dark-blue mb-4">جزئیات فاکتور</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-brand-medium-gray">
            <span className="text-brand-medium-blue">مبلغ پایه:</span>
            <span className="font-semibold text-brand-dark-blue">{formatPrice(invoice.amount)}</span>
          </div>
          {invoice.tax && invoice.tax > 0 && (
            <div className="flex justify-between items-center py-3 border-b border-brand-medium-gray">
              <span className="text-brand-medium-blue">مالیات:</span>
              <span className="font-semibold text-brand-dark-blue">{formatPrice(invoice.tax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-3 bg-brand-off-white rounded-lg px-4">
            <span className="text-lg font-semibold text-brand-dark-blue">جمع کل:</span>
            <span className="text-xl font-bold text-brand-dark-blue">{formatPrice(invoice.totalAmount)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 pt-6 border-t border-brand-medium-gray">
            <h4 className="font-semibold text-brand-dark-blue mb-2">یادداشت:</h4>
            <p className="text-brand-medium-blue whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

