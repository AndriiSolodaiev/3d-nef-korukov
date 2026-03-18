import ionRangeSlider from 'ion-rangeslider';
import $ from 'jquery';
import * as yup from 'yup';
import s3d2spriteIcon from '../../../../../s3d2/scripts/templates/spriteIcon';
import i18next from 'i18next';
import TextInput from '../../../../../s3d2/scripts/templates/common/inputs/TextInput';
import Textarea from '../../../../../s3d2/scripts/templates/common/inputs/Textarea';
import ButtonWithoutIcon from '../../../../../s3d2/scripts/templates/common/ButtonWithoutIcon';
import SexyInput from '../../form/input/input';
import FormMonster from '../../form/form/form';

export default class InstallmentCalculator {
  constructor(props) {
    this.container = props.container;
    this.i18n = props.i18n;
    this.flatId = props.flatId || null;
    this.area = props.area;
    this.price_base_m2 = props.price_base_m2;
    this.price = props.price;
    this.currency_rate = props.currency_rate || 42;
    this.currency_id = props.currency_id || '$';
    this.min_month_installment = props.min_month_installment || 0;
    this.max_month_installment = props.max_month_installment || 36;
    this.min_first_installment = props.min_first_installment || 35;
    this.max_first_installment = props.max_first_installment || 100;
    this.first_payment = this.min_first_installment;
    this.month_installment = this.min_month_installment;
    this.monthPaymentView = 'data-month-payment-value';
    this.flatSumView = 'data-flat-sum';
    this.currency_label = props.currency_label || '€';
    this.month_payment_value = 0;
    this.additionalPricesData = [
      {
        min: 30,
        max: 50,
        additional_price: this.currency_id === 'UAH' ? 200 * this.currency_rate : 200,
      }, // 200 currency units per m²
      {
        min: 50,
        max: 100,
        additional_price: this.currency_id === 'UAH' ? 100 * this.currency_rate : 100,
      }, // 100 currency units per m²
    ];
  }

  init() {
    this.container.insertAdjacentHTML('beforeend', this.template());
    this.$form = this.container.querySelector('form');
    this.initRanges();
    this.initValidation();
    this.calculate();
  }

  initRanges() {
    $('[data-calculator-first-payment]').ionRangeSlider({
      onFinish: data => {
        const firstPayment = data.from;
        this.first_payment = firstPayment;
        this.calculate();
      },
    });
    $('[data-calculator-month-installment]').ionRangeSlider({
      values: [12, 24, 36],
      onFinish: data => {
        const monthInstallment = data.from_value;
        this.month_installment = monthInstallment;
        this.calculate();
      },
    });
  }

  defineAdditionalSumToM2Price(first_payment_percent) {
    let additional_price = 0;
    if (first_payment_percent >= 50) {
      additional_price = 100; // 100 currency units per m²
    } else {
      additional_price = 200; // 200 currency units per m²
    }
    if (this.currency_id === 'UAH') {
      return additional_price * this.currency_rate;
    }
    return additional_price;
  }

