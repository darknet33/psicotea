/**
 * Layout del grupo público. A diferencia de `(dashboard)`, NO envuelve a los
 * hijos en `ProtectedRoute`: estas rutas se abren sin sesión, es lo que permite
 * que un padre consulte los datos de su hijo escaneando el QR de la credencial.
 *
 * El sidebar y el header del dashboard viven en `(dashboard)/layout.tsx`, así
 * que aquí solo hace falta un contenedor centrado y sin cromo de navegación.
 */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}
