import s3d2spriteIcon from '../../../../../../../s3d2/scripts/templates/spriteIcon';

import get from 'lodash/get';
import Swiper, { Navigation } from 'swiper';

Swiper.use([Navigation]);

let disablePreviousResize = null;

export default function s3d2_paymentSection({ i18n, flat, payment_list = [] }) {
  if (typeof disablePreviousResize === 'function') {
    disablePreviousResize();
    disablePreviousResize = null;
  }

  const paymentHtml =
    payment_list.length > 0
      ? `
    <section class="payment">
      <div class="payment__title-icon-container">
        <h1 class="payment__title-icon-container__title">${i18n.t('Flat.payment_title')}</h1>
        <div class="payment__icon-info-block">
          <svg class="payment__icon-info-block__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 0C3.13404 0 0 3.13404 0 7C0 10.866 3.13404 14 7 14C10.866 14 14 10.866 14 7C14 3.13404 10.866 6.44269e-08 7 0ZM6.49414 5.64258C6.89296 5.64263 7.20081 5.74476 7.41699 5.94922C7.63313 6.15359 7.74121 6.41997 7.74121 6.74707C7.74118 6.81456 7.73381 6.93343 7.71875 7.10352C7.70374 7.27424 7.67603 7.4311 7.63574 7.57324L7.22266 9.125C7.18919 9.24939 7.15957 9.39179 7.13281 9.55176C7.10595 9.71173 7.0918 9.83324 7.0918 9.91504C7.09185 10.1208 7.13562 10.2614 7.22266 10.3359C7.30978 10.4106 7.46125 10.4482 7.67578 10.4482C7.7763 10.4482 7.89024 10.4289 8.01758 10.3916C8.14481 10.3543 8.23695 10.3215 8.29395 10.293L8.18359 10.7734C7.85171 10.9121 7.58641 11.0179 7.38867 11.0908C7.19094 11.1636 6.96154 11.2002 6.7002 11.2002C6.29807 11.2002 5.98562 11.0957 5.7627 10.8877C5.53975 10.6797 5.42773 10.4157 5.42773 10.0957C5.42774 9.9715 5.43636 9.84449 5.45312 9.71484C5.46992 9.58515 5.49636 9.43804 5.5332 9.27441L5.94531 7.7168C5.98212 7.56764 6.01389 7.42613 6.03906 7.29297C6.06411 7.15974 6.07617 7.03795 6.07617 6.92773C6.07615 6.72876 6.03797 6.58985 5.96094 6.51172C5.88379 6.43354 5.73626 6.39456 5.51855 6.39453C5.41128 6.39453 5.30078 6.41262 5.18848 6.44824C5.07638 6.4837 4.97971 6.51682 4.89941 6.54883L5.01074 6.06934C5.28219 5.95205 5.54199 5.85104 5.79004 5.76758C6.03797 5.68404 6.27296 5.64258 6.49414 5.64258ZM7.41406 2.7998C7.68563 2.7998 7.91767 2.89596 8.11035 3.08789C8.30315 3.27991 8.3994 3.51107 8.39941 3.78125C8.39941 4.0514 8.30314 4.28144 8.11035 4.47168C7.91764 4.66193 7.6857 4.75684 7.41406 4.75684C7.14253 4.75683 6.90935 4.66193 6.71484 4.47168C6.52065 4.28149 6.42383 4.05129 6.42383 3.78125C6.42384 3.51114 6.52053 3.27991 6.71484 3.08789C6.90934 2.89586 7.14251 2.79981 7.41406 2.7998Z" fill="var(--s3d2-color-text-gray-900)" fill-opacity="0.2"/>
          </svg>
          <div class="payment__icon-info-block__text-block">
            <p class="payment__icon-info-block__text-block__text">${i18n.t('Flat.payment_info')}</p>
          </div>
        </div>
      </div>

      <p class="payment__description">${i18n.t('Flat.payment_description')}</p>
      <div class="payment-swiper-wrapper">

          <div class="swiper">
            <ul class="payment__list swiper-wrapper">
              ${getPaymentCardFromDevBase(flat)}
            </ul>
          </div>

        <div class="payment__nav-buttons">
          <div class="swiper-button-prev">
            <button class="payment__nav-buttons__button" type="button">
                ${s3d2spriteIcon('Big arrow left')}
            </button>
          </div>
          <div class="swiper-button-next">
              <button class="payment__nav-buttons__button" type="button">
                ${s3d2spriteIcon('Big arrow right')}
            </button>
          </div>
        </div>

        <!--<p class="payment__end-text">${i18n.t('Flat.payment_end_text')}</p>-->
      </div>
    </section>
  `
      : ``;

  requestAnimationFrame(() => initSwiper());

  return paymentHtml;
}

