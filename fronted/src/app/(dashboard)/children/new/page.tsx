"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChildForm } from "@/components/forms/child-form";
import { createChild } from "@/lib/api/children";
import { getErrorMessage } from "@/lib/axios";
import type { ChildInput } from "@/types/child";

export default function NewChildPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(input: ChildInput) {
    try {
      setIsSubmitting(true);
      const child = await createChild(input);
      toast.success("Niño registrado correctamente");
      router.push(`/children/${child.id}`);
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/children">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registrar niño</h2>
          <p className="text-muted-foreground">Alta de un nuevo paciente con su tutor.</p>
        </div>
      </div>

      <ChildForm submitLabel="Registrar niño" isSubmitting={isSubmitting} onSubmit={handleSubmit} />
    </div>
  );
}