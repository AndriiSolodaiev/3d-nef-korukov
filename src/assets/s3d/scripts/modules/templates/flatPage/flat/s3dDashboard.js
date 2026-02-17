import get from 'lodash/get';
import { FLAT_GALLERY_FANCYBOX, TOOLTIP_ATTRIBUTE } from '../../../../../../s3d2/scripts/constants';
import s3d2_ButtonIconLeft from '../../../../../../s3d2/scripts/templates/common/s3d2_ButtonIconLeft';
import s3d2spriteIcon from '../../../../../../s3d2/scripts/templates/spriteIcon';
import {
  numberWithDots,
  numberWithCommas,
} from '../../../../../../s3d2/scripts/helpers/helpers_s3d2';

export default function s3dDashboard(
  i18n,
  flat,
  $specifiedFlybysByGroup = '',
  showPrices = true,
  contacts,
) {
  const lang = i18n.language;
  const gallery = get(flat, 'gallery', []);
  const address = get(
    contacts,
    ['sales_department', 'text', lang],
    contacts.sales_department.text.en,
  );
const gardenProperty = Object.values(flat.properties).find(prop =>
  prop.property_name?.includes('Bahçe') ||
  prop.property_name?.includes('Garden')
);


  return `
        <div class="s3d-flat-dashboard">
            <div data-gallery-length="${gallery.length}" class="s3d-flat-dashboard__gallery ${
    gallery.length >= 5 ? '' : 's3d-flat-dashboard__gallery--less-items'
  }" ${gallery.length == 0 || !gallery.length ? ' style="display: none;" ' : ''}>
                <div class="s3d-flat-dashboard__gallery-item-wrap">
                    <div class="s3d-flat-dashboard__gallery-item" ${FLAT_GALLERY_FANCYBOX}="0">
                        <img src="${gallery[0]}" alt="flat image" loading="lazy"/>
                    </div>
                </div>
                <div class="s3d-flat-dashboard__gallery-item-wrap">
                    <div class="s3d-flat-dashboard__gallery-item" ${FLAT_GALLERY_FANCYBOX}="1">
                        <img src="${gallery[1]}" alt="flat image" loading="lazy"/>
                    </div>
                </div>
                <div class="s3d-flat-dashboard__gallery-item-wrap">
                    <div class="s3d-flat-dashboard__gallery-item" ${FLAT_GALLERY_FANCYBOX}="2">
                        <img src="${gallery[2]}" alt="flat image" loading="lazy"/>
                    </div>
                </div>
                <div class="s3d-flat-dashboard__gallery-item-wrap">
                    <div class="s3d-flat-dashboard__gallery-item" ${FLAT_GALLERY_FANCYBOX}="3">
                        <img src="${gallery[3]}" alt="flat image" loading="lazy"/>
                    </div>
                </div>
                <div class="s3d-flat-dashboard__gallery-item-wrap">
                    <div class="s3d-flat-dashboard__gallery-item" ${FLAT_GALLERY_FANCYBOX}="4">
                        <img src="${
                          gallery[4]
                        }" onerror="this.closest('.s3d-flat-dashboard__gallery-item-wrap').remove()" alt="flat image" loading="lazy"/>
                    </div>
                </div>
                <div class="s3d-flat-dashboard__status-label" ${
                  flat.sale == 1
                    ? `${TOOLTIP_ATTRIBUTE}="${i18n.t('unit_statuses.1_tooltip')}"`
                    : ''
                }>
                    <span>${i18n.t(`sales.${flat.sale}`)}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1C4.13404 1 1 4.13404 1 8C1 11.866 4.13404 15 8 15C11.866 15 15 11.866 15 8C15 4.13404 11.866 1 8 1ZM7.49414 6.64258C7.89296 6.64263 8.20081 6.74476 8.41699 6.94922C8.63313 7.15359 8.74121 7.41997 8.74121 7.74707C8.74118 7.81456 8.73381 7.93343 8.71875 8.10352C8.70374 8.27424 8.67603 8.4311 8.63574 8.57324L8.22266 10.125C8.18919 10.2494 8.15957 10.3918 8.13281 10.5518C8.10595 10.7117 8.0918 10.8332 8.0918 10.915C8.09185 11.1208 8.13562 11.2614 8.22266 11.3359C8.30978 11.4106 8.46125 11.4482 8.67578 11.4482C8.7763 11.4482 8.89024 11.4289 9.01758 11.3916C9.14481 11.3543 9.23695 11.3214 9.29395 11.293L9.18359 11.7734C8.85171 11.9121 8.58641 12.0179 8.38867 12.0908C8.19094 12.1636 7.96154 12.2002 7.7002 12.2002C7.29807 12.2002 6.98562 12.0957 6.7627 11.8877C6.53975 11.6797 6.42773 11.4157 6.42773 11.0957C6.42774 10.9715 6.43636 10.8445 6.45312 10.7148C6.46992 10.5851 6.49636 10.438 6.5332 10.2744L6.94531 8.7168C6.98212 8.56764 7.01389 8.42613 7.03906 8.29297C7.06411 8.15974 7.07617 8.03795 7.07617 7.92773C7.07615 7.72876 7.03797 7.58985 6.96094 7.51172C6.88379 7.43354 6.73626 7.39456 6.51855 7.39453C6.41128 7.39453 6.30078 7.41262 6.18848 7.44824C6.07638 7.4837 5.97971 7.51682 5.89941 7.54883L6.01074 7.06934C6.28219 6.95205 6.54199 6.85104 6.79004 6.76758C7.03797 6.68404 7.27296 6.64258 7.49414 6.64258ZM8.41406 3.7998C8.68563 3.7998 8.91767 3.89596 9.11035 4.08789C9.30315 4.27991 9.3994 4.51107 9.39941 4.78125C9.39941 5.0514 9.30314 5.28144 9.11035 5.47168C8.91764 5.66193 8.6857 5.75684 8.41406 5.75684C8.14253 5.75683 7.90935 5.66193 7.71484 5.47168C7.52065 5.28149 7.42383 5.05129 7.42383 4.78125C7.42384 4.51114 7.52053 4.27991 7.71484 4.08789C7.90933 3.89586 8.14251 3.79981 8.41406 3.7998Z" fill="none"/>
                    </svg>
                </div>
                ${s3d2_ButtonIconLeft(
                  's3d-flat-dashboard__gallery-button',
                  `${FLAT_GALLERY_FANCYBOX}="${gallery.length >= 5 ? 5 : 0}"`,
                  i18n.t('Flat.see_all_photos', { count: gallery.length }),
                  'Card',
                )}
            </div>
            <div class="s3d-flat-dashboard__info">
                <div class="s3d-flat-dashboard__info-item s3d-flat-dashboard__info-item--mobile-column s3d-flat-dashboard__info-item--mobile-head">
                    <span class="text-style-3-d-fonts-1920-h-1">
                        ${i18n.t('ctr.nav.flat')} ${flat.number}
                    </span>

                    <!--${
                      flat.adress
                        ? `
                    <span class="text-style-3-d-fonts-1920-body-regular">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 4C9.30033 4 6.90924 5.66034 6.90918 8.83008C6.90918 9.49423 7.26924 10.4656 7.44922 10.8682L12 20L16.5508 10.8682C16.7308 10.4656 17.0908 9.49423 17.0908 8.83008C17.0908 5.66036 14.6997 4.00002 12 4ZM12 7.09082C13.1045 7.09087 13.9999 7.98632 14 9.09082C14 10.1954 13.1045 11.0908 12 11.0908C10.8954 11.0908 10 10.1954 10 9.09082C10.0001 7.98629 10.8955 7.09082 12 7.09082Z" fill="none"/>
                        </svg>
                        ${flat.adress}
                    </span>`
                        : ``
                    }-->
                    <span class="text-style-3-d-fonts-1920-body-regular">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M12 4C9.30033 4 6.90924 5.66034 6.90918 8.83008C6.90918 9.49423 7.26924 10.4656 7.44922 10.8682L12 20L16.5508 10.8682C16.7308 10.4656 17.0908 9.49423 17.0908 8.83008C17.0908 5.66036 14.6997 4.00002 12 4ZM12 7.09082C13.1045 7.09087 13.9999 7.98632 14 9.09082C14 10.1954 13.1045 11.0908 12 11.0908C10.8954 11.0908 10 10.1954 10 9.09082C10.0001 7.98629 10.8955 7.09082 12 7.09082Z" fill="none"/>
                      </svg>
                      ${address}
                    </span>
                </div>
            </div>
            <div class="s3d-flat-dashboard__info-details">
                    ${
                      showPrices
                        ? `<div class="s3d-flat-dashboard__info-details-item">
                        <span class="text-style-3-d-fonts-1920-h-1">
                            ${
                              i18n.t('currency_label') === '$'
                                ? `${i18n.t('currency_label')} ${numberWithDots(flat.price)} `
                                : `${numberWithDots(flat.price)}  ${i18n.t('currency_label')}`
                            }

                        </span>

                    </div>`
                        : ''
                    }
                    <div class="s3d-flat-dashboard__info-details-item s3d-flat-dashboard__info-item--mobile-row">
                        <span class="text-style-3-d-fonts-1920-h-1">
                            ${flat.rooms}+1
                        </span>
                        <span class="text-style-3-d-fonts-1920-body-regular">
                            ${i18n.t('Flat.information.villa_type')}
                        </span>
                    </div>
                    <!--<div class="s3d-flat-dashboard__info-details-item s3d-flat-dashboard__info-item--mobile-row">
                        <span class="text-style-3-d-fonts-1920-h-1">
                            ${
                              Object.values(flat.customProperties)?.find(
                                prop => prop?.value.crm_properties_id == 52,
                              )?.value.value
                            }
                        </span>
                        <span class="text-style-3-d-fonts-1920-body-regular">
                            ${i18n.t('Flat.information.baths')}
                        </span>
                    </div>-->
                    <div class="s3d-flat-dashboard__info-details-item s3d-flat-dashboard__info-item--mobile-row">
                        <span class="text-style-3-d-fonts-1920-h-1">
                            ${numberWithCommas(flat.area)}
                        </span>
                        <span class="text-style-3-d-fonts-1920-body-regular">
                            ${i18n.t('Flat.information.villa')} ${i18n.t('area_unit')}
                        </span>
                    </div>
                    ${gardenProperty? `
                    <div class="s3d-flat-dashboard__info-details-item s3d-flat-dashboard__info-item--mobile-row">
                        <span class="text-style-3-d-fonts-1920-h-1">
                            ${numberWithCommas(gardenProperty.property_flat)}
                        </span>
                        <span class="text-style-3-d-fonts-1920-body-regular">
                             ${i18n.t('Flat.information.garden')} ${i18n.t('area_unit')}
                        </span>
                    </div>`: ""}
            </div>

            <div class="s3d-flat-dashboard__call-to-action">
                <button class="s3d2-ButtonIconLeft active s3d2-ButtonIconLeft--secondary text-uppercase-important" data-open-form="">
                    <span>${i18n.t('ctr.nav.callback')}</span>
                </button>
                <div class="s3d-flat-dashboard__call-to-action-inner">
                    <button class="s3d2-ButtonIconLeft text-uppercase-important js-s3d__create-pdf" >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M10.6963 2.52148C10.05 2.62975 9.67309 3.07502 9.49707 3.60645C9.33077 4.10904 9.3258 4.72134 9.38965 5.32129C9.51788 6.52549 9.94971 7.89656 10.3066 8.7959C9.87676 10.0097 9.25985 11.5656 8.51953 13.0957C8.23921 13.6751 7.94016 14.2435 7.63379 14.7871C6.57007 15.2802 5.75094 15.7665 5.13574 16.2275C4.25996 16.884 3.74825 17.5219 3.57129 18.084C3.48159 18.3691 3.46703 18.6776 3.59277 18.9521C3.72508 19.2405 3.97897 19.417 4.26465 19.4756C4.79031 19.5831 5.37945 19.3058 5.86621 18.8262L5.86719 18.8271C6.75405 18.036 7.59021 16.858 8.34277 15.5615C8.7122 15.3971 9.11375 15.231 9.54883 15.0645C11.526 14.3558 13.0365 13.9394 14.2227 13.6934C14.6333 13.9791 15.045 14.2239 15.4492 14.4268C16.3686 14.8881 17.2534 15.1475 17.9912 15.2432C18.3593 15.2908 18.7007 15.2992 18.9971 15.2666C19.2846 15.2349 19.5718 15.1602 19.7969 15.0098C20.1207 14.7931 20.3793 14.5035 20.4688 14.1445C20.5634 13.7646 20.4448 13.4035 20.2021 13.125C19.7518 12.6087 18.8666 12.3399 17.7715 12.3398C16.9849 12.3398 15.991 12.3431 14.458 12.6279C13.3199 11.7588 12.2088 10.5009 11.3828 8.74512C11.4648 8.50555 11.5397 8.2824 11.6045 8.07812L11.6035 8.07715C11.9004 7.18185 12.2482 5.83852 12.3008 4.73145C12.3265 4.18949 12.2869 3.6218 12.0693 3.19141C11.9546 2.9646 11.78 2.7562 11.5254 2.62695C11.2707 2.49779 10.9858 2.4731 10.6963 2.52148ZM6.58984 16.4609C6.13672 17.1049 5.67105 17.6609 5.20117 18.0801L5.19043 18.0908L5.17969 18.1006C4.85072 18.4307 4.60166 18.4903 4.50195 18.4941C4.50393 18.4693 4.51009 18.4335 4.52539 18.3848C4.61068 18.1137 4.92934 17.6325 5.73535 17.0283C5.97814 16.8464 6.26236 16.6569 6.58984 16.4609ZM17.7715 13.3398C18.7729 13.3399 19.2865 13.597 19.4482 13.7822C19.5106 13.8539 19.5018 13.8875 19.498 13.9023C19.4891 13.9382 19.4416 14.0446 19.2412 14.1787C19.2038 14.2035 19.0964 14.2495 18.8877 14.2725C18.6874 14.2945 18.4276 14.2909 18.1191 14.251C17.5024 14.171 16.7256 13.9478 15.8975 13.5322C15.8412 13.504 15.7851 13.4734 15.7285 13.4434C16.6027 13.3389 17.2415 13.3398 17.7715 13.3398ZM10.9199 10.0254C11.5879 11.2034 12.3811 12.149 13.2148 12.8955C12.1265 13.1596 10.815 13.5481 9.21094 14.123L9.20117 14.127C9.16783 14.1397 9.13455 14.1533 9.10156 14.166C9.20921 13.9545 9.31641 13.7432 9.41895 13.5312C10.0049 12.3203 10.5144 11.0944 10.9199 10.0254ZM10.8613 3.50781C10.9902 3.48631 11.0498 3.50674 11.0732 3.51855C11.0967 3.53052 11.1348 3.55962 11.1768 3.64258C11.2729 3.8328 11.3256 4.18198 11.3018 4.68359C11.2644 5.47106 11.0506 6.43375 10.8203 7.22754C10.6227 6.57429 10.4524 5.85992 10.3838 5.21582C10.3254 4.6671 10.3463 4.22192 10.4463 3.91992C10.5367 3.64701 10.6691 3.54009 10.8613 3.50781Z" fill="none"/>
                        </svg>
                        <span>${i18n.t('Flat.buttons.pdf')}</span>
                    </button>
                    <button class="s3d2-ButtonIconLeft js-s3d-add__favourite text-uppercase-important" data-id="${
                      flat.id
                    }">
                        <input type="checkbox" data-key="checked"/>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M15.665 18.5909H12.5801V6.65561C13.2351 7.02232 13.9613 7.36904 14.6885 7.64954C15.7069 8.04237 16.7696 8.32327 17.6562 8.32336H19.25C19.5261 8.32336 19.7499 8.09945 19.75 7.82336C19.75 7.54722 19.5261 7.32336 19.25 7.32336H17.6562C16.9498 7.32327 16.0207 7.0922 15.0479 6.71692C14.1775 6.38115 13.3063 5.943 12.5801 5.49769V4.75C12.5801 4.47386 12.3562 4.25 12.0801 4.25C11.8039 4.25 11.5801 4.47386 11.5801 4.75V5.49769C10.8538 5.943 9.98269 6.38115 9.1123 6.71692C8.13943 7.0922 7.21039 7.32327 6.50391 7.32336H4.91016C4.63401 7.32336 4.41016 7.54722 4.41016 7.82336C4.41022 8.09945 4.63405 8.32336 4.91016 8.32336H6.50391C7.39059 8.32327 8.45329 8.04237 9.47168 7.64954C10.1988 7.36904 10.9251 7.02231 11.5801 6.6556V18.5909H8.49512C8.21898 18.5909 7.99512 18.8148 7.99512 19.0909C7.99512 19.3671 8.21898 19.5909 8.49512 19.5909H15.665C15.9412 19.5909 16.165 19.3671 16.165 19.0909C16.165 18.8148 15.9412 18.5909 15.665 18.5909ZM16.8596 8.34766C17.0679 8.34769 17.2541 8.47691 17.3274 8.67188L19.718 15.0459C19.7959 15.2537 19.7275 15.4878 19.55 15.6211C18.774 16.2031 17.8296 16.5186 16.8596 16.5186C15.8897 16.5185 14.9462 16.203 14.1702 15.6211C13.9926 15.4879 13.9243 15.2538 14.0022 15.0459L16.3918 8.67188L16.4241 8.60254C16.5116 8.44691 16.6772 8.34767 16.8596 8.34766ZM15.0774 15.0244C15.6148 15.3449 16.2294 15.5185 16.8596 15.5186C17.4897 15.5186 18.1044 15.3447 18.6418 15.0244L16.8596 10.2705L15.0774 15.0244ZM7.2998 8.34766C7.50809 8.34769 7.69433 8.47691 7.76758 8.67188L10.1582 15.0459C10.2361 15.2537 10.1677 15.4878 9.99023 15.6211C9.21415 16.2031 8.26982 16.5186 7.2998 16.5186C6.3299 16.5185 5.38635 16.203 4.61035 15.6211C4.43279 15.4879 4.36445 15.2538 4.44238 15.0459L6.83203 8.67188L6.86426 8.60254C6.9518 8.44691 7.11734 8.34767 7.2998 8.34766ZM5.51758 15.0244C6.05502 15.3449 6.66963 15.5185 7.2998 15.5186C7.92991 15.5186 8.54461 15.3447 9.08203 15.0244L7.2998 10.2705L5.51758 15.0244Z" fill="none"/>
                        </svg>
                        <span title="Added to compare" data-in-fav="">${i18n.t(
                          'Flat.buttons.addedToCompare',
                        )}</span>
                        <span title="Compare" data-not-in-fav="">${i18n.t(
                          'Flat.buttons.compare',
                        )}</span>
                    </button>
                  ${$specifiedFlybysByGroup}
                </div>
            </div>
        </div>
    `;
}
