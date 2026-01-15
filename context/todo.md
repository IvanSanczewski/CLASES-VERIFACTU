# Project TODO List

1. [DONE] Guide user to set up a Supabase project and create an 'invoices' table.
2. [DONE] Update the server to connect to Supabase and save incoming webhook data.
3. [DONE] Create a new API endpoint to fetch a list of all invoices.
4. [DONE] Redesign the frontend to display the list of all invoices.
5. [DONE] Implement frontend controls and backend logic for filtering invoices by date.
6. [pending] We need to create each invoices based on the invoices created by SBpay.me, not by all bookings received by Simplybook.me.
7. [pending] Preare Supabase for Invocash API. We need to the table with possible new requirements based on invoices instead of bookings.
8. [pending] Implement the sending of each captured invoice to the selected accounting app.

## Do We Need a Service Layer?

A service layer is a pattern where you extract business logic out of your route handlers (like our /webhook function) and into separate, reusable modules or classes. For example, we could create an InvoiceService.js file with a function like createInvoicesFromBooking(bookingId).

For our current needs, a service layer is not strictly required. The logic is contained in one place and is manageable.

For future growth: as we add more features (like fetching and filtering invoices for the frontend, as per your todo.md), a service layer provides several benefits:

- Separation of Concerns: It keeps the HTTP request/response logic separate from the core business logic.
- Reusability: We could reuse the createInvoicesFromBooking function elsewhere if needed.
- Testability: It is much easier to write automated tests for a standalone service function than for an entire Express endpoint.

### STEP 5: Implementation Plan for Date Filtering

The final step is to allow users to filter the invoices by a date range.

**What we will build:**
A user interface with "Start Date" and "End Date" inputs and a "Filter" button. When the button is clicked, the invoice list will update to show only the records from the selected period.

**How we will implement it:**

1.  **Frontend Changes (`index.html` & `script/main.js`):**

    - **Add UI Controls (`index.html`):** We will insert two `<input type="date">` fields and a `<button>` just above the invoices table.
    - **Handle User Input (`script/main.js`):** An event listener will be attached to the button. On click, it will read the date values.
    - **Modify API Call (`script/main.js`):** The `fetchAndDisplayInvoices` function will be updated to accept the start and end dates. It will then pass these dates as query parameters in the GET request to the server (e.g., `/api/invoices?startDate=2025-01-01&endDate=2025-01-31`).

2.  **Backend Changes (`server.js`):**
    - **Enhance API Endpoint (`/api/invoices`):** The endpoint will be modified to check for `startDate` and `endDate` in the request's query parameters (`req.query`).
    - **Dynamic Database Query:** If dates are provided, we will add filters to the Supabase query. We'll use `.gte('booking_time', startDate)` for the start date (greater than or equal to) and `.lte('booking_time', endDate)` for the end date (less than or equal to).
    - **Default Behavior:** If no dates are sent in the request, the endpoint will return all invoices, just as it does now.

### STEP 6: Switch the trigger from reservations in Simplybook.me to invoices in SBPay.me (same platform).

**We need to change the trigger, instead of reservations in Simplybook.me, for each invoice created in SBPay.me. SBPay.me is the payment part of Simplybook.me (they are the same platform), and I have already checked that all the details we are actually capturing are visible in the invoice.**

**This step is crucial, because we will avoid sending invoices that have not been paid. This happens because some bookings are not paid immediately. Also, some clients make direct reservations and pay with their card on the spot, then the payment is manually added to SBPay.me and that MUST trigger an invoice to be sent to VeriFactu (we will implement the sending in STEP 8, but now it is irrelevant).**

