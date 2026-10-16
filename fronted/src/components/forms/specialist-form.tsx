"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateSelects } from "@/components/forms/date-selects";
import { createSpecialist, listSpecialists, updateSpecialist } from "@/lib/api/specialists";
import { createUser, listUsers } from "@/lib/api/users";
import { getErrorMessage } from "@/lib/axios";
import { toDateInputValue } from "@/lib/format";
import type { Specialist } from "@/types/specialist";
import type { User } from "@/types/user";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const specialistSchema = z.object({
  userMode: z.enum(["existing", "new"]),
  userId: z.string(),
  newName: z.string(),
  newLastName: z.string(),
  newEmail: z.string(),
  newPassword: z.string(),
  professionalId: z
    .string()
    .trim()
    .min(1, "El carnet profesional es obligatorio")
    .max(50, "El carnet profesional no puede superar los 50 caracteres"),
  specialty: z
    .string()
    .trim()
    .min(1, "La especialidad es obligatoria")
    .max(100, "La especialidad no puede superar los 100 caracteres"),
  licenseNumber: z.string().max(50, "La matrícula no puede superar los 50 caracteres"),
  phone: z.string().max(30, "El teléfono no puede superar los 30 caracteres"),
  address: z.string().max(191, "La dirección no puede superar los 191 caracteres"),
  entryDate: z.string(),
  monthlySalary: z.string(),
});

type SpecialistFormValues = z.infer<typeof specialistSchema>;

interface SpecialistFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Especialista a editar; si no se pasa, el formulario crea uno nuevo. */
  specialist?: Specialist | null;
  onSaved: (specialist: Specialist) => void;
}

