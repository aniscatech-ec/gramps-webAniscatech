import {html, css} from 'lit'
import '@material/web/button/outlined-button'
import {mdiFamilyTree, mdiDna, mdiSearchWeb} from '@mdi/js'
import {GrampsjsObject} from './GrampsjsObject.js'
import {asteriskIcon, crossIcon} from '../icons.js'
import './GrampsJsImage.js'
import './GrampsjsEditGender.js'
import './GrampsjsPersonRelationship.js'
import './GrampsjsFormExternalSearch.js'
import {fireEvent} from '../util.js'

export class GrampsjsPerson extends GrampsjsObject {
  static get styles() {
    return [
      super.styles,
      css`
        .quick-meta-card {
          margin-top: 24px;
          padding: 20px;
          border: 1px solid var(--grampsjs-color-shade-250, #e5e7eb);
          border-radius: 16px;
          background: var(--grampsjs-color-shade-210, #fafafa);
          max-width: 980px;
        }

        .quick-meta-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 6px;
        }

        .quick-meta-subtitle {
          margin: 0 0 18px;
          color: var(--grampsjs-color-shade-110, #6b7280);
          font-size: 14px;
        }

        .quick-meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }

        .quick-meta-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .quick-meta-field.wide {
          grid-column: 1 / -1;
        }

        .quick-meta-field label {
          font-size: 13px;
          font-weight: 600;
          color: var(--grampsjs-color-shade-090, #4b5563);
        }

        .quick-meta-field input {
          height: 44px;
          border-radius: 10px;
          border: 1px solid var(--grampsjs-color-shade-250, #d1d5db);
          padding: 0 14px;
          font-size: 14px;
          background: #fff;
          box-sizing: border-box;
        }

        .quick-meta-field input:focus {
          outline: none;
          border-color: var(--mdc-theme-primary, #6d28d9);
          box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.12);
        }

        .quick-meta-actions {
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .quick-meta-save {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          padding: 0 18px;
          border: none;
          border-radius: 999px;
          background: var(--mdc-theme-primary, #6d28d9);
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }

        .quick-meta-save[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .quick-meta-status {
          font-size: 13px;
          color: var(--grampsjs-color-shade-090, #4b5563);
        }
      `,
    ]
  }

  static get properties() {
    return {
      homePersonDetails: {type: Object},
      canEdit: {type: Boolean},
      _quickMeta: {type: Object, state: true},
      _savingQuickMeta: {type: Boolean, state: true},
      _quickMetaStatus: {type: String, state: true},
    }
  }

  constructor() {
    super()
    this.homePersonDetails = {}
    this._objectsName = 'People'
    this._objectEndpoint = 'people'
    this._objectIcon = 'person'
    this._showReferences = false
    this._showPersonTimeline = true
    this._quickMeta = this._emptyQuickMeta()
    this._savingQuickMeta = false
    this._quickMetaStatus = ''
  }

  updated(changedProperties) {
    super.updated?.(changedProperties)
    if (changedProperties.has('data') && this.data?.handle) {
      this._quickMeta = this._readQuickMetaFromData(this.data)
      this._quickMetaStatus = ''
    }
  }

  _quickMetaFields() {
    return [
      {key: 'birthCountry', label: 'País de nacimiento', type: 'País de Nacimiento'},
      {key: 'age', label: 'Edad', type: 'Edad'},
      {key: 'email', label: 'Correo', type: 'Correo', inputType: 'email'},
      {key: 'phone', label: 'Número de teléfono', type: 'Número de teléfono'},
      {key: 'address', label: 'Dirección actual', type: 'Dirección Actual', wide: true},
    ]
  }

  _emptyQuickMeta() {
    return {
      birthCountry: '',
      age: '',
      email: '',
      phone: '',
      address: '',
    }
  }

  _getAttributeValueByType(type, data = this.data) {
    const attrs = data?.attribute_list || []
    const found = attrs.find(attr => {
      const attrType = typeof attr.type === 'string' ? attr.type : attr.type?.string
      return attrType === type
    })
    return found?.value || ''
  }

  _readQuickMetaFromData(data) {
    return {
      birthCountry: this._getAttributeValueByType('País de Nacimiento', data),
      age: this._getAttributeValueByType('Edad', data),
      email: this._getAttributeValueByType('Correo', data),
      phone: this._getAttributeValueByType('Número de teléfono', data),
      address: this._getAttributeValueByType('Dirección Actual', data),
    }
  }

  _handleQuickMetaInput(e) {
    const {field} = e.currentTarget.dataset
    this._quickMeta = {
      ...this._quickMeta,
      [field]: e.currentTarget.value,
    }
    this._quickMetaStatus = ''
  }

