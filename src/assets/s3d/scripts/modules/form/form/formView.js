import FormMonster from './form.js';
import SexyInput from '../input/input.js';
import i18next from 'i18next';
import * as yup from 'yup';
import dispatchTrigger from '../../helpers/triggers.js';
import ButtonWithoutIcon from '../../../../../s3d2/scripts/templates/common/ButtonWithoutIcon.js';
import TextInput from '../../../../../s3d2/scripts/templates/common/inputs/TextInput.js';
import s3d2spriteIcon from '../../../../../s3d2/scripts/templates/spriteIcon.js';
import Textarea from '../../../../../s3d2/scripts/templates/common/inputs/Textarea.js';
import UIProgressButton from '../UIProgressButton.js';
import SuccessFormPopup from '../SuccessFormPopup.js';

export default class FormView {
  constructor(props) {
    this._id = `form-${(Math.random() * 1000).toFixed(0)}`;
    this.modalManager = props.modalManager;
    this.inited = false;
    this.config = props.config;
    this.i18n = props.i18n;
    this.init();
  }

  init() {
    if (!this.inited) {
      document.body.insertAdjacentHTML('beforeend', this.getTemplate());
      window.addEventListener('form-open', () => {
        this.open();
      });
      window.addEventListener('click', evt => {
        if (evt.target.closest('[data-form-layout-close]') === null) return;
        this.close();
      });
      window.addEventListener('click', evt => {
        if (evt.target.classList.contains('form-layout')) this.close();
      });
      window.addEventListener('click', evt => {
        if (evt.target.closest('[data-open-form]') === null) return;
        dispatchTrigger('callback-click', {
          url: window.location.href,
        });
        this.open();
      });

      const bttn = this.get$Form().querySelector('.form-progress-button');
      this.uIProgressButton = new UIProgressButton(bttn, {
        statusTime: 3000,
      });

      this.initValidation();
      if (this.modalManager.push) {
        this.modalManager.push({
          id: this._id,
          close: () => {
            this.close();
          },
        });
      }
      this.inited = true;
    }
  }

  close() {
    document.querySelector(`#${this._id}`).style.visibility = '';
    document.querySelector(`#${this._id}`).style.opacity = '';
    document.querySelectorAll('[data-form-button-after-success-send]').forEach(btn => {
      btn.remove();
    });
  }

  open() {
    document.querySelector(`#${this._id}`).style.visibility = 'visible';
    document.querySelector(`#${this._id}`).style.opacity = '1';
    if (this.modalManager.open) this.modalManager.open(this._id);
  }

  updateHiddenFields(fields = []) {
    // delete all hidden fields in form
    const $form = document.querySelector(`#${this._id} form`);
    const hiddenFields = $form.querySelectorAll('input[type="hidden"]');
    if (hiddenFields.length > 0) {
      hiddenFields.forEach(field => field.remove());
    }
    // add new hidden fields
    fields.forEach(field => {
      const $field = document.createElement('input');
      $field.type = 'hidden';
      $field.name = field.name;
      $field.value = field.value;
      $form.appendChild($field);
    });
  }

