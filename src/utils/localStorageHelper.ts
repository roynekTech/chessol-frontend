export const localStorageHelper = {
  setItem: (key: string, value: Record<string, string[]> | string | object) => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error("Error setting item in localStorage", error);
    }
  },

  getItem: (key: string) => {
    try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) {
        return null;
      }
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error("Error getting item from localStorage", error);
      return null;
    }
  },

  updateItem: (
    key: string,
    value: Record<string, string[]> | string | object
  ) => {
    try {
      const existingValue = localStorageHelper.getItem(key);
      if (existingValue) {
        if (typeof existingValue === "object" && typeof value === "object") {
          const updatedValue = { ...existingValue, ...value };
          localStorageHelper.setItem(key, updatedValue);
        } else {
          localStorageHelper.setItem(key, value);
        }
      } else {
        localStorageHelper.setItem(key, value);
      }
    } catch (error) {
      console.error("Error updating item in localStorage", error);
    }
  },

  deleteItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error deleting item from localStorage", error);
    }
  },
};
