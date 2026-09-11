"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";

const profileSchema = z.object({
  email: z.email("Ingresa un email válido"),
  name: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Debe incluir mayúscula, minúscula y número",
    ),
});

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { email: "", name: "", lastName: "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        email: user.email,
        name: user.name,
        lastName: user.lastName,
      });
    }
  }, [user, profileForm]);

  async function onProfileSubmit(values: ProfileValues) {
    try {
      await updateProfile(values);
      toast.success("Datos actualizados correctamente");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    try {
      await changePassword(values);
      toast.success("Contraseña actualizada. Deberás iniciar sesión nuevamente.");
      passwordForm.reset();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Mi perfil</h2>
        <p className="text-muted-foreground">
          Administra tus datos personales y tu contraseña.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <UserRound className="size-5 text-primary" />
            <div>
              <CardTitle>Mis datos</CardTitle>
              <CardDescription>Nombre, apellido y email de tu cuenta.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  autoComplete="given-name"
                  aria-invalid={Boolean(profileForm.formState.errors.name)}
                  {...profileForm.register("name")}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-error">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  aria-invalid={Boolean(profileForm.formState.errors.lastName)}
                  {...profileForm.register("lastName")}
                />
                {profileForm.formState.errors.lastName && (
                  <p className="text-sm text-error">{profileForm.formState.errors.lastName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(profileForm.formState.errors.email)}
                  {...profileForm.register("email")}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-sm text-error">{profileForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
              >
                {profileForm.formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <KeyRound className="size-5 text-primary" />
            <div>
              <CardTitle>Cambiar contraseña</CardTitle>
              <CardDescription>Se cerrarán tus otras sesiones al cambiarla.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(passwordForm.formState.errors.currentPassword)}
                  {...passwordForm.register("currentPassword")}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-error">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(passwordForm.formState.errors.newPassword)}
                  {...passwordForm.register("newPassword")}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-error">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="secondary"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? "Cambiando..." : "Cambiar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}