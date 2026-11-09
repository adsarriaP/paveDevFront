// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  nombre: string;
  user: string;
  email?: string;
  id: string | number;
  rol: string;
  esJefe?: number; // Cambiado a number (1 = es jefe, 0 = no es jefe)
  planilla?: string | string[] | null; // Planillas que gestiona (solo para ANALISTA)
}

interface PeriodoAcceso {
  fecha_inicio: string;
  fecha_fin: string;
  nombre?: string;
  permitir_fines_semana?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  periodoAcceso: PeriodoAcceso | null;
}

const initialState: AuthState = {
  token: localStorage.getItem("token"),
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null,
  isAuthenticated: !!localStorage.getItem("token"),
  periodoAcceso: localStorage.getItem("periodoAcceso")
    ? JSON.parse(localStorage.getItem("periodoAcceso")!)
    : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ token: string; user: User; periodoAcceso?: PeriodoAcceso | null }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.periodoAcceso = action.payload.periodoAcceso || null;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.periodoAcceso = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("rol");
      localStorage.removeItem("esJefe");
      localStorage.removeItem("periodoAcceso");
    },
    revalidateToken: (
      state,
      action: PayloadAction<{ token: string; user: User }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
  },
});

export const { loginSuccess, logout, revalidateToken } = authSlice.actions;
export default authSlice.reducer;