  getTemplate() {
    return `
        <div class="toast-wrapper" data-toast-wrapper=""></div>
        <div class="form-layout" id="${this._id}">
            <div class="form form--popup">
                 <!--${s3d2spriteIcon('close', 'form-layout-close', 'data-form-layout-close')}-->
                <svg width="24" class="form-layout-close" data-form-layout-close height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00008 7.29297L8.35363 7.64652L12.5001 11.793L16.6465 7.64652L17.0001 7.29297L17.7072 8.00008L17.3536 8.35363L13.2072 12.5001L17.3536 16.6465L17.7072 17.0001L17.0001 17.7072L16.6465 17.3536L12.5001 13.2072L8.35363 17.3536L8.00008 17.7072L7.29297 17.0001L7.64652 16.6465L11.793 12.5001L7.64652 8.35363L7.29297 8.00008L8.00008 7.29297Z" fill="#1A1E21"></path>
          </svg>
                <div class="form--popup__img">
                    <img src="/wp-content/themes/3d/assets/s3d/images/logo-nef.svg" alt="form-img">
                </div>

                <div class="form--popup__intro">
                  <div class="form--popup__title">${i18next.t('title').toUpperCase()}</div>
                  <div class="form--popup__description">
                  ${i18next.t('subtitle')}
                  </div>
                </div>
                <form data-home-contact="data-home-contact" autocomplete="off">
                  <div class="form-overflow">
                    <div class="form-field form-field-input form--popup-input" data-field-input="data-field-input" data-field-name="data-field-name" data-status="field--inactive">
                        <div class="form-field-input__title">
                          ${i18next.t('Your name')} *
                        </div>
                        ${TextInput({
                          text: i18next.t('namePlaceholder'),
                          className: '',
                          attributes: 'name="name"',
                          type: 'text',
                          value: '',
                        })}
                        <div class="input-message" data-input-message="data-input-message"></div>
                    </div>
                    <div class="form-field disabled form-field-input form--popup-input" data-field-input="data-field-input" data-field-phone="data-field-phone" data-status="field--inactive">
                        <div class="form-field-input__title">
                          ${i18next.t('Your phone')} *
                        </div>
                        ${TextInput({
                          text: '',
                          className: '',
                          attributes: 'name="phone"',
                          type: 'text',
                          value: '',
                        })}
                        <div class="input-message" data-input-message="data-input-message"></div>
                    </div>
                    <div class="form-field form-field-input form--popup-input" data-field-input="data-field-input" data-field-message="data-field-message" data-status="field--inactive">
                        <div class="form-field-input__title">
                          ${i18next.t('Your comment')}
                        </div>
                        ${Textarea({
                          text: i18next.t('Type your message'),
                          className: '',
                          attributes: 'name="message"',
                          type: 'text',
                          value: '',
                        })}
                        <div class="input-message" data-input-message="data-input-message"></div>
                    </div>
                  </div>
                  <div class="s3d2__contact__form__submit-wrapper">
                    <div class="form-progress-button">
                      <button type="submit" data-btn-submit><span>${i18next.t(
                        'send',
                      )}</span></button>
                      <svg class="form-progress-circle" viewBox="0 0 120 120"><path d="m35,2.5c17.955803,0 32.5,14.544199 32.5,32.5c0,17.955803 -14.544197,32.5 -32.5,32.5c-17.955803,0 -32.5,-14.544197 -32.5,-32.5c0,-17.955801 14.544197,-32.5 32.5,-32.5z"/></svg>
                      <svg class="checkmark" viewBox="0 0 120 120">><path d="m31.5,46.5l15.3,-23.2"/><path d="m31.5,46.5l-8.5,-7.1"/></svg>
                      <svg class="cross" viewBox="0 0 120 120">><path d="m35,35l-9.3,-9.3"/><path d="m35,35l9.3,9.3"/><path d="m35,35l-9.3,9.3"/><path d="m35,35l9.3,-9.3"/></svg>
                    </div>
                  </div>
                </form>
            </div>
        </div>
    `;
  }

  initValidation(onSuccess) {
    const $form = document.querySelector(`#${this._id} form`);
    new FormMonster({
      onEndSubmitResult: status => {
        this.uIProgressButton.stop(status, stat => {
          if (stat >= 0) {
            new SuccessFormPopup({
              modalManager: this.modalManager,
              i18n: this.i18n,
            }).open();
          }
        });
      },
      onEndSubmit: () => {
        this.uIProgressButton.startLoad();
      },
      onStartSubmit: () => {
        this.uIProgressButton.startSubmit();
      },
      elements: {
        $form,
        showSuccessMessage: false,
        successAction: () => {
          setTimeout(() => {
            document.querySelector(`#${this._id}`).style.visibility = '';
            document.querySelector(`#${this._id}`).style.opacity = '';
            document.querySelectorAll('[data-form-button-after-success-send]').forEach(btn => {
              btn.remove();
            });
          }, 5000);
          onSuccess && onSuccess();
        },
        $btnSubmit: $form.querySelector('[data-btn-submit]'),
        fields: {
          name: {
            inputWrapper: new SexyInput({
              animation: 'none',
              $field: $form.querySelector('[data-field-name]'),
            }),
            rule: yup
              .string()
              .required(i18next.t('required'))
              .min(2, i18next.t('name_too_short', { cnt: 2 }))
              .trim(),
            defaultMessage: i18next.t('name'),
            config: this.config,
            valid: false,
            error: [],
          },
          phone: {
            inputWrapper: new SexyInput({
              animation: 'none',
              config: this.config,
              $field: $form.querySelector('[data-field-phone]'),
              typeInput: 'phone',
            }),
            rule: yup
              .string()
              .required(i18next.t('required'))
              .test('phone-validation', i18next.t('field_too_short', { cnt: 10 }), function(value) {
                if (!value) return false;
                const digitsOnly = value.replace(/\D/g, '');
                return digitsOnly.length >= 10;
              }),
            defaultMessage: i18next.t('phone'),
            valid: false,
            error: [],
          },
        },
      },
    });
  }

  get$Form() {
    return document.querySelector(`#${this._id}`);
  }
}
