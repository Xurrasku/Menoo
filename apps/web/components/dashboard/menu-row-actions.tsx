"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MenuRowActionsProps = {
  menuId: string;
  locale: string;
  labels: {
    edit: string;
    duplicate: string;
    delete: string;
  };
};

export function MenuRowActions({ menuId, locale, labels }: MenuRowActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (event: Event) => {
    event.preventDefault();

    if (isDeleting) {
      return;
    }

    // Simple confirmation for now to avoid accidental deletions.
    // This can be replaced with a custom dialog if needed.
    const confirmed = window.confirm(
      "Are you sure you want to delete this menu? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/menus/${menuId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete menu (${response.status})`);
      }

      // Refresh the menus list so the deleted menu disappears.
      router.refresh();
    } catch (error) {
      console.error("Failed to delete menu", error);
      window.alert("We couldn't delete this menu. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-[5.5vw] w-[5.5vw] rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 sm:h-8 sm:w-8"
        >
          <MoreHorizontal className="h-[3vw] w-[3vw] sm:h-4 sm:w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            router.push(`/${locale}/dashboard/menus/${menuId}/edit`);
          }}
        >
          {labels.edit}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            // TODO: Implement duplication when backend support is available.
            // For now, this is a no-op to avoid surprising behaviour.
          }}
        >
          {labels.duplicate}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(event) => {
            void handleDelete(event);
          }}
        >
          {isDeleting ? `${labels.delete}...` : labels.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