  async _saveQuickMeta() {
    if (!this.edit || !this.canEdit || !this.data?.handle) return

    this._savingQuickMeta = true
    this._quickMetaStatus = 'Guardando...'

    try {
      const current = await this.appState.apiGet(`/api/people/${this.data.handle}`)
      if ('error' in current) {
        fireEvent(this, 'grampsjs:error', {message: current.error})
        this._quickMetaStatus = 'No se pudo cargar la persona.'
        this._savingQuickMeta = false
        return
      }

      const personData = current.data ?? {}
      const existingAttrs = [...(personData.attribute_list || [])]

      this._quickMetaFields().forEach(field => {
        const idx = existingAttrs.findIndex(attr => {
          const attrType = typeof attr.type === 'string' ? attr.type : attr.type?.string
          return attrType === field.type
        })

        const value = (this._quickMeta[field.key] || '').trim()

        if (value) {
          const nextAttr = {
            ...(idx >= 0 ? existingAttrs[idx] : {}),
            type: field.type,
            value,
          }
          if (idx >= 0) {
            existingAttrs[idx] = nextAttr
          } else {
            existingAttrs.push(nextAttr)
          }
        } else if (idx >= 0) {
          existingAttrs.splice(idx, 1)
        }
      })

      const payload = {
        ...personData,
        _class: 'Person',
        attribute_list: existingAttrs,
      }

      const result = await this.appState.apiPut(`/api/people/${this.data.handle}`, payload)

      if ('error' in result) {
        fireEvent(this, 'grampsjs:error', {message: result.error})
        this._quickMetaStatus = 'No se pudo guardar.'
        this._savingQuickMeta = false
        return
      }

      this.data = {
        ...this.data,
        attribute_list: existingAttrs,
      }
      this._quickMeta = this._readQuickMetaFromData(this.data)
      this._quickMetaStatus = 'Guardado correctamente.'
      fireEvent(this, 'grampsjs:notification', {message: 'Metadatos guardados correctamente.'})
    } catch (err) {
      fireEvent(this, 'grampsjs:error', {message: err?.message || 'Error guardando metadatos.'})
      this._quickMetaStatus = 'Ocurrió un error al guardar.'
    }

    this._savingQuickMeta = false
  }

