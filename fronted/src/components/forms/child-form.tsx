"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChildInput } from "@/types/child";
import { SEX_OPTIONS } from "@/types/child";
import { toDateInputValue } from "@/lib/format";

const childSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  dateOfBirth: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  sex: z.enum(["M", "F", "Masculino", "Femenino"], {
    message: "Selecciona un sexo válido",
  }),
  enrollmentDate: z.string().min(1, "La fecha de inscripción es obligatoria"),
  isActive: z.boolean(),
  parentName: z.string().min(1, "El nombre del tutor es obligatorio"),
  parentLastName: z.string().min(1, "El apellido del tutor es obligatorio"),
  parentRelationship: z.string().min(1, "El parentesco es obligatorio"),
  parentPhone: z.string().min(1, "El teléfono del tutor es obligatorio"),
  parentEmail: z.union([z.string().trim().email("Email inválido"), z.literal("")]),
  parentCarnet: z.string().min(1, "El carnet del tutor es obligatorio"),
  specialistId: z.string(),
});

type ChildFormValues = z.infer<typeof childSchema>;

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function toValues(input?: Partial<ChildInput>): ChildFormValues {
  return {
    name: input?.name ?? "",
    lastName: input?.lastName ?? "",
    dateOfBirth: toDateInputValue(input?.dateOfBirth),
    sex: (input?.sex as ChildFormValues["sex"]) ?? "M",
    enrollmentDate: toDateInputValue(input?.enrollmentDate),
    isActive: input?.isActive ?? true,
    parentName: input?.parentName ?? "",
    parentLastName: input?.parentLastName ?? "",
    parentRelationship: input?.parentRelationship ?? "",
    parentPhone: input?.parentPhone ?? "",
    parentEmail: input?.parentEmail ?? "",
    parentCarnet: input?.parentCarnet ?? "",
    specialistId: input?.specialistId != null ? String(input.specialistId) : "",
  };
}

interface ChildFormProps {
  initialValues?: Partial<ChildInput>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (input: ChildInput) => Promise<void> | void;
}

export function ChildForm({
  initialValues,
  submitLabel = "Guardar",
  isSubmitting = false,
  onSubmit,
}: ChildFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChildFormValues>({
    resolver: zodResolver(childSchema),
    defaultValues: toValues(initialValues),
  });

  function handleFormSubmit(values: ChildFormValues) {
    onSubmit({
      name: values.name,
      lastName: values.lastName,
      dateOfBirth: values.dateOfBirth,
      sex: values.sex,
      enrollmentDate: values.enrollmentDate,
      isActive: values.isActive,
      parentName: values.parentName,
      parentLastName: values.parentLastName,
      parentRelationship: values.parentRelationship,
      parentPhone: values.parentPhone,
      parentEmail: values.parentEmail.trim() || undefined,
      parentCarnet: values.parentCarnet,
      specialistId: values.specialistId.trim() ? Number(values.specialistId) : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4" />
            Datos del niño
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register("name")} aria-invalid={Boolean(errors.name)} />
            {errors.name && <p className="text-sm text-error">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input id="lastName" {...register("lastName")} aria-invalid={Boolean(errors.lastName)} />
            {errors.lastName && <p className="text-sm text-error">{errors.lastName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} aria-invalid={Boolean(errors.dateOfBirth)} />
            {errors.dateOfBirth && <p className="text-sm text-error">{errors.dateOfBirth.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sex">Sexo</Label>
            <select id="sex" className={inputClass} {...register("sex")}>
              {SEX_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.sex && <p className="text-sm text-error">{errors.sex.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="enrollmentDate">Fecha de inscripción</Label>
            <Input id="enrollmentDate" type="date" {...register("enrollmentDate")} aria-invalid={Boolean(errors.enrollmentDate)} />
            {errors.enrollmentDate && (
              <p className="text-sm text-error">{errors.enrollmentDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialistId">ID del especialista asignado (opcional)</Label>
            <Input
              id="specialistId"
              type="number"
              min="1"
              placeholder="Ej: 1"
              {...register("specialistId")}
            />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" className="size-4" {...register("isActive")} />
            <span className="text-sm">Niño activo</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tutor / responsable</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="parentName">Nombre del tutor</Label>
            <Input id="parentName" {...register("parentName")} aria-invalid={Boolean(errors.parentName)} />
            {errors.parentName && <p className="text-sm text-error">{errors.parentName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentLastName">Apellido del tutor</Label>
            <Input id="parentLastName" {...register("parentLastName")} aria-invalid={Boolean(errors.parentLastName)} />
            {errors.parentLastName && (
              <p className="text-sm text-error">{errors.parentLastName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentRelationship">Parentesco</Label>
            <Input
              id="parentRelationship"
              placeholder="Madre, Padre, Tutor..."
              {...register("parentRelationship")}
              aria-invalid={Boolean(errors.parentRelationship)}
            />
            {errors.parentRelationship && (
              <p className="text-sm text-error">{errors.parentRelationship.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentCarnet">Carnet / documento</Label>
            <Input id="parentCarnet" {...register("parentCarnet")} aria-invalid={Boolean(errors.parentCarnet)} />
            {errors.parentCarnet && <p className="text-sm text-error">{errors.parentCarnet.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentPhone">Teléfono</Label>
            <Input id="parentPhone" {...register("parentPhone")} aria-invalid={Boolean(errors.parentPhone)} />
            {errors.parentPhone && <p className="text-sm text-error">{errors.parentPhone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentEmail">Email (opcional)</Label>
            <Input id="parentEmail" type="email" {...register("parentEmail")} aria-invalid={Boolean(errors.parentEmail)} />
            {errors.parentEmail && <p className="text-sm text-error">{errors.parentEmail.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}