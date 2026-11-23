---
name: pave-orchestrator
description: >-
  Playbook de coordinacion desde pave-front hacia pave-back cuando se requieren
  cambios sincronizados de UI, contratos API y base de datos.
---

# Orquestador Frontend ↔ Backend (PAVE)

Cuando un requerimiento en `pave-front` dependa de cambios en `pave-back` o en MySQL:

1. **Verificar contrato actual**: Revisar `docs/INTEGRACION_API.md` (frontend) y `../pave-back/docs/API_ENDPOINTS.md` + `../pave-back/docs/BASE_DE_DATOS.md`.
2. **Alinear estados y roles**:
   - `EstadoSolicitud`: `0` Cancelada, `1` Pendiente, `2` Rechazada, `3` Aprobada.
   - `EstadoSolicitudAplazamiento`: `0` Cancelada, `1` Pendiente, `2` Rechazada, `3` Aprobada Jefe, `4` Aprobada Gerente, `5` Aprobada Admin, `6` Aprobada Final.
   - Filtro de `ANALISTA`: compara `usuario.planilla_analista` contra el arreglo `user.planilla` del analista autenticado.
3. **Delegar por capa**: Ejecutar cambios de BD/NestJS en `pave-back` primero (verificando `npm run build`), luego actualizar tipos/hooks/vistas en `pave-front` (`npm run build && npm run lint`).