  calculate() {
    const area = parseFloat(this.area);
    const price = this.price;
    const basePricePerM2 = parseFloat(this.price_base_m2);
    const months = parseInt(this.month_installment, 10) || 12;
    const firstPaymentPercent = parseFloat(this.first_payment) / 100 || 35;

    // Додаємо відсоток до ціни за м2 залежно від терміну
    let adjustedPricePerM2 = basePricePerM2;

    if (months === 12) {
      adjustedPricePerM2 *= 1.06;
    } else if (months === 24) {
      adjustedPricePerM2 *= 1.12;
    } else if (months === 36) {
      adjustedPricePerM2 *= 1.18;
    }

    let persent = 0;
    if (months === 12) {
      persent = 0.06;
    } else if (months === 24) {
      persent = 0.12;
    } else if (months === 36) {
      persent = 0.18;
    }

    const totalPrice = area * basePricePerM2;

    const firstPaymentSum = totalPrice * firstPaymentPercent;
    const creditAmount = totalPrice - firstPaymentSum;

    let monthlyPayment = 0;

    let estimatedFlatPrice = totalPrice;
    let num1 = totalPrice - firstPaymentSum + (totalPrice - firstPaymentSum) * persent;
    let num2 = totalPrice - (totalPrice - firstPaymentSum);
    if (months > 0) {
      estimatedFlatPrice = (num1 + num2).toFixed(2);
      monthlyPayment = ((creditAmount + creditAmount * persent) / months).toFixed(2);
      //  monthlyPayment = (creditAmount / months).toFixed(2);
      // estimatedFlatPrice = (
      //   parseFloat(firstPaymentSum) +
      //   parseFloat(monthlyPayment) * months
      // ).toFixed(2);
    }

    // Вивід у DOM
    document.querySelector(`[data-monthly-payment-sum-view]`).textContent = this.numberWithCommas(
      monthlyPayment,
    );
    //ПИШЕМ СЮДИ ЗАГАЛЬНУ СУММУ ЯКУ ТРЕБА ОПЛАТИТИ
    document.querySelector(`[${this.flatSumView}]`).textContent =
      months == 0 || firstPaymentPercent == 1 ? price : this.numberWithCommas(estimatedFlatPrice);
    // document.getElementById('outstanding_balance').textContent = this.numberWithCommas(
    //   num1.toFixed(2),
    // );
    document.querySelector('[data-installment-count-view]').textContent = months;
    document.querySelector(
      '[data-first-payment-percent-view]',
    ).textContent = `${this.first_payment}%`;
    document.querySelector('[data-first-payment-sum-view]').textContent = this.numberWithCommas(
      firstPaymentSum.toFixed(2),
    );

    // Очищення прихованих полів
    this.$form.querySelectorAll('[type="hidden"]').forEach(el => el.remove());

    // Додавання прихованих значень
    this.createHiddenInput('flat_id', this.flatId);
    this.createHiddenInput('area', area);
    this.createHiddenInput('price_base_m2', basePricePerM2);
    this.createHiddenInput('price_adjusted_m2', adjustedPricePerM2.toFixed(2));
    this.createHiddenInput('currency_rate', this.currency_rate);
    this.createHiddenInput('currency_id', this.currency_id);
    this.createHiddenInput('currency_label', this.currency_label);
    this.createHiddenInput('first_payment', this.first_payment);
    this.createHiddenInput('month_installment_value', monthlyPayment);
    this.createHiddenInput('estimate_flat_price', estimatedFlatPrice);
  }

