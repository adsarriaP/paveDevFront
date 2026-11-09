// src/components/dependencias/hooks/useFormDependencias.ts
import { useState, useEffect } from "react";
import { Notify } from "notiflix/build/notiflix-notify-aio";
import useApi from "@/hooks/useApi";
import useDebounce from "@/hooks/useDebounce";
import { Dependencia } from "@/types/entities.types";

// Tipos específicos para este hook
export type TipoDependencia = "gerencia" | "subgerencia" | "unidad";

export interface JefeOption {
  id: number;
  nombre: string;
  user: string;
  registro: number;
  rol: { nombre: string };
}

export interface GerenciaOption {
  id: number;
  gerencia: string;
}

export interface SubgerenciaOption {
  id: number;
  gerencia: string;
  subgerencia: string;
}

export interface FormData {
  nombreGerencia: string;
  nombreSubgerencia: string;
  nombreUnidad: string;
}

export interface UseFormDependenciasProps {
  isVisible: boolean;
  onSuccess?: () => void;
}

interface UsuariosBuscarResponse {
  ok: boolean;
  data: JefeOption[];
  total: number;
}

const SEARCH_DEBOUNCE_MS = 400;

export const useFormDependencias = ({
  isVisible,
  onSuccess,
}: UseFormDependenciasProps) => {
  // Estados principales
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGerencias, setLoadingGerencias] = useState(false);
  const [loadingSubgerencias, setLoadingSubgerencias] = useState(false);

  // Datos del servidor
  const [gerencias, setGerencias] = useState<GerenciaOption[]>([]);
  const [subgerencias, setSubgerencias] = useState<SubgerenciaOption[]>([]);

  // --- Búsqueda de jefe principal ---
  const [searchTermJefe, setSearchTermJefe] = useState("");
  const [searchResultsJefe, setSearchResultsJefe] = useState<JefeOption[]>([]);
  const [isSearchingJefe, setIsSearchingJefe] = useState(false);
  const debouncedSearchJefe = useDebounce(searchTermJefe, SEARCH_DEBOUNCE_MS);

  // --- Búsqueda de jefe secundario ---
  const [searchTermJefeSecundario, setSearchTermJefeSecundario] = useState("");
  const [searchResultsJefeSecundario, setSearchResultsJefeSecundario] = useState<JefeOption[]>([]);
  const [isSearchingJefeSecundario, setIsSearchingJefeSecundario] = useState(false);
  const debouncedSearchJefeSecundario = useDebounce(searchTermJefeSecundario, SEARCH_DEBOUNCE_MS);

  // Estados de UI
  const [popoverOpenJefe, setPopoverOpenJefe] = useState(false);
  const [popoverOpenJefeSecundario, setPopoverOpenJefeSecundario] = useState(false);

  // Estados del formulario
  const [tipoDependencia, setTipoDependencia] = useState<TipoDependencia>("gerencia");
  const [selectedJefe, setSelectedJefe] = useState<JefeOption | null>(null);
  const [selectedJefeSecundario, setSelectedJefeSecundario] = useState<JefeOption | null>(null);
  const [gerenciaSeleccionada, setGerenciaSeleccionada] = useState<string>("");
  const [subgerenciaSeleccionada, setSubgerenciaSeleccionada] = useState<string>("");
  const [unidadDirectaAGerencia, setUnidadDirectaAGerencia] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    nombreGerencia: "",
    nombreSubgerencia: "",
    nombreUnidad: "",
  });

  const { post, get } = useApi();

  // Efectos de carga inicial
  useEffect(() => {
    if (isVisible) {
      fetchGerencias();
    }
  }, [isVisible]);

  useEffect(() => {
    if (gerenciaSeleccionada && !unidadDirectaAGerencia) {
      fetchSubgerenciasByGerencia(gerenciaSeleccionada);
    } else {
      setSubgerencias([]);
      setSubgerenciaSeleccionada("");
    }
  }, [gerenciaSeleccionada, unidadDirectaAGerencia]);

  // --- Efecto de búsqueda de jefe (respuesta inmediata al tipear) ---
  useEffect(() => {
    if (searchTermJefe.trim()) {
      setIsSearchingJefe(true);
    } else {
      setIsSearchingJefe(false);
      setSearchResultsJefe([]);
    }
  }, [searchTermJefe]);

  // --- Efecto de fetch debounced para jefe ---
  useEffect(() => {
    if (!debouncedSearchJefe.trim()) return;

    const fetchJefe = async () => {
      try {
        const response = await get<UsuariosBuscarResponse>(
          `/usuarios/buscar?q=${encodeURIComponent(debouncedSearchJefe.trim())}`
        );
        setSearchResultsJefe(response.data);
      } catch (error) {
        console.error("Error al buscar usuarios:", error);
      } finally {
        setIsSearchingJefe(false);
      }
    };

    fetchJefe();
  }, [debouncedSearchJefe]);

  // --- Efecto de búsqueda de jefe secundario (respuesta inmediata) ---
  useEffect(() => {
    if (searchTermJefeSecundario.trim()) {
      setIsSearchingJefeSecundario(true);
    } else {
      setIsSearchingJefeSecundario(false);
      setSearchResultsJefeSecundario([]);
    }
  }, [searchTermJefeSecundario]);

  // --- Efecto de fetch debounced para jefe secundario ---
  useEffect(() => {
    if (!debouncedSearchJefeSecundario.trim()) return;

    const fetchJefeSecundario = async () => {
      try {
        const response = await get<UsuariosBuscarResponse>(
          `/usuarios/buscar?q=${encodeURIComponent(debouncedSearchJefeSecundario.trim())}`
        );
        setSearchResultsJefeSecundario(response.data);
      } catch (error) {
        console.error("Error al buscar usuarios:", error);
      } finally {
        setIsSearchingJefeSecundario(false);
      }
    };

    fetchJefeSecundario();
  }, [debouncedSearchJefeSecundario]);

  // Funciones de reset
  const resetForm = () => {
    setFormData({
      nombreGerencia: "",
      nombreSubgerencia: "",
      nombreUnidad: "",
    });
    setSelectedJefe(null);
    setSelectedJefeSecundario(null);
    setSearchTermJefe("");
    setSearchTermJefeSecundario("");
    setSearchResultsJefe([]);
    setSearchResultsJefeSecundario([]);
    setGerenciaSeleccionada("");
    setSubgerenciaSeleccionada("");
    setTipoDependencia("gerencia");
    setUnidadDirectaAGerencia(false);
  };

  const fetchGerencias = async () => {
    try {
      setLoadingGerencias(true);
      const response = await get<Dependencia[]>("/dependencias/gerencias");
      const gerenciasFormatted = response.map((dep) => ({
        id: dep.id,
        gerencia: dep.gerencia,
      }));
      setGerencias(gerenciasFormatted);
    } catch (error) {
      console.error("Error al cargar gerencias:", error);
      Notify.failure("No se pudieron cargar las gerencias");
    } finally {
      setLoadingGerencias(false);
    }
  };

  const fetchSubgerenciasByGerencia = async (gerencia: string) => {
    try {
      setLoadingSubgerencias(true);
      const response = await get<Dependencia[]>(
        `/dependencias/subgerencias/por-gerencia/${encodeURIComponent(gerencia)}`
      );
      const subgerenciasFormatted = response.map((dep) => ({
        id: dep.id,
        gerencia: dep.gerencia,
        subgerencia: dep.subgerencia || "",
      }));
      setSubgerencias(subgerenciasFormatted);
    } catch (error) {
      console.error("Error al cargar subgerencias:", error);
      setSubgerencias([]);
    } finally {
      setLoadingSubgerencias(false);
    }
  };

  // Handlers principales
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleJefeSelection = (jefe: JefeOption) => {
    setSelectedJefe(jefe);
    setPopoverOpenJefe(false);
    setSearchTermJefe("");
    setSearchResultsJefe([]);
  };

  const handleJefeSecundarioSelection = (jefe: JefeOption) => {
    setSelectedJefeSecundario(jefe);
    setPopoverOpenJefeSecundario(false);
    setSearchTermJefeSecundario("");
    setSearchResultsJefeSecundario([]);
  };

  const handlePopoverJefeChange = (open: boolean) => {
    setPopoverOpenJefe(open);
    if (!open) {
      setSearchTermJefe("");
      setSearchResultsJefe([]);
    }
  };

  const handlePopoverJefeSecundarioChange = (open: boolean) => {
    setPopoverOpenJefeSecundario(open);
    if (!open) {
      setSearchTermJefeSecundario("");
      setSearchResultsJefeSecundario([]);
    }
  };

  const handleTipoChange = (tipo: TipoDependencia) => {
    setTipoDependencia(tipo);
    setGerenciaSeleccionada("");
    setSubgerenciaSeleccionada("");
    setUnidadDirectaAGerencia(false);
    setSubgerencias([]);
  };

  // Lógica de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedJefe) {
      Notify.failure("Por favor seleccione un jefe");
      return;
    }

    setIsLoading(true);

    try {
      await handleCrearDependencia();

      if (onSuccess) {
        onSuccess();
      }
      resetForm();
    } catch (error: unknown) {
      console.error("Error al crear dependencia:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Error al crear la dependencia";
      Notify.failure(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrearDependencia = async () => {
    const payload: Record<string, unknown> = {
      jefe: selectedJefe!.id,
    };

    if (selectedJefeSecundario) {
      payload.jefe_secundario = selectedJefeSecundario.id;
    }

    switch (tipoDependencia) {
      case "gerencia":
        if (!formData.nombreGerencia) {
          throw new Error("Por favor ingrese el nombre de la gerencia");
        }
        payload.gerencia = formData.nombreGerencia;
        break;

      case "subgerencia":
        if (!gerenciaSeleccionada || !formData.nombreSubgerencia) {
          throw new Error(
            "Por favor seleccione una gerencia e ingrese el nombre de la subgerencia"
          );
        }
        payload.gerencia = gerenciaSeleccionada;
        payload.subgerencia = formData.nombreSubgerencia;
        break;

      case "unidad":
        if (!gerenciaSeleccionada || !formData.nombreUnidad) {
          throw new Error(
            "Por favor seleccione una gerencia e ingrese el nombre de la unidad"
          );
        }

        if (unidadDirectaAGerencia) {
          payload.gerencia = gerenciaSeleccionada;
          payload.unidad = formData.nombreUnidad;
        } else {
          if (!subgerenciaSeleccionada) {
            throw new Error(
              "Por favor seleccione una subgerencia o marque 'Pertenece directamente a la gerencia'"
            );
          }
          payload.gerencia = gerenciaSeleccionada;
          payload.subgerencia = subgerenciaSeleccionada;
          payload.unidad = formData.nombreUnidad;
        }
        break;
    }

    await post("/dependencias", payload);
    Notify.success(
      `${tipoDependencia.charAt(0).toUpperCase() + tipoDependencia.slice(1)} creada exitosamente`
    );

    await fetchGerencias();
  };

  return {
    // Estados
    isLoading,
    loadingGerencias,
    loadingSubgerencias,

    // Datos
    gerencias,
    subgerencias,

    // Búsqueda de jefe
    searchTermJefe,
    setSearchTermJefe,
    searchResultsJefe,
    isSearchingJefe,

    // Búsqueda de jefe secundario
    searchTermJefeSecundario,
    setSearchTermJefeSecundario,
    searchResultsJefeSecundario,
    isSearchingJefeSecundario,

    // Estados del formulario
    formData,
    selectedJefe,
    selectedJefeSecundario,
    tipoDependencia,
    gerenciaSeleccionada,
    subgerenciaSeleccionada,
    unidadDirectaAGerencia,

    // Estados de UI
    popoverOpenJefe,
    popoverOpenJefeSecundario,

    // Handlers
    handleInputChange,
    handleJefeSelection,
    handleJefeSecundarioSelection,
    handlePopoverJefeChange,
    handlePopoverJefeSecundarioChange,
    handleTipoChange,
    handleSubmit,
    setGerenciaSeleccionada,
    setSubgerenciaSeleccionada,
    setUnidadDirectaAGerencia,
  };
};
