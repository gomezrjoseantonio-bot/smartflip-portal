
# SmartFlip — Portal de Inversores (auto-recibos)

Portal Next.js + Supabase con generación **automática mensual** de recibos en PDF (Vercel Cron).

## ¿Qué hace solo?
- El día 1 a las 08:00 (Europa/Madrid) ejecuta un cron que:
  1) Calcula los intereses del mes **anterior** para cada préstamo activo.
  2) Genera un PDF por inversor/mes (plantilla simple con desglose y retención).
  3) Lo sube al bucket `docs` y crea el registro en `documents` y `receipts`.
- En el panel /dashboard el inversor ve y descarga sus recibos sin que toques nada.

## Pasos de puesta en marcha
1. **Supabase (UE)** y activa Email/Magic Link.
2. Ejecuta `supabase_core.sql` (tablas básicas) y `supabase_autorecibos.sql` (préstamos y recibos).
3. En **API** copia URL y `anon` y en **Project Settings → Service roles** copia la `service_role` key (solo servidor).
4. Variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (cliente)
   - `SUPABASE_SERVICE_ROLE` (servidor)
   - `CRON_SECRET` (elige una cadena larga)
5. **Vercel**: despliega el repo e introduce esas variables (las que no empiezan por NEXT_PUBLIC son **Server**).
6. Verás un cron en `vercel.json` que llama `/api/cron/generate-receipts` el día 1. También puedes ejecutarlo a mano con:
   ```bash
   curl -X POST https://TU-DOMINIO/api/cron/generate-receipts -H "x-cron-secret: TU_SECRETO"
   ```
   Opcionalmente añade `?year=2025&month=7` para forzar un mes concreto (1-12).

## Alta de préstamos (una sola vez por inversor)
- Ve a `Auth` → invita o que entren con su email.
- Inserta filas en la tabla `loans` (puedes usar el editor o CSV). Campos clave:
  - `principal`, `annual_rate` (0.10 = 10%), `start_date`, `end_date` (opcional), `payment_day` (1-28), `retention_pct` (19,00 por defecto).
- El cron hará el resto cada mes.

## RGPD
- Archivos en bucket **privado** con RLS. Solo el inversor dueño lee su prefijo; admin todo.
- Retención fiscal incluida como dato informativo en el recibo (consulta con asesoría).

## Nota legal
Este software genera recibos de intereses **informativos**. Para obligaciones fiscales en España (modelos 123/193, certificados anuales), valida con tu asesor.
