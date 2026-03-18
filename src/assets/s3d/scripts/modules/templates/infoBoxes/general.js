import {
  isDesktop,
  isNotDesktopTouchMode,
  numberWithCommas,
} from '../../../../../s3d2/scripts/helpers/helpers_s3d2';
import ButtonWithoutIcon from '../../../../../s3d2/scripts/templates/common/ButtonWithoutIcon';
import $closeBtn from './$closeBtn';

function general(i18n, data) {
  const {
    type,
    flyby,
    flatsCount,
    minPriceM2,
    minPrice,
    currency,
    finishDate,
    side,
    buttonType,
    show_prices = true,
  } = data;
  if (!type) {
    return '';
  }
  
  const $freeObjectsTitle = flatsCount
    ? `
  <div class="s3d-infoBox__block">
    <div class="s3d-infoBox__subtitle">${i18n.t(`infoBox.freeObjects`)}</div>
    <div class="s3d-infoBox__title">${flatsCount}</div>
  </div>`
    : '';

  const $finishDate = finishDate
    ? `
  <div class="s3d-infoBox__block">
    <div class="s3d-infoBox__subtitle">${i18n.t('infoBox.finishDate')} </div>
    <div class="s3d-infoBox__title">
      ${finishDate}
    </div>
  </div>
  `
    : '';
  const $minPriceM2 =
    show_prices && minPriceM2
      ? `
  <div class="s3d-infoBox__block">
    <div class="s3d-infoBox__subtitle">${i18n.t('infoBox.price_m2_from')} </div>
    <div class="s3d-infoBox__title">
      ${i18n.t('infoBox.from_price', {
        text: numberWithCommas(minPriceM2),
        currency: i18n.t('currency_label'),
      })}
    </div>
  </div>
  `
      : '';
  const $minPrice =
    show_prices && minPrice
      ? `
  <div class="s3d-infoBox__block">
    
    <div class="s3d-infoBox__title">${i18n.t('infoBox.from_price', {
      text: numberWithCommas(minPrice),
      currency: i18n.t('currency_label'),
    })}</div>
  </div>
  `
      : '';

  return `
    <div class="s3d-infoBox__general">
        ${$closeBtn()}
        <div class="s3d-infoBox__title-wrap"><span class="s3d-infoBox__title">
          ${i18n.t(`ctr.nav.${type}_${flyby}_${side}`)}
        </span></div>
        ${$freeObjectsTitle}
        ${$finishDate}
        
        ${$minPrice}
        ${
          isDesktop() && isNotDesktopTouchMode()
            ? ''
            : ButtonWithoutIcon(
                's3d-infoBox__link',
                `${type && `data-s3d-event="transform" data-type="${type}"`} ${
                  flyby ? `data-flyby="${flyby}"` : ''
                } ${side ? `data-side="${side}"` : ''}`,
                i18n.t('infoBox.general.button_titles.' + buttonType),
                'secondary',
              )
        }
    </div>`;
}

export default general;
