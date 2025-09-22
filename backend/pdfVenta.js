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

    // Logo
    try {
      doc.image(path.join(__dirname, 'Rider.png'), 40, 30, { width: 80 });
    } catch (e) {}

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

    // Tabla: encabezado
    const tableTop = doc.y;
    const colX = [40, 170, 250, 320, 390, 470];
    const colW = [130, 80, 70, 70, 80];

    doc
      .font('Helvetica-Bold').fontSize(12).fillColor('#fff')
      .rect(colX[0], tableTop, 430, 22).fill('#a32020')
      .fillColor('#fff')
      .text('Producto', colX[0] + 4, tableTop + 5, { width: colW[0] })
      .text('Marca', colX[1] + 4, tableTop + 5, { width: colW[1] })
      .text('Cantidad', colX[2] + 4, tableTop + 5, { width: colW[2], align: 'right' })
      .text('Precio', colX[3] + 4, tableTop + 5, { width: colW[3], align: 'right' })
      .text('Subtotal', colX[4] + 4, tableTop + 5, { width: colW[4], align: 'right' });

    doc.moveDown();
    let y = tableTop + 22;

    // Tabla: filas
    doc.font('Helvetica').fontSize(12).fillColor('#222');
    detalles.forEach((d, i) => {
      // Alternar color de fondo para filas
      if (i % 2 === 0) {
        doc.rect(colX[0], y, 430, 20).fill('#f6f6f6').fillColor('#222');
      }
      doc
        .text(d.nombre, colX[0] + 4, y + 4, { width: colW[0] })
        .text(d.marca || '-', colX[1] + 4, y + 4, { width: colW[1] })
        .text(d.cantidad, colX[2] + 4, y + 4, { width: colW[2], align: 'right' })
        .text(`$${Number(d.precio).toFixed(2)}`, colX[3] + 4, y + 4, { width: colW[3], align: 'right' })
        .text(`$${(Number(d.precio) * d.cantidad).toFixed(2)}`, colX[4] + 4, y + 4, { width: colW[4], align: 'right' });
      y += 20;
      doc.fillColor('#222');
    });

    // Línea divisoria antes del total
    doc.moveTo(colX[0], y + 2).lineTo(colX[0] + 430, y + 2).strokeColor('#a32020').lineWidth(1).stroke();

    // Total
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#a32020')
      .text('TOTAL:', colX[3] + 4, y + 8, { width: colW[3], align: 'right' })
      .text(`$${Number(venta.total).toFixed(2)}`, colX[4] + 4, y + 8, { width: colW[4], align: 'right' });

    doc.moveDown(3);
    doc.fontSize(11).fillColor('#333')
      .text('Gracias por su compra.', { align: 'center' })
      .moveDown(0.5)
      .text('Rider Motos - Av. Siempreviva 123 - Tel: 555-1234', { align: 'center' })
      .text('www.ridermotos.com.ar', { align: 'center', link: 'http://www.ridermotos.com.ar', underline: true });

    doc.end();
  });
}

module.exports = { generarPDFVenta };