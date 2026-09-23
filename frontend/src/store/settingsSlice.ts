import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { TimeFormat } from '../lib/time'

type SettingsState = {
  timeFormat: TimeFormat
}

// Default matches the raw SerpApi format so existing displays don't change
// until a user opts into 12h from the Settings page.
const initialState: SettingsState = {
  timeFormat: '24h',
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTimeFormat: (state, action: PayloadAction<TimeFormat>) => {
      state.timeFormat = action.payload
    },
  },
})

export const { setTimeFormat } = settingsSlice.actions
export default settingsSlice.reducer
