/**
 * @file Content
 * @description contenido informativo ubicado junto a la card del login
 */

import React from 'react';
import { CalendarPlus, CheckCircle, CalendarDays, Eye } from 'lucide-react';

const items = [
  {
    icon: <CalendarPlus className="text-muted-foreground w-12 h-12" />,
    title: 'Solicitud Rápida',
    description:
      'Realiza solicitudes en segundos: solo elige las fechas deseadas y envía tu petición de manera ágil y sencilla.',
  },
  {
    icon: <CheckCircle className="text-muted-foreground w-12 h-12" />,
    title: 'Aprobación Eficiente',
    description:
      'Para los jefes, aprobar o rechazar solicitudes es más fácil que nunca, con vistas y controles claros.',
  },
  {
    icon: <CalendarDays className="text-muted-foreground w-12 h-12" />,
    title: 'Calendario Anual',
    description:
      'Visualiza todas las solicitudes en un calendario anual para entender mejor los periodos y gestionar las solicitudes más facil.',
  },
  {
    icon: <Eye className="text-muted-foreground w-12 h-12" />,
    title: 'Transparencia y Seguimiento',
    description:
      'Haz seguimiento al estado de tus solicitudes y mantente informado en todo momento sobre su progreso.',
  },
];

type ContentProps = React.ComponentProps<'div'>;

export default function Content({ className, ...props }: ContentProps) {
  return (
    <div
      className={`flex flex-col self-center gap-4 max-w-[450px] ${
        className || ''
      }`}
      {...props}
    >
      <div className="hidden md:flex">
        <h1 className="w-full text-[clamp(2rem,10vw,2.15rem)] font-bold">
          <strong>P.A.V.E</strong>
        </h1>
      </div>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {item.icon}
          <div>
            <h2 className="font-medium mb-1">{item.title}</h2>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
