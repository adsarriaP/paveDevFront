import React from 'react';

import jsPDF from 'jspdf';

import autoTable from 'jspdf-autotable';

import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface Vacacion {
  periodo: string;

  diasPendientes: number;

  diasPendientesSecundarios?: number;

  fechaDisfrute: string;

  fechaRetorno: string;

  fechaDisfruteSecundario?: string;

  fechaRetornoSecundario?: string;
}

interface Props {
  nombre: string;

  registro: string;

  vacaciones: Vacacion[];

  renderAsButton?: boolean;

  esAplazamiento?: boolean;
}

const CertificadoVacaciones: React.FC<Props> = ({
  nombre,

  registro,

  vacaciones,

  renderAsButton = false,

  esAplazamiento = false,
}) => {
  const generarPDF = () => {
    const doc = new jsPDF();

    const logoUrl = '/images/company_logo.png';

    const img = new Image();

    img.crossOrigin = 'anonymous';

    img.src = logoUrl;

    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 30, 30);

      generateContent(doc);
    };

    img.onerror = () => {
      generateContent(doc);
    };
  };

  const formatearFechaEspanol = (fechaStr: string): string => {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    return `${day} de ${meses[month - 1]} de ${year}`;
  };

  const generateContent = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.width;

    if (esAplazamiento) {
      // ── FORMATO REG 101838 ──

      const fechaActual = new Date();
      const dia = fechaActual.getDate().toString().padStart(2, '0');
      const mes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fechaActual);
      const anio = fechaActual.getFullYear();
      const fechaStr = `Santiago de Cali, ${dia} de ${mes} de ${anio}`;

      // Fecha alineada a la derecha
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(fechaStr, pageWidth - 30 - doc.getTextWidth(fechaStr), 20);

      // Encabezado corporativo centrado
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');

      const emcaliText = 'EMPRESAS MUNICIPALES DE CALI – EMCALI E.I.C.E.- E.S.P.';
      doc.text(emcaliText, (pageWidth - doc.getTextWidth(emcaliText)) / 2, 50);

      const gerenciaText = 'GERENCIA DE ÁREA GESTIÓN HUMANA';
      doc.text(gerenciaText, (pageWidth - doc.getTextWidth(gerenciaText)) / 2, 58);

      const unidadText = 'UNIDAD COMPENSACIÓN Y BENEFICIOS';
      doc.text(unidadText, (pageWidth - doc.getTextWidth(unidadText)) / 2, 66);

      // Línea separadora
      doc.setLineWidth(0.3);
      doc.line(30, 72, pageWidth - 30, 72);

      // Sección PARA / DE / ASUNTO
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PARA:', 30, 83);
      doc.setFont('helvetica', 'normal');
      doc.text(`${nombre.toUpperCase()}      Registro laboral No. ${registro}`, 55, 83);

      doc.setFont('helvetica', 'bold');
      doc.text('DE:', 30, 93);
      doc.setFont('helvetica', 'normal');
      doc.text('802 UNIDAD COMPENSACIÓN Y BENEFICIOS', 55, 93);

      doc.setFont('helvetica', 'bold');
      doc.text('ASUNTO:', 30, 103);
      doc.setFont('helvetica', 'normal');
      doc.text('NOVEDAD VACACIONES', 55, 103);

      // Línea separadora
      doc.line(30, 109, pageWidth - 30, 109);

      // Saludo
      doc.setFontSize(11);
      doc.text('Cordial saludo,', 30, 120);

      // Cuerpo principal
      doc.text(
        'En atención a su solicitud, de manera atenta me permito dar respuesta al disfrute de sus vacaciones así:',
        30,
        133,
        { maxWidth: pageWidth - 60 }
      );

      // Líneas de vacaciones
      let yPos = 153;

      vacaciones.forEach((v) => {
        const inicio = formatearFechaEspanol(v.fechaDisfrute);
        const fin = formatearFechaEspanol(v.fechaRetorno);
        const linea = `* ${v.diasPendientes} días del periodo ${v.periodo} del ${inicio} al ${fin} inclusive, sin que esta novedad genere reliquidación alguna.`;
        const lines = doc.splitTextToSize(linea, pageWidth - 60);
        doc.text(lines, 30, yPos);
        yPos += lines.length * 7 + 6;

        if (
          v.diasPendientesSecundarios &&
          v.diasPendientesSecundarios > 0 &&
          v.fechaDisfruteSecundario &&
          v.fechaRetornoSecundario &&
          v.fechaDisfruteSecundario !== 'N/A'
        ) {
          const inicioSec = formatearFechaEspanol(v.fechaDisfruteSecundario);
          const finSec = formatearFechaEspanol(v.fechaRetornoSecundario);
          const lineaSec = `* ${v.diasPendientesSecundarios} días del periodo ${v.periodo} del ${inicioSec} al ${finSec} inclusive, sin que esta novedad genere reliquidación alguna.`;
          const linesSec = doc.splitTextToSize(lineaSec, pageWidth - 60);
          doc.text(linesSec, 30, yPos);
          yPos += linesSec.length * 7 + 6;
        }
      });

      // Cierre
      yPos += 8;
      doc.text('Agradezco la atención prestada,', 30, yPos);

      // Línea de firma
      doc.setLineWidth(0.5);
      doc.line(30, yPos + 30, 130, yPos + 30);

      doc.setFont('helvetica', 'bold');
      doc.text('LINA MARÍA ÁLVAREZ SIERRA', 30, yPos + 38);

      doc.setFont('helvetica', 'normal');
      doc.text('Jefe de Unidad Compensación y Beneficios', 30, yPos + 46);
      doc.text('Gerencia de Área Gestión Humana', 30, yPos + 54);
      doc.text('EMCALI E.I.C.E. E.S.P.  Nit.890.399.003-4', 30, yPos + 62);

      doc.text('Elaboró: MARIA GABRIELA LOPEZ MONSALVE, Asistente', 30, yPos + 76);

      doc.setLineWidth(0.3);
      doc.line(30, yPos + 88, pageWidth - 30, yPos + 88);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      const approvalTextAplaz = 'Este documento ha sido aprobado digitalmente por la Unidad Compensación y Beneficios – EMCALI E.I.C.E. E.S.P. La información aquí consignada es verídica y tiene plena validez.';
      doc.text(doc.splitTextToSize(approvalTextAplaz, pageWidth - 60), 30, yPos + 96);

      doc.save('certificado_aplazamiento_vacaciones.pdf');
    } else {
      // ── FORMATO TABLA (sin cambios) ──

      doc.setFontSize(12);

      const emcaliWidth = doc.getTextWidth(
        'EMPRESAS MUNICIPALES DE CALI – EMCALI E.I.C.E.- E.S.P.'
      );

      doc.text(
        'EMPRESAS MUNICIPALES DE CALI – EMCALI E.I.C.E.- E.S.P.',
        (pageWidth - emcaliWidth) / 2,
        50
      );

      const gerenciaWidth = doc.getTextWidth('GERENCIA DE ÁREA GESTIÓN HUMANA');

      doc.text(
        'GERENCIA DE ÁREA GESTIÓN HUMANA',
        (pageWidth - gerenciaWidth) / 2,
        60
      );

      const unidadWidth = doc.getTextWidth(
        'UNIDAD COMPENSACIÓN Y BENEFICIOS'
      );

      doc.text(
        'UNIDAD COMPENSACIÓN Y BENEFICIOS',
        (pageWidth - unidadWidth) / 2,
        70
      );

      doc.setFontSize(14);

      const tituloDocumento = 'REPORTE DE VACACIONES PENDIENTES DE DISFRUTE';

      const titleWidth = doc.getTextWidth(tituloDocumento);

      doc.text(tituloDocumento, (pageWidth - titleWidth) / 2, 90);

      doc.setFontSize(12);

      doc.text('Nombre del funcionario:', 30, 110);

      doc.text(nombre, 80, 110);

      doc.text('Registro laboral:', 30, 120);

      doc.text(registro, 70, 120);

      const tableRows: (string | number)[][] = [];

      vacaciones.forEach((v) => {
        tableRows.push([v.periodo, v.diasPendientes, v.fechaDisfrute]);

        if (
          v.diasPendientesSecundarios &&
          v.diasPendientesSecundarios > 0 &&
          v.fechaDisfruteSecundario &&
          v.fechaDisfruteSecundario !== 'N/A'
        ) {
          tableRows.push([
            v.periodo,
            v.diasPendientesSecundarios,
            v.fechaDisfruteSecundario,
          ]);
        }
      });

      autoTable(doc, {
        startY: 140,

        tableWidth: 150,

        margin: { left: 30 },

        head: [['PERIODO', 'DÍAS PENDIENTES', 'FECHA PARA DISFRUTE']],

        body: tableRows,

        theme: 'grid',

        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          fontSize: 10,
        },

        styles: { cellPadding: 2, fontSize: 10, lineWidth: 0.1 },

        columnStyles: {
          0: { cellWidth: 50 },

          1: { cellWidth: 50 },

          2: { cellWidth: 50 },
        },
      });

      const fecha = new Date().toLocaleDateString();

      doc.text(
        'Fecha de generación del reporte:',
        30,
        doc.lastAutoTable.finalY + 20
      );

      doc.text(fecha, 100, doc.lastAutoTable.finalY + 20);

      doc.text(
        'Para más información comunicarse con la Unidad Compensación y Beneficios al correo vacaciones@emcali.com.co.',
        30,
        doc.lastAutoTable.finalY + 30,
        { maxWidth: 150 }
      );

      const finalY = doc.lastAutoTable.finalY;
      doc.setLineWidth(0.3);
      doc.line(30, finalY + 52, pageWidth - 30, finalY + 52);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      const approvalTextTabla = 'Este documento ha sido aprobado digitalmente por la Unidad Compensación y Beneficios – EMCALI E.I.C.E. E.S.P. La información aquí consignada es verídica y tiene plena validez.';
      doc.text(doc.splitTextToSize(approvalTextTabla, pageWidth - 60), 30, finalY + 60);

      doc.save('reporte_vacaciones.pdf');
    }
  };

  if (renderAsButton) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={generarPDF}
        className="h-8 px-2 text-blue-600 hover:bg-blue-100 border border-blue-600"
        title={esAplazamiento ? 'Descargar certificado de aplazamiento' : 'Descargar certificado'}
      >
        <FileText className="h-4 w-4 text-blue-600" />
      </Button>
    );
  }

  return <button onClick={generarPDF}>Generar PDF</button>;
};

export default CertificadoVacaciones;
