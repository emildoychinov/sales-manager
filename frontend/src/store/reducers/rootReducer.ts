import authReducer from "./authReducer";
import datasetsReducer from "./datasetsReducer";

export const rootReducer = {
  auth: authReducer,
  datasets: datasetsReducer,
};
