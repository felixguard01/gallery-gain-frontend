export const state = () => ({
    username: 'Guest',
    pages: 'addPhoto'
  })
  
  export const mutations = {

    setUsername(state, username ) {
      state.username = username
    },

    setPages(state, pages ) {
      state.pages = pages
    }

  }
  