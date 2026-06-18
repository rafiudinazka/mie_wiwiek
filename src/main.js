import { mount } from 'svelte'
import './app.css'
import './receipt-print.css'
import App from './App.svelte'

const app = mount(App, {
  target: /** @type {Element} */ (document.getElementById('app')),
})

export default app