function initSwiper() {
  const swiperEl = document.querySelector('.payment-swiper-wrapper .swiper');
  if (!swiperEl) return;

  if (swiperEl.swiper) {
    swiperEl.swiper.destroy(true, true);
  }

  const swiper = new Swiper(swiperEl, {
    slidesPerView: 5,
    spaceBetween: 20,
    observer: true,
    observeParents: true,
    watchOverflow: true,
    slidesOffsetAfter: 0,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    breakpoints: {
      320: { slidesPerView: 1 },
      768: { slidesPerView: 2 },
      1366: { slidesPerView: 5 },
    },
    on: {
      init: handleSwiperInit,
      resize: function() {
        updateSwiperUI(this);
      },
      afterInit: function() {
        updateSwiperUI(this);
      },
    },
  });
}

function handleSwiperInit() {
  if (!this?.slides) return;

  updateSwiperUI(this);

  disablePreviousResize = debounceResizeCallback(() => {
    if (this && !this.destroyed && this.slides) {
      updateSwiperUI(this);
    }
  }, 150);
}

function updateSwiperUI(swiperInstance) {
  //оновлення розмітки карток, якщо їх менше за зазначену кількість у свайпері
  //(займають всю ширину екрану)
  if (!swiperInstance?.slides?.length) return;

  const { slides, params, el, wrapperEl } = swiperInstance;

  // Центрування карток
  if (slides.length <= params.slidesPerView) {
    el.classList.add('swiper--centered');
  } else {
    el.classList.remove('swiper--centered');
  }

  //створення timeline лінії
  const firstSlide = slides[0];
  const lastSlide = slides[slides.length - 1];

  if (!firstSlide || !lastSlide) {
    console.error('No first or last slides');
    return;
  }

  const lineStart = firstSlide.offsetLeft + firstSlide.offsetWidth / 2;
  const lineEnd = lastSlide.offsetLeft + lastSlide.offsetWidth / 2;

  let line = wrapperEl.querySelector('.payment-timeline');

  //якщо лінії не знайдено, створюємо її
  if (!line) {
    line = document.createElement('div');
    line.className = 'payment-timeline';
    Object.assign(line.style, {
      position: 'absolute',
      top: '-16px',
    });
    wrapperEl.appendChild(line);
  }

  line.style.left = `${lineStart}px`;
  line.style.width = `${lineEnd - lineStart}px`;
}

 
function getPaymentCardFromDevBase(flat) {
  const PAYMENT_FIELD_IDS = {
    DOWN_PAYMENT: '53', // Down Payment (%35)
    INTERIM_6M: '54', // Interim Payment (6th month-%10)
    INTERIM_12M: '55', // Interim Payment (12th month-%15)
    INTERIM_18M: '56', // Interim Payment (18th month-%10)
    INSTALLMENT: '57', // Installment Amount (36 month)
  };

  const paymentIds = Object.values(PAYMENT_FIELD_IDS);
  const propertiesMap = new Map(flat.customProperties.map(prop => [prop.properties?.id, prop]));

  const paymentItemsHtml = paymentIds
    .map(id => {
      const property = propertiesMap.get(id);
      const rawLabel = property?.properties?.label ?? '';
      const priceValue = property?.value?.value ?? '';

      if (!rawLabel && !priceValue) return '';

      const { title, period, percent } = parsePaymentTitle(rawLabel);

      return `
          <li class="payment__list__item swiper-slide">
            <div class="payment__list__item__title-container">
              <h2 class="payment__list__item__title">
                ${title}${percent ? ` (${percent})` : ''}
              </h2>
            </div>
              <div class="payment__list__item__description-percent-container">
                <div class="payment__list__item__percent-container">
                  <p class="payment__list__item__percent-container__percent">${priceValue}</p>
                </div>
              </div>
              <p class="payment__list__item__period">${period}</p>
          </li>
        `;
    })
    .join('');

  return paymentItemsHtml;
}


