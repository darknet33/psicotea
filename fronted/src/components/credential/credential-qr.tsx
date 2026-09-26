"use client";

import QRCode from "react-qr-code";

interface CredentialQrProps {
  /** URL pública completa que codifica la credencial del niño. */
  value: string;
  /** Lado del SVG en píxeles. */
  size?: number;
  className?: string;
}

/**
 * QR de la credencial, en SVG para que escanee nítido al imprimir.
 *
 * `react-qr-code` no necesita Canvas ni `useEffect`, así que funciona igual en
 * el navegador que al generar el HTML de la tarjeta.
 */
export function CredentialQr({ value, size = 168, className }: CredentialQrProps) {
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Código QR de la credencial"
    >
      <QRCode
        value={value}
        size={size}
        // Nivel H: la tarjeta se imprime y se ensucia con el tiempo; el margen
        // de corrección evita que deje de leerse.
        level="H"
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  );
}
