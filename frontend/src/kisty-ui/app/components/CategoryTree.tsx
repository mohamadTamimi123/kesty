"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  Bars3Icon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { Category } from "../types/category";

interface CategoryTreeProps {
  categories: Category[];
  onReorder: (categoryIds: string[]) => Promise<void>;
  onMove: (categoryId: string, newParentId: string | null, newOrder?: number) => Promise<void>;
  onDelete: (category: Category) => void;
  onAddSubcategory?: (parentId: string) => void;
  getIconUrl: (iconUrl: string | null) => string | null;
}

interface CategoryItemProps {
  category: Category;
  level: number;
  onDelete: (category: Category) => void;
  onAddSubcategory?: (parentId: string) => void;
  getIconUrl: (iconUrl: string | null) => string | null;
  isDragging?: boolean;
}

function CategoryItem({
  category,
  level,
  onDelete,
  onAddSubcategory,
  getIconUrl,
  isDragging = false,
}: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: category.id,
    disabled: isDragging,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const hasChildren = category.children && category.children.length > 0;
  const iconUrl = getIconUrl(category.iconUrl);
  const indentLevel = level * 24;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-brand-medium-gray rounded-lg mb-2 ${
        isSortableDragging ? "shadow-lg" : "shadow-sm"
      }`}
    >
      <div
        className="flex items-center gap-3 p-4 hover:bg-brand-light-sky transition-colors"
        style={{ paddingRight: `${indentLevel + 16}px` }}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-brand-medium-gray hover:text-brand-dark-blue transition-colors"
        >
          <Bars3Icon className="w-5 h-5 rotate-90" />
        </div>

        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        {/* Icon */}
        {iconUrl ? (
          <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <Image
              src={iconUrl}
              alt={category.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
            بدون آیکون
          </div>
        )}

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-brand-dark-blue truncate">
              {category.title}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${
                category.isActive
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-gray-100 text-gray-800 border-gray-300"
              }`}
            >
              {category.isActive ? "فعال" : "غیرفعال"}
            </span>
            {category.level && category.level > 1 && (
              <span className="text-xs text-brand-medium-blue">
                سطح {category.level}
              </span>
            )}
          </div>
          <p className="text-xs text-brand-medium-blue truncate mt-1">
            {category.slug}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onAddSubcategory && (
            <Button
              variant="neutral"
              size="sm"
              className="p-2"
              onClick={() => onAddSubcategory(category.id)}
              title="افزودن زیردسته"
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          )}
          <Link href={`/dashboard/admin/categories/edit/${category.id}`}>
            <Button
              variant="neutral"
              size="sm"
              className="p-2"
              title="ویرایش"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="neutral"
            size="sm"
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(category)}
            title="حذف"
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-t border-brand-medium-gray bg-brand-off-white">
          <SortableContext
            items={category.children!.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {category.children!.map((child) => (
              <CategoryItem
                key={child.id}
                category={child}
                level={level + 1}
                onDelete={onDelete}
                onAddSubcategory={onAddSubcategory}
                getIconUrl={getIconUrl}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

export default function CategoryTree({
  categories,
  onReorder,
  onMove,
  onDelete,
  onAddSubcategory,
  getIconUrl,
}: CategoryTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeCategory = activeId
    ? findCategoryById(categories, activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    setIsReordering(true);

    try {
      const activeCategory = findCategoryById(categories, active.id as string);
      const overCategory = findCategoryById(categories, over.id as string);

      if (!activeCategory || !overCategory) {
        return;
      }

      // Check if moving within same parent (reorder)
      if (activeCategory.parentId === overCategory.parentId) {
        const siblings = getSiblings(categories, activeCategory.parentId);
        const oldIndex = siblings.findIndex((c) => c.id === active.id);
        const newIndex = siblings.findIndex((c) => c.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(siblings, oldIndex, newIndex);
          await onReorder(reordered.map((c) => c.id));
        }
      } else {
        // Moving to different parent
        const newParentId = overCategory.parentId === activeCategory.parentId
          ? overCategory.id
          : overCategory.parentId;

        await onMove(active.id as string, newParentId);
      }
    } catch (error) {
      console.error("Error reordering categories:", error);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-2">
        <SortableContext
          items={categories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              level={0}
              onDelete={onDelete}
              onAddSubcategory={onAddSubcategory}
              getIconUrl={getIconUrl}
              isDragging={isReordering}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeCategory ? (
          <div className="bg-white border-2 border-brand-medium-blue rounded-lg shadow-lg p-4 opacity-90">
            <div className="flex items-center gap-3">
              {getIconUrl(activeCategory.iconUrl) && (
                <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={getIconUrl(activeCategory.iconUrl)!}
                    alt={activeCategory.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <span className="font-semibold text-brand-dark-blue">
                {activeCategory.title}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Helper functions
function findCategoryById(
  categories: Category[],
  id: string
): Category | null {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }
    if (category.children) {
      const found = findCategoryById(category.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getSiblings(categories: Category[], parentId: string | null): Category[] {
  const findSiblings = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    for (const cat of cats) {
      if (cat.parentId === parentId) {
        result.push(cat);
      }
      if (cat.children) {
        result.push(...findSiblings(cat.children));
      }
    }
    return result;
  };
  return findSiblings(categories);
}