function parsePaymentTitle(input) {
  // Регулярний вираз витягує:
  // 1. Все до першої дужки (Назва платежу)
  // 2. Вміст у дужках до дефіса або знака % (Період)
  // 3. Все, що залишилося після знака % (Значення відсотка)
  const regex = /^([^(]+)\s*\(([^-%]*)-?%?([^)]*)\)$/;
  const match = input.match(regex);

  if (match) {
    // Якщо всередині дужок був тільки відсоток (як %35),
    // то match[2] буде пустим, а match[3] отримає число.
    return {
      title: match[1].trim(),
      period: match[2].trim() ? `${match[2].trim()}` : '',
      percent: match[3].trim() ? `${match[3].trim()}%` : '',
    };
  }

  // Якщо формат не підійшов — просто виводимо назву, а інше порожнє
  return { title: input, period: '', percent: '' };
}

function paymentCard(i18n, item) {
  const lang = i18n.language || 'en';

  const escapeHtml = str =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  function getTranslation(field) {
    const value = field[lang] || field['en'] || '';
    return escapeHtml(value);
  }

  const title = getTranslation(item.title);
  const description = getTranslation(item.description);
  const percent = getTranslation(item.percent);
  const payment = getTranslation(item.payment);
  const period = getTranslation(item.period);

  return `
      <div class="payment__list__item swiper-slide">
        <h2 class="payment__list__item__title">${title}</h2>

        <div class="payment__list__item__description-percent-container">
          <p class="payment__list__item__description">${description}</p>

          <div class="payment__list__item__percent-container">
            <p class="payment__list__item__percent-container__percent">${percent}</p>
            <p class="payment__list__item__percent-container__payment">${payment}</p>
          </div>
        </div>

        <p class="payment__list__item__period">${period}</p>
      </div>
  `;
}

//перерахунок лінії при ресайзі екрану
export function debounceResizeCallback(callback, wait = 150, options) {
  const isFn = typeof callback === 'function';

  const w = typeof wait === 'number' && Number.isFinite(wait) && wait >= 0 ? wait : 0;

  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;

  /** @type {boolean} */
  let disabled = false;

  // Guard for non-browser / no window.
  const hasWindow =
    typeof window !== 'undefined' &&
    window &&
    typeof window.addEventListener === 'function' &&
    typeof window.removeEventListener === 'function';

  /** @param {UIEvent|Event} ev */
  const handler = ev => {
    if (disabled) return;

    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    timer = setTimeout(() => {
      timer = null;
      if (disabled) return;
      if (!isFn) return;

      try {
        callback(ev);
      } catch {
        // Intentionally swallow to avoid breaking resize event loop.
        // Users can wrap callback if they need error propagation/logging.
      }
    }, w);
  };

  if (hasWindow && isFn) {
    // Use provided options only when it's a valid type per spec.
    const optType = typeof options;
    const validOptions = options == null || optType === 'boolean' || optType === 'object';

    window.addEventListener('resize', handler, validOptions ? options : undefined);
  }

  /**
   * Disables the resize callback: removes the event listener (if any)
   * and cancels any pending debounced call.
   *
   * Safe to call multiple times.
   *
   * @returns {void}
   */
  const disable = () => {
    if (disabled) return;
    disabled = true;

    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    if (hasWindow && isFn) {
      const optType = typeof options;
      const validOptions = options == null || optType === 'boolean' || optType === 'object';

      window.removeEventListener('resize', handler, validOptions ? options : undefined);
    }
  };

  return disable;
}
