import { create } from 'zustand'

const useUIStore = create((set) => ({
  showTradeForm: false,
  editingTrade: null,
  theme: localStorage.getItem('theme') || 'dark',
  openTradeForm: (trade = null) => set({ showTradeForm: true, editingTrade: trade }),
  closeTradeForm: () => set({ showTradeForm: false, editingTrade: null }),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return { theme: newTheme }
  }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    set({ theme })
  }
}))

export default useUIStore
