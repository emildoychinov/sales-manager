import { useDispatch as useReduxDispatch, useSelector as useReduxSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "./index";

export const useDispatch = useReduxDispatch.withTypes<AppDispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;
