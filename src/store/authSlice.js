import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    isAuthenticated: !!localStorage.getItem('jwtToken'),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.isAuthenticated = true;
            state.user = action.payload; // { username, fullName }
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            localStorage.removeItem('jwtToken');
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;