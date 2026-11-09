import React from 'react';

import jsPDF from 'jspdf';

import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';

// No se necesita declaración para lastAutoTable ya que no usamos autoTable

interface Vacacion {
    periodo: string;

    diasPendientes: number;

    diasPendientesSecundarios?: number;

    fechaDisfrute: string;

    fechaDisfruteSecundario?: string;
}

interface Props {
    nombre: string;

    registro: string;

    vacaciones: Vacacion[];

    renderAsButton?: boolean;

    esAplazamiento?: boolean;
}

const MemorandoVacaciones: React.FC<Props> = ({
    nombre,

    registro,

    vacaciones,

    renderAsButton = false,

    esAplazamiento = false,
}) => {
    const generarPDF = () => {
        const doc = new jsPDF();

        // Add logo

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

    const generateContent = (doc: jsPDF) => {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Formatear la fecha actual
        const fechaActual = new Date();
        const dia = fechaActual.getDate().toString().padStart(2, '0');
        const mes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fechaActual);
        const anio = fechaActual.getFullYear();

        // Número de memorando (podría ser dinámico en el futuro)
        const consecutivo = `3000-${Math.floor(Math.random() * 1000)}-${anio}`;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');

        // Encabezado con el logo ya añadido
        const memorandoText = 'MEMORANDO';
        const memorandoWidth = doc.getTextWidth(memorandoText);
        doc.text(memorandoText, (pageWidth - memorandoWidth) / 2, 25);

        // Consecutivo en la esquina superior derecha
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Consecutivo: ${consecutivo}`,
            pageWidth - 60,
            35
        );

        // Fecha en la esquina superior derecha
        doc.text(
            `Santiago de Cali, ${dia} de ${mes} de ${anio}`,
            pageWidth - 60,
            42
        );

        // Encabezado corporativo centrado
        doc.setFont('helvetica', 'bold');
        const emcaliText = 'EMPRESAS MUNICIPALES DE CALI – EMCALI E.I.C.E.- E.S.P.';
        const emcaliWidth = doc.getTextWidth(emcaliText);
        doc.text(
            emcaliText,
            (pageWidth - emcaliWidth) / 2,
            50
        );

        const gerenciaText = 'GERENCIA DE ÁREA GESTIÓN HUMANA';
        const gerenciaWidth = doc.getTextWidth(gerenciaText);
        doc.text(
            gerenciaText,
            (pageWidth - gerenciaWidth) / 2,
            60
        );

        const unidadText = 'UNIDAD COMPENSACIÓN Y BENEFICIOS';
        const unidadWidth = doc.getTextWidth(unidadText);
        doc.text(
            unidadText,
            (pageWidth - unidadWidth) / 2,
            70
        );

        // Línea separadora
        doc.setLineWidth(0.5);
        doc.line(30, 80, pageWidth - 30, 80);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');

        const tituloDocumento = esAplazamiento
            ? 'CERTIFICADO DE APLAZAMIENTO DE VACACIONES'
            : 'MEMORANDO DE VACACIONES';

        const titleWidth = doc.getTextWidth(tituloDocumento);
        doc.text(
            tituloDocumento,
            (pageWidth - titleWidth) / 2,
            95
        );

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        // Sección PARA
        doc.text('PARA:', 30, 110);
        doc.setFont('helvetica', 'bold');
        doc.text(nombre, 70, 110);
        doc.setFont('helvetica', 'normal');
        doc.text(`Registro laboral : ${registro} - CAM PISO 8`, 70, 118);

        // Sección DE
        doc.text('DE:', 30, 130);
        doc.setFont('helvetica', 'bold');
        doc.text('UNIDAD COMPENSACIÓN Y BENEFICIOS', 70, 130);
        doc.setFont('helvetica', 'normal');

        // Sección ASUNTO
        doc.text('ASUNTO:', 30, 142);
        doc.setFont('helvetica', 'bold');
        doc.text('Novedad Vacaciones', 70, 142);
        doc.setFont('helvetica', 'normal');

        // Párrafo introductorio
        doc.text(
            `En atención a su solicitud con visto bueno de la Gerencia, mediante oficio 9000014742025, me permito dar respuesta al disfrute de sus vacaciones así:`,
            30, 160, { maxWidth: pageWidth - 60 }
        );

        // En lugar de tabla, formatear el texto para cada período de vacaciones
        let yPosition = 170;

        // Configurar estilo para los items
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        vacaciones.forEach((v) => {
            // Formatear el texto principal para cada período
            const textoVacacion = `*${v.diasPendientes} días del período ${v.periodo} ${v.fechaDisfrute} inclusive, esta novedad no genera reliquidación alguna.`;

            doc.text(
                textoVacacion,
                30,
                yPosition,
                { maxWidth: pageWidth - 60 }
            );

            yPosition += 15; // Espacio entre items

            // Añadir el segundo período si existe
            if (
                v.diasPendientesSecundarios &&
                v.diasPendientesSecundarios > 0 &&
                v.fechaDisfruteSecundario &&
                v.fechaDisfruteSecundario !== 'N/A'
            ) {
                const textoVacacionSecundario = `*${v.diasPendientesSecundarios} días del período ${v.periodo} ${v.fechaDisfruteSecundario} inclusive, esta novedad no genera reliquidación alguna.`;

                doc.text(
                    textoVacacionSecundario,
                    30,
                    yPosition,
                    { maxWidth: pageWidth - 60 }
                );

                yPosition += 15;
            }
        });

        // Guardar la posición final para usar en elementos posteriores
        const finalY = yPosition + 10;

        // Agregar texto explicativo adicional
        const textoAdicional = esAplazamiento
            ? "El presente aplazamiento ha sido debidamente autorizado por las instancias correspondientes."
            : "Le recordamos que debe presentarse a sus labores el día hábil siguiente a la finalización de sus vacaciones.";

        doc.text(
            textoAdicional,
            30,
            finalY,
            { maxWidth: pageWidth - 60 }
        );

        // Texto de Cordialmente
        doc.text(
            'Cordialmente,',
            30,
            finalY + 30
        );

        // Línea para firma
        doc.setLineWidth(0.5);
        doc.line(30, finalY + 60, 150, finalY + 60);

        // Nombre del firmante
        doc.setFont('helvetica', 'bold');
        doc.text(
            'LINA MARIA ALVAREZ SIERRA',
            30,
            finalY + 70
        );

        // Cargo del firmante
        doc.setFont('helvetica', 'normal');
        doc.text(
            'Jefe Unidad',
            30,
            finalY + 78
        );

        // Agregar sección de copia
        doc.text(
            'Copia: Historia laboral, Analista Jorge Caicedo',
            30,
            finalY + 95
        );

        // Agregar sección de elaboración
        doc.text(
            'Elaboró:',
            30,
            finalY + 110
        );
        doc.text(
            'Maria Rocio Zapata - Analista',
            70,
            finalY + 110
        );

        // Fecha de generación en la parte inferior
        const fecha = new Date().toLocaleDateString();
        doc.setFontSize(8);
        doc.text(
            `Fecha de generación: ${fecha}`,
            30,
            pageHeight - 20
        );

        const nombreArchivo = esAplazamiento
            ? 'certificado_aplazamiento_vacaciones.pdf'
            : 'reporte_vacaciones.pdf';
        doc.save(nombreArchivo);
    };

    if (renderAsButton) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={generarPDF}
                className="h-8 px-2 text-blue-600 hover:bg-blue-100 border border-blue-600"
                title={esAplazamiento ? "Descargar certificado de aplazamiento" : "Descargar certificado"}
            >
                <FileText className="h-4 w-4 text-blue-600" />
            </Button>
        );
    }

    return <button onClick={generarPDF}>Generar PDF</button>;
};

export default MemorandoVacaciones;
