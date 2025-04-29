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

  // Track page load count for specific game
  incrementPageLoadCount: (gameId: string) => {
    try {
      const countKey = `pageLoadCount_${gameId}`;
      const currentCount = localStorageHelper.getItem(countKey) || 0;
      localStorageHelper.setItem(countKey, currentCount + 1);
      return currentCount + 1;
    } catch (error) {
      console.error("Error incrementing page load count", error);
      return 1;
    }
  },

  // Get current page load count
  getPageLoadCount: (gameId: string) => {
    try {
      const countKey = `pageLoadCount_${gameId}`;
      return localStorageHelper.getItem(countKey) || 0;
    } catch (error) {
      console.error("Error getting page load count", error);
      return 0;
    }
  },

  // Reset the page load counter
  resetPageLoadCount: (gameId: string) => {
    try {
      const countKey = `pageLoadCount_${gameId}`;
      localStorageHelper.deleteItem(countKey);
    } catch (error) {
      console.error("Error resetting page load count", error);
    }
  },
};
