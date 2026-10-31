import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../../services/auth.service'
import { getErrorMessage } from '../../api/axios'

// Thunk to fetch current logged-in user via HTTP-only cookie
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.getMe()
      return data.user
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

// Thunk for email/password login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials)
      return data.user
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

// Thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout()
      return null
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

const initialState = {
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null
    },
    setUser: (state, action) => {
      state.user = action.payload
      state.role = action.payload?.role || null
      state.isAuthenticated = !!action.payload
      state.isCheckingAuth = false
    },
  },
  extraReducers: (builder) => {
    // fetchCurrentUser
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isCheckingAuth = true
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isCheckingAuth = false
        state.user = action.payload
        state.role = action.payload?.role || null
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isCheckingAuth = false
        state.user = null
        state.role = null
        state.isAuthenticated = false
      })

    // loginUser
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.role = action.payload?.role || null
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

    // logoutUser
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.role = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null
      })
  },
})

export const { clearAuthError, setUser } = authSlice.actions
export default authSlice.reducer
