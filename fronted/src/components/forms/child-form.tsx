"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Star, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateSelects } from "@/components/forms/date-selects";
import type { ChildInput } from "@/types/child";
import { SEX_OPTIONS } from "@/types/child";

const tutorSchema = z.object({
  name: z.string().min(1, "El nombre del tutor es obligatorio"),
  lastName: z.string().min(1, "El apellido del tutor es obligatorio"),
  relationship: z.string().min(1, "El parentesco es obligatorio"),
  phone: z.string().min(1, "El celular/WhatsApp es obligatorio"),
  email: z.union([z.string().trim().email("Email inválido"), z.literal("")]),
  carnet: z.string().min(1, "El carnet es obligatorio"),
  isPrimary: z.boolean(),
});

const childSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    lastName: z.string().min(1, "El apellido es obligatorio"),
    dateOfBirth: z.string().min(1, "La fecha de nacimiento es obligatoria"),
    sex: z.enum(["Varón", "Mujer"], {
      message: "Selecciona un sexo válido",
    }),
    enrollmentDate: z.string().min(1, "La fecha de inscripción es obligatoria"),
    isActive: z.boolean(),
    tutors: z
      .array(tutorSchema)
      .min(1, "Agrega al menos un tutor / responsable"),
    specialistId: z.string(),
  })
  .refine(
    (values) => values.tutors.filter((t) => t.isPrimary).length === 1,
    {
      message: "Marca exactamente un tutor como principal",
    },
  );

type ChildFormValues = z.infer<typeof childSchema>;
type TutorFormValues = z.infer<typeof tutorSchema>;

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function emptyTutor(): TutorFormValues {
  return {
    name: "",
    lastName: "",
    relationship: "",
    phone: "",
    email: "",
    carnet: "",
    isPrimary: false,
  };
}

function toValues(input?: Partial<ChildInput>): ChildFormValues {
  const tutors = (input?.tutors?.length ? input.tutors : [emptyTutor()]).map(
    (t) => ({
      name: t.name ?? "",
      lastName: t.lastName ?? "",
      relationship: t.relationship ?? "",
      phone: t.phone ?? "",
      email: t.email ?? "",
      carnet: t.carnet ?? "",
      isPrimary: t.isPrimary ?? false,
    }),
  );

  if (!input?.tutors?.length) {
    tutors[0].isPrimary = true;
  }

  return {
    name: input?.name ?? "",
    lastName: input?.lastName ?? "",
    dateOfBirth: input?.dateOfBirth ?? "",
    sex: (input?.sex as ChildFormValues["sex"]) ?? "Varón",
    enrollmentDate: input?.enrollmentDate ?? "",
    isActive: input?.isActive ?? true,
    tutors,
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
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ChildFormValues>({
    resolver: zodResolver(childSchema),
    defaultValues: toValues(initialValues),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tutors",
  });

  function handleSetPrimary(index: number) {
    fields.forEach((_, i) => {
      setValue(`tutors.${i}.isPrimary`, i === index);
    });
  }

  function handleFormSubmit(values: ChildFormValues) {
    onSubmit({
      name: values.name,
      lastName: values.lastName,
      dateOfBirth: values.dateOfBirth,
      sex: values.sex,
      enrollmentDate: values.enrollmentDate,
      isActive: values.isActive,
      tutors: values.tutors.map((t) => ({
        name: t.name,
        lastName: t.lastName,
        relationship: t.relationship,
        phone: t.phone,
        email: t.email.trim() || undefined,
        carnet: t.carnet,
        isPrimary: t.isPrimary,
      })),
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
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field }) => (
                <DateSelects
                  value={field.value}
                  onChange={field.onChange}
                  invalid={Boolean(errors.dateOfBirth)}
                />
              )}
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-error">{errors.dateOfBirth.message}</p>
            )}
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
            <Controller
              control={control}
              name="enrollmentDate"
              render={({ field }) => (
                <DateSelects
                  value={field.value}
                  onChange={field.onChange}
                  invalid={Boolean(errors.enrollmentDate)}
                />
              )}
            />
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
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="size-4" />
            Tutores / responsables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border p-4 space-y-4"
              data-primary={fields[index]?.isPrimary ? true : undefined}
            >
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="radio"
                    name="tutor-primary"
                    checked={Boolean(fields[index]?.isPrimary)}
                    onChange={() => handleSetPrimary(index)}
                    className="size-4"
                  />
                  Tutor principal
                </label>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                    Quitar
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`tutors.${index}.name`}>Nombre del tutor</Label>
                  <Input
                    id={`tutors.${index}.name`}
                    {...register(`tutors.${index}.name`)}
                    aria-invalid={Boolean(errors.tutors?.[index]?.name)}
                  />
                  {errors.tutors?.[index]?.name && (
                    <p className="text-sm text-error">
                      {errors.tutors?.[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tutors.${index}.lastName`}>Apellido del tutor</Label>
                  <Input
                    id={`tutors.${index}.lastName`}
                    {...register(`tutors.${index}.lastName`)}
                    aria-invalid={Boolean(errors.tutors?.[index]?.lastName)}
                  />
                  {errors.tutors?.[index]?.lastName && (
                    <p className="text-sm text-error">
                      {errors.tutors?.[index]?.lastName?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tutors.${index}.relationship`}>Parentesco</Label>
                  <Input
                    id={`tutors.${index}.relationship`}
                    placeholder="Madre, Padre, Tutor..."
                    {...register(`tutors.${index}.relationship`)}
                    aria-invalid={Boolean(errors.tutors?.[index]?.relationship)}
                  />
                  {errors.tutors?.[index]?.relationship && (
                    <p className="text-sm text-error">
                      {errors.tutors?.[index]?.relationship?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tutors.${index}.carnet`}>Carnet / documento</Label>
                  <Input
                    id={`tutors.${index}.carnet`}
                    {...register(`tutors.${index}.carnet`)}
                    aria-invalid={Boolean(errors.tutors?.[index]?.carnet)}
                  />
                  {errors.tutors?.[index]?.carnet && (
                    <p className="text-sm text-error">
                      {errors.tutors?.[index]?.carnet?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tutors.${index}.phone`}>Celular/WhatsApp</Label>
                  <Input
                    id={`tutors.${index}.phone`}
                    type="tel"
                    {...register(`tutors.${index}.phone`)}
                    aria-invalid={Boolean(errors.tutors?.[index]?.phone)}
                  />
                  {errors.tutors?.[index]?.phone && (
                    <p className="text-sm text-error">
                      {errors.tutors?.[index]?.phone?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tutors.${index}.email`}>Email (opcional)</Label>
                  <Input
                    id={`tutors.${index}.email`}
                    type="email"
                    {...register(`tutors.${index}.email`)}
                    aria-invalid={Boolean(errors.tutors?.[index]?.email)}
                  />
                  {errors.tutors?.[index]?.email && (
                    <p className="text-sm text-error">
                      {errors.tutors?.[index]?.email?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {errors.root && (
            <p className="text-sm text-error">{errors.root.message}</p>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyTutor())}
          >
            <Plus className="size-4" />
            Agregar tutor
          </Button>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}