For context, these are the 4 links to the Simplybook.me API docs:
API Explorer: `https://simplybook.me/en/api/developer-api/tab?_gl=1*nxbgr3*_up*MQ..*_ga*NTc3MDkwNzM1LjE3Njg0MTgxNDA.*_ga_DF4Z49WJND*czE3Njg0MTgxMzkkbzEkZzAkdDE3Njg0MTgxMzkkajYwJGwwJGg0NjEzNTc5Njk.`
User API guide: `https://simplybook.me/en/api/developer-api/tab/guide_api`
API Documentation: `https://simplybook.me/en/api/developer-api/tab/doc_api?_gl=1*1wpcobx*_up*MQ..*_ga*NTc3MDkwNzM1LjE3Njg0MTgxNDA.*_ga_DF4Z49WJND*czE3Njg0MTgxMzkkbzEkZzEkdDE3Njg0MTgxNDgkajUxJGwwJGg0NjEzNTc5Njk.`
REST API: `https://simplybook.me/en/api/developer-api/tab/rest_api?_gl=1*1wlrjr0*_up*MQ..*_ga*NTc3MDkwNzM1LjE3Njg0MTgxNDA.*_ga_DF4Z49WJND*czE3Njg0MTgxMzkkbzEkZzEkdDE3Njg0MTgxNTgkajQxJGwwJGg0NjEzNTc5Njk.`

## NOT RELEVANT FOR THE MOMENT, IGNORE EVERYTHING BELOW THIS LINE

### STEP 7: Prepare Supabase for Invocash VeriFactu Integration

To store the status and IDs related to the VeriFactu submission through Invocash, we need to add new columns to your `invoices` table in Supabase.

Please go to your Supabase dashboard, navigate to the SQL Editor, and execute the following SQL command:

```sql
ALTER TABLE invoices
ADD COLUMN invocash_invoice_id TEXT,
ADD COLUMN verifactu_status TEXT DEFAULT 'pending',
ADD COLUMN verifactu_qr_url TEXT; -- Optional, if Invocash API provides a direct URL to the QR
```

- `invocash_invoice_id`: To store the unique ID assigned by Invocash to the invoice.
- `verifactu_status`: To track the current status of the VeriFactu submission (e.g., 'pending', 'sent', 'validated', 'error'). Defaults to 'pending' for new invoices.
- `verifactu_qr_url`: (Optional) If Invocash's API provides a direct URL to the VeriFactu QR code, we can store it here for display in the frontend.
  **STEP 7 implemented up to this step, but might need changes.**

### STEP 8:

### LAST CONVERSATION

1.  La URL del endpoint de la API de Invocash para crear facturas.
2.  Tu API Key de Invocash para autenticar las peticiones.

He encontrado esta URL de la documentación que vimos antes: https://ivansanceviciustest.invo.cash/api/documentation#/. Revisándola,
parece que el endpoint para crear una factura es un POST a /api/v1/invoices. ¿Me lo puedes confirmar?

Y lo más importante, ¿cuál es tu API Key de Invocash?

Nota de seguridad: La manejaremos de forma segura utilizando variables de entorno para no dejarla expuesta en el código.

Una vez que me des esa información, este será el plan:

1.  Modificar `server.js`:
    - Crear una función sendToInvocash(invoice) que tome los datos de una factura.
    - Dentro de esa función, construir y enviar la petición POST a la API de Invocash con los datos mapeados correctamente.
    - Actualizar la fila correspondiente en la tabla invoices de Supabase con el invocash_invoice_id y el nuevo verifactu_status que
      nos devuelva Invocash.
2.  Actualizar el Webhook:
    - Llamar a nuestra nueva función sendToInvocash() justo después de guardar una nueva factura en la base de datos.
3.  Actualizar el Frontend:
    - Añadir una columna a la tabla en index.html para mostrar el verifactu_status de cada factura.

✦ Gracias por la URL. He analizado la documentación de app.verifactuapi.es y la información es muy reveladora.

Mis Hallazgos

Esta API parece ser un servicio más genérico y directo para la validación VeriFactu, no necesariamente atado a la marca "Invocash"
(aunque podrían ser los operadores o usar esta misma plataforma).

- Endpoint: El endpoint para crear una factura es POST /api/alta-registro-facturacion.
- Autenticación: Usa un token de autenticación (Bearer Token) que se obtiene haciendo login.
- Datos Requeridos: Aquí está el punto clave. La API exige datos muy específicos y estructurados que son obligatorios para la
  normativa española. En particular, requiere un campo IDEmisorFactura que debe ser el NIF del emisor.
