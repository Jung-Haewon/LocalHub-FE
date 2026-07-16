import axios from 'axios'

const api = axios.create({
  baseURL: 'https://localhub-be-blwp.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
})

export default api
