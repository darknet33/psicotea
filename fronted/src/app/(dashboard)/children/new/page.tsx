"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChildForm, type ChildFormServerError } from "@/components/forms/child-form";
import { createChild, getChildSubmitError } from "@/lib/api/children";
import { getErrorMessage } from "@/lib/axios";
import type { ChildInput } from "@/types/child";

export default function NewChildPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<ChildFormServerError | null>(null);

  async function handleSubmit(input: ChildInput) {
    try {
      setIsSubmitting(true);
      setServerError(null);
      const child = await createChild(input);
      toast.success("Niño registrado correctamente");
      router.push(`/children/${child.id}`);
      router.refresh();
    } catch (error) {
      const fieldError = getChildSubmitError(error);
      if (fieldError) {
        setServerError(fieldError);
      } else {
        toast.error(getErrorMessage(error));
      }
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

      <ChildForm
        submitLabel="Registrar niño"
        isSubmitting={isSubmitting}
        serverError={serverError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}