  _renderQuickMetaForm() {
    return html`
      <div class="quick-meta-card">
        <h3 class="quick-meta-title">Información rápida</h3>
        <p class="quick-meta-subtitle">Edita estos datos sin entrar al bloque técnico de Metadatos.</p>
        <div class="quick-meta-grid">
          ${this._quickMetaFields().map(field => html`
            <div class="quick-meta-field ${field.wide ? 'wide' : ''}">
              <label for=${`quick-meta-${field.key}`}>${field.label}</label>
              <input
                id=${`quick-meta-${field.key}`}
                data-field=${field.key}
                type=${field.inputType || 'text'}
                .value=${this._quickMeta?.[field.key] || ''}
                ?disabled=${!this.edit || !this.canEdit || this._savingQuickMeta}
                @input=${this._handleQuickMetaInput}
              />
            </div>
          `)}
        </div>
        ${this.edit && this.canEdit ? html`
          <div class="quick-meta-actions">
            <button
              class="quick-meta-save"
              ?disabled=${this._savingQuickMeta}
              @click=${this._saveQuickMeta}
            >
              ${this._savingQuickMeta ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <span class="quick-meta-status">${this._quickMetaStatus || ''}</span>
          </div>
        ` : html`
          <div class="quick-meta-actions">
            <span class="quick-meta-status">Activa el modo edición para modificar estos campos.</span>
          </div>
        `}
      </div>
    `
  }

  renderProfile() {
    return html`
      <h2>
        <grampsjs-edit-gender
          ?edit="${this.edit}"
          gender="${this.data.gender}"
        ></grampsjs-edit-gender>
        ${this._displayName()}
      </h2>
      ${this._renderBirth()} ${this._renderDeath()} ${this._renderRelation()}
      <p class="button-list">
        ${this._renderTreeBtn()} ${this._renderDnaBtn()}
        ${this._renderExternalSearchBtn()}
      </p>
      ${this._renderQuickMetaForm()}
    `
  }

  _displayName() {
    if (!this.data.profile) {
      return ''
    }
    const surname = this.data.profile.name_surname || '…'
    const suffix = this.data.profile.name_suffix || ''
    const call = this.data?.primary_name?.call
    let given = this.data.profile.name_given || call || '…'
    const callIndex = call && call !== given ? given.search(call) : -1
    given =
      callIndex > -1
        ? html`
            ${given.substring(0, callIndex)}
            <span class="given-name"
              >${given.substring(callIndex, callIndex + call.length)}</span
            >
            ${given.substring(callIndex + call.length)}
          `
        : given
    return html`${given} ${surname} ${suffix}`
  }

  _renderBirth() {
    const obj = this.data?.profile?.birth
    if (obj === undefined || Object.keys(obj).length === 0) {
      return ''
    }
    return html`
      <span class="event">
        <i>${asteriskIcon}</i>
        ${obj.date || ''} ${obj.place ? this._('in') : ''}
        ${obj.place_name || obj.place || ''}
      </span>
    `
  }

  _renderDeath() {
    const obj = this.data?.profile?.death
    if (obj === undefined || Object.keys(obj).length === 0) {
      return ''
    }
    return html`
      <span class="event">
        <i>${crossIcon}</i>
        ${obj.date || ''} ${obj.place ? this._('in') : ''}
        ${obj.place_name || obj.place || ''}
      </span>
    `
  }

  _renderRelation() {
    if (!this.homePersonDetails.handle) {
      // no home person set
      return ''
    }
    return html`
      <dl>
        <dt>${this._('Relationship to home person')}</dt>
        <dd>
          <grampsjs-person-relationship
            person1="${this.homePersonDetails.handle}"
            person2="${this.data.handle}"
            .appState="${this.appState}"
          ></grampsjs-person-relationship>
        </dd>
      </dl>
    `
  }

  _renderTreeBtn() {
    return html`
      <md-outlined-button @click="${this._handleTreeButtonClick}">
        ${this._('Show in tree')}
        <grampsjs-icon
          path="${mdiFamilyTree}"
          color="var(--mdc-theme-primary)"
          slot="icon"
        >
        </grampsjs-icon>
      </md-outlined-button>
    `
  }

  _renderExternalSearchBtn() {
    return html`
      <md-outlined-button @click="${this._handleExternalSearchClick}">
        ${this._('External Search')}
        <grampsjs-icon
          path="${mdiSearchWeb}"
          color="var(--mdc-theme-primary)"
          slot="icon"
        >
        </grampsjs-icon>
      </md-outlined-button>
    `
  }

  _renderDnaBtn() {
    if (!this.data?.person_ref_list?.filter(ref => ref.rel === 'DNA').length) {
      // no DNA data
      return ''
    }
    return html`
      <md-outlined-button
        @click="${this._handleDnaButtonClick}"
        class="dna-btn"
      >
        ${this._('DNA matches')}
        <grampsjs-icon
          path="${mdiDna}"
          color="var(--mdc-theme-primary)"
          slot="icon"
        ></grampsjs-icon>
      </md-outlined-button>
    `
  }

  _handleTreeButtonClick() {
    this.dispatchEvent(
      new CustomEvent('pedigree:person-selected', {
        bubbles: true,
        composed: true,
        detail: {grampsId: this.data.gramps_id},
      })
    )
    fireEvent(this, 'nav', {path: 'tree'})
  }

  _handleExternalSearchClick() {
    // Helper to extract year from date string (format: "YYYY-MM-DD" or "YYYY")
    const extractYear = dateStr => {
      if (!dateStr) return ''
      const match = dateStr.match(/^\d{4}/)
      return match ? match[0] : ''
    }
    const data = {
      name_given: this.data?.profile?.name_given,
      name_surname: this.data?.profile?.name_surname,
      name_middle: this.data?.profile?.name_given?.split(' ')[1] || '',
      place_name:
        this.data?.profile?.birth?.place_name ||
        this.data?.profile?.birth?.place ||
        this.data?.profile?.death?.place_name ||
        this.data?.profile?.death?.place ||
        '',
      birth_year: extractYear(this.data?.profile?.birth?.date),
      death_year: extractYear(this.data?.profile?.death?.date),
    }
    this.dialogContent = html`
      <div>
        <grampsjs-form-external-search
          @object:cancel=${this._handleCancelDialog}
          .appState="${this.appState}"
          .data=${data}
          .dialogTitle=${this._('External Search')}
          .hideSaveButton=${true}
        >
        </grampsjs-form-external-search>
      </div>
    `
  }

  _handleCancelDialog() {
    this.dialogContent = ''
  }

  _handleDnaButtonClick() {
    fireEvent(this, 'nav', {path: `dna-matches/${this.data.gramps_id}`})
  }
}

window.customElements.define('grampsjs-person', GrampsjsPerson)
