const PDFDocument = require('pdfkit');
const path = require('path');

function generarPDFVenta(venta, detalles, cliente) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    try {
      doc.image(path.join(__dirname, 'Rider.png'), 40, 30, { width: 80 });
    } catch (e) {
      // Si no encuentra el logo, simplemente no lo muestra
    }

    doc.fontSize(22).fillColor('#a32020').text('Comprobante de Venta', { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(12).fillColor('#000').text(`Fecha: ${new Date(venta.fecha).toLocaleDateString()}`);
    doc.text(`Método de pago: ${venta.metodo_pago || '-'}`);
    doc.moveDown(0.5);

    doc.fontSize(13).fillColor('#333').text(`Cliente: ${cliente.nombre} ${cliente.apellido}`);
    doc.text(`Correo: ${cliente.correo}`);
    doc.text(`Teléfono: ${cliente.telefono}`);
    doc.moveDown();

    // Tabla de productos
    doc.fontSize(13).fillColor('#a32020').text('Detalle de productos:', { underline: true });
    doc.moveDown(0.5);

    // Encabezado tabla
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#000')
      .text('Producto', 40, doc.y, { continued: true, width: 120 })
      .text('Marca', 170, doc.y, { continued: true, width: 80 })
      .text('Cantidad', 250, doc.y, { continued: true, width: 60 })
      .text('Precio', 320, doc.y, { continued: true, width: 60 })
      .text('Subtotal', 390, doc.y, { width: 70 });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(12);

    detalles.forEach((d) => {
      doc.text(d.nombre, 40, doc.y, { continued: true, width: 120 })
        .text(d.marca || '-', 170, doc.y, { continued: true, width: 80 })
        .text(d.cantidad, 250, doc.y, { continued: true, width: 60 })
        .text(`$${Number(d.precio).toFixed(2)}`, 320, doc.y, { continued: true, width: 60 })
        .text(`$${(Number(d.precio) * d.cantidad).toFixed(2)}`, 390, doc.y, { width: 70 });
    });

    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#a32020')
      .text(`TOTAL: $${Number(venta.total).toFixed(2)}`, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(11).fillColor('#333')
      .text('Gracias por su compra.', { align: 'center' })
      .moveDown(0.5)
      .text('Rider Motos - Av. Siempreviva 123 - Tel: 555-1234', { align: 'center' })
      .text('www.ridermotos.com.ar', { align: 'center', link: 'http://www.ridermotos.com.ar', underline: true });

    doc.end();
  });
}

module.exports = { generarPDFVenta };