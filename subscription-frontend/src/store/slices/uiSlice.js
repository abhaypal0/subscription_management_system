import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isSidebarOpen: false, // mobile drawer
  isSidebarCollapsed: false, // desktop mini-sidebar
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload
    },
    toggleSidebarCollapse: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed
    },
  },
})

export const { toggleSidebar, setSidebarOpen, toggleSidebarCollapse } = uiSlice.actions
export default uiSlice.reducer
