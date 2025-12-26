"use client";

import { ChangelogTask, TaskStatus, ChangeType, TestStatus } from "../types/changelog";
import {
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  LinkIcon,
  CodeBracketIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface ChangelogItemProps {
  task: ChangelogTask;
}

export default function ChangelogItem({ task }: ChangelogItemProps) {
  const getStatusIcon = () => {
    switch (task.status) {
      case TaskStatus.DONE:
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case TaskStatus.IN_PROGRESS:
        return <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case TaskStatus.DONE:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            انجام شده
          </span>
        );
      case TaskStatus.IN_PROGRESS:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            در حال انجام
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            در انتظار
          </span>
        );
    }
  };

  const getChangeTypeBadge = () => {
    if (!task.changeType) return null;

    const badges = {
      [ChangeType.FEATURE]: "bg-blue-100 text-blue-800",
      [ChangeType.BUGFIX]: "bg-red-100 text-red-800",
      [ChangeType.REFACTOR]: "bg-purple-100 text-purple-800",
      [ChangeType.SECURITY]: "bg-orange-100 text-orange-800",
      [ChangeType.PERFORMANCE]: "bg-yellow-100 text-yellow-800",
      [ChangeType.DOCUMENTATION]: "bg-gray-100 text-gray-800",
    };

    const labels = {
      [ChangeType.FEATURE]: "ویژگی جدید",
      [ChangeType.BUGFIX]: "رفع باگ",
      [ChangeType.REFACTOR]: "بازسازی",
      [ChangeType.SECURITY]: "امنیت",
      [ChangeType.PERFORMANCE]: "عملکرد",
      [ChangeType.DOCUMENTATION]: "مستندات",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[task.changeType]}`}>
        {labels[task.changeType]}
      </span>
    );
  };

  const getTestStatusBadge = () => {
    const badges = {
      [TestStatus.NOT_TESTED]: "bg-gray-100 text-gray-800",
      [TestStatus.IN_TESTING]: "bg-yellow-100 text-yellow-800",
      [TestStatus.PASSED]: "bg-green-100 text-green-800",
      [TestStatus.FAILED]: "bg-red-100 text-red-800",
    };

    const labels = {
      [TestStatus.NOT_TESTED]: "تست نشده",
      [TestStatus.IN_TESTING]: "در حال تست",
      [TestStatus.PASSED]: "تست شده ✓",
      [TestStatus.FAILED]: "تست ناموفق ✗",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[task.testStatus]}`}>
        {labels[task.testStatus]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg border border-brand-medium-gray p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">{getStatusIcon()}</div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="text-lg font-semibold text-brand-dark-blue">
                {task.title}
              </h3>
              <div className="flex gap-2 flex-shrink-0">
                {getChangeTypeBadge()}
                {getTestStatusBadge()}
                {getStatusBadge()}
              </div>
            </div>
            
            {task.description && (
              <p className="text-brand-medium-blue mb-3">{task.description}</p>
            )}

            {/* Related Page and Module */}
            {(task.relatedPage || task.relatedModule) && (
              <div className="mb-3 flex flex-wrap gap-2">
                {task.relatedPage && (
                  <span className="px-2 py-1 text-xs bg-brand-light-sky text-brand-dark-blue rounded flex items-center gap-1">
                    <DocumentTextIcon className="w-3 h-3" />
                    {task.relatedPage}
                  </span>
                )}
                {task.relatedModule && (
                  <span className="px-2 py-1 text-xs bg-brand-light-gray text-brand-dark-blue rounded">
                    ماژول: {task.relatedModule}
                  </span>
                )}
              </div>
            )}

            {/* PR Link and Commit Hash */}
            {(task.prLink || task.commitHash) && (
              <div className="mb-3 flex flex-wrap gap-2">
                {task.prLink && (
                  <a
                    href={task.prLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    PR
                  </a>
                )}
                {task.commitHash && (
                  <span className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded flex items-center gap-1 font-mono">
                    <CodeBracketIcon className="w-3 h-3" />
                    {task.commitHash.substring(0, 7)}
                  </span>
                )}
              </div>
            )}

            {/* Test Information */}
            {task.testStatus !== TestStatus.NOT_TESTED && (
              <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                {task.testedBy && (
                  <span className="text-brand-medium-gray">
                    تست شده توسط: <span className="font-medium">{task.testedBy}</span>
                  </span>
                )}
                {task.testedAt && (
                  <span className="text-brand-medium-gray mr-3">
                    | تاریخ تست: {formatDate(task.testedAt)}
                  </span>
                )}
                {task.testNotes && (
                  <div className="mt-1 text-brand-medium-blue">
                    یادداشت: {task.testNotes}
                  </div>
                )}
              </div>
            )}

            {/* Hours Information */}
            {(task.estimatedHours || task.actualHours) && (
              <div className="mb-3 flex gap-4 text-xs text-brand-medium-gray">
                {task.estimatedHours && (
                  <span>تخمین: {task.estimatedHours} ساعت</span>
                )}
                {task.actualHours && (
                  <span className={task.estimatedHours && task.actualHours > task.estimatedHours ? "text-red-600" : "text-green-600"}>
                    واقعی: {task.actualHours} ساعت
                  </span>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-brand-medium-gray">
              {task.category && (
                <span className="px-2 py-1 bg-brand-light-sky rounded">
                  {task.category}
                </span>
              )}
              {task.priority && (
                <span className="px-2 py-1 bg-brand-light-gray rounded">
                  اولویت: {task.priority}
                </span>
              )}
              {task.assignee && (
                <span className="px-2 py-1 bg-brand-light-gray rounded">
                  مسئول: {task.assignee}
                </span>
              )}
              <span className="text-xs">
                ایجاد شده: {formatDate(task.createdAt)}
              </span>
              {task.completedAt && (
                <span className="text-xs text-green-600">
                  تکمیل شده: {formatDate(task.completedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

