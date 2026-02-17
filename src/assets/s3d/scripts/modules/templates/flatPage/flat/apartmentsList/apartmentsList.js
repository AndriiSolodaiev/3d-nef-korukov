import Card from '../../../../templates/card/card';
import Swiper, { Navigation } from 'swiper';
import s3d2spriteIcon from '../../../../../../../s3d2/scripts/templates/spriteIcon';

Swiper.use([Navigation]);

export default function s3dApartmentsList(i18n, flat, favouritesIds$, showPrices, otherTypeFlats) {
  console.log(otherTypeFlats);
  if (otherTypeFlats.length == 0) return '';

  const currentPrice = parseFloat(flat.price);
  const currentType = flat.type;
  const currentId = flat.id; // щоб не показати ту саму квартиру

  // 1. Шукаємо одну найближчу квартиру ТОГО Ж ТИПУ
  const sameTypeNearest = otherTypeFlats
    .filter(item => item.type === currentType && item.id !== currentId)
    .sort(
      (a, b) =>
        Math.abs(parseFloat(a.price) - currentPrice) - Math.abs(parseFloat(b.price) - currentPrice),
    )
    .slice(0, 1); // беремо тільки 1 найближчу

  // 2. Шукаємо найближчі за ціною квартири ІНШИХ ТИПІВ
  const otherTypesNearest = otherTypeFlats
    .filter(item => item.type !== currentType)
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    .slice(0, 9); // беремо 4 найдешевші за ціною

  // 3. Склеюємо результат
  const flatsToShow = [...sameTypeNearest, ...otherTypesNearest];

  const containerId = `flat-progress-swiper-${Date.now()}`;
  const apartmentsListHtml = `
    <div class="s3d-flat-new__apartments-list">

      <div class="s3d-villa__floor__title-wrap">
        <div class="s3d-villa__floor__title-wrap__line"></div>
        <span class="s3d-villa__floor__title"> ${i18n.t(`Flat.same_apartment_type`)}</span>
        <div class="s3d-villa__floor__title-wrap__line"></div>
      </div>

    <div id="${containerId}" class="s3d-flat-new__apartments-list-wrapper s3d-villa__construction-progress-screen__list swiper-container">
            <div class="s3d-flat-new__apartments-list-swiper s3d-villa__construction-progress-screen__list swiper">
                <div class="swiper-wrapper">
                    ${flatsToShow
                      .map(otherTypeFlat =>
                        Card(i18n, otherTypeFlat, favouritesIds$, showPrices, '', '', true),
                      )
                      .join('')}
                </div>
            </div>

            <div class="s3d-flat-new__apartments-list-swiper-nav-wrap s3d-villa__construction-swiper-nav-wrap">
                    <div class="s3d-flat-new__apartments-list-swiper-button-prev s3d-villa__construction-swiper-button-prev swiper-button-prev">
                      ${s3d2spriteIcon('Big arrow left')}
                    </div>
                    <div class="s3d-flat-new__apartments-list-swiper-button-next s3d-villa__construction-swiper-button-next swiper-button-next">
                        ${s3d2spriteIcon('Big arrow right')}
                    </div>
              </div>
          </div>

    </div>
    `;

  function updateNavigationButtons(swiper) {
    const prevButton = document.querySelector(
      `#${containerId} .s3d-flat-new__apartments-list-swiper-button-prev`,
    );
    const nextButton = document.querySelector(
      `#${containerId} .s3d-flat-new__apartments-list-swiper-button-next`,
    );

    const totalSlides = swiper.slides.length;
    const slidesPerView = swiper.params.slidesPerView;

    if (totalSlides <= slidesPerView) {
      // Если слайдов меньше или равно, чем количество видимых слайдов, отключаем обе кнопки
      prevButton.classList.add('disabled');
      nextButton.classList.add('disabled');
    } else {
      // Если слайды есть для прокрутки, проверяем первый и последний слайд
      if (swiper.isBeginning) {
        prevButton.classList.add('disabled');
      } else {
        prevButton.classList.remove('disabled');
      }

      if (swiper.isEnd) {
        nextButton.classList.add('disabled');
      } else {
        nextButton.classList.remove('disabled');
      }
    }
  }

  setTimeout(() => {
    const swiperContainer = document.querySelector(`#${containerId} .swiper`);
    if (swiperContainer) {
      new Swiper(swiperContainer, {
        navigation: {
          nextEl: `#${containerId} .s3d-flat-new__apartments-list-swiper-button-next`,
          prevEl: `#${containerId} .s3d-flat-new__apartments-list-swiper-button-prev`,
        },
        slidesPerView: 5,
        spaceBetween: 40,
        speed: 1000,
        // loop: true,
        breakpoints: {
          320: {
            slidesPerView: swiperContainer.querySelector('.s3d-villa__construction-progress-card')
              ? 2
              : 1,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          1366: {
            slidesPerView: 4,
            spaceBetween: 24,
          },
          1920: {
            slidesPerView: 5,
            spaceBetween: 20,
          },
        },
        on: {
          init: function() {
            // Вызовите логику для начальной установки кнопок
            updateNavigationButtons(this); // Передаем текущий swiper объект
          },
          slideChange: function() {
            // Эта функция будет вызываться при смене слайда
            updateNavigationButtons(this); // Передаем текущий swiper объект
          },
        },
      });
    } else {
      console.warn(`Swiper container not found for ID: ${containerId}`);
    }
  }, 500);

  return apartmentsListHtml;
}
