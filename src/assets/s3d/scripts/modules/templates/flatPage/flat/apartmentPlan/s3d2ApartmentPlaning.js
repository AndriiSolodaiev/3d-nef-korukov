import get from 'lodash/get';
import ButtonWithoutIcon from '../../../../../../../s3d2/scripts/templates/common/ButtonWithoutIcon';
import ButtonIconLeft from '../../../../../../../s3d2/scripts/templates/common/ButtonIconLeft';
import { $highlightSvgElements } from '../../../controller/$highlightSvgElements';
import { numberWithCommas } from '../../../../../../../s3d2/scripts/helpers/helpers_s3d2';
import { socialMediaIcons } from '../../../../../../../s3d2/scripts/templates/common/icons/social-media-icons';

export default function s3d2ApartmentPlanings(i18n, flat, socialMediaLinks, contacts) {
  const firstLevelPhoto = flat.flat_levels_photo[1].without;

  const $socialMediaList = Object.entries(socialMediaLinks)
    .map(([name, url]) => {
      if (!url) return '';
      return `
        <a href="${url}" class="s3d2-apartment__flat-explication-screen-socials-item" rel="noopener noreferrer" target="_blank">
            ${socialMediaIcons[name]}
        </a>
      `;
    })
    .join('');

  const $email = get(contacts, 'email');

  const $floorButtons = () => {
    //прибрати flat.level = 2
    if (flat.level < 2) {
      return '';
    }
    const $buttons = [];
    for (let i = 1; i <= +flat.level; i++) {
      const buttonClass = i === 1 ? 'active' : '';
      if (!get(flat, `flat_levels_photo.${i}`)) {
        $buttons.push(' ');
        continue;
      }
      $buttons.push(
        ButtonWithoutIcon(
          `${buttonClass}`,
          `data-flat-explication-button="floor" data-value="${i}"`,
          i18n.t(`Flat.explication_data.floor_${i}`),
        ),
      );
    }
    const $buttonsFinal = $buttons.filter(el => el && el.length > 2);
    return $buttons.filter(el => el && el.length > 2).length > 1 ? $buttonsFinal.join('') : '';
  };
  const hasFlat2dAnd3dPlansOnLevel =
    flat.level !== 1 && Object.keys(get(flat, 'flat_levels_photo.1', {})).length > 1;

  // const parking_sqm = flat.customProperties.find(
  //   el => get(el, 'value.crm_properties_id', false) == 69,
  // );
  // const winter_garden = flat.customProperties.find(
  //   el => get(el, 'value.crm_properties_id', false) == 70,
  // );
const gardenProperty = Object.values(flat.properties).find(prop =>
  prop.property_name?.includes('Bahçe') ||
  prop.property_name?.includes('Garden')
);
const terraceProperty = Object.values(flat.properties).find(prop =>
  prop.property_name?.includes('Terrace') ||
  prop.property_name?.includes('Teras')
);
  return `
      <div class="s3d2-apartment__flat-explication-screen-wrap">
        <div class="s3d2-apartment__flat-explication-screen">
            <div class="s3d2-apartment__flat-explication-screen-slider swiper-container">
                <div class="s3d2-apartment__flat-explication-screen-buttons--floor-wrap">
                  ${
                    flat.level > 1
                      ? `<div class="s3d2-apartment__flat-explication-screen-buttons--floor">${$floorButtons()}</div>`
                      : ''
                  }

                  ${
                    flat.level > 1 && hasFlat2dAnd3dPlansOnLevel
                      ? `<div class="s3d2-apartment__flat-explication-screen-buttons--divider">/</div>`
                      : ''
                  }


                    ${
                      hasFlat2dAnd3dPlansOnLevel
                        ? `
                      <div class="s3d2-apartment__flat-explication-screen-buttons--slider">
                        <div class="s3d2-apartment__flat-explication-screen-buttons--planning3d">
                          ${
                            hasFlat2dAnd3dPlansOnLevel
                              ? ButtonWithoutIcon(
                                  '',
                                  'data-flat-explication-button="type"  data-value="2d"',
                                  i18n.t(`Flat.buttons.planning3d`),
                                )
                              : ''
                          }
                          ${
                            hasFlat2dAnd3dPlansOnLevel
                              ? ButtonWithoutIcon(
                                  'active',
                                  'data-flat-explication-button="type" data-value="3d"',
                                  i18n.t(`Flat.buttons.planning2d`),
                                )
                              : ''
                          }
                        </div>
                      </div>
                      `
                        : ''
                    }


                      <!-- <div class="s3d2-apartment__flat-explication-screen-buttons--furnished">

                        ${$highlightSvgElements(
                          i18n,
                          `data-flat-explication-furnished`,
                          'flat-explication-furnished',
                          i18n.t(`Flat.buttons.furnished`),
                        )}
                      </div> -->


                </div>


                <div class="swiper-wrapper">
                    <div class="swiper-slide">
                        <div class="s3d2-apartment__flat-explication-screen-slide">
                            <img src="${firstLevelPhoto}" data-flat-explication-image />
                        </div>
                    </div>
                </div>

            </div>

            <div class="s3d2-apartment__flat-explication-screen-table">
              <!--<span class="s3d2-apartment__flat-explication-screen-title">Layout</span>-->
              <div class="s3d2-apartment__flat-explication-screen-table-inner">
                <div class="s3d2-apartment__flat-explication-screen-table-content">
                  <!--<div class="s3d2-apartment__flat-explication-screen-table__title" data-flat-explication-title> Floor </div>-->
                  <div class="s3d2-apartment__flat-explication-screen-info ">
                      <div class="s3d2-apartment__flat-explication-screen-info-row  ">
                          <div class="s3d2-apartment__flat-explication-screen-info-row-title">
                              ${i18n.t('Flat.information.allArea')}:
                          </div>
                          <div class="s3d2-apartment__flat-explication-screen-info-row-blank">
                          </div>

                          <div class="s3d2-apartment__flat-explication-screen-info-row-value">
                              ${numberWithCommas(flat.area)} ${i18n.t('area_unit')}
                          </div>
                      </div>
                      ${
                        flat.life_room
                          ? ` <div class="s3d2-apartment__flat-explication-screen-info-row  ">
                          <div class="s3d2-apartment__flat-explication-screen-info-row-title">
                              ${i18n.t('Flat.information.life_area')}:
                          </div>
                          <div class="s3d2-apartment__flat-explication-screen-info-row-blank">
                          </div>
                          <div class="s3d2-apartment__flat-explication-screen-info-row-value">
                              ${numberWithCommas(flat.life_room)} ${i18n.t('area_unit')}
                          </div>
                      </div>`
                          : ``
                      }
                      ${
                        terraceProperty
                          ? ` <div class="s3d2-apartment__flat-explication-screen-info-row  ">
                          <div class="s3d2-apartment__flat-explication-screen-info-row-title">
                              ${terraceProperty.property_name}:
                          </div>
                          <div class="s3d2-apartment__flat-explication-screen-info-row-blank">
                          </div>
                          <div class="s3d2-apartment__flat-explication-screen-info-row-value">
                              ${numberWithCommas(terraceProperty.property_flat)} ${i18n.t('area_unit')}
                          </div>
                      </div>`
                          : ``
                      }
                      ${
                        gardenProperty
                          ? ` <div class="s3d2-apartment__flat-explication-screen-info-row  ">
                          <div class="s3d2-apartment__flat-explication-screen-info-row-title">
                              ${gardenProperty.property_name}:
                          </div>
                          <div class="s3d2-apartment__flat-explication-screen-info-row-blank">
                          </div>
                          <div class="s3d2-apartment__flat-explication-screen-info-row-value">
                              ${numberWithCommas(gardenProperty.property_flat)} ${i18n.t('area_unit')}
                          </div>
                      </div>`
                          : ``
                      }
                      
                      ${
                        flat.exterior_area
                          ? `    <div class="s3d2-apartment__flat-explication-screen-info-row  ">
                          <div class="s3d2-apartment__flat-explication-screen-info-row-title">
                              ${i18n.t('Flat.information.exterior_area')}:
                          </div>
                          <div class="s3d2-apartment__flat-explication-screen-info-row-blank">
                          </div>
                          <div class="s3d2-apartment__flat-explication-screen-info-row-value">
                              ${numberWithCommas(flat.exterior_area)} ${i18n.t('area_unit')}
                          </div>
                      </div>`
                          : ``
                      }
                  </div>
                  <div class="s3d2-apartment__flat-explication-screen-info" data-villa-explication-floor-properties-container>
                    <div class="s3d2-apartment__flat-explication-screen-info-row">
                        <div class="s3d2-apartment__flat-explication-screen-info-row-title">Living area:</div>
                        <div class="s3d2-apartment__flat-explication-screen-info-row-blank">
                        </div>
                        <div class="s3d2-apartment__flat-explication-screen-info-row-value">
                            ${flat.life_room} ${i18n.t('area_unit')}
                        </div>
                    </div>
                  </div>
                 
                </div>
              </div>
              <button class="s3d2-ButtonIconLeft active s3d2-ButtonIconLeft--secondary text-uppercase-important s3d2-apartment__flat-explication-screen-open text-uppercase-important js-s3d__create-pdf" data-flat-explication-button>
                <span>${i18n.t('Flat.explication_data.open_full_plan')}</span>
              </button>
              <div class="s3d2-apartment__flat-explication-screen-socials-wrap">
                <button data-s3d-share class="s3d2-apartment__flat-explication-screen-socials-share">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M11.293 1L8.5 1L8.5 -3.71547e-07L13 -5.68248e-07L13 4.5L12 4.5L12 1.70703L5.52051 8.18652L4.81348 7.47949L11.293 1ZM-4.00701e-07 3.83301C8.58134e-05 3.3469 0.193369 2.88085 0.537109 2.53711C0.880849 2.19337 1.34689 2.00009 1.83301 2L5.83301 2L5.83301 3L1.83301 3C1.61211 3.00009 1.40034 3.08794 1.24414 3.24414C1.08794 3.40034 1.00009 3.61211 1 3.83301L1 11.167C1.00009 11.3879 1.08794 11.5997 1.24414 11.7559C1.40034 11.9121 1.61211 11.9999 1.83301 12L9.16699 12C9.38789 11.9999 9.59966 11.9121 9.75586 11.7559C9.91206 11.5997 9.99991 11.3879 10 11.167L10 7.16699L11 7.16699L11 11.167C10.9999 11.6531 10.8066 12.1192 10.4629 12.4629C10.1192 12.8066 9.65311 12.9999 9.16699 13L1.83301 13C1.34689 12.9999 0.880849 12.8066 0.537109 12.4629C0.193369 12.1192 8.60293e-05 11.6531 -8.01233e-08 11.167L-4.00701e-07 3.83301Z" fill="none"/>
                  </svg>
                  <span>${i18n.t('Flat.share')}</span>
                </button>

                <div class="s3d2-apartment__flat-explication-screen-socials">
                  ${$socialMediaList}
                  <a class="s3d2-apartment__flat-explication-screen-socials-item" href="mailto:${$email}" rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 16.5C4 17.3249 4.71979 17.9998 5.59961 18L18.4004 18C19.2802 17.9998 20 17.3249 20 16.5L20 7.5C20 7.38762 19.9853 7.27834 19.96 7.17285L12.4941 13.707C12.2115 13.9544 11.7896 13.9542 11.5068 13.707L4.03906 7.17285C4.01379 7.27827 4 7.38769 4 7.5L4 16.5ZM12 12.1455L18.9258 6.08496C18.7609 6.03073 18.5843 6.00004 18.4004 6L5.59961 6C5.41533 6.00004 5.23834 6.03054 5.07324 6.08496L12 12.1455Z" fill="none"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
        </div>
      </div>
    `;
}
