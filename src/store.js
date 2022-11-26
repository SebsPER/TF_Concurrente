import create from 'zustand'

export const useStore = create((set) => ({
  username: null,
  roomId: null,
  cod: null,
  setUsername: (username) => set(() => ({ username })),
  setRoomId: (roomId) => set(() => ({ roomId: roomId })),
  setCod: (cod) => set(() => ({ cod: cod })),
}))
