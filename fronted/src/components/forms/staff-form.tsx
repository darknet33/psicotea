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
import { createStaff, listStaff, updateStaff } from "@/lib/api/staff";
import { createUser, listUsers } from "@/lib/api/users";
import { getErrorMessage } from "@/lib/axios";
import { toDateInputValue } from "@/lib/format";
import type { Staff } from "@/types/staff";
import type { User } from "@/types/user";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const staffSchema = z.object({
  userMode: z.enum(["existing", "new"]),
  userId: z.string(),
  newName: z.string(),
  newLastName: z.string(),
  newEmail: z.string(),
  newPassword: z.string(),
  employeeId: z
    .string()
    .trim()
    .min(1, "El código de empleado es obligatorio")
    .max(40, "El código no puede superar los 40 caracteres"),
  position: z
    .string()
    .trim()
    .min(1, "El cargo es obligatorio")
    .max(80, "El cargo no puede superar los 80 caracteres"),
  department: z.string().max(80, "El departamento no puede superar los 80 caracteres"),
  hireDate: z.string(),
  salary: z.string(),
  phone: z.string().max(40, "El teléfono no puede superar los 40 caracteres"),
  address: z.string().max(191, "La dirección no puede superar los 191 caracteres"),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Miembro del personal a editar; si no se pasa, se crea uno nuevo. */
  staff?: Staff | null;
  onSaved: (staff: Staff) => void;
}

export function StaffForm({ open, onOpenChange, staff, onSaved }: StaffFormProps) {
  const isEdit = Boolean(staff);
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
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      userMode: "existing",
      userId: "",
      newName: "",
      newLastName: "",
      newEmail: "",
      newPassword: "",
      employeeId: "",
      position: "",
      department: "",
      hireDate: "",
      salary: "",
      phone: "",
      address: "",
    },
  });

  const userMode = useWatch({ control, name: "userMode" });
  const hireDate = useWatch({ control, name: "hireDate" });

  useEffect(() => {
    if (!open) return;
    reset({
      userMode: "existing",
      userId: "",
      newName: "",
      newLastName: "",
      newEmail: "",
      newPassword: "",
      employeeId: staff?.employeeId ?? "",
      position: staff?.position ?? "",
      department: staff?.department ?? "",
      hireDate: staff?.hireDate ? toDateInputValue(staff.hireDate) : "",
      salary: staff?.salary != null ? String(staff.salary) : "",
      phone: staff?.phone ?? "",
      address: staff?.address ?? "",
    });
  }, [open, staff, reset]);

  useEffect(() => {
    if (!open || isEdit) return;
    let cancelled = false;

    async function load() {
      try {
        setLoadingUsers(true);
        const [allUsers, allStaff] = await Promise.all([
          listUsers(),
          listStaff(true),
        ]);
        if (cancelled) return;
        setUsers(
          allUsers.filter(
            (user) =>
              user.role === "ADMIN" ||
              user.role === "PERSONAL_ADMINISTRATIVO",
          ),
        );
        setTakenUserIds(new Set(allStaff.map((item) => item.userId)));
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

  async function handleFormSubmit(values: StaffFormValues) {
    const salary = values.salary.trim() ? Number(values.salary) : undefined;

    if (salary !== undefined && (!Number.isFinite(salary) || salary < 0)) {
      setError("salary", { message: "El salario debe ser un número mayor o igual a cero" });
      return;
    }

    try {
      if (isEdit && staff) {
        const saved = await updateStaff(staff.id, {
          employeeId: values.employeeId.trim(),
          position: values.position.trim(),
          department: values.department.trim() || undefined,
          hireDate: values.hireDate || undefined,
          salary,
          phone: values.phone.trim() || undefined,
          address: values.address.trim() || undefined,
        });
        toast.success("Personal actualizado");
        onSaved(saved);
        handleClose(false);
        return;
      }

      let userId: number;
      if (values.userMode === "new") {
        if (!values.newName.trim() || !values.newLastName.trim()) {
          setError("newName", { message: "Indica nombre y apellido del usuario" });
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
          role: "PERSONAL_ADMINISTRATIVO",
        });
        userId = created.id;
      } else {
        if (!values.userId) {
          setError("userId", { message: "Selecciona un usuario" });
          return;
        }
        userId = Number(values.userId);
      }

      const saved = await createStaff({
        userId,
        employeeId: values.employeeId.trim(),
        position: values.position.trim(),
        department: values.department.trim() || undefined,
        hireDate: values.hireDate,
        salary,
        phone: values.phone.trim() || undefined,
        address: values.address.trim() || undefined,
      });
      toast.success("Personal registrado");
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
          <DialogTitle>{isEdit ? "Editar personal" : "Nuevo personal"}</DialogTitle>
          <DialogDescription>
            Datos laborales del personal administrativo del centro.
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
                  <Label htmlFor="staff-user">Usuario</Label>
                  <select
                    id="staff-user"
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
                      No hay usuarios disponibles sin ficha de personal. Crea uno nuevo.
                    </p>
                  )}
                  {errors.userId && (
                    <p className="text-sm text-error">{errors.userId.message}</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="staff-new-name">Nombre</Label>
                    <Input id="staff-new-name" {...register("newName")} />
                    {errors.newName && (
                      <p className="text-sm text-error">{errors.newName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-new-lastname">Apellido</Label>
                    <Input id="staff-new-lastname" {...register("newLastName")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-new-email">Email</Label>
                    <Input id="staff-new-email" {...register("newEmail")} />
                    {errors.newEmail && (
                      <p className="text-sm text-error">{errors.newEmail.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-new-password">Contraseña</Label>
                    <Input
                      id="staff-new-password"
                      type="password"
                      {...register("newPassword")}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-employee-id">Código de empleado</Label>
              <Input
                id="staff-employee-id"
                {...register("employeeId")}
                aria-invalid={Boolean(errors.employeeId)}
              />
              {errors.employeeId && (
                <p className="text-sm text-error">{errors.employeeId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-position">Cargo</Label>
              <Input
                id="staff-position"
                {...register("position")}
                aria-invalid={Boolean(errors.position)}
              />
              {errors.position && (
                <p className="text-sm text-error">{errors.position.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-department">Departamento (opcional)</Label>
              <Input id="staff-department" {...register("department")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Teléfono (opcional)</Label>
              <Input id="staff-phone" {...register("phone")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="staff-address">Dirección (opcional)</Label>
              <Input id="staff-address" {...register("address")} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de ingreso</Label>
              <DateSelects
                value={hireDate}
                onChange={(value) => setValue("hireDate", value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-salary">Salario (opcional)</Label>
              <Input
                id="staff-salary"
                inputMode="decimal"
                {...register("salary")}
                aria-invalid={Boolean(errors.salary)}
              />
              {errors.salary && (
                <p className="text-sm text-error">{errors.salary.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar" : "Registrar personal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
