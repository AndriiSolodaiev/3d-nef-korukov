import groupBy from 'lodash/groupBy';
import isArray from 'lodash/isArray';
import get from 'lodash/get';
import { format, parseISO } from 'date-fns';

import createFlatInfo from './$flatInfo';
import $addToFavourite from '../$addToFavourite';
import $goToFloor from './$goToFloor';
import ButtonWithoutIcon from '../../../../../s3d2/scripts/templates/common/ButtonWithoutIcon';
import s3d2spriteIcon from '../../../../../s3d2/scripts/templates/spriteIcon';
import IconButton from '../../../../../s3d2/scripts/templates/common/IconButton';
import { $highlightSvgElements } from '../controller/$highlightSvgElements';
import { numberWithCommas, showOn } from '../../../../../s3d2/scripts/helpers/helpers_s3d2';
import FlatDocCard from '../../../../../s3d2/scripts/templates/flat/FlatDocCard';
import FlatFinancialTermsCard from '../../../../../s3d2/scripts/templates/flat/FlatFinancialTermsCard';
import ButtonIconLeft from '../../../../../s3d2/scripts/templates/common/ButtonIconLeft';
import { TOOLTIP_ATTRIBUTE } from '../../../../../s3d2/scripts/constants';
import $s3dVillaNavigation from './villa/villaNavigation';
import s3dFlatFloor from './flat/floor/flatFloor';
import renderVillaContact, { initializeVillaContact } from './villa/contactUs/villaContactUs';
import s32d_renderVillaContact, {
  s3d2_initializeVillaContact,
} from './villa/contactUs/s3d2_villaContactUs';
import VillaGalleryScreen from './villa/gallery/villaGalleryMarkup';
import VirtualTour from './villa/virtualTour/virtualTour';
import renderFaqList from './villa/faq/villaFaqList';
import VillaFinancialTermsScreen from './villa/terms/villaTermsScreen';
import FlatDocumentationScreen from './villa/documents/documents';
import FlatConstructionProgressScreen from './villa/constructionProgress/villaConstructionScreen';
import VillaContactLocation from './villa/contactUs/villaContactUsLocation';
import createFlybyVillaPage from './villa/flybyIndividual/villaFlybyView';
import generateButtonGroup from './villa/villaSpecifiedDropDown';
import s3dFloorPlan from '../flatPage/flat/floorPlan/floorPlan';
import s3dApartmentsList from '../flatPage/flat/apartmentsList/apartmentsList';
import $villaUpArrow from './villa/$villaUpArrow';
import initAnimations from './villa/animation/heroPinAnimation';
import s3dDashboard from './flat/s3dDashboard';
import getConfig from '../../../../../s3d2/scripts/getConfig';
import { socialMediaIcons } from '../../../../../s3d2/scripts/templates/common/icons/social-media-icons';
import {
  SMARTO_TOURS_CONTAINER_SELECTOR,
  SMARTO_TOURS_V3_CONTAINER_SELECTOR,
} from '../../../../../s3d2/scripts/modules/AudioAssistant/smartoToursSelectors';
import s3d2FlatFloorPlan from './flat/s3d2FlatFloor';
import $brandsList from './$brandsList';
import $s3d2_brandsList from './$s3d2_brandsList';
import s3d2_paymentSection from './villa/payment/s3d2_payment';

/**
 * Represents a Flat object.
 *
 * @constructor
 * @param {Object} i18n - The internationalization object.
 * @param {Object} flat - The flat object.
 * @param {Array} favouritesIds$ - The array of favourite IDs.
 * @param {Array} [otherTypeFlats=[]] - The array of other type flats.
 * @param {Array} [labelsToShowInInfoBlock=[]] - The array of labels to show in the info block.
 * @param {Object} [unit_statuses={}] - The unit statuses object.
 * @param {Array} [floorList=[]] - The array of floor list.
 * @param {Array} [projectDocs=[]] - The array of project documents.
 * @param {Array} [constructionProgressList=[]] - The array of constructionProgressList data.
 * @param {Array} [financialTermsData=[]] - The array of financial terms data.
 * @param {Array} [constructionProgressDataList=[]] - The construction progress array.

 */
