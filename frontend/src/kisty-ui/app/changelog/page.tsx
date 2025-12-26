"use client";

import { useState, useEffect } from "react";
import ChangelogItem from "../components/ChangelogItem";
import {
  ChangelogTask,
  TaskStatus,
  ChangeType,
  TestStatus,
  ChangelogStats,
  ChangelogFilters,
} from "../types/changelog";
import apiClient from "../lib/api";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type ViewMode = "tasks" | "progress" | "system-flow" | "requirements-platform";
type ProgressSubTab = "overview" | "priorities";

export default function ChangelogPage() {
  const [tasks, setTasks] = useState<ChangelogTask[]>([]);
  const [doneTasks, setDoneTasks] = useState<ChangelogTask[]>([]);
  const [pendingTasks, setPendingTasks] = useState<ChangelogTask[]>([]);
  const [stats, setStats] = useState<ChangelogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("tasks");
  const [progressSubTab, setProgressSubTab] = useState<ProgressSubTab>("overview");
  
  // Advanced filters
  const [changeTypeFilter, setChangeTypeFilter] = useState<ChangeType | "all">("all");
  const [testStatusFilter, setTestStatusFilter] = useState<TestStatus | "all">("all");
  const [moduleFilter, setModuleFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const filters: ChangelogFilters = {};
        
        if (filter !== "all") {
          filters.status = filter;
        }
        if (changeTypeFilter !== "all") {
          filters.changeType = changeTypeFilter;
        }
        if (testStatusFilter !== "all") {
          filters.testStatus = testStatusFilter;
        }
        if (moduleFilter) {
          filters.relatedModule = moduleFilter;
        }
        if (searchQuery) {
          filters.search = searchQuery;
        }

        const [allTasks, statsData] = await Promise.all([
          apiClient.getChangelogTasks(filters),
          apiClient.getChangelogStats(),
        ]);

        setTasks(allTasks);
        setStats(statsData);
        setDoneTasks(allTasks.filter((t) => t.status === TaskStatus.DONE));
        setPendingTasks(
          allTasks.filter(
            (t) => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS
          )
        );
      } catch (error: any) {
        console.error("Error fetching changelog:", error);
        toast.error(error.response?.data?.message || "خطا در دریافت لیست تسک‌ها");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filter, changeTypeFilter, testStatusFilter, moduleFilter, searchQuery]);

  const filteredTasks =
    filter === "all"
      ? tasks
      : tasks.filter((t) => t.status === filter);

  // Get unique modules from tasks
  const uniqueModules = Array.from(
    new Set(tasks.map((t) => t.relatedModule).filter((m): m is string => !!m))
  ).sort();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-brand-medium-blue">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-dark-blue font-display mb-4">
            تغییرات و تسک‌های پروژه
          </h1>
          <p className="text-lg text-brand-medium-blue mb-6">
            لیست کامل تسک‌های انجام شده و در حال انجام پروژه کیستی
          </p>
          
          {/* View Mode Tabs */}
          <div className="flex gap-2 border-b border-brand-medium-gray flex-wrap">
            <button
              onClick={() => setViewMode("tasks")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                viewMode === "tasks"
                  ? "border-brand-medium-blue text-brand-medium-blue"
                  : "border-transparent text-brand-medium-gray hover:text-brand-dark-blue"
              }`}
            >
              تسک‌ها
            </button>
            <button
              onClick={() => setViewMode("progress")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                viewMode === "progress"
                  ? "border-brand-medium-blue text-brand-medium-blue"
                  : "border-transparent text-brand-medium-gray hover:text-brand-dark-blue"
              }`}
            >
              <ChartBarIcon className="w-5 h-5" />
              گزارش پیشرفت
            </button>
            <button
              onClick={() => setViewMode("system-flow")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                viewMode === "system-flow"
                  ? "border-brand-medium-blue text-brand-medium-blue"
                  : "border-transparent text-brand-medium-gray hover:text-brand-dark-blue"
              }`}
            >
              <DocumentTextIcon className="w-5 h-5" />
              فلو فعلی سیستم
            </button>
            <button
              onClick={() => setViewMode("requirements-platform")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                viewMode === "requirements-platform"
                  ? "border-brand-medium-blue text-brand-medium-blue"
                  : "border-transparent text-brand-medium-gray hover:text-brand-dark-blue"
              }`}
            >
              <CogIcon className="w-5 h-5" />
              پلتفرم نیازمندی‌ها
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-medium-gray mb-1">کل تسک‌ها</p>
                  <p className="text-2xl font-bold text-brand-dark-blue">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-brand-light-sky rounded-full flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-brand-medium-blue" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-medium-gray mb-1">انجام شده</p>
                  <p className="text-2xl font-bold text-green-600">{stats.done}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-medium-gray mb-1">در انتظار</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-medium-gray mb-1">در حال انجام</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ArrowPathIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray" />
            <input
              type="text"
              placeholder="جستجو در عنوان و توضیحات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
            />
          </div>
        </div>

        {/* Basic Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-brand-medium-blue text-white"
                : "bg-white text-brand-dark-blue border border-brand-medium-gray hover:bg-brand-light-sky"
            }`}
          >
            همه
          </button>
          <button
            onClick={() => setFilter(TaskStatus.DONE)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === TaskStatus.DONE
                ? "bg-green-600 text-white"
                : "bg-white text-brand-dark-blue border border-brand-medium-gray hover:bg-green-50"
            }`}
          >
            انجام شده
          </button>
          <button
            onClick={() => setFilter(TaskStatus.IN_PROGRESS)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === TaskStatus.IN_PROGRESS
                ? "bg-blue-600 text-white"
                : "bg-white text-brand-dark-blue border border-brand-medium-gray hover:bg-blue-50"
            }`}
          >
            در حال انجام
          </button>
          <button
            onClick={() => setFilter(TaskStatus.PENDING)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === TaskStatus.PENDING
                ? "bg-gray-600 text-white"
                : "bg-white text-brand-dark-blue border border-brand-medium-gray hover:bg-gray-50"
            }`}
          >
            در انتظار
          </button>
          
          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              showAdvancedFilters
                ? "bg-purple-600 text-white"
                : "bg-white text-brand-dark-blue border border-brand-medium-gray hover:bg-purple-50"
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            فیلترهای پیشرفته
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mb-6 bg-white rounded-lg border border-brand-medium-gray p-6">
            <h3 className="text-lg font-semibold text-brand-dark-blue mb-4">
              فیلترهای پیشرفته
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Change Type Filter */}
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  نوع تغییر
                </label>
                <select
                  value={changeTypeFilter}
                  onChange={(e) => setChangeTypeFilter(e.target.value as ChangeType | "all")}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                >
                  <option value="all">همه</option>
                  <option value={ChangeType.FEATURE}>ویژگی جدید</option>
                  <option value={ChangeType.BUGFIX}>رفع باگ</option>
                  <option value={ChangeType.REFACTOR}>بازسازی</option>
                  <option value={ChangeType.SECURITY}>امنیت</option>
                  <option value={ChangeType.PERFORMANCE}>عملکرد</option>
                  <option value={ChangeType.DOCUMENTATION}>مستندات</option>
                </select>
              </div>

              {/* Test Status Filter */}
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  وضعیت تست
                </label>
                <select
                  value={testStatusFilter}
                  onChange={(e) => setTestStatusFilter(e.target.value as TestStatus | "all")}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                >
                  <option value="all">همه</option>
                  <option value={TestStatus.NOT_TESTED}>تست نشده</option>
                  <option value={TestStatus.IN_TESTING}>در حال تست</option>
                  <option value={TestStatus.PASSED}>تست شده</option>
                  <option value={TestStatus.FAILED}>تست ناموفق</option>
                </select>
              </div>

              {/* Module Filter */}
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  ماژول
                </label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-brand-medium-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                >
                  <option value="">همه ماژول‌ها</option>
                  {uniqueModules.map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setChangeTypeFilter("all");
                  setTestStatusFilter("all");
                  setModuleFilter("");
                  setSearchQuery("");
                }}
                className="px-4 py-2 text-sm text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
              >
                پاک کردن فیلترها
              </button>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {filter === "all" ? (
          <div className="space-y-6">
            {/* Done Tasks Section */}
            {doneTasks.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-brand-dark-blue mb-4 font-display flex items-center gap-2">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  تسک‌های انجام شده ({doneTasks.length})
                </h2>
                <div className="space-y-4">
                  {doneTasks.map((task) => (
                    <ChangelogItem key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )}

            {/* Pending Tasks Section */}
            {pendingTasks.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-brand-dark-blue mb-4 font-display flex items-center gap-2">
                  <ClockIcon className="w-6 h-6 text-gray-600" />
                  تسک‌های باقی‌مانده ({pendingTasks.length})
                </h2>
                <div className="space-y-4">
                  {pendingTasks.map((task) => (
                    <ChangelogItem key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <ChangelogItem key={task.id} task={task} />
              ))
            ) : (
              <div className="bg-white rounded-lg border border-brand-medium-gray p-12 text-center">
                <p className="text-brand-medium-blue">
                  تسکی با این وضعیت یافت نشد
                </p>
              </div>
            )}
          </div>
        )}

        {tasks.length === 0 && (
          <div className="bg-white rounded-lg border border-brand-medium-gray p-12 text-center">
            <p className="text-brand-medium-blue">هنوز تسکی ثبت نشده است</p>
          </div>
        )}

        {/* Progress Report View */}
        {viewMode === "progress" && (
          <div className="space-y-6">
            {/* Progress Sub Tabs */}
            <div className="flex gap-2 border-b border-brand-medium-gray">
              <button
                onClick={() => setProgressSubTab("overview")}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                  progressSubTab === "overview"
                    ? "border-brand-medium-blue text-brand-medium-blue"
                    : "border-transparent text-brand-medium-gray hover:text-brand-dark-blue"
                }`}
              >
                پیشرفت کلی و ماژول‌ها
              </button>
              <button
                onClick={() => setProgressSubTab("priorities")}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                  progressSubTab === "priorities"
                    ? "border-brand-medium-blue text-brand-medium-blue"
                    : "border-transparent text-brand-medium-gray hover:text-brand-dark-blue"
                }`}
              >
                اولویت‌ها و ویژگی‌های تکمیل شده
              </button>
            </div>

            {/* Overview Sub Tab */}
            {progressSubTab === "overview" && (
              <>
                {/* Overall Progress */}
                <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
                  <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                    گزارش پیشرفت کلی پروژه
                  </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">22</div>
                  <div className="text-brand-medium-blue">ماژول‌های کامل</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">1</div>
                  <div className="text-brand-medium-blue">ماژول‌های ناقص</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600 mb-2">0</div>
                  <div className="text-brand-medium-blue">ماژول‌های پیاده‌سازی نشده</div>
                </div>
              </div>
              <div className="bg-brand-light-sky rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-brand-dark-blue font-medium">پیشرفت کلی</span>
                  <span className="text-brand-dark-blue font-bold">96%</span>
                </div>
                <div className="w-full bg-white rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full"
                    style={{ width: "96%" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Modules Status Table */}
            <div className="bg-white rounded-lg border border-brand-medium-gray overflow-hidden">
              <div className="p-6 border-b border-brand-medium-gray">
                <h2 className="text-2xl font-bold text-brand-dark-blue font-display">
                  وضعیت ماژول‌ها
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-light-sky">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-brand-dark-blue">
                        ماژول
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-brand-dark-blue">
                        Backend
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-brand-dark-blue">
                        Frontend
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-brand-dark-blue">
                        وضعیت
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-brand-dark-blue">
                        اولویت
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-medium-gray">
                    {/* Complete Modules */}
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">احراز هویت</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">کاربران</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">شهرها</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">نمونه کارها</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">نظرات و امتیازها</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">مواد</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">مقالات آموزشی</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">بازارگاه ماشین‌آلات</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">Changelog</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">پیام‌رسان</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">پروفایل تولیدکننده</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">توزیع درخواست</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-brand-medium-gray">-</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">سابسکریپشن</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">پرداخت زرین‌پال</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">تیکتینگ</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">چت Real-Time</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">دسته‌بندی‌ها</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">پروژه‌ها</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">ماشین‌آلات</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          کامل
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                    
                    {/* Incomplete Modules */}
                    <tr className="bg-yellow-50">
                      <td className="px-6 py-4 font-medium text-brand-dark-blue">توزیع درخواست</td>
                      <td className="px-6 py-4 text-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-brand-medium-gray">-</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          ناقص
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-brand-medium-gray">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
              </>

            )}

            {/* Priorities Sub Tab */}
            {progressSubTab === "priorities" && (
              <>
                {/* Completed Priority Tasks */}
                <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display flex items-center gap-2">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                اولویت‌های تکمیل شده
              </h2>
              <div className="space-y-4">
                <div className="border-r-4 border-green-500 bg-green-50 p-4 rounded">
                  <h3 className="font-bold text-green-800 mb-2">اولویت 1 (بحرانی) - تکمیل شده ✓</h3>
                  <ul className="list-disc list-inside space-y-1 text-green-700">
                    <li>✓ سیستم پیام‌رسان Real-Time - پیاده‌سازی WebSocket Gateway و اتصال Frontend</li>
                    <li>✓ ساختار سلسله‌مراتبی Categories - API endpoints برای tree، root، children و path</li>
                    <li>✓ روابط many-to-many برای Supplier - API endpoints برای مدیریت روابط Category-Supplier</li>
                    <li>✓ صفحه پروفایل تولیدکننده عمومی - Backend و Frontend کامل با نمایش portfolio و reviews</li>
                  </ul>
                </div>
                <div className="border-r-4 border-green-500 bg-green-50 p-4 rounded">
                  <h3 className="font-bold text-green-800 mb-2">اولویت 2 (مهم) - تکمیل شده ✓</h3>
                  <ul className="list-disc list-inside space-y-1 text-green-700">
                    <li>✓ جدول machine_main_category - API endpoints برای مدیریت دسته‌های اصلی ماشین‌آلات</li>
                    <li>✓ فیلدهای Projects - همه فیلدها (subCategoryId، machineId، completionDate، clientName) موجود است</li>
                    <li>✓ سیستم توزیع درخواست - Controller و API endpoints برای توزیع پروژه‌ها به تولیدکنندگان</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Completed Features */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                ویژگی‌های تکمیل شده
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-green-300 bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">دسته‌بندی‌ها ✓</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ فیلد parent_id برای ساختار سلسله‌مراتبی</li>
                    <li>✓ فیلد level برای بهینه‌سازی</li>
                    <li>✓ جدول category_supplier برای روابط</li>
                    <li>✓ API endpoints برای tree، root، children و path</li>
                    <li>✓ API endpoints برای مدیریت روابط Supplier-Category</li>
                  </ul>
                </div>
                <div className="border border-green-300 bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">پروژه‌ها ✓</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ فیلد sub_category_id</li>
                    <li>✓ فیلد machine_id</li>
                    <li>✓ فیلد completion_date</li>
                    <li>✓ فیلد client_name</li>
                  </ul>
                </div>
                <div className="border border-green-300 bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">ماشین‌آلات ✓</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ جدول machine_main_category</li>
                    <li>✓ جدول machine_supplier</li>
                    <li>✓ API endpoints برای مدیریت machine_main_category</li>
                  </ul>
                </div>
                <div className="border border-green-300 bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">پیام‌رسان ✓</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ Entity: conversations</li>
                    <li>✓ Entity: messages</li>
                    <li>✓ ماژول Backend با WebSocket Gateway</li>
                    <li>✓ صفحات Frontend با Real-Time updates</li>
                    <li>✓ اتصال WebSocket برای پیام‌های لحظه‌ای</li>
                  </ul>
                </div>
                <div className="border border-green-300 bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">پروفایل تولیدکننده ✓</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ API endpoint برای دریافت supplier با slug</li>
                    <li>✓ صفحه Frontend با نمایش portfolio و reviews</li>
                    <li>✓ دکمه ارسال پیام مستقیم</li>
                    <li>✓ نمایش تخصص‌ها و آمار</li>
                  </ul>
                </div>
                <div className="border border-green-300 bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">توزیع درخواست ✓</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ Controller و API endpoints</li>
                    <li>✓ توزیع خودکار به تولیدکنندگان مرتبط</li>
                    <li>✓ ارسال notification از طریق پیام‌رسان</li>
                  </ul>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {/* System Flow View */}
        {viewMode === "system-flow" && (
          <div className="space-y-6">
            {/* System Introduction */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-4 font-display">
                معرفی سیستم
              </h2>
              <p className="text-brand-medium-blue leading-relaxed">
                پلتفرم کیستی یک شبکه تخصصی تولید و ساخت قطعات سفارشی است که به صورت مستقیم مهندسین و کارفرمایان را به بهترین کارگاه‌های ساخت و تولید در سراسر ایران متصل می‌کند. این پلتفرم امکان ثبت درخواست پروژه، جستجو در بین تولیدکنندگان، برقراری ارتباط، مدیریت پروژه‌ها و پرداخت را فراهم می‌کند.
              </p>
            </div>

            {/* Pages Structure */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                ساختار صفحات سیستم
              </h2>
              <div className="space-y-6">
                {/* Page 1: Home */}
                <div className="border-r-4 border-brand-medium-blue bg-brand-light-sky/30 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-brand-dark-blue mb-3">صفحه اصلی (Home)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">مسیر:</p>
                      <p className="text-brand-medium-blue">/</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">نقش کاربر:</p>
                      <p className="text-brand-medium-blue">همه کاربران (عمومی)</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">هدف:</p>
                      <p className="text-brand-medium-blue">نمایش دسته‌بندی‌ها، شهرها و امکان جستجو</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">ورودی‌ها:</p>
                      <p className="text-brand-medium-blue">شهر و دسته‌بندی انتخابی</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">خروجی‌ها:</p>
                      <p className="text-brand-medium-blue">لیست تولیدکنندگان، دسته‌بندی‌ها و شهرها</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">اکشن‌ها:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>جستجو بر اساس شهر و تخصص</li>
                        <li>ثبت نام به عنوان تولیدکننده</li>
                        <li>درخواست ساخت قطعه</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Validation:</p>
                      <p className="text-brand-medium-blue">حداقل یکی از فیلدهای شهر یا تخصص باید انتخاب شود</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Edge Cases:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>عدم وجود تولیدکننده در شهر یا تخصص انتخابی</li>
                        <li>خطا در بارگذاری داده‌ها</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Page 2: Login */}
                <div className="border-r-4 border-brand-medium-blue bg-brand-light-sky/30 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-brand-dark-blue mb-3">صفحه ورود</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">مسیر:</p>
                      <p className="text-brand-medium-blue">/login</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">نقش کاربر:</p>
                      <p className="text-brand-medium-blue">کاربران غیر لاگین شده</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">هدف:</p>
                      <p className="text-brand-medium-blue">ورود به حساب کاربری با شماره موبایل</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">ورودی‌ها:</p>
                      <p className="text-brand-medium-blue">شماره موبایل (11 رقمی)</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">خروجی‌ها:</p>
                      <p className="text-brand-medium-blue">ارسال OTP و هدایت به صفحه تایید</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">اکشن‌ها:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>ورود با شماره موبایل</li>
                        <li>ورود با گوگل (آماده برای پیاده‌سازی)</li>
                        <li>لینک به ثبت نام</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Validation:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>شماره موبایل باید 11 رقمی و با 09 شروع شود</li>
                        <li>فرمت صحیح: 09123456789</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Edge Cases:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>شماره موبایل تکراری (کاربر موجود است)</li>
                        <li>خطا در ارسال OTP</li>
                        <li>عدم دسترسی به شبکه</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Page 3: Register */}
                <div className="border-r-4 border-brand-medium-blue bg-brand-light-sky/30 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-brand-dark-blue mb-3">صفحه ثبت نام</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">مسیر:</p>
                      <p className="text-brand-medium-blue">/register</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">نقش کاربر:</p>
                      <p className="text-brand-medium-blue">کاربران جدید</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">هدف:</p>
                      <p className="text-brand-medium-blue">ایجاد حساب کاربری جدید (مشتری یا تولیدکننده)</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">ورودی‌ها:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>شماره موبایل</li>
                        <li>نام و نام خانوادگی</li>
                        <li>رمز عبور</li>
                        <li>تکرار رمز عبور</li>
                        <li>نوع حساب (مشتری/تولیدکننده)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">خروجی‌ها:</p>
                      <p className="text-brand-medium-blue">ارسال OTP و ذخیره اطلاعات در sessionStorage</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">اکشن‌ها:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>ثبت نام</li>
                        <li>انتخاب نقش کاربر</li>
                        <li>لینک به ورود</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Validation:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>شماره موبایل: 11 رقمی و با 09 شروع شود</li>
                        <li>نام و نام خانوادگی: الزامی و غیر خالی</li>
                        <li>رمز عبور: حداقل 8 کاراکتر، شامل حروف بزرگ، کوچک و عدد</li>
                        <li>تکرار رمز عبور: باید با رمز عبور مطابقت داشته باشد</li>
                        <li>موافقت با شرایط و قوانین: الزامی</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Edge Cases:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>شماره موبایل تکراری</li>
                        <li>رمز عبور ضعیف</li>
                        <li>عدم تطابق رمز عبور و تکرار آن</li>
                        <li>خطا در ارسال OTP</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Page 4: OTP */}
                <div className="border-r-4 border-brand-medium-blue bg-brand-light-sky/30 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-brand-dark-blue mb-3">صفحه تایید OTP</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">مسیر:</p>
                      <p className="text-brand-medium-blue">/otp?phone=...</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">نقش کاربر:</p>
                      <p className="text-brand-medium-blue">کاربران در حال ثبت نام/ورود</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">هدف:</p>
                      <p className="text-brand-medium-blue">تایید شماره موبایل با کد 6 رقمی</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">ورودی‌ها:</p>
                      <p className="text-brand-medium-blue">کد OTP (6 رقمی)</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">خروجی‌ها:</p>
                      <p className="text-brand-medium-blue">ورود به سیستم و هدایت به داشبورد مناسب</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">اکشن‌ها:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>تایید کد OTP</li>
                        <li>ارسال مجدد کد</li>
                        <li>تغییر شماره موبایل</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Validation:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>کد باید دقیقاً 6 رقم باشد</li>
                        <li>فقط اعداد مجاز است</li>
                        <li>تایمر 120 ثانیه‌ای برای ارسال مجدد</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Edge Cases:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>کد OTP اشتباه</li>
                        <li>انقضای کد OTP</li>
                        <li>عدم دریافت کد</li>
                        <li>قطع شدن شبکه در حین تایید</li>
                        <li>Back button در مرورگر</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Page 5: Dashboard Customer */}
                <div className="border-r-4 border-brand-medium-blue bg-brand-light-sky/30 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-brand-dark-blue mb-3">داشبورد مشتری</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">مسیر:</p>
                      <p className="text-brand-medium-blue">/dashboard/customer</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">نقش کاربر:</p>
                      <p className="text-brand-medium-blue">مشتری (CUSTOMER)</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">هدف:</p>
                      <p className="text-brand-medium-blue">مدیریت پروژه‌ها، پیام‌ها و پروفایل</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">ورودی‌ها:</p>
                      <p className="text-brand-medium-blue">Token احراز هویت</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">خروجی‌ها:</p>
                      <p className="text-brand-medium-blue">لیست پروژه‌ها، پیام‌ها و اطلاعات کاربر</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">اکشن‌ها:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>ایجاد پروژه جدید</li>
                        <li>مشاهده پروژه‌ها</li>
                        <li>مدیریت پیام‌ها</li>
                        <li>ویرایش پروفایل</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Validation:</p>
                      <p className="text-brand-medium-blue">نیاز به احراز هویت و نقش CUSTOMER</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Edge Cases:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>عدم احراز هویت (redirect به login)</li>
                        <li>نقش کاربر نامعتبر</li>
                        <li>خطا در بارگذاری داده‌ها</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Page 6: Create Project */}
                <div className="border-r-4 border-brand-medium-blue bg-brand-light-sky/30 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-brand-dark-blue mb-3">ایجاد پروژه</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">مسیر:</p>
                      <p className="text-brand-medium-blue">/dashboard/customer/projects/create</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">نقش کاربر:</p>
                      <p className="text-brand-medium-blue">مشتری (CUSTOMER)</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">هدف:</p>
                      <p className="text-brand-medium-blue">ثبت درخواست پروژه جدید</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">ورودی‌ها:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>عنوان پروژه</li>
                        <li>توضیحات</li>
                        <li>دسته‌بندی</li>
                        <li>زیردسته</li>
                        <li>ماشین‌آلات</li>
                        <li>تاریخ تکمیل</li>
                        <li>نام مشتری</li>
                        <li>تخمین تعداد</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">خروجی‌ها:</p>
                      <p className="text-brand-medium-blue">پروژه ثبت شده و توزیع به تولیدکنندگان</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">اکشن‌ها:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>ثبت پروژه</li>
                        <li>بازگشت به لیست پروژه‌ها</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Validation:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>عنوان پروژه: الزامی</li>
                        <li>دسته‌بندی: الزامی</li>
                        <li>تاریخ تکمیل: باید در آینده باشد</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Edge Cases:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>عدم انتخاب دسته‌بندی</li>
                        <li>تاریخ نامعتبر</li>
                        <li>خطا در ثبت پروژه</li>
                        <li>عدم توزیع به تولیدکنندگان</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Page 7: Messaging */}
                <div className="border-r-4 border-brand-medium-blue bg-brand-light-sky/30 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-brand-dark-blue mb-3">پیام‌رسانی</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">مسیر:</p>
                      <p className="text-brand-medium-blue">/messaging</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">نقش کاربر:</p>
                      <p className="text-brand-medium-blue">مشتری و تولیدکننده</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">هدف:</p>
                      <p className="text-brand-medium-blue">ارسال و دریافت پیام‌های Real-Time</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">ورودی‌ها:</p>
                      <p className="text-brand-medium-blue">متن پیام، فایل (اختیاری)</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">خروجی‌ها:</p>
                      <p className="text-brand-medium-blue">پیام‌های ارسال شده و دریافت شده</p>
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark-blue mb-1">اکشن‌ها:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>ارسال پیام</li>
                        <li>مشاهده مکالمات</li>
                        <li>اتصال WebSocket</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Validation:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>متن پیام: غیر خالی</li>
                        <li>اتصال WebSocket: باید برقرار باشد</li>
                      </ul>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-brand-dark-blue mb-1">Edge Cases:</p>
                      <ul className="text-brand-medium-blue list-disc list-inside">
                        <li>قطع اتصال WebSocket</li>
                        <li>عدم دریافت پیام Real-Time</li>
                        <li>خطا در ارسال پیام</li>
                        <li>پیام‌های تکراری</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Flows */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                فلوهای کاربری مرحله‌ای
              </h2>
              <div className="space-y-6">
                {/* Flow 1: Registration */}
                <div className="border-r-4 border-green-500 bg-green-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-green-800 mb-3">فلو ثبت نام</h3>
                  <div className="space-y-2 text-green-700">
                    <div className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <div>
                        <p className="font-medium">شروع:</p>
                        <p>کاربر وارد صفحه /register می‌شود</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <div>
                        <p className="font-medium">مرحله:</p>
                        <p>کاربر اطلاعات را وارد می‌کند (موبایل، نام، رمز عبور، نقش)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <div>
                        <p className="font-medium">نقطه تصمیم:</p>
                        <p>اگر Validation موفق باشد → ارسال OTP</p>
                        <p>اگر Validation ناموفق باشد → نمایش خطا</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">4.</span>
                      <div>
                        <p className="font-medium">مرحله:</p>
                        <p>کاربر به صفحه /otp هدایت می‌شود</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">5.</span>
                      <div>
                        <p className="font-medium">نقطه تصمیم:</p>
                        <p>اگر OTP صحیح باشد → ورود به سیستم و هدایت به داشبورد</p>
                        <p>اگر OTP اشتباه باشد → نمایش خطا و امکان ارسال مجدد</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">6.</span>
                      <div>
                        <p className="font-medium">خروجی نهایی:</p>
                        <p>کاربر وارد داشبورد می‌شود (مشتری یا تولیدکننده)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow 2: Login */}
                <div className="border-r-4 border-blue-500 bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-800 mb-3">فلو ورود</h3>
                  <div className="space-y-2 text-blue-700">
                    <div className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <div>
                        <p className="font-medium">شروع:</p>
                        <p>کاربر وارد صفحه /login می‌شود</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <div>
                        <p className="font-medium">مرحله:</p>
                        <p>کاربر شماره موبایل را وارد می‌کند</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <div>
                        <p className="font-medium">نقطه تصمیم:</p>
                        <p>اگر شماره معتبر باشد → ارسال OTP</p>
                        <p>اگر شماره نامعتبر باشد → نمایش خطا</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">4.</span>
                      <div>
                        <p className="font-medium">مرحله:</p>
                        <p>کاربر کد OTP را وارد می‌کند</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">5.</span>
                      <div>
                        <p className="font-medium">خروجی نهایی:</p>
                        <p>ورود به سیستم و هدایت به داشبورد مناسب</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow 3: Create Project */}
                <div className="border-r-4 border-purple-500 bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-purple-800 mb-3">فلو ایجاد پروژه</h3>
                  <div className="space-y-2 text-purple-700">
                    <div className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <div>
                        <p className="font-medium">شروع:</p>
                        <p>مشتری وارد /dashboard/customer/projects/create می‌شود</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <div>
                        <p className="font-medium">مرحله:</p>
                        <p>مشتری اطلاعات پروژه را وارد می‌کند</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <div>
                        <p className="font-medium">نقطه تصمیم:</p>
                        <p>اگر Validation موفق باشد → ثبت پروژه</p>
                        <p>اگر Validation ناموفق باشد → نمایش خطا</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">4.</span>
                      <div>
                        <p className="font-medium">مرحله:</p>
                        <p>سیستم پروژه را به تولیدکنندگان مرتبط توزیع می‌کند</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">5.</span>
                      <div>
                        <p className="font-medium">خروجی نهایی:</p>
                        <p>پروژه ثبت شده و تولیدکنندگان مطلع می‌شوند</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow 4: Messaging */}
                <div className="border-r-4 border-orange-500 bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-orange-800 mb-3">فلو پیام‌رسانی Real-Time</h3>
                  <div className="space-y-2 text-orange-700">
                    <div className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <div>
                        <p className="font-medium">شروع:</p>
                        <p>کاربر وارد صفحه /messaging می‌شود</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <div>
                        <p className="font-medium">مرحله:</p>
                        <p>اتصال WebSocket برقرار می‌شود</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <div>
                        <p className="font-medium">مرحله:</p>
                        <p>کاربر مکالمه را انتخاب می‌کند یا مکالمه جدید ایجاد می‌کند</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">4.</span>
                      <div>
                        <p className="font-medium">مرحله:</p>
                        <p>کاربر پیام را تایپ و ارسال می‌کند</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">5.</span>
                      <div>
                        <p className="font-medium">خروجی نهایی:</p>
                        <p>پیام از طریق WebSocket به کاربر مقابل ارسال می‌شود</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                Use Case ها
              </h2>
              <div className="space-y-4">
                <div className="border-r-4 border-brand-medium-blue bg-brand-light-sky/30 p-4 rounded-lg">
                  <p className="text-brand-dark-blue mb-2">
                    <span className="font-semibold">As a</span> مشتری،
                  </p>
                  <p className="text-brand-dark-blue mb-2">
                    <span className="font-semibold">I want</span> ثبت درخواست پروژه،
                  </p>
                  <p className="text-brand-dark-blue">
                    <span className="font-semibold">So that</span> بتوانم بهترین تولیدکنندگان را پیدا کنم و پروژه خود را به انجام برسانم.
                  </p>
                </div>
                <div className="border-r-4 border-brand-medium-blue bg-brand-light-sky/30 p-4 rounded-lg">
                  <p className="text-brand-dark-blue mb-2">
                    <span className="font-semibold">As a</span> تولیدکننده،
                  </p>
                  <p className="text-brand-dark-blue mb-2">
                    <span className="font-semibold">I want</span> مشاهده درخواست‌های پروژه مرتبط با تخصص من،
                  </p>
                  <p className="text-brand-dark-blue">
                    <span className="font-semibold">So that</span> بتوانم به مشتریان پیشنهاد بدهم و پروژه‌های جدید دریافت کنم.
                  </p>
                </div>
                <div className="border-r-4 border-brand-medium-blue bg-brand-light-sky/30 p-4 rounded-lg">
                  <p className="text-brand-dark-blue mb-2">
                    <span className="font-semibold">As a</span> کاربر،
                  </p>
                  <p className="text-brand-dark-blue mb-2">
                    <span className="font-semibold">I want</span> برقراری ارتباط Real-Time با طرف مقابل،
                  </p>
                  <p className="text-brand-dark-blue">
                    <span className="font-semibold">So that</span> بتوانم سریع‌تر و راحت‌تر مذاکره کنم.
                  </p>
                </div>
                <div className="border-r-4 border-brand-medium-blue bg-brand-light-sky/30 p-4 rounded-lg">
                  <p className="text-brand-dark-blue mb-2">
                    <span className="font-semibold">As a</span> مشتری،
                  </p>
                  <p className="text-brand-dark-blue mb-2">
                    <span className="font-semibold">I want</span> مشاهده پروفایل و نمونه کارهای تولیدکنندگان،
                  </p>
                  <p className="text-brand-dark-blue">
                    <span className="font-semibold">So that</span> بتوانم بهترین انتخاب را داشته باشم.
                  </p>
                </div>
              </div>
            </div>

            {/* QA Checklist */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                چک‌لیست QA برای فلوها
              </h2>
              <div className="space-y-6">
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-brand-dark-blue mb-3">فلو ثبت نام</h3>
                  <ul className="space-y-2 text-brand-medium-blue list-disc list-inside">
                    <li>✓ اگر OTP اشتباه وارد شود → نمایش خطای مناسب</li>
                    <li>✓ اگر شبکه قطع شود → نمایش پیام خطا و امکان تلاش مجدد</li>
                    <li>✓ اگر کاربر Back بزند → اطلاعات در sessionStorage باقی می‌ماند</li>
                    <li>✓ اگر شماره موبایل تکراری باشد → نمایش خطای مناسب</li>
                    <li>✓ اگر رمز عبور ضعیف باشد → نمایش راهنمای رمز قوی</li>
                    <li>✓ اگر تایمر OTP تمام شود → امکان ارسال مجدد</li>
                  </ul>
                </div>
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-brand-dark-blue mb-3">فلو ورود</h3>
                  <ul className="space-y-2 text-brand-medium-blue list-disc list-inside">
                    <li>✓ اگر OTP اشتباه وارد شود → نمایش خطا و امکان تلاش مجدد</li>
                    <li>✓ اگر شبکه قطع شود → نمایش پیام خطا</li>
                    <li>✓ اگر کاربر Back بزند → بازگشت به صفحه ورود</li>
                    <li>✓ اگر شماره موبایل ثبت نشده باشد → هدایت به ثبت نام</li>
                    <li>✓ اگر Token منقضی شود → هدایت به صفحه ورود</li>
                  </ul>
                </div>
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-brand-dark-blue mb-3">فلو ایجاد پروژه</h3>
                  <ul className="space-y-2 text-brand-medium-blue list-disc list-inside">
                    <li>✓ اگر Validation ناموفق باشد → نمایش خطاهای مربوطه</li>
                    <li>✓ اگر شبکه قطع شود → نمایش خطا و ذخیره محلی</li>
                    <li>✓ اگر کاربر Back بزند → هشدار از دست رفتن اطلاعات</li>
                    <li>✓ اگر توزیع ناموفق باشد → نمایش خطا اما ثبت پروژه</li>
                  </ul>
                </div>
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-brand-dark-blue mb-3">فلو پیام‌رسانی</h3>
                  <ul className="space-y-2 text-brand-medium-blue list-disc list-inside">
                    <li>✓ اگر WebSocket قطع شود → تلاش برای اتصال مجدد</li>
                    <li>✓ اگر پیام ارسال نشود → نمایش خطا و امکان ارسال مجدد</li>
                    <li>✓ اگر پیام تکراری دریافت شود → جلوگیری از نمایش تکراری</li>
                    <li>✓ اگر شبکه قطع شود → ذخیره پیام‌ها و ارسال بعد از اتصال</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* UX Improvements */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                پیشنهاد بهبود تجربه کاربری و کیفیت
              </h2>
              <div className="space-y-4">
                <div className="border-r-4 border-yellow-500 bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">بهبودهای پیشنهادی:</h3>
                  <ul className="space-y-2 text-yellow-700 list-disc list-inside">
                    <li>افزودن امکان فراموشی رمز عبور</li>
                    <li>بهبود مدیریت خطاها با پیام‌های واضح‌تر</li>
                    <li>افزودن Loading State برای عملیات‌های طولانی</li>
                    <li>بهینه‌سازی تجربه موبایل</li>
                    <li>افزودن امکان جستجوی پیشرفته در تولیدکنندگان</li>
                    <li>افزودن سیستم اعلان‌ها (Notifications)</li>
                    <li>بهبود مدیریت فایل‌ها در پیام‌رسانی</li>
                    <li>افزودن امکان ویرایش و حذف پیام‌ها</li>
                    <li>بهبود سیستم پرداخت و امنیت</li>
                    <li>افزودن امکان فیلتر و مرتب‌سازی در لیست‌ها</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Requirements Platform View */}
        {viewMode === "requirements-platform" && (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-brand-dark-blue via-brand-medium-blue to-brand-dark-blue text-white rounded-lg p-8 md:p-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display">
                پلتفرم استانداردسازی و اعتبارسنجی نیازمندی‌ها
              </h1>
              <p className="text-xl mb-6 text-brand-light-sky">
                راهکار جامع برای تحلیل، استانداردسازی و اعتبارسنجی نیازمندی‌های پروژه‌های نرم‌افزاری
              </p>
              <button className="px-8 py-3 bg-white text-brand-medium-blue font-bold rounded-lg hover:bg-brand-light-sky transition-all">
                درخواست دمو
              </button>
            </div>

            {/* Problem Section */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                چالش‌های نیازمندی‌های تعریف نشده
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-r-4 border-red-500 bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">تناقضات در نیازمندی‌ها</h3>
                  <p className="text-red-700 text-sm">
                    نیازمندی‌های متضاد و متناقض که باعث سردرگمی تیم توسعه و افزایش هزینه‌ها می‌شود.
                  </p>
                </div>
                <div className="border-r-4 border-red-500 bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">عدم شفافیت</h3>
                  <p className="text-red-700 text-sm">
                    نیازمندی‌های مبهم و نامشخص که باعث تفسیرهای مختلف و خطا در پیاده‌سازی می‌شود.
                  </p>
                </div>
                <div className="border-r-4 border-red-500 bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">نبود استاندارد</h3>
                  <p className="text-red-700 text-sm">
                    عدم وجود ساختار استاندارد برای تعریف و مستندسازی نیازمندی‌ها.
                  </p>
                </div>
                <div className="border-r-4 border-red-500 bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">ریسک بالا</h3>
                  <p className="text-red-700 text-sm">
                    افزایش ریسک پروژه به دلیل نیازمندی‌های ناقص یا اشتباه.
                  </p>
                </div>
              </div>
            </div>

            {/* Solution Section */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                راهکار ما
              </h2>
              <p className="text-brand-medium-blue leading-relaxed mb-4">
                پلتفرم ما با استفاده از الگوریتم‌های پیشرفته و ساختار استاندارد، نیازمندی‌های پروژه را تحلیل کرده، تناقضات را شناسایی می‌کند و خروجی استاندارد و آماده برای توسعه ارائه می‌دهد.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-brand-light-sky rounded-lg">
                  <div className="text-3xl font-bold text-brand-medium-blue mb-2">100%</div>
                  <div className="text-brand-dark-blue">شناسایی تناقضات</div>
                </div>
                <div className="text-center p-4 bg-brand-light-sky rounded-lg">
                  <div className="text-3xl font-bold text-brand-medium-blue mb-2">50%</div>
                  <div className="text-brand-dark-blue">کاهش ریسک</div>
                </div>
                <div className="text-center p-4 bg-brand-light-sky rounded-lg">
                  <div className="text-3xl font-bold text-brand-medium-blue mb-2">30%</div>
                  <div className="text-brand-dark-blue">کاهش هزینه</div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                چگونه کار می‌کند؟
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-medium-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-brand-dark-blue mb-2">ورود نیازمندی‌ها</h3>
                  <p className="text-brand-medium-blue text-sm">
                    نیازمندی‌های پروژه را به صورت ساختاریافته وارد کنید
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-medium-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-brand-dark-blue mb-2">تحلیل و اعتبارسنجی</h3>
                  <p className="text-brand-medium-blue text-sm">
                    سیستم به صورت خودکار تناقضات و مشکلات را شناسایی می‌کند
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-medium-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="text-lg font-semibold text-brand-dark-blue mb-2">خروجی استاندارد</h3>
                  <p className="text-brand-medium-blue text-sm">
                    دریافت مستندات استاندارد، User Stories و API Specs آماده
                  </p>
                </div>
              </div>
            </div>

            {/* Deliverables */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                خروجی‌های پلتفرم
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="font-semibold text-brand-dark-blue mb-2">✓ معرفی پروژه</h3>
                  <p className="text-sm text-brand-medium-blue">مستندات کامل پروژه با تمام جزئیات</p>
                </div>
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="font-semibold text-brand-dark-blue mb-2">✓ ماژول‌ها</h3>
                  <p className="text-sm text-brand-medium-blue">لیست کامل ماژول‌ها با روابط و وابستگی‌ها</p>
                </div>
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="font-semibold text-brand-dark-blue mb-2">✓ فلوها</h3>
                  <p className="text-sm text-brand-medium-blue">فلوچارت‌های کامل کاربری و سیستم</p>
                </div>
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="font-semibold text-brand-dark-blue mb-2">✓ User Story ها</h3>
                  <p className="text-sm text-brand-medium-blue">User Stories استاندارد با فرمت As a... I want...</p>
                </div>
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="font-semibold text-brand-dark-blue mb-2">✓ Acceptance Criteria</h3>
                  <p className="text-sm text-brand-medium-blue">معیارهای پذیرش برای هر User Story</p>
                </div>
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="font-semibold text-brand-dark-blue mb-2">✓ Constraints</h3>
                  <p className="text-sm text-brand-medium-blue">محدودیت‌ها و قیدهای فنی و کسب‌وکار</p>
                </div>
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="font-semibold text-brand-dark-blue mb-2">✓ Risks & Conflicts</h3>
                  <p className="text-sm text-brand-medium-blue">شناسایی ریسک‌ها و تناقضات</p>
                </div>
                <div className="border border-brand-medium-gray rounded-lg p-4">
                  <h3 className="font-semibold text-brand-dark-blue mb-2">✓ JSON Output</h3>
                  <p className="text-sm text-brand-medium-blue">خروجی JSON برای استفاده در سیستم‌های دیگر</p>
                </div>
                <div className="border border-brand-medium-gray rounded-lg p-4 md:col-span-2">
                  <h3 className="font-semibold text-brand-dark-blue mb-2">✓ API / Swagger Readiness</h3>
                  <p className="text-sm text-brand-medium-blue">مستندات API کامل با Swagger/OpenAPI Spec</p>
                </div>
              </div>
            </div>

            {/* Example Conflict */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                مثال کشف تناقض
              </h2>
              <div className="bg-yellow-50 border-r-4 border-yellow-500 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">مثال: ورود با اثر انگشت</h3>
                <div className="space-y-3 text-yellow-700">
                  <div>
                    <p className="font-medium mb-1">نیازمندی 1:</p>
                    <p>"کاربر باید بتواند با اثر انگشت وارد سیستم شود"</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">نیازمندی 2:</p>
                    <p>"ورود فقط با شماره موبایل و OTP انجام می‌شود"</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">نیازمندی 3:</p>
                    <p>"در صورت فراموشی رمز، کاربر می‌تواند رمز را بازیابی کند"</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-yellow-300">
                    <p className="font-bold text-yellow-800">تناقض شناسایی شده:</p>
                    <p className="mt-2">
                      نیازمندی 1 و 2 با هم در تضاد هستند. اگر ورود فقط با OTP انجام می‌شود، 
                      ورود با اثر انگشت امکان‌پذیر نیست. همچنین نیازمندی 3 مربوط به رمز عبور است 
                      در حالی که سیستم از OTP استفاده می‌کند و رمز عبور ندارد.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                ویژگی‌های پلتفرم
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-brand-dark-blue">تحلیل خودکار تناقضات</h3>
                    <p className="text-sm text-brand-medium-blue">شناسایی خودکار نیازمندی‌های متضاد</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-brand-dark-blue">ساختار استاندارد</h3>
                    <p className="text-sm text-brand-medium-blue">استانداردسازی نیازمندی‌ها بر اساس بهترین روش‌ها</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-brand-dark-blue">خروجی JSON</h3>
                    <p className="text-sm text-brand-medium-blue">خروجی قابل استفاده در سیستم‌های دیگر</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-brand-dark-blue">مستندات API</h3>
                    <p className="text-sm text-brand-medium-blue">تولید خودکار Swagger/OpenAPI Spec</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-brand-dark-blue">User Stories</h3>
                    <p className="text-sm text-brand-medium-blue">تولید خودکار User Stories استاندارد</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-brand-dark-blue">گزارش ریسک</h3>
                    <p className="text-sm text-brand-medium-blue">شناسایی و گزارش ریسک‌های پروژه</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Value */}
            <div className="bg-white rounded-lg border border-brand-medium-gray p-6">
              <h2 className="text-2xl font-bold text-brand-dark-blue mb-6 font-display">
                ارزش کسب‌وکار
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-4xl mb-3">📉</div>
                  <h3 className="font-semibold text-green-800 mb-2">کاهش ریسک</h3>
                  <p className="text-sm text-green-700">
                    شناسایی زودهنگام مشکلات و کاهش ریسک پروژه تا 50%
                  </p>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-4xl mb-3">💰</div>
                  <h3 className="font-semibold text-blue-800 mb-2">کاهش هزینه</h3>
                  <p className="text-sm text-blue-700">
                    کاهش هزینه‌های توسعه و بازسازی تا 30% با نیازمندی‌های صحیح
                  </p>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <div className="text-4xl mb-3">👁️</div>
                  <h3 className="font-semibold text-purple-800 mb-2">شفافیت</h3>
                  <p className="text-sm text-purple-700">
                    شفافیت کامل برای مدیران و تیم توسعه با مستندات استاندارد
                  </p>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="bg-gradient-to-br from-brand-medium-blue to-brand-dark-blue text-white rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-4 font-display">
                آماده شروع هستید؟
              </h2>
              <p className="text-xl mb-6 text-brand-light-sky">
                با ما تماس بگیرید و از مشاوره رایگان بهره‌مند شوید
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-3 bg-white text-brand-medium-blue font-bold rounded-lg hover:bg-brand-light-sky transition-all">
                  درخواست دمو
                </button>
                <button className="px-8 py-3 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-brand-medium-blue transition-all">
                  تماس با ما
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

