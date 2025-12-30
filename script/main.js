// HANDLES PAGE FUNCTIONALITIES

document.addEventListener('DOMContentLoaded', () => {
  const invoiceTableBody = document.getElementById('facturas-body');

  async function fetchAndDisplayInvoices() {
    try {
      const response = await fetch('/api/invoices');
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const invoices = await response.json();
      console.log('Facturas recibidas del servidor:', invoices);

      // Limpiar el cuerpo de la tabla antes de agregar nuevas filas
      invoiceTableBody.innerHTML = '';

      if (invoices.length === 0) {
        const row = invoiceTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = 'No hay facturas para mostrar.';
        cell.style.textAlign = 'center';
        return;
      }

      invoices.forEach(invoice => {
        const row = invoiceTableBody.insertRow();

        const cellClientName = row.insertCell();
        cellClientName.textContent = invoice.client_name;

        const cellClientEmail = row.insertCell();
        cellClientEmail.textContent = invoice.client_email;

        const cellServiceName = row.insertCell();
        cellServiceName.textContent = invoice.service_name;

        const cellAmount = row.insertCell();
        cellAmount.textContent = `${parseFloat(invoice.amount).toFixed(2)} EUR`;

        const cellBookingTime = row.insertCell();
        // Formatear la fecha para que sea más legible
        cellBookingTime.textContent = new Date(invoice.booking_time).toLocaleString();
      });

    } catch (error) {
      console.error('No se pueden cargar las facturas del servidor.', error.message);
      const row = invoiceTableBody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 5;
      cell.textContent = 'Error al cargar las facturas.';
      cell.style.textAlign = 'center';
      cell.style.color = 'red';
    }
  }

  fetchAndDisplayInvoices();
});