function Flat({
  i18n,
  flat,
  favouritesIds$,
  otherTypeFlats = [],
  labelsToShowInInfoBlock = [],
  unit_statuses = {},
  floorList = [],
  projectDocs = [],
  exteriorData = [],
  financialTermsData = [],
  constructionProgress = null,
  constructionProgressDataList = [],
  showPrices,
  getFlat,
  globalPhoneNumber = '',
  contactAdvantagesList = [],
  social_media_links: socialMediaLinks = {},
  manager_info: managerInfo = {},
  g_contacts: contacts = {},
  project_google_map_location,
  faq_questions = [],
  brands_list = [],
  payment_list = [],
  contact_block_variant,
}) {
  function s3d2_CalculatorScreen(children = '', className = '') {
    return `
    <div class="calculator-screen">
      <div class="villa__contact-location ${className}">
        ${children}
      </div>
    </div>
  `;
  }
  
  const CONFIG = getConfig();

  const contactFormHtml1 = renderVillaContact(i18n, managerInfo, contactAdvantagesList);
  const contactFormHtml2 = renderVillaContact(i18n, managerInfo, contactAdvantagesList);

  const s3d2_contactFormHtml1 =
    contact_block_variant == '1' ? s32d_renderVillaContact('v1', { i18n, managerInfo }) : '';
  const s3d2_contactFormHtml2 =
    contact_block_variant == '2'
      ? s32d_renderVillaContact('v2', {
          i18n,
          socialMediaLinks,
          contacts,
          project_google_map_location,
        })
      : '';
  const s3d2_contactFormHtml3 =
    contact_block_variant == '3'
      ? s32d_renderVillaContact('v3', {
          i18n,
          managerInfo,
          project_google_map_location,
        })
      : '';

  const contactFormContainerId1 = extractContainerId(contactFormHtml1);
  const contactFormContainerId2 = extractContainerId(contactFormHtml2);

  const s3d2_contactFormContainerId1 =
    contact_block_variant == '1' ? extractContainerId(s3d2_contactFormHtml1) : '';
  const s3d2_contactFormContainerId2 =
    contact_block_variant == '2' ? extractContainerId(s3d2_contactFormHtml2) : '';
  const s3d2_contactFormContainerId3 =
    contact_block_variant == '3' ? extractContainerId(s3d2_contactFormHtml3) : '';

  const isChecked = favouritesIds$.value.includes(flat.id);
function s3d2_PanoramaScreen () {
  const currentLang = document.documentElement.lang || 'tr';
    return `
     <section class="panorama-screen">
    <div class="payment__title-icon-container">
        <h1 class="payment__title-icon-container__title">${i18n.t('Flat.panorama')}</h1>
        <div class="payment__icon-info-block">
          <svg class="payment__icon-info-block__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 0C3.13404 0 0 3.13404 0 7C0 10.866 3.13404 14 7 14C10.866 14 14 10.866 14 7C14 3.13404 10.866 6.44269e-08 7 0ZM6.49414 5.64258C6.89296 5.64263 7.20081 5.74476 7.41699 5.94922C7.63313 6.15359 7.74121 6.41997 7.74121 6.74707C7.74118 6.81456 7.73381 6.93343 7.71875 7.10352C7.70374 7.27424 7.67603 7.4311 7.63574 7.57324L7.22266 9.125C7.18919 9.24939 7.15957 9.39179 7.13281 9.55176C7.10595 9.71173 7.0918 9.83324 7.0918 9.91504C7.09185 10.1208 7.13562 10.2614 7.22266 10.3359C7.30978 10.4106 7.46125 10.4482 7.67578 10.4482C7.7763 10.4482 7.89024 10.4289 8.01758 10.3916C8.14481 10.3543 8.23695 10.3215 8.29395 10.293L8.18359 10.7734C7.85171 10.9121 7.58641 11.0179 7.38867 11.0908C7.19094 11.1636 6.96154 11.2002 6.7002 11.2002C6.29807 11.2002 5.98562 11.0957 5.7627 10.8877C5.53975 10.6797 5.42773 10.4157 5.42773 10.0957C5.42774 9.9715 5.43636 9.84449 5.45312 9.71484C5.46992 9.58515 5.49636 9.43804 5.5332 9.27441L5.94531 7.7168C5.98212 7.56764 6.01389 7.42613 6.03906 7.29297C6.06411 7.15974 6.07617 7.03795 6.07617 6.92773C6.07615 6.72876 6.03797 6.58985 5.96094 6.51172C5.88379 6.43354 5.73626 6.39456 5.51855 6.39453C5.41128 6.39453 5.30078 6.41262 5.18848 6.44824C5.07638 6.4837 4.97971 6.51682 4.89941 6.54883L5.01074 6.06934C5.28219 5.95205 5.54199 5.85104 5.79004 5.76758C6.03797 5.68404 6.27296 5.64258 6.49414 5.64258ZM7.41406 2.7998C7.68563 2.7998 7.91767 2.89596 8.11035 3.08789C8.30315 3.27991 8.3994 3.51107 8.39941 3.78125C8.39941 4.0514 8.30314 4.28144 8.11035 4.47168C7.91764 4.66193 7.6857 4.75684 7.41406 4.75684C7.14253 4.75683 6.90935 4.66193 6.71484 4.47168C6.52065 4.28149 6.42383 4.05129 6.42383 3.78125C6.42384 3.51114 6.52053 3.27991 6.71484 3.08789C6.90934 2.89586 7.14251 2.79981 7.41406 2.7998Z" fill="var(--s3d2-color-text-gray-900)" fill-opacity="0.2"/>
          </svg>
          <div class="payment__icon-info-block__text-block">
            <p class="payment__icon-info-block__text-block__text">${i18n.t('Flat.panorama_info')}</p>
          </div>
        </div>
      </div>
      <p class="payment__description">${i18n.t('Flat.panorama_description')}</p>
      <iframe class="payment__iframe" src=${CONFIG.panorama_view[currentLang]} loading="lazy"></iframe>
      </section>
    `;
  };
  const specifiedFlybyByGroup = groupBy(flat.specifiedFlybys, e => {
    return `flyby_${e.flyby}_${e.side}`;
  });

  const svgFlybyLink = flat.flatSvgLink ? flat.flatSvgLink : false;

  const $specifiedFlybysByGroup = Object.entries(specifiedFlybyByGroup)
    .map(([groupName, flybyList]) => generateButtonGroup(groupName, flybyList, flat, i18n))
    .join('');

  const flybyLists = Object.entries(specifiedFlybyByGroup).map(
    ([groupName, flybyList]) => flybyList,
  );

  const flatHtml = `
  <div class="s3d-flat-new s3d-villa">
    ${$s3dVillaNavigation({
      i18n,
      flat,
      isChecked,
      $specifiedFlybysByGroup,
    })}
    <div class="s3d-villa__container">
      ${flat['3d_tour'] ? VirtualTour(i18n, flat) : ''}
      ${
        flat['3d_tour_v2']
          ? `
        <div class="s3d-villa__gallery-wrap" style="padding-top: 0;">
          <div ${SMARTO_TOURS_CONTAINER_SELECTOR.replace(/\[|\]/g, '')}></div>
        </div>
      `
          : ``
      }
      ${
        flat['3d_tour_v3']
          ? `
        <div class="s3d-villa__gallery-wrap" style="padding-top: 0;">
          <div ${SMARTO_TOURS_V3_CONTAINER_SELECTOR.replace(/\[|\]/g, '')}></div>
        </div>
      `
          : ``
      }
      <div class="s3d-villa__container-bg"></div>
      ${s3dDashboard(i18n, flat, $specifiedFlybysByGroup, showPrices, contacts)}
      <div class="s3d-villa__video-screen" style="padding-top: var(--space-5);     padding-left: var(--space-6);padding-right: var(--space-6);">
        <div class="s3d-villa-description-screen">
          <div class="s3d-villa-description-screen-item" ${
            !flat.description ? 'style="display:none;"' : ''
          }>
            <div class="s3d-villa-description-screen-item-title">
              Description
            </div>
            <div class="s3d-villa-description-screen-item-text">
              ${flat.description}
            </div>
          </div>
          <div class="s3d-villa-description-screen-item" ${
            Object.entries(CONFIG.flat_description_2.items).length === 0
              ? 'style="display:none;"'
              : ''
          }>
            <div class="s3d-villa-description-screen-item-title">
              ${CONFIG.flat_description_2.title}
            </div>
            <div class="s3d-villa-description-screen-item-text">
              ${Object.entries(CONFIG.flat_description_2.items)
                .map(
                  ([name, value]) => `
                <a href="${value}" class="s3d-villa__contact-location-intro-item__social-item" target="_blank">
                  ${socialMediaIcons[name]}
                </a>
              `,
                )
                .join('')}
            </div>
          </div>

        </div>

      </div>
      ${s3d2FlatFloorPlan(i18n, flat, floorList, socialMediaLinks, contacts)}
      ${s3d2_paymentSection({ i18n, flat, payment_list })}
      ${$additionalAmenities(flat)}
      
      ${s3d2_PanoramaScreen()}
      ${s3dApartmentsList(i18n, flat, favouritesIds$, showPrices, otherTypeFlats)}
      ${s3d2_contactFormHtml1}
      ${s3d2_contactFormHtml2}
      ${s3d2_contactFormHtml3}

      <!-- ${contactFormHtml1} -->
      ${
        flat['view_from_window_link']
          ? `
        <div class="s3d-villa__virtual-tour-wrap">
            <div class="s3d-villa__floor__title-wrap">
                <div class="s3d-villa__floor__title-wrap__line"></div>
                <span class="s3d-villa__floor__title"> ${i18n.t('Flat.from_window_view')}</span>
                <div class="s3d-villa__floor__title-wrap__line"></div>
            </div>
            <div class="s3d-villa__virtual-tour-iframe-wrap">
                <iframe src="${flat['view_from_window_link']}" loading="lazy"></iframe>
            </div>
        </div>
      `
          : ''
      }
      ${
        flat['video']
          ? `
        <div class="s3d-villa__video-screen">
          <div class="s3d-villa__floor__title-wrap">
            <div class="s3d-villa__floor__title-wrap__line"></div>
            <span class="s3d-villa__floor__title">${i18n.t('Flat.video')}</span>
            <div class="s3d-villa__floor__title-wrap__line"></div>
          </div>
          <div class="s3d-villa__video-screen-iframe-wrap">
            <video class="" controls src="${flat['video']}" loading="lazy">
            </video>
          </div>
        </div>
      `
          : ''
      }


    <!--  ${renderFaqList(i18n, faq_questions, flat)} -->
      ${VillaFinancialTermsScreen(i18n, financialTermsData)}
      ${FlatDocumentationScreen(i18n, projectDocs)}
      ${FlatConstructionProgressScreen(i18n, constructionProgressDataList)}
      <div class="s3d-villa__contact-screen">
      ${VillaContactLocation(
        i18n,
        socialMediaLinks,
        contacts,
        globalPhoneNumber,
        project_google_map_location,
      )}
        ${contactFormHtml2}
      </div>

      <div last-screen-animation>
        <div class="s3d-flat-new__bottom" ></div>
      </div>
    </div>
    ${svgFlybyLink ? createFlybyVillaPage(flat) : ''}
    ${$villaUpArrow()}
  </div>
`;

  if (svgFlybyLink) {
    renderFlatFlyby(svgFlybyLink, flat.id, flat, getFlat);
  }

  initializeContactForms(contactFormContainerId1, contactFormContainerId2, i18n);
  s32d_initializeContactForms(
    s3d2_contactFormContainerId1,
    s3d2_contactFormContainerId2,
    s3d2_contactFormContainerId3,
    i18n,
    contact_block_variant,
  );

  return flatHtml;
}
/**
 * Extracts the container ID from the given HTML string (assumes the first ID found is the target).
 *
 * @param {string} html - The HTML string to extract the ID from.
 * @returns {string|null} - The extracted ID or null if no ID is found.
 */
