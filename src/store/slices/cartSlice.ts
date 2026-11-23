"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ICartItem } from "@/types";

interface CartState {
  items: ICartItem[];
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isOpen: false,
};

function recalculateTotals(state: CartState) {
  state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  state.totalPrice = state.items.reduce(
    (sum, item) => sum + item.discountPrice * item.quantity,
    0
  );
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<ICartItem>) {
      const { productId, size, color } = action.payload;
      const existingIndex = state.items.findIndex(
        (item) => item.productId === productId && item.size === size && item.color === color
      );

      if (existingIndex >= 0) {
        const existing = state.items[existingIndex];
        const newQty = existing.quantity + action.payload.quantity;
        if (newQty <= existing.maxStock) {
          existing.quantity = newQty;
        } else {
          existing.quantity = existing.maxStock;
        }
      } else {
        state.items.push({ ...action.payload });
      }

      recalculateTotals(state);
    },

    removeFromCart(
      state,
      action: PayloadAction<{ productId: string; size: string; color: string }>
    ) {
      const { productId, size, color } = action.payload;
      state.items = state.items.filter(
        (item) =>
          !(item.productId === productId && item.size === size && item.color === color)
      );
      recalculateTotals(state);
    },

    updateQuantity(
      state,
      action: PayloadAction<{
        productId: string;
        size: string;
        color: string;
        quantity: number;
      }>
    ) {
      const { productId, size, color, quantity } = action.payload;
      const item = state.items.find(
        (item) => item.productId === productId && item.size === size && item.color === color
      );

      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i !== item);
        } else if (quantity <= item.maxStock) {
          item.quantity = quantity;
        } else {
          item.quantity = item.maxStock;
        }
      }

      recalculateTotals(state);
    },

    updateMaxStocks(
      state,
      action: PayloadAction<{ productId: string; size: string; color: string; maxStock: number }[]>
    ) {
      action.payload.forEach(({ productId, size, color, maxStock }) => {
        const item = state.items.find(
          (i) => i.productId === productId && i.size === size && i.color === color
        );
        if (item) {
          item.maxStock = maxStock;
        }
      });
    },

    clearCart(state) {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
    },

    openCart(state) {
      state.isOpen = true;
    },

    closeCart(state) {
      state.isOpen = false;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, updateMaxStocks, openCart, closeCart } = cartSlice.actions;
export default cartSlice.reducer;