  createHiddenInput(name, value) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    this.$form.appendChild(input);
  }

  template() {
    return `
      <div class="installment-calculator-wrapper">
        <div class="installment-calculator">
          <div class="installment-calculator__left">
            <div class="installment-calculator__left-group installment-calculator__title fonts-3d-h1">${this.i18n.t(
              'calculator.title',
            )}</div>

            <div class="installment-calculator__left-price">
              <div>
                <div class="fonts-3d-h1">${this.area} ${this.i18n.t(
              'area_unit',
            )}</div>
                <div class="fonts-3d-body">${this.i18n.t('calculator.area')}</div>
              </div>

              <div class="installment-calculator__price">
                <div class="fonts-3d-h1">
                ${this.currency_label}
                ${this.numberWithCommas(this.price_base_m2)}
                </div>
                <div class="fonts-3d-body">${this.i18n.t('calculator.price')}</div>
              </div>
            </div>

            <div class="installment-calculator__range-group">
              <div class="installment-calculator__range-label fonts-3d-h3-semibold">
                <span data-first-payment-percent-view></span>
              </div>

              <div class="installment-calculator__range-group-title fonts-3d-h3-semibold">${this.i18n.t(
                'calculator.first',
              )}</div>

              <input type="number" data-calculator-first-payment class="installment-calculator__first-payment" value="${
                this.min_first_installment
              }" data-min="${this.min_first_installment}"
              data-max="${this.max_first_installment}" />
            </div>

            <div class="installment-calculator__range-group">
              <div class="installment-calculator__range-label fonts-3d-h3-semibold">
                <span data-installment-count-view></span>
              </div>

              <div class="installment-calculator__range-group-title fonts-3d-h3-semibold">${this.i18n.t(
                'calculator.term',
              )}</div>

              <input type="number" data-calculator-month-installment class="installment-calculator__month-installment" value="${
                this.min_month_installment
              }" data-min="${this.min_month_installment}"
              data-max="${this.max_month_installment}" />
            </div>

            <div class="installment-calculator__left-result-container">
                <div class="installment-calculator__left-result-container__payment">
                  <div class="fonts-3d-h1">
                    ${this.currency_label} <span data-first-payment-sum-view></span>
                  </div>
                  <div class="fonts-3d-body">${this.i18n.t('calculator.first_title_amount')}</div>
                </div>

                <div class="installment-calculator__left-result-container__payment">
                  <div class="fonts-3d-h1">
                    ${this.currency_label} <span data-monthly-payment-sum-view></span>
                  </div>
                  <div class="fonts-3d-body">${this.i18n.t('calculator.month')}</div>
                </div>
            </div>
          </div>

          <div class="installment-calculator__right">
            <div class="installment-calculator__right-group">
              <div class="fonts-3d-h1">
                ${this.currency_label}
                <span ${this.flatSumView}>1 168 956 </span>
              </div>
              <div class="fonts-3d-body">
                ${this.i18n.t('calculator.all')}
              </div>
            </div>

            <div class="installment-calculator__wrapper">
              <div class="installment-calculator__wrapper__tile fonts-3d-body">${this.i18n.t(
                'calculator.info_title',
              )}</div>
              <div class="installment-calculator__wrapper__text fonts-3d-body">${this.i18n.t(
                'calculator.info_1',
              )}</div>
              <div class="installment-calculator__wrapper__text fonts-3d-body">${this.i18n.t(
                'calculator.info_2',
              )}</div>
              <div class="installment-calculator__wrapper__text fonts-3d-body">${this.i18n.t(
                'calculator.info_3',
              )}</div>
            </div>

            <div class="installment-calculator__wrapper">
              <div class="installment-calculator__wrapper__tile fonts-3d-body">${this.i18n.t(
                'calculator.info_5_title',
              )}</div>
              <div class="fonts-3d-h2">${this.i18n.t('calculator.info_5')}</div>
            </div>

            <div class="manager-provide-cta-container">
              <span class="fonts-3d-body">${this.i18n.t('calculator.info_4')}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M37.3047 31.9556C36.9314 31.7433 36.4401 31.5109 35.9986 31.2392M55.8507 40.0152C54.626 39.5674 51.7216 38.5107 49.902 37.8659C47.6275 37.06 46.6652 37.6868 45.6154 38.045C44.5656 38.4032 41.7662 39.3883 39.7542 40.2838C37.7421 41.1793 35.73 38.851 34.5053 37.6868C33.2806 36.5227 31.7934 35.0003 31.0061 34.463C30.486 34.1081 29.8133 33.3626 29.6938 32.4328M35.9986 31.2392C35.509 30.9379 35.0807 30.5884 34.9427 30.1646C34.9054 30.012 34.8404 29.7944 34.7501 29.5378M35.9986 31.2392C36.1041 31.042 36.2072 30.8678 36.3029 30.7174C36.5543 30.3223 36.6161 29.7705 36.5979 29.3026C36.5943 29.2093 36.595 29.1085 36.6014 29.0005M43.3409 23.0006C41.2413 21.2095 41.0664 20.4931 36.7798 20.2245C35.6927 20.1564 34.78 20.0076 33.9804 19.8293M33.9804 19.8293C31.627 19.3046 30.253 18.5243 28.2941 18.7917C27.5606 18.8918 26.8543 18.936 26.1946 18.9476M33.9804 19.8293C35.4676 19.1499 36.3424 18.3439 37.4796 17.4484C38.6169 16.5529 39.7541 16.2843 41.2413 17.7171C42.7285 19.1499 44.6531 21.0304 46.4027 22.2842C48.1523 23.5379 48.9397 25.8662 52.7888 27.1199C54.1885 27.4781 55.6757 26.1348 59 28.5527M29.6938 32.4328C29.6453 32.0554 29.6879 31.6477 29.8688 31.2235C29.917 31.1104 29.975 30.9962 30.0438 30.881C30.2036 30.6132 30.3249 30.3776 30.4167 30.1646M29.6938 32.4328C28.5669 32.995 25.8162 34.3493 23.2202 35.6251M8.96077 19.3149C9.01241 18.2618 8.78055 16.1639 7.56066 15.2992C7.40287 15.1874 7.22856 15.0962 7.03618 15.0306M8.96077 19.3149C8.96077 19.7758 8.76479 20.2043 8.5284 20.5453C8.23451 20.9694 8.11474 21.5498 8.29126 22.0346C8.51816 22.6577 8.7425 23.5482 8.78583 24.6125C8.87331 26.7617 10.7772 24.4334 11.0063 24.1647M8.96077 19.3149C9.51803 20.6338 10.238 22.3402 11.0063 24.1647M7.03618 15.0306C6.68626 14.1709 6.13221 12.7023 5.89893 12.0754C5.72397 11.4784 5.84644 10.1411 7.73603 9.56798C9.62563 8.99486 14.647 7.65757 16.9216 7.06057C17.4464 6.94117 18.6012 6.91729 19.0211 7.77697C19.2778 8.3026 20.6814 11.0967 22.1199 13.956M7.03618 15.0306C6.33633 14.8515 6.11527 17.227 5.46152 17.8962C4.93663 18.4335 3.27449 19.5977 3.44946 21.6573C3.62442 23.717 3.79936 25.1498 3.44946 26.4035C3.09955 27.6572 3.53695 29.0005 4.14932 30.0751C4.76169 31.1497 6.94872 35.269 5.02413 39.5674C3.48447 43.0062 1.69985 46.7912 1 48.2538M24.6199 18.9211C23.6424 18.875 22.8515 18.7917 22.3454 18.7917C21.4688 18.7917 19.6163 18.4795 19.2836 19.3149C19.2178 19.48 19.2114 19.6899 19.2836 19.9558C19.721 21.5678 21.9955 22.2842 23.9201 22.4633C24.6067 22.5272 25.6663 22.7621 26.8069 23.05M24.6199 18.9211C24.3638 18.4129 24.0666 17.8229 23.7451 17.1844M24.6199 18.9211C25.1031 18.9438 25.632 18.9575 26.1946 18.9476M26.8069 23.05L28.0541 25.508M26.8069 23.05C27.2167 23.1534 27.6369 23.2637 28.0541 23.3754M30.4167 30.1646C30.6852 29.5419 30.7023 29.1131 30.6986 28.6422C30.696 28.3048 30.6827 27.9457 30.7436 27.4781C30.7788 27.2082 30.8386 26.9672 30.9211 26.7617M30.4167 30.1646L28.0541 25.508M29.3439 23.7258C30.5179 24.0477 31.5397 24.3312 32.0558 24.4334C33.1416 24.6483 33.9662 25.2393 34.2428 25.508C34.7783 26.106 35.8339 27.3029 36.4125 28.0156C36.5947 28.24 36.6481 28.5347 36.6165 28.822C36.6098 28.8835 36.6048 28.943 36.6014 29.0005M29.3439 23.7258C29.3439 24.7916 29.6115 25.1498 30.9211 26.7617M29.3439 23.7258C28.9278 23.6117 28.4926 23.4928 28.0541 23.3754M30.9211 26.7617C31.1459 26.2016 31.5385 25.9048 32.0558 26.0039C32.2934 26.0494 32.5572 26.1783 32.8432 26.4035C33.7382 27.1082 34.4165 28.5895 34.7501 29.5378M34.7501 29.5378C35.555 29.5378 36.2481 29.1796 36.6014 29.0005M22.1199 13.956C22.8703 13.4187 24.0075 13.15 24.3575 13.956C24.7074 14.7619 24.4321 16.0157 23.6075 16.9112M22.1199 13.956C22.6277 14.9652 23.1398 15.9826 23.6075 16.9112M23.6075 16.9112C23.6538 17.0032 23.6997 17.0943 23.7451 17.1844M23.7451 17.1844C24.5324 17.0007 25.4947 16.6856 26.1946 18.9476M28.0541 25.508C28.5566 25.1498 29.0388 24.1979 28.0541 23.3754M12.81 53C13.539 51.2388 15.137 47.4479 15.6968 46.3733C16.3967 45.03 17.4465 44.6718 18.8462 43.0599C20.2459 41.448 22.6079 37.2349 23.2202 35.6251M23.2202 35.6251C21.6243 36.4094 20.0869 37.1641 19.0211 37.6868C18.3213 37.9555 16.7466 38.045 16.0467 36.254C15.5353 34.9451 13.0924 29.119 11.0063 24.1647M11.0063 10.3289L15.0068 9.11842" stroke="#1A1E21"/>
              </svg>
            </div>
          </div>
        </div>
        ${this.getFormTemplate()}
      </div>
    `;
  }

  getFormTemplate() {
    return `
      <div class="form">
        <div class="form__title fonts-3d-h1">${this.i18n.t('calculator.form-title')}</div>
        <div class="form__description fonts-3d-body">${this.i18n.t(
          'calculator.form-description',
        )}</div>

        <div class="installment-calculator-form-success-block" data-installment-form-success-block>
          <div class="installment-calculator-form-success-block__title fonts-3d-h1">
            ${this.i18n.t('calculator.form-ok')}
          </div>
          <div class="fonts-3d-body">
            ${this.i18n.t('calculator.thank-you')}
          </div>
          <button type="button" class="s3d2-ButtonIconLeft s3d2-ButtonIconLeft--light" onclick="this.parentElement.classList.remove('active');">
            <span>${this.i18n.t('calculator.close')}</span>
          </button>
        </div>

        <form data-home-contact="data-home-contact" autocomplete="off">
          <div class="form-overflow">
            <div class="form-field form-field-input" data-field-input="data-field-input" data-field-name="data-field-name" data-status="field--inactive">
              <div class="s3d2__contact__form__title">
                ${i18next.t('Your name')}*
              </div>
              ${TextInput({
                text: i18next.t('Type your name'),
                className: 's3d2-TextInput',
                attributes: 'name="name"',
                type: 'text',
                value: '',
              })}
              <div class="input-message" data-input-message="data-input-message"></div>
            </div>
            <div class="form-field disabled form-field-input" data-field-input="data-field-input" data-field-phone="data-field-phone" data-status="field--inactive">
                <div class="s3d2__contact__form__title">
                  ${i18next.t('YOUR PHONE')}:*
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
            <div class="form-field form-field-input" data-field-input="data-field-input" data-field-email="data-field-email" data-status="field--inactive">
              <div class="s3d2__contact__form__title">
                ${i18next.t('YOUR EMAIL')}:
              </div>
              ${TextInput({
                text: i18next.t('Type your Email'),
                className: '',
                attributes: 'name="email"',
                type: 'email',
                value: '',
              })}
              <div class="input-message" data-input-message="data-input-message"></div>
            </div>
          </div>
          <div class="s3d2__contact__form__submit-wrapper">
            <div class="form-progress-button">
              <button type="submit" data-btn-submit><span>${i18next.t('send')}</span></button>
              <svg class="form-progress-circle" viewBox="0 0 120 120">
                <path d="m35,2.5c17.955803,0 32.5,14.544199 32.5,32.5c0,17.955803 -14.544197,32.5 -32.5,32.5c-17.955803,0 -32.5,-14.544197 -32.5,-32.5c0,-17.955801 14.544197,-32.5 32.5,-32.5z"/>
              </svg>
              <svg class="checkmark" viewBox="0 0 120 120"><path d="m31.5,46.5l15.3,-23.2"/>
                <path d="m31.5,46.5l-8.5,-7.1"/></svg>
              <svg class="cross" viewBox="0 0 120 120"><path d="m35,35l-9.3,-9.3"/>
                <path d="m35,35l9.3,9.3"/><path d="m35,35l-9.3,9.3"/><path d="m35,35l9.3,-9.3"/>
              </svg>
            </div>
          </div>
        </form>
    </div>
    `;
  }

  initValidation() {
    const $form = this.container.querySelector(`form`);
    new FormMonster({
      elements: {
        $form,
        showSuccessMessage: false,
        successAction: () => {
          this.container
            .querySelector('[data-installment-form-success-block]')
            .classList.add('active');
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
                if (!value || value.length === 0) return true;
                const digitsOnly = value.replace(/\D/g, '');
                return digitsOnly.length >= 10;
              }),
            defaultMessage: i18next.t('phone'),
            valid: false,
            error: [],
          },
          email: {
            inputWrapper: new SexyInput({
              animation: 'none',
              config: this.config,
              $field: $form.querySelector('[data-field-email]'),
              typeInput: 'email',
            }),
            rule: yup
              .string()
              .required(i18next.t('required'))
              .test('email-validation', i18next.t('invalid_email_format'), function(value) {
                if (!value) return false;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
              }),
            defaultMessage: i18next.t('email'),
            valid: false,
            error: [],
          },
        },
      },
    });
  }

  numberWithCommas(x) {
    if (!x) return 0;
    return x
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      .replace('.', ',');
  }
}