function extractContainerId(html) {
  const match = html.match(/id="([^"]+)"/);
  return match ? match[1] : null;
}

export function FlatExplicationPropertyRow(title, value, i18n) {
  return `
    <div class="s3d-flat__explication-screen-info-row text-style-3-d-fonts-1920-body-regular text-gray-800">
      <div class="s3d-flat__explication-screen-info-row-title">${title}</div>
      <div class="s3d-flat__explication-screen-info-row-value">
        ${value} ${i18n.t('area_unit')}
      </div>
    </div>
  `;
}

/**
 * Initializes the contact forms by their container IDs.
 *
 * @param {string|null} id1 - The ID of the first contact form container.
 * @param {string|null} id2 - The ID of the second contact form container.
 */

function initializeContactForms(id1, id2, i18n) {
  setTimeout(() => {
    if (id1) {
      initializeVillaContact(id1, i18n);
    }
    if (id2) {
      initializeVillaContact(id2, i18n);
    }
  }, 0);
}

function s32d_initializeContactForms(id1, id2, id3, i18n, contact_block_variant) {
  setTimeout(() => {
    if (id1 && contact_block_variant == '1') {
      s3d2_initializeVillaContact(id1, i18n);
    }
    if (id2 && contact_block_variant == '2') {
      s3d2_initializeVillaContact(id2, i18n);
    }
    if (id3 && contact_block_variant == '3') {
      s3d2_initializeVillaContact(id3, i18n);
    }
  }, 0);
}

