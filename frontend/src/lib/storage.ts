const TOKEN_KEY = "sangu.accessToken"
const USER_KEY = "sangu.user"

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: () => localStorage.getItem(USER_KEY),
  setUser: (userJson: string) => localStorage.setItem(USER_KEY, userJson),
  clearUser: () => localStorage.removeItem(USER_KEY),
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}

