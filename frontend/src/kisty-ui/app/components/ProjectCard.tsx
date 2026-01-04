"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { Project } from "../types/project";
import { MapPinIcon, TagIcon, CalendarIcon } from "@heroicons/react/24/outline";

interface ProjectCardProps {
  project: Project;
  showCustomer?: boolean;
}

function ProjectCard({ project, showCustomer = false }: ProjectCardProps) {
  const formattedDate = useMemo(() => {
    const date = typeof project.createdAt === "string" ? new Date(project.createdAt) : project.createdAt;
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }, [project.createdAt]);

  return (
    <Link href={`/public/projects/${project.id}`}>
      <div className="bg-white rounded-lg shadow-md border border-brand-medium-gray overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-brand-dark-blue line-clamp-2 flex-1">
              {project.title}
            </h3>
            {project.status === "PENDING" && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-300 mr-2 flex-shrink-0">
                جدید
              </span>
            )}
            {project.status === "IN_PROGRESS" && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-300 mr-2 flex-shrink-0">
                در حال انجام
              </span>
            )}
            {project.status === "COMPLETED" && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-300 mr-2 flex-shrink-0">
                تکمیل شده
              </span>
            )}
          </div>
          
          <p className="text-sm text-brand-medium-blue line-clamp-3 mb-4">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-brand-medium-blue">
            {project.city && (
              <div className="flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                <span>{project.city.title}</span>
              </div>
            )}
            {project.category && (
              <div className="flex items-center gap-1">
                <TagIcon className="w-4 h-4" />
                <span>{project.category.title}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {showCustomer && project.customer && (
            <div className="mt-3 pt-3 border-t border-brand-medium-gray">
              <p className="text-xs text-brand-medium-blue">
                توسط: <span className="font-medium">{project.customer.fullName}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default memo(ProjectCard);

