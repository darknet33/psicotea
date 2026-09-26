"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChildForm, type ChildFormServerError } from "@/components/forms/child-form";
import { getChild, getChildSubmitError, updateChild } from "@/lib/api/children";
import { getErrorMessage } from "@/lib/axios";
import type { ChildInput } from "@/types/child";

export default function EditChildPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const childId = Number(params.id);

  const [initialValues, setInitialValues] = useState<ChildInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<ChildFormServerError | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const child = await getChild(childId);
        setInitialValues({
          name: child.name,
          lastName: child.lastName,
          dateOfBirth: child.dateOfBirth,
          sex: child.sex,
          photoUrl: child.photoUrl,
          diagnostico: child.diagnostico,
          carnet: child.carnet,
          isActive: child.isActive,
          tutors: child.tutors.map((tutor) => ({
            name: tutor.name,
            lastName: tutor.lastName,
            relationship: tutor.relationship,
            phone: tutor.phone,
            email: tutor.email ?? undefined,
            address: tutor.address ?? undefined,
            carnet: tutor.carnet,
            isPrimary: tutor.isPrimary,
          })),
          specialistId: child.specialistId ?? undefined,
        });
      } catch (err) {
        setError(getErrorMessage(err));
      }
    })();
  }, [childId]);

  async function handleSubmit(input: ChildInput) {
    try {
      setIsSubmitting(true);
      setServerError(null);
      const child = await updateChild(childId, input);
      toast.success("Cambios guardados correctamente");
      router.push(`/children/${child.id}`);
      router.refresh();
    } catch (err) {
      const fieldError = getChildSubmitError(err);
      if (fieldError) {
        setServerError(fieldError);
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/children/${childId}`}>
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editar niño</h2>
          <p className="text-muted-foreground">Actualiza los datos del paciente y su tutor.</p>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => router.push("/children")}>
            Volver al listado
          </Button>
        </div>
      ) : !initialValues ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <ChildForm
          initialValues={initialValues}
          submitLabel="Guardar cambios"
          isSubmitting={isSubmitting}
          serverError={serverError}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}