export function SpecialistForm({
  open,
  onOpenChange,
  specialist,
  onSaved,
}: SpecialistFormProps) {
  const isEdit = Boolean(specialist);
  const [users, setUsers] = useState<User[]>([]);
  const [takenUserIds, setTakenUserIds] = useState<Set<number>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SpecialistFormValues>({
    resolver: zodResolver(specialistSchema),
    defaultValues: {
      userMode: "existing",
      userId: "",
      newName: "",
      newLastName: "",
      newEmail: "",
      newPassword: "",
      professionalId: "",
      specialty: "",
      licenseNumber: "",
      phone: "",
      address: "",
      entryDate: "",
      monthlySalary: "",
    },
  });

  const userMode = useWatch({ control, name: "userMode" });
  const entryDate = useWatch({ control, name: "entryDate" });

  useEffect(() => {
    if (!open) return;
    reset({
      userMode: "existing",
      userId: "",
      newName: "",
      newLastName: "",
      newEmail: "",
      newPassword: "",
      professionalId: specialist?.professionalId ?? "",
      specialty: specialist?.specialty ?? "",
      licenseNumber: specialist?.licenseNumber ?? "",
      phone: specialist?.phone ?? "",
      address: specialist?.address ?? "",
      entryDate: specialist?.entryDate ? toDateInputValue(specialist.entryDate) : "",
      monthlySalary:
        specialist?.monthlySalary != null ? String(specialist.monthlySalary) : "",
    });
  }, [open, specialist, reset]);

  useEffect(() => {
    if (!open || isEdit) return;
    let cancelled = false;

    async function load() {
      try {
        setLoadingUsers(true);
        const [allUsers, allSpecialists] = await Promise.all([
          listUsers(),
          listSpecialists({ includeInactive: true }),
        ]);
        if (cancelled) return;
        setUsers(allUsers.filter((user) => user.role === "ESPECIALISTA"));
        setTakenUserIds(new Set(allSpecialists.map((item) => item.userId)));
      } catch (error) {
        if (!cancelled) toast.error(getErrorMessage(error));
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, isEdit]);

  const availableUsers = useMemo(
    () => users.filter((user) => !takenUserIds.has(user.id)),
    [users, takenUserIds],
  );

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleFormSubmit(values: SpecialistFormValues) {
    const monthlySalary = values.monthlySalary.trim()
      ? Number(values.monthlySalary)
      : undefined;

    if (monthlySalary !== undefined && (!Number.isFinite(monthlySalary) || monthlySalary < 0)) {
      setError("monthlySalary", { message: "El sueldo debe ser un número mayor o igual a cero" });
      return;
    }

    try {
      if (isEdit && specialist) {
        const saved = await updateSpecialist(specialist.id, {
          professionalId: values.professionalId.trim(),
          specialty: values.specialty.trim(),
          licenseNumber: values.licenseNumber.trim() || undefined,
          phone: values.phone.trim() || undefined,
          address: values.address.trim() || undefined,
          entryDate: values.entryDate || undefined,
          monthlySalary,
        });
        toast.success("Especialista actualizado");
        onSaved(saved);
        handleClose(false);
        return;
      }

      // --- Alta nueva: resolver el usuario (existente o recién creado) ---
      let userId: number;
      if (values.userMode === "new") {
        if (!values.newName.trim() || !values.newLastName.trim()) {
          setError("newName", { message: "Indica el nombre y apellido del usuario" });
          return;
        }
        if (!values.newEmail.trim() || !values.newPassword) {
          setError("newEmail", { message: "Indica email y contraseña del usuario" });
          return;
        }
        const created = await createUser({
          name: values.newName.trim(),
          lastName: values.newLastName.trim(),
          email: values.newEmail.trim(),
          password: values.newPassword,
          role: "ESPECIALISTA",
        });
        userId = created.id;
      } else {
        if (!values.userId) {
          setError("userId", { message: "Selecciona un usuario" });
          return;
        }
        userId = Number(values.userId);
      }

      const saved = await createSpecialist({
        userId,
        professionalId: values.professionalId.trim(),
        specialty: values.specialty.trim(),
        licenseNumber: values.licenseNumber.trim() || undefined,
        phone: values.phone.trim() || undefined,
        address: values.address.trim() || undefined,
        entryDate: values.entryDate || undefined,
        monthlySalary,
      });
      toast.success("Especialista creado");
      onSaved(saved);
      handleClose(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar especialista" : "Nuevo especialista"}</DialogTitle>
          <DialogDescription>
            Datos profesionales y sueldo mensual del especialista. El horario, las
            áreas y los niños asignados se gestionan en el detalle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          {!isEdit && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" value="existing" {...register("userMode")} />
                  Usuario existente
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="new" {...register("userMode")} />
                  Crear usuario nuevo
                </label>
              </div>

              {userMode === "existing" ? (
                <div className="space-y-2">
                  <Label htmlFor="userId">Usuario (rol especialista)</Label>
                  <select
                    id="userId"
                    className={inputClass}
                    disabled={loadingUsers}
                    {...register("userId")}
                    aria-invalid={Boolean(errors.userId)}
                  >
                    <option value="">
                      {loadingUsers ? "Cargando usuarios..." : "Selecciona un usuario..."}
                    </option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.lastName} · {user.email}
                      </option>
                    ))}
                  </select>
                  {availableUsers.length === 0 && !loadingUsers && (
                    <p className="text-xs text-muted-foreground">
                      No hay usuarios con rol ESPECIALISTA sin perfil. Crea uno nuevo.
                    </p>
                  )}
                  {errors.userId && (
                    <p className="text-sm text-error">{errors.userId.message}</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newName">Nombre</Label>
                    <Input id="newName" {...register("newName")} />
                    {errors.newName && (
                      <p className="text-sm text-error">{errors.newName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newLastName">Apellido</Label>
                    <Input id="newLastName" {...register("newLastName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">Email</Label>
                    <Input id="newEmail" type="email" {...register("newEmail")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Contraseña</Label>
                    <Input id="newPassword" type="password" {...register("newPassword")} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="professionalId">Carnet profesional</Label>
              <Input
                id="professionalId"
                {...register("professionalId")}
                aria-invalid={Boolean(errors.professionalId)}
              />
              {errors.professionalId && (
                <p className="text-sm text-error">{errors.professionalId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                {...register("specialty")}
                aria-invalid={Boolean(errors.specialty)}
              />
              {errors.specialty && (
                <p className="text-sm text-error">{errors.specialty.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Matrícula (opcional)</Label>
              <Input id="licenseNumber" {...register("licenseNumber")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Dirección (opcional)</Label>
              <Input id="address" {...register("address")} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de ingreso</Label>
              <DateSelects
                value={entryDate}
                onChange={(value) => setValue("entryDate", value)}
              />
              <p className="text-xs text-muted-foreground">
                Define desde qué mes se generan los sueldos.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlySalary">Sueldo mensual (opcional)</Label>
              <Input
                id="monthlySalary"
                type="number"
                min="0"
                step="0.01"
                {...register("monthlySalary")}
                aria-invalid={Boolean(errors.monthlySalary)}
              />
              {errors.monthlySalary && (
                <p className="text-sm text-error">{errors.monthlySalary.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar" : "Crear especialista"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
