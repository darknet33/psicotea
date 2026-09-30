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
import { PhotoUpload } from "@/components/forms/photo-upload";
import type { ChildInput } from "@/types/child";
import { SEX_OPTIONS } from "@/types/child";

const tutorSchema = z.object({
  name: z.string().min(1, "El nombre del tutor es obligatorio"),
  lastName: z.string().min(1, "El apellido del tutor es obligatorio"),
  relationship: z.string().min(1, "El parentesco es obligatorio"),
  phone: z.string().min(1, "El celular/WhatsApp es obligatorio"),
  email: z.union([z.string().trim().email("Email inválido"), z.literal("")]),
  address: z.string().trim(),
  carnet: z.string().min(1, "El carnet es obligatorio"),
  isPrimary: z.boolean(),
});

/**
 * El backend devuelve la foto como ruta relativa (`/uploads/<archivo>`); se
 * acepta también una URL absoluta por si el cliente la guarda en otro servicio.
 */
const photoUrlSchema = z
  .string()
  .trim()
  .min(1, "La foto es obligatoria")
  .refine(
    (value) => /^\/uploads\/[A-Za-z0-9._-]+$/.test(value) || /^https?:\/\/\S+$/.test(value),
    "La foto debe ser una ruta /uploads/... o una URL válida",
  );

const childSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    lastName: z.string().min(1, "El apellido es obligatorio"),
    dateOfBirth: z.string().min(1, "La fecha de nacimiento es obligatoria"),
    sex: z.enum(["Varón", "Mujer"], {
      message: "Selecciona un sexo válido",
    }),
    photoUrl: photoUrlSchema,
    diagnostico: z.string().trim().min(1, "El diagnóstico es obligatorio"),
    // Carnet del niño: obligatorio y único. Distinto del `carnet` de cada tutor.
    carnet: z
      .string()
      .trim()
      .min(1, "El carnet del niño es obligatorio")
      .max(191, "El carnet no puede superar los 191 caracteres"),
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
  )
  .refine(
    (values) => {
      const carnets = values.tutors
        .map((t) => t.carnet.trim())
        .filter((carnet) => carnet.length > 0);
      return new Set(carnets).size === carnets.length;
    },
    {
      message: "Hay carnets repetidos: un niño no puede tener dos veces al mismo tutor",
      path: ["tutors"],
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
    address: "",
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
      address: t.address ?? "",
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
    photoUrl: input?.photoUrl ?? "",
    diagnostico: input?.diagnostico ?? "",
    carnet: input?.carnet ?? "",
    isActive: input?.isActive ?? true,
    tutors,
    specialistId: input?.specialistId != null ? String(input.specialistId) : "",
  };
}

interface ChildFormProps {
  initialValues?: Partial<ChildInput>;
  submitLabel?: string;
  isSubmitting?: boolean;
  /**
   * Error devuelto por el backend en el envío anterior, para mostrarlo junto al
   * campo que lo causó y no solo como toast. `carnet` cubre el 400 de carnet
   * duplicado, que el esquema local no puede detectar.
   */
  serverError?: ChildFormServerError | null;
  onSubmit: (input: ChildInput) => Promise<void> | void;
}

export type ChildFormServerError =
  | { field: "carnet"; message: string }
  | { field: "root"; message: string };

export function ChildForm({
  initialValues,
  submitLabel = "Guardar",
  isSubmitting = false,
  serverError = null,
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

  // El error del backend tiene prioridad sobre el del esquema local: si el
  // carnet ya pertenece a otro niño, ese es el mensaje que el usuario necesita
  // ver, aunque el formulario valide correctamente.
  const carnetServerError =
    serverError?.field === "carnet" ? serverError.message : null;

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
      photoUrl: values.photoUrl,
      diagnostico: values.diagnostico,
      carnet: values.carnet.trim(),
      isActive: values.isActive,
      tutors: values.tutors.map((t) => ({
        name: t.name,
        lastName: t.lastName,
        relationship: t.relationship,
        phone: t.phone,
        email: t.email.trim() || undefined,
        address: t.address.trim() || undefined,
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
          <div className="space-y-2 sm:col-span-2">
            <Label>Foto del niño</Label>
            <Controller
              control={control}
              name="photoUrl"
              render={({ field }) => (
                <PhotoUpload
                  value={field.value}
                  onChange={field.onChange}
                  invalid={Boolean(errors.photoUrl)}
                />
              )}
            />
            {errors.photoUrl && (
              <p className="text-sm text-error">{errors.photoUrl.message}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="diagnostico">Diagnóstico</Label>
            <textarea
              id="diagnostico"
              rows={3}
              placeholder="Ej: Trastorno por déficit de atención e hiperactividad (TDAH)"
              className={inputClass}
              aria-invalid={Boolean(errors.diagnostico)}
              {...register("diagnostico")}
            />
            {errors.diagnostico && (
              <p className="text-sm text-error">{errors.diagnostico.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="carnet">Carnet / documento del niño</Label>
            <Input
              id="carnet"
              maxLength={191}
              placeholder="Ej: CI 10293847"
              {...register("carnet")}
              aria-invalid={Boolean(errors.carnet || carnetServerError)}
              aria-describedby={
                errors.carnet || carnetServerError ? "carnet-error" : undefined
              }
            />
            {carnetServerError ? (
              <p id="carnet-error" className="text-sm text-error">
                {carnetServerError}
              </p>
            ) : (
              errors.carnet && (
                <p id="carnet-error" className="text-sm text-error">
                  {errors.carnet.message}
                </p>
              )
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
                <Controller
                  control={control}
                  name={`tutors.${index}.isPrimary`}
                  render={({ field: primaryField }) => (
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="radio"
                        name="tutor-primary"
                        value={field.id}
                        checked={Boolean(primaryField.value)}
                        onChange={() => {
                          handleSetPrimary(index);
                          primaryField.onChange(true);
                        }}
                        onBlur={primaryField.onBlur}
                        className="size-4"
                      />
                      Tutor principal
                    </label>
                  )}
                />
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
                <div className="space-y-2">
                  <Label htmlFor={`tutors.${index}.address`}>Dirección (opcional)</Label>
                  <Input
                    id={`tutors.${index}.address`}
                    placeholder="Av. Siempre Viva 742"
                    {...register(`tutors.${index}.address`)}
                    aria-invalid={Boolean(errors.tutors?.[index]?.address)}
                  />
                  {errors.tutors?.[index]?.address && (
                    <p className="text-sm text-error">
                      {errors.tutors?.[index]?.address?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {errors.root && (
            <p className="text-sm text-error">{errors.root.message}</p>
          )}
          {errors.tutors?.root?.message && (
            <p className="text-sm text-error">{errors.tutors.root.message}</p>
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