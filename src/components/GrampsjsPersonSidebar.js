import {LitElement, html, css} from 'lit'
import {apiGet} from '../api.js'

export class GrampsjsPersonSidebar extends LitElement {
  static get properties() {
    return {
      grampsId: {type: String},
      open: {type: Boolean},
      _personData: {type: Object},
      _loading: {type: Boolean},
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .sidebar {
        position: fixed;
        top: 0;
        right: -400px;
        width: 380px;
        height: 100vh;
        background: #fff;
        box-shadow: -4px 0 20px rgba(0,0,0,0.15);
        transition: right 0.3s ease;
        z-index: 1000;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .sidebar.open {
        right: 0;
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        position: sticky;
        top: 0;
        z-index: 1;
      }

      .sidebar-title {
        font-size: 14px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .close-btn {
        cursor: pointer;
        background: none;
        border: none;
        padding: 4px;
        color: #6b7280;
        font-size: 20px;
        line-height: 1;
        border-radius: 4px;
      }
      .close-btn:hover { background: #f3f4f6; }

      .person-header {
        padding: 24px 20px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        border-bottom: 1px solid #f3f4f6;
      }

      .person-avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        font-weight: 600;
        flex-shrink: 0;
        overflow: hidden;
      }

      .person-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .person-name {
        font-size: 20px;
        font-weight: 700;
        color: #111827;
        line-height: 1.2;
      }

      .person-dates {
        font-size: 13px;
        color: #6b7280;
        margin-top: 4px;
      }

      .section {
        padding: 16px 20px;
        border-bottom: 1px solid #f3f4f6;
      }

      .section-label {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 10px;
      }

      .info-row {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 14px;
        color: #374151;
      }

      .info-icon {
        color: #9ca3af;
        flex-shrink: 0;
        width: 16px;
      }

      .person-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #2563eb;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        border: none;
        margin: 16px 20px;
      }
      .person-link:hover { background: #1d4ed8; }

      .loading {
        padding: 40px 20px;
        text-align: center;
        color: #9ca3af;
      }

      .relation-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        margin: 2px;
        cursor: pointer;
        text-decoration: none;
        background: #f3f4f6;
        color: #374151;
        border: none;
      }
      .relation-chip:hover { background: #e5e7eb; }
    `
  }

  constructor() {
    super()
    this.grampsId = ''
    this.open = false
    this._personData = null
    this._loading = false
  }

  updated(changedProps) {
    if (changedProps.has('grampsId') && this.grampsId) {
      this._fetchPerson()
    }
  }

  async _fetchPerson() {
  this._loading = true
  this._personData = null

  try {
    const resp = await apiGet(`/api/people/?gramps_id=${this.grampsId}&extend=all`)

    if (!resp || resp.error) {
      console.error('Error fetching person:', resp?.error)
      this._loading = false
      return
    }

    const payload = resp.data

    const list =
      Array.isArray(payload) ? payload :
      Array.isArray(payload?.data) ? payload.data :
      Array.isArray(payload?.results) ? payload.results :
      []

    if (list.length > 0) {
      this._personData = list[0]
    }
  } catch (e) {
    console.error('Error fetching person:', e)
  }

  this._loading = false
}

_goToProfile() {
  const id = this._personData?.gramps_id || this.grampsId
  if (!id) return
  window.location.href = `/person/${id}`
}

  _getFullName(person) {
    if (!person?.primary_name) return 'Sin nombre'
    const {first_name, surname_list} = person.primary_name
    const surname = surname_list?.[0]?.surname || ''
    return `${first_name} ${surname}`.trim()
  }

  _getInitials(person) {
    const name = this._getFullName(person)
    return name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
  }

  _formatDate(dateObj) {
    if (!dateObj?.dateval) return ''
    const [y, m, d] = dateObj.dateval
    if (!y) return ''
    if (m && d) return `${d.toString().padStart(2,'0')}/${m.toString().padStart(2,'0')}/${y}`
    return y.toString()
  }

  _close() {
    this.open = false
    this.dispatchEvent(new CustomEvent('sidebar-closed', {bubbles: true, composed: true}))
  }

  _goToProfile() {
  const id = this._personData?.gramps_id || this.grampsId
  if (!id) return
  window.location.href = `/person/${id}`
}

  render() {
    return html`
      <div class="sidebar ${this.open ? 'open' : ''}">
        <div class="sidebar-header">
          <span class="sidebar-title">Ficha Personal</span>
          <button class="close-btn" @click=${this._close}>✕</button>
        </div>

        ${this._loading ? html`
          <div class="loading">Cargando...</div>
        ` : this._personData ? this._renderPerson() : html`
          <div class="loading">Selecciona una persona en el árbol</div>
        `}
      </div>
    `
  }

  _renderPerson() {
    const p = this._personData
    const fullName = this._getFullName(p)
    const initials = this._getInitials(p)

    // Eventos de nacimiento y muerte
    const birthEvent = p.extended?.events?.find(e => e.type === 'Birth')
    const deathEvent = p.extended?.events?.find(e => e.type === 'Death')
    const birthDate = this._formatDate(birthEvent?.date)
    const deathDate = this._formatDate(deathEvent?.date)
    const birthPlace = birthEvent?.extended?.place?.name?.value || ''
    const deathPlace = deathEvent?.extended?.place?.name?.value || ''

    // Foto principal
    const mediaRef = p.media_list?.[0]
    const mediaHandle = mediaRef?.ref
    const mediaUrl = mediaHandle ? `/api/media/${mediaHandle}/thumbnail/200` : null

    // Padres
    const parents = p.extended?.families?.filter(f =>
      f.father_handle === p.handle || f.mother_handle === p.handle
    ) || []

    return html`
      <div class="person-header">
        <div class="person-avatar">
          ${mediaUrl
            ? html`<img src="${mediaUrl}" alt="${fullName}">`
            : initials
          }
        </div>
        <div>
          <div class="person-name">${fullName}</div>
          <div class="person-dates">
            ${birthDate ? `★ ${birthDate}` : ''}
            ${deathDate ? ` · † ${deathDate}` : ''}
          </div>
        </div>
      </div>

      ${birthDate || birthPlace ? html`
        <div class="section">
          <div class="section-label">Nacimiento</div>
          ${birthDate ? html`
            <div class="info-row">
              <span class="info-icon">📅</span>
              <span>${birthDate}</span>
            </div>` : ''}
          ${birthPlace ? html`
            <div class="info-row">
              <span class="info-icon">📍</span>
              <span>${birthPlace}</span>
            </div>` : ''}
        </div>
      ` : ''}

      ${deathDate || deathPlace ? html`
        <div class="section">
          <div class="section-label">Fallecimiento</div>
          ${deathDate ? html`
            <div class="info-row">
              <span class="info-icon">📅</span>
              <span>${deathDate}</span>
            </div>` : ''}
          ${deathPlace ? html`
            <div class="info-row">
              <span class="info-icon">📍</span>
              <span>${deathPlace}</span>
            </div>` : ''}
        </div>
      ` : ''}

      <div class="section">
        <div class="section-label">ID en árbol</div>
        <div class="info-row">
          <span class="info-icon">🆔</span>
          <span>${p.gramps_id}</span>
        </div>
      </div>

      <button class="person-link" @click=${this._goToProfile}>
        Ver perfil completo →
      </button>
    `
  }
}

customElements.define('grampsjs-person-sidebar', GrampsjsPersonSidebar)