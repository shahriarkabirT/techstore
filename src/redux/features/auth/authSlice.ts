import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    permissions?: string[];
    phone?: string;
    bio?: string;
    gender?: 'male' | 'female' | 'other' | '';
    dateOfBirth?: string | Date;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    addressBook?: {
        name: string;
        phone: string;
        address: string;
        city: string;
        isDefault: boolean;
    }[];
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        },
        clearAuth: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
