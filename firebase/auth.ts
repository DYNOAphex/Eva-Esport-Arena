import { getAuth, initializeAuth } from "firebase/auth";

import { firebaseApp } from "./config";

export const auth = (() => {
  try {
    return initializeAuth(firebaseApp);
  } catch {
    return getAuth(firebaseApp);
  }
})();
