import {
  isMobile,
  isTablet,
  isDesktop,
  isNotDesktopTouchMode,
  numberWithCommas,
  numberWithDots,
} from '../../../../../s3d2/scripts/helpers/helpers_s3d2';
import ButtonWithoutIcon from '../../../../../s3d2/scripts/templates/common/ButtonWithoutIcon';
import s3d2spriteIcon from '../../../../../s3d2/scripts/templates/spriteIcon';
import $closeBtn from './$closeBtn';

function Flat(i18n, data) {
  const imageDefault = `${window.defaultModulePath}/images/examples/no-image.png`;
  const {
    rooms,
    rooms_unit,
    floor,
    price,
    price_m2,
    build,
    type,
    number,
    project_deadline,
    properties,
    customProperties,
    area,
    sale,
    id,
    show_prices,
    parking_spots,
    img_small: srcImage,
  } = data;
  const img = srcImage ? srcImage : imageDefault;
  const currency = i18n.t(`currency_label`);

  const buildType = data.customProperties[1].value.value;

  const $priceBlock = show_prices
    ? `
    <!--<div class="s3d-infoBox__flat__alert-title">
      ${
        currency === '$'
          ? `${i18n.t(`currency_label`, '')} ${numberWithCommas(price_m2)} ${i18n.t(
              `Flat.information.per`,
              '',
            )} ${i18n.t(`area_unit`, '')}`
          : `${numberWithCommas(price_m2)} ${i18n.t(`currency_label`, '')} ${i18n.t(
              `Flat.information.per`,
              '',
            )} ${i18n.t(`area_unit`, '')}`
      }
    </div>-->
    <div class="text-style-3-d-fonts-1920-h-1 s3d-infoBox__title s3d-infoBox__title-no-bottom-margin">
      ${
        currency === '$'
          ? `${i18n.t(`currency_label`, '')} ${numberWithDots(price)} `
          : `${numberWithDots(price)} ${i18n.t(`currency_label`, '')}`
      }
    </div>
  `
    : ``;

  return `
    <div class="s3d-infoBox__flat-backdrop" data-s3d-event="closed">
       ${
         isMobile() || isTablet()
           ? `
          <div class="s3d-infoBox__flat-overlay" data-s3d-event="closed"></div>
        `
           : ''
       }
      <div class="s3d-infoBox__flat">
      <!-- <div class="s3d-infoBox__flat__alert s3d-infoBox__flat__alert--left s3d-infoBox__flat__alert--dark" data-s3d-update="sale" >
          ${i18n.t(`Flat.information.area`)}:
          ${area} ${i18n.t('Flat.information.area_unit')}
        </div> -->
        <div class="s3d-infoBox__flat__alert-header">
          <div>
            <div class="s3d-infoBox__flat__alert s3d-infoBox__flat__alert--with-icon" data-s3d-update="sale"  data-sale="${sale}">
              ${i18n.t(`sales.${sale}`)}
              ${s3d2spriteIcon('Info', 's3d-infoBox__flat__alert__status-icon')}
            </div>
            ${
              project_deadline
                ? `
              <div class="s3d-infoBox__flat__alert__badge">
                ${project_deadline}
                ${s3d2spriteIcon('Construction', 's3d-card__badge-icon')}
              </div>
              `
                : ''
            }
          </div>
          ${isDesktop() ? '' : $closeBtn()}
        </div>
        <div class="s3d-infoBox__flat__alert__middle" style="display:flex; justify-content: space-between;  width: 100%">
          <div>${i18n.t('ctr.nav.mansion')} ${number} </div>
          <div class="decorative-slash">/</div>
          <div>${numberWithCommas(area)} ${i18n.t('Flat.information.area_unit')}</div>
        </div>
        <div class="s3d-infoBox__flat__image-wrapper">
          <div class="s3d-infoBox__image">
            <img src="${img}"/>
          </div>
        </div>
        <div class="s3d-infoBox__flat-bottom">
          ${$priceBlock}
          <div class="s3d-infoBox__info">
            <div class="s3d-infoBox__flat__wrapper-label">
              <div class="s3d-card__info-label">
            ${i18n.t('Flat.information.build')}: ${build}
          </div>
          <div class="s3d-card__info-label">
            ${i18n.t('Flat.information.floor')}: ${floor}
          </div>
              <div class="s3d-card__info-label">
                ${i18n.t('Flat.information.villa_type')}: ${rooms}+1
              </div>
            </div>
            <!--<div class="s3d-infoBox__flat__block">
              <div class="s3d-infoBox__flat__text">${i18n.t('Flat.information.price')}</div>
              <div class="s3d-infoBox__flat__textBold">${price} ${i18n.t(
    `currency_label`,
    '',
  )}</div>
            </div>
            <div class="s3d-infoBox__flat__block">
              <div class="s3d-infoBox__flat__text">${i18n.t('Flat.information.price_m2')}</div>
              <div class="s3d-infoBox__flat__textBold">${numberWithCommas(price_m2)} ${i18n.t(
    `currency_label`,
    '',
  )}</div>
            </div>-->
            ${
              isDesktop() && isNotDesktopTouchMode()
                ? ''
                : ButtonWithoutIcon(
                    '',
                    `data-s3d-event="transform" data-type="flat" data-id="${id}"`,
                    i18n.t('infoBox.reviewFlat'),
                    'secondary',
                  )
            }
          </div>
        </div>
      </div>
    </div>`;
}

export default Flat;
