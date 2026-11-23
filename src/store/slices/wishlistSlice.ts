"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { IWishlistItem } from "@/types";

interface WishlistState {
  items: IWishlistItem[];
}

const initialState: WishlistState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    toggleWishlist(state, action: PayloadAction<IWishlistItem>) {
      const index = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );

      if (index >= 0) {
        state.items.splice(index, 1);
      } else {
        state.items.push(action.payload);
      }
    },

    removeFromWishlist(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
    },

    clearWishlist(state) {
      state.items = [];
    },
  },
});

export const { toggleWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
