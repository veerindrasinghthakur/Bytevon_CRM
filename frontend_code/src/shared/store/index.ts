import { configureStore } from '@reduxjs/toolkit'
import entitySearchReducer from './entitySearchSlice'

// Combine feature slices into the root reducer.
const store = configureStore({
  reducer: {
    entitySearch: entitySearchReducer,
    // Add other slices here as the app grows.
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
