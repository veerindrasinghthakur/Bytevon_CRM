import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { EntityOption } from '@/shared/types'
import {EntitySearchState} from '../types'
/**
 * Simple slice to keep the last selected entity (or multiple selections).
 * This demonstrates how a component like `EntitySearch` could read/write
 * global state instead of receiving props.
 */


const initialState: EntitySearchState = {
  selected: null,
  selectedMultiple: [],
}

export const entitySearchSlice = createSlice({
  name: 'entitySearch',
  initialState,
  reducers: {
    setSelected(state, action: PayloadAction<EntityOption | null>) {
      state.selected = action.payload
    },
    setSelectedMultiple(state, action: PayloadAction<EntityOption[]>) {
      state.selectedMultiple = action.payload
    },
    clear(state) {
      state.selected = null
      state.selectedMultiple = []
    },
  },
})

export const { setSelected, setSelectedMultiple, clear } = entitySearchSlice.actions
export default entitySearchSlice.reducer
