/**
 * @file ForgotPassword.tsx
 * @description Componente mejorado para recuperación de contraseña
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Notify } from "notiflix/build/notiflix-notify-aio";

export default function ForgotPassword() {
  const [resetEmail, setResetEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  // Manejar el cambio en el campo de correo
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetEmail(e.target.value);
  };

  // Manejar el envío del formulario
  const handleResetPassword = async () => {
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      Notify.failure("Por favor, ingrese un correo electrónico válido");
      return;
    }

    try {
      setIsSubmitting(true);

      // Aquí implementarías la lógica para solicitar restablecer contraseña
      // Ejemplo: await axios.post(`${baseUrl}/auth/reset-password`, { email: resetEmail });

      // Simulamos un retardo para mostrar el estado de carga
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Notify.success(
        "Se ha enviado un correo con las instrucciones para recuperar su contraseña"
      );
      setOpen(false);
      setResetEmail("");
    } catch (error) {
      console.error("Error al solicitar recuperación de contraseña:", error);
      Notify.failure(
        "No se pudo procesar su solicitud. Intente nuevamente más tarde."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-sm">
          ¿Olvidó su contraseña?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recuperar Contraseña</DialogTitle>
          <DialogDescription>
            Ingrese su correo electrónico y le enviaremos instrucciones para
            recuperar su contraseña.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Correo Electrónico</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="usuario@correo.com"
              value={resetEmail}
              onChange={handleEmailChange}
              autoComplete="email"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="mr-2"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleResetPassword}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar Instrucciones"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
