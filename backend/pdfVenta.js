const PDFDocument = require('pdfkit');

function generarPDFVenta(venta, detalles, cliente) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    doc.fontSize(20).fillColor('#a32020').text('Detalle de Venta', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('#000').text(`Fecha: ${venta.fecha}`);
    doc.text(`Cliente: ${cliente.nombre} ${cliente.apellido}`);
    doc.text(`Correo: ${cliente.correo}`);
    doc.text(`Teléfono: ${cliente.telefono}`);
    doc.moveDown();

    detalles.forEach((d, i) => {
      doc.fontSize(12).fillColor('#000').text(
        `Producto: ${d.nombre} | Marca: ${d.marca || '-'} | Cantidad: ${d.cantidad} | Precio: $${Number(d.precio).toFixed(2)} | Subtotal: $${(Number(d.precio) * Number(d.cantidad)).toFixed(2)}`
      );
    });

    doc.moveDown();
    doc.fontSize(14).fillColor('#a32020').text(`Total: $${Number(venta.total).toFixed(2)}`, { align: 'right' });

    doc.end();
  });
}

module.exports = { generarPDFVenta };