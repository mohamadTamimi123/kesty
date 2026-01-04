"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../../components/Button";
import { Invoice, InvoiceStatus } from "../../../types/invoice";
import apiClient from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import logger from "../../../utils/logger";
import LoadingSpinner from "../../../components/LoadingSpinner";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
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

export default function CustomerInvoicesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'ALL'>('ALL');

  const fetchInvoices = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const data = await apiClient.getCustomerInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error("Error fetching invoices", error);
      toast.error("خطا در دریافت فاکتورها");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices();
    }
  }, [isAuthenticated, fetchInvoices]);

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const blob = await apiClient.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
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

  const filteredInvoices = invoices.filter((invoice) => 
    filterStatus === 'ALL' || invoice.status === filterStatus
  );

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === InvoiceStatus.PENDING).length,
    paid: invoices.filter((i) => i.status === InvoiceStatus.PAID).length,
    overdue: invoices.filter((i) => i.status === InvoiceStatus.OVERDUE).length,
    totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
    pendingAmount: invoices
      .filter((i) => i.status === InvoiceStatus.PENDING)
      .reduce((sum, i) => sum + i.totalAmount, 0),
    paidAmount: invoices
      .filter((i) => i.status === InvoiceStatus.PAID)
      .reduce((sum, i) => sum + i.totalAmount, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/customer"
          className="text-brand-medium-blue hover:text-brand-dark-blue mb-4 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          بازگشت به داشبورد
        </Link>
        <h1 className="text-3xl font-bold text-brand-dark-blue font-display mb-2">
          فاکتورهای من
        </h1>
        <p className="text-brand-medium-blue">
          مشاهده و مدیریت فاکتورهای دریافتی
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-5 border border-brand-medium-gray">
          <div className="text-3xl font-bold text-brand-dark-blue mb-1">
            {stats.total}
          </div>
          <div className="text-sm text-brand-medium-blue">کل فاکتورها</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <div className="text-3xl font-bold text-yellow-600 mb-1">
            {stats.pending}
          </div>
          <div className="text-sm text-brand-medium-blue">در انتظار پرداخت</div>
          <div className="text-xs text-brand-medium-blue mt-1">
            {formatPrice(stats.pendingAmount)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 border border-green-200 bg-gradient-to-br from-green-50 to-white">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {stats.paid}
          </div>
          <div className="text-sm text-brand-medium-blue">پرداخت شده</div>
          <div className="text-xs text-brand-medium-blue mt-1">
            {formatPrice(stats.paidAmount)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5 border border-brand-medium-gray">
          <div className="text-2xl font-bold text-brand-dark-blue mb-1">
            {formatPrice(stats.totalAmount)}
          </div>
          <div className="text-sm text-brand-medium-blue">جمع کل</div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border border-brand-medium-gray">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-brand-medium-blue">
              <FunnelIcon className="w-5 h-5" />
              <span className="text-sm font-medium">فیلتر وضعیت:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-brand-medium-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                همه
              </button>
              <button
                onClick={() => setFilterStatus(InvoiceStatus.PENDING)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === InvoiceStatus.PENDING
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                در انتظار پرداخت
              </button>
              <button
                onClick={() => setFilterStatus(InvoiceStatus.PAID)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === InvoiceStatus.PAID
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                پرداخت شده
              </button>
              <button
                onClick={() => setFilterStatus(InvoiceStatus.OVERDUE)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === InvoiceStatus.OVERDUE
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                سررسید گذشته
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentArrowDownIcon className="w-16 h-16 text-brand-medium-gray mx-auto mb-4" />
            <p className="text-brand-medium-blue mb-2">
              {filterStatus === 'ALL'
                ? 'شما هنوز فاکتوری دریافت نکرده‌اید'
                : 'فاکتوری با این وضعیت وجود ندارد'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-off-white border-b border-brand-medium-gray">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">شماره فاکتور</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">پروژه</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">تولیدکننده</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">مبلغ</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">تاریخ سررسید</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">وضعیت</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-medium-gray">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-brand-off-white transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-dark-blue">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="text-xs text-brand-medium-blue">
                        {formatDate(invoice.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-dark-blue">
                        {invoice.project?.title || 'پروژه'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-brand-medium-blue">
                        {invoice.supplier?.workshopName || invoice.supplier?.fullName || 'تولیدکننده'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-dark-blue">
                        {formatPrice(invoice.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-brand-medium-blue">
                        {formatDate(invoice.dueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/customer/invoices/${invoice.id}`}>
                          <Button variant="neutral" size="sm">
                            <EyeIcon className="w-4 h-4 ml-2" />
                            مشاهده
                          </Button>
                        </Link>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <DocumentArrowDownIcon className="w-4 h-4 ml-2" />
                          دانلود
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

