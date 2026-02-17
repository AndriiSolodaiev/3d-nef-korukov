import { get } from 'lodash';
import $addToFavourite from '../$addToFavourite';
import { TOOLTIP_ATTRIBUTE, BATHS_CUSTOM_PROPERTY_ID } from '../../../../../s3d2/scripts/constants';
import { numberWithDots, numberWithCommas } from '../../../../../s3d2/scripts/helpers/helpers_s3d2';
import ButtonWithoutIcon from '../../../../../s3d2/scripts/templates/common/ButtonWithoutIcon';
import s3d2spriteIcon from '../../../../../s3d2/scripts/templates/spriteIcon';
import closeCard from './$closeCard';

function Card(
  i18n,
  flat,
  favouritesIds$,
  showPrices = true,
  customatributeEnter = '',
  customatributeLeave = '',
  slide = false,
) {
  const imageDefault = `${window.defaultModulePath}/images/examples/no-image.png`;
  const {
    area,
    rooms,
    rooms_unit,
    floor,
    number,
    price_m2,
    build,
    type,
    price,
    sale,
    baths,
    properties,
    customProperties,
    specifiedFlybys,
    project_deadline,
    img_big: src,
    id,
  } = flat;

  const buildType = get(flat, 'customProperties[1].value.value', '');

  const $showIn3dButton = (() => {
    const isMarked = Array.isArray(specifiedFlybys) && specifiedFlybys.length > 0;
    if (!isMarked) return '';
    const firstFlyby = specifiedFlybys.find(() => true);
    return `
      <div class="s3d-card__right-bottom-button"
        data-show-flat-in-flyby
        data-side="${firstFlyby.side}"
        data-control-point="${firstFlyby.controlPoint}"
        data-flyby="${firstFlyby.flyby}"
        data-type="flyby"
        change="true"
        data-flatid="${id}"
        ${TOOLTIP_ATTRIBUTE}="${i18n.t('Flat.buttons.showIn3d')}"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M4 5.75V6.3315V18.25L11.5001 22.7031L12.0001 23L12.5001 22.7031L20 18.25V6.33149V5.75L19.5103 5.45925L12.0001 1L4.48968 5.45926L4 5.75ZM5 6.92526V17.6808L11.5001 21.5401L11.4999 10.7846L5 6.92526ZM12.4999 10.7846L12.5001 21.5401L19 17.6808V6.92523L12.4999 10.7846ZM18.531 6.04074L12.0001 2.16299L5.46903 6.04076L11.9999 9.91851L18.531 6.04074Z" fill="#1A1E21"></path>
        </svg>
      </div>
    `;
  })();

  const currency = i18n.t('Flat.information.priceText');

  const $status = (i18n, flat) => {
    const tooltipAttributes =
      flat.sale == 1 ? `${TOOLTIP_ATTRIBUTE}="${i18n.t('unit_statuses.1_tooltip')}"` : '';
    return `
       <div class="s3d-card__status s3d-card__image-info" data-sale='${sale}' ${tooltipAttributes}>
          ${i18n.t(`unit_statuses.${sale}`)}
          ${s3d2spriteIcon('Info', 's3d-card__status-icon')}
        </div>
    `;
  };

  const $number = (i18n, flat) => {
    return `
      <div class="s3d-card__rooms-count s3d-card__image-info">
        ${i18n.t('Flat.information.area')}: ${numberWithCommas(flat.area)} ${i18n.t(
      'Flat.information.area_unit',
    )}
      </div>
    `;
  };

  const $price = () => {
    if (!showPrices) return '';
    if (currency.trim() == '$') {
      return `
        <div class="s3d-card__title">
          ${i18n.t('Flat.information.priceText')} ${numberWithDots(price)}
        </div>
      `;
    }
    return `
      <div class="s3d-card__title">
        ${numberWithDots(price)} ${i18n.t('Flat.information.priceText')}
      </div>
    `;
  };

  const $priceM2 = () => {
    if (!showPrices) return '';
    if (currency.trim() == '$') {
      return `
        <div class="s3d-card__row">
          <div class="s3d-card__name">
            ${i18n.t('Flat.information.priceText')}
            ${price_m2}
            ${i18n.t('Flat.information.per')}
            ${i18n.t('Flat.information.area_unit')}
          </div>
        </div>
      `;
    }
    return `
      <div class="s3d-card__row">
        <div class="s3d-card__name">
          ${price_m2}
          ${i18n.t('Flat.information.priceText')}
          ${i18n.t('Flat.information.per')}
          ${i18n.t('Flat.information.area_unit')}
        </div>
      </div>
    `;
  };

  const isFavourite = favouritesIds$.value.includes(id);

  return `
    <div class="${
      slide ? 'swiper-slide' : ''
    } s3d-card js-s3d-card" data-id="${id}" data-key="id" data-sale="${sale}" ${customatributeEnter} ${customatributeLeave}>
      ${closeCard()}
      <div class="s3d-card__header">
        <div class="left">
          ${$status(i18n, flat)}
          ${
            project_deadline
              ? `
            <div class="s3d-card__badge">
              ${project_deadline}
              ${s3d2spriteIcon('Construction', 's3d-card__badge-icon')}
            </div>
            `
              : ''
          }
        </div>
        <div class="right">
          ${$addToFavourite(i18n, flat, favouritesIds$)}
        </div>

        <!-- ${$number(i18n, flat)} -->
      </div>
      <div class="s3d-card__middle">
        <div>${i18n.t('Flat.information.rooms')}: ${rooms}+1</div>
        <div class="decorative-slash">/</div>
        <div>${numberWithCommas(area)} ${i18n.t('Flat.information.area_unit')}</div>
        <!-- <div>${area} м²</div> -->
      </div>
      <div class="s3d-card__image">
        <img src="${src ||
          imageDefault}" onerror="this.src='${imageDefault}'" data-key="src" loading="lazy">
      </div>
      <div class="s3d-card__info-wrapper">
        <!--<div class="s3d-card__table">
          ${$priceM2()}
        </div>-->
        ${$price()}
        <div class="s3d-card__info-label-wrapper">
          <div class="s3d-card__info-label">
            ${i18n.t('Flat.information.build')}: ${build}
          </div>
          <!--<div class="s3d-card__info-label">
            ${i18n.t('Flat.information.floor')}: ${floor}
          </div>-->
          <div class="s3d-card__info-label">
           ${i18n.t('Flat.information.villa_type')}: ${rooms}+1
          </div>
          <!--<div class="s3d-card__info-label">
           ${i18n.t('Flat.information.baths')}: ${
    Object.values(get(flat, 'customProperties', {}))?.find(prop => prop?.value.crm_properties_id == 52)?.value.value
  }
          </div>-->
        </div>
        <!-- <div class="s3d-card__buttons">
            ${ButtonWithoutIcon('js-s3d-card__link', '', i18n.t('Flat.goToFlat'), 'secondary')}
        </div> -->
      </div>
      ${$showIn3dButton}
   </div>`;
}

export default Card;
