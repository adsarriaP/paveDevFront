import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  festivos = [],
  onYearChange,
  startMonth,
  endMonth,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  festivos?: string[] // Array de fechas en formato "YYYY-MM-DD"
  onYearChange?: (year: number) => void // Callback cuando cambia el año
}) {
  // Rango de años por defecto: desde 5 años atrás hasta 3 años adelante
  const currentYear = new Date().getFullYear()
  const defaultStartMonth = new Date(currentYear - 5, 0)
  const defaultEndMonth = new Date(currentYear + 3, 11)
  const defaultClassNames = getDefaultClassNames()

  // Función para verificar si una fecha es festivo
  const isFestivo = (date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0]
    return festivos.includes(dateString)
  }

  // Función para verificar si es fin de semana
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay()
    return day === 0 || day === 6 // Domingo o Sábado
  }

  // Función combinada para días deshabilitados
  const isDisabledDate = (date: Date): boolean => {
    return isFestivo(date) || isWeekend(date)
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      startMonth={startMonth ?? defaultStartMonth}
      endMonth={endMonth ?? defaultEndMonth}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      // *** USAR LA FUNCIÓN DISABLED PARA PREVENIR SELECCIÓN ***
      disabled={(date) => {
        // Si ya hay una función disabled, combinarla
        if (props.disabled) {
          if (typeof props.disabled === 'function') {
            return props.disabled(date) || isDisabledDate(date)
          }
          return isDisabledDate(date)
        }
        return isDisabledDate(date)
      }}
      // Detectar cambios de año
      onMonthChange={(month) => {
        if (onYearChange) {
          onYearChange(month.getFullYear())
        }
        // Llamar al onMonthChange original si existe
        if (props.onMonthChange) {
          props.onMonthChange(month)
        }
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-popover inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-muted-foreground",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        // *** COMPONENTE PERSONALIZADO PARA LOS BOTONES DE DÍA ***
        DayButton: ({ day, modifiers, ...props }) => (
          <CalendarDayButton 
            day={day} 
            modifiers={modifiers}
            isFestivo={isFestivo(day.date)}
            isWeekend={isWeekend(day.date)}
            {...props} 
          />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

// *** COMPONENTE MEJORADO PARA LOS BOTONES DE DÍA ***
function CalendarDayButton({
  className,
  day,
  modifiers,
  isFestivo = false,
  isWeekend = false,
  onClick,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  isFestivo?: boolean
  isWeekend?: boolean
}) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  // *** DETERMINAR SI EL DÍA ESTÁ DESHABILITADO ***
  const isDisabled = modifiers.disabled || isFestivo || isWeekend;

  // *** MANEJAR CLICK PARA PREVENIR SELECCIÓN DE DÍAS DESHABILITADOS ***
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Click prevenido en fecha deshabilitada:', day.date.toLocaleDateString());
      return;
    }
    
    // Si no está deshabilitado, permitir el click normal
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      // *** DESHABILITAR VISUALMENTE EL BOTÓN ***
      disabled={isDisabled}
      // *** INTERCEPTAR CLICKS ***
      onClick={handleClick}
      // *** TAMBIÉN PREVENIR CLICK CON POINTER-EVENTS SI ESTÁ DESHABILITADO ***
      style={{
        pointerEvents: isDisabled ? 'none' : 'auto',
        cursor: isDisabled ? 'not-allowed' : 'pointer'
      }}
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-festivo={isFestivo}
      data-weekend={isWeekend}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
        // *** ESTILOS PARA FESTIVOS (ROJO) ***
        "data-[festivo=true]:bg-red-100 data-[festivo=true]:text-red-800 data-[festivo=true]:border-red-300",
        "dark:data-[festivo=true]:bg-red-900/20 dark:data-[festivo=true]:text-red-400 dark:data-[festivo=true]:border-red-800",
        // *** ESTILOS PARA FINES DE SEMANA (GRIS) ***
        "data-[weekend=true]:bg-gray-100 data-[weekend=true]:text-gray-600",
        "dark:data-[weekend=true]:bg-gray-800/20 dark:data-[weekend=true]:text-gray-400",
        // *** ESTILOS PARA DÍAS DESHABILITADOS ***
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // *** MANTENER COLORES CUANDO ESTÁN DESHABILITADOS ***
        "disabled:data-[festivo=true]:bg-red-100 disabled:data-[weekend=true]:bg-gray-100",
        "dark:disabled:data-[festivo=true]:bg-red-900/20 dark:disabled:data-[weekend=true]:bg-gray-800/20",
        // *** PREVENIR HOVER EN DÍAS DESHABILITADOS ***
        "disabled:hover:bg-red-100 disabled:hover:bg-gray-100",
        defaultClassNames.day,
        className
      )}
      {...props}
    >
      {day.date.getDate()}
    </Button>
  )
}

export { Calendar, CalendarDayButton }