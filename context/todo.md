# Project TODO List

1. [DONE] Guide user to set up a Supabase project and create an 'invoices' table.
2. [DONE] Update the server to connect to Supabase and save incoming webhook data.
3. [DONE] Create a new API endpoint to fetch a list of all invoices.
4. [DONE] Redesign the frontend to display the list of all invoices.
5. [pending] Implement frontend controls and backend logic for filtering invoices by date.

Do We Need a Service Layer?

That is an excellent architectural question.

A service layer is a pattern where you extract business logic out of your route handlers (like our /webhook
function) and into separate, reusable modules or classes. For example, we could create an InvoiceService.js file with a function like createInvoicesFromBooking(bookingId).

For our current needs, a service layer is not strictly required. The logic is contained in one place and ismanageable.

However, for future growth, it is a very good idea. As we add more features (like fetching and filtering invoices for the frontend, as per your todo.md), a service layer provides several benefits:

- Separation of Concerns: It keeps the HTTP request/response logic separate from the core business logic.
- Reusability: We could reuse the createInvoicesFromBooking function elsewhere if needed.
- Testability: It is much easier to write automated tests for a standalone service function than for an entire Express endpoint.

### Note on Code Cleanup

During the implementation of steps 3 and 4, some parts of `server.js` became obsolete. Specifically:

- The `lastProcessedData` global variable, which was used to store the last invoice in memory.
- The `/api/last-processed-data` endpoint, which served this single invoice to the frontend.
  This functionality was entirely replaced by the `/api/invoices` endpoint that fetches all data from the database. These obsolete parts were removed to keep the code clean and maintainable.

---

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

### `is fetchAndDisplayInvoices() fetching and displaying? shouldn't we separate it?`

<span style="color:lightgreen ;">[PENDING]</span> Implement frontend controls and backend logic
