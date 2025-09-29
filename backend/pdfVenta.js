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

    // Logo bien arriba a la izquierda
    let logoY = 20;
    try {
      doc.image(path.join(__dirname, 'Rider.png'), 30, logoY, { width: 80 });
    } catch (e) {}

    // Título bien arriba y centrado
    const tituloY = 35;
    doc.fontSize(24).fillColor('#a32020').text('Comprobante de Venta', 0, tituloY, { align: 'center', underline: true });

    // Datos de la venta y cliente (más abajo)
    let datosY = 110;
    doc.fontSize(12).fillColor('#000').text(`Fecha: ${new Date(venta.fecha).toLocaleDateString()}`, 40, datosY);
    datosY += 20;
    doc.text(`Método de pago: ${venta.metodo_pago || '-'}`, 40, datosY);
    datosY += 25;
    doc.fontSize(13).fillColor('#333').text(`Cliente: ${cliente.nombre} ${cliente.apellido}`, 40, datosY);
    datosY += 18;
    doc.text(`Correo: ${cliente.correo}`, 40, datosY);
    datosY += 18;
    doc.text(`Teléfono: ${cliente.telefono}`, 40, datosY);

    // Detalle de productos (más espacio antes)
    datosY += 35;
    doc.fontSize(13).fillColor('#a32020').text('Detalle de productos:', 40, datosY, { underline: true });
    datosY += 25;

    // Tabla: encabezado (más ancha)
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const tableLeft = 40;
    const tableWidth = pageWidth - 2 * (tableLeft - doc.page.margins.left); // para que quede a lo largo
    const colX = [
      tableLeft,
      tableLeft + 0.22 * tableWidth,
      tableLeft + 0.44 * tableWidth,
      tableLeft + 0.60 * tableWidth,
      tableLeft + 0.75 * tableWidth
    ];
    const colW = [
      0.22 * tableWidth,
      0.22 * tableWidth,
      0.16 * tableWidth,
      0.15 * tableWidth,
      0.15 * tableWidth
    ];

    // Encabezado de tabla
    doc
      .font('Helvetica-Bold').fontSize(12).fillColor('#fff')
      .rect(tableLeft, datosY, tableWidth, 22).fill('#a32020')
      .fillColor('#fff')
      .text('Producto', colX[0] + 4, datosY + 5, { width: colW[0] - 8 })
      .text('Marca', colX[1] + 4, datosY + 5, { width: colW[1] - 8 })
      .text('Cantidad', colX[2] + 4, datosY + 5, { width: colW[2] - 8, align: 'right' })
      .text('Precio', colX[3] + 4, datosY + 5, { width: colW[3] - 8, align: 'right' })
      .text('Subtotal', colX[4] + 4, datosY + 5, { width: colW[4] - 8, align: 'right' });

    let y = datosY + 22;

    // Tabla: filas (más espacio entre filas)
    doc.font('Helvetica').fontSize(12).fillColor('#222');
    detalles.forEach((d, i) => {
      if (i % 2 === 0) {
        doc.rect(tableLeft, y, tableWidth, 24).fill('#f6f6f6').fillColor('#222');
      }
      doc
        .text(d.nombre, colX[0] + 4, y + 6, { width: colW[0] - 8 })
        .text(d.marca || '-', colX[1] + 4, y + 6, { width: colW[1] - 8 })
        .text(d.cantidad, colX[2] + 4, y + 6, { width: colW[2] - 8, align: 'right' })
        .text(`$${Number(d.precio).toFixed(2)}`, colX[3] + 4, y + 6, { width: colW[3] - 8, align: 'right' })
        .text(`$${(Number(d.precio) * d.cantidad).toFixed(2)}`, colX[4] + 4, y + 6, { width: colW[4] - 8, align: 'right' });
      y += 24;
      doc.fillColor('#222');
    });

    // Línea divisoria antes del total
    doc.moveTo(tableLeft, y + 2).lineTo(tableLeft + tableWidth, y + 2).strokeColor('#a32020').lineWidth(1).stroke();

    // Total (alineado a la derecha, una sola línea)
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#a32020')
      .text('TOTAL:', colX[3] + 4, y + 10, { width: colW[3] - 8, align: 'right' })
      .text(`$${Number(venta.total).toFixed(2)}`, colX[4] + 4, y + 10, { width: colW[4] - 8, align: 'right' });

    // Pie de página: más abajo, pero siempre en la misma hoja
    const pieY = Math.max(y + 60, 690); // nunca menos de 690, pero si la tabla es más larga, baja más
    doc.fontSize(12).fillColor('#333');
    doc.text('Gracias por su compra.', 0, pieY, { align: 'center' });
    doc.text('Rider Motos - Av.Uruguay 61 - Tel: 3541 43-7332', 0, pieY + 18, { align: 'center' });
    doc.text('www.ridermotos.com.ar', 0, pieY + 36, { align: 'center', link: 'http://www.ridermotos.com.ar', underline: true });

    doc.end();
  });
}

module.exports = { generarPDFVenta };