function renderFlatFlyby(link, flatId, flat, getFlat) {
  axios.get(link).then(el => {
    const container = document.querySelector('[data-flat-flyby-svg-container]');
    const parser = new DOMParser();
    const doc = parser.parseFromString(el.data, 'text/html');
    const svg = doc.querySelector('svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg
      .querySelectorAll('[data-type="infrastructure"], [data-type="flyby"]')
      .forEach(el => el.remove());
    svg.querySelectorAll(`polygon`).forEach(el => el.setAttribute('fill', 'none'));
    svg.querySelectorAll(`polygon[data-type="flat"]`).forEach(el => {
      el.classList.add('polygon__filter-select');
      if (!getFlat(el.dataset.id)) {
        el.remove();
        return;
      }
      el.dataset['_type'] = getFlat(el.dataset.id)['build_name'];
    });
    svg.querySelectorAll(`polygon[data-_type="${flat.build_name}"]`).forEach(el => {
      el.classList.add('active');
      const sale = getFlat(el.dataset.id).sale;
      el.dataset['sale'] = sale;
      // el.classList.remove('polygon__filter-select');
    });

    svg.querySelectorAll(`[data-id="${flatId}"]`).forEach(el => el.classList.add('active-flat'));
    container.insertAdjacentElement('beforeend', svg);
    const scrollEl = container.closest('.s3d-villa__flyby-wrapper');
    setTimeout(() => {
      scrollEl.scrollTo({
        left: scrollEl.scrollWidth / 2 - window.innerWidth / 2,
        behavior: 'smooth',
      });
    }, 3000);
  });
}

export default Flat;

function $additionalAmenities(flat) {
  if (!window.s3dAdditionalServices || !window.s3dAdditionalServices[flat.id]) {
    return ``;
  }

  const data = window.s3dAdditionalServices[flat.id]; // на проді ці дані виведені хардкодом у 3d.php !!!!

  return `
    <div class="s3d-villa__video-screen">
      <div class="s3d-villa__floor__title-wrap">
        <div class="s3d-villa__floor__title-wrap__line"></div>
        <span class="s3d-villa__floor__title">Features & Amenities</span>
        <div class="s3d-villa__floor__title-wrap__line"></div>
      </div>
      <div class="s3d-villa__additional-amenities">

      ${data
        .map(
          item => `
        <div class="s3d-villa__additional-amenities-item">
          ${
            item.title ? `<h3 class="s3d-villa__additional-amenities-title">${item.title}</h3>` : ''
          }
          <ul class="s3d-villa__additional-amenities-list">
            ${item.features
              .map(
                feature => `
              <li class="s3d-villa__additional-amenities-list-item">
                ${Object.entries(feature)
                  .map(
                    ([key, value]) => `
                  <span class="s3d-villa__additional-amenities-list-item-key">${key}:</span>
                  <span class="s3d-villa__additional-amenities-list-item-value">${value}</span>`,
                  )
                  .join('')}
              </li>`,
              )
              .join('')}
            </ul>
          </div>
        `,
        )
        .join('')}
      </div>
    </div>
  `;
}
