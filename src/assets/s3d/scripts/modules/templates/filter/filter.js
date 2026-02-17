import $amountFlat from './$filter-amount';
import $filterClose from './$filterClose';
import $ranges from './$ranges';
import Checkbox from '../../../../../s3d2/scripts/templates/components/filter/Checkbox';
import Link from '../../../../../s3d2/scripts/templates/common/Link';
import TextInput from '../../../../../s3d2/scripts/templates/common/inputs/TextInput';
import CheckboxWithLabel from '../../../../../s3d2/scripts/templates/components/filter/CheckboxWithLabel';
import { SEARCH_PARAMS_FILTER_PREFIX } from '../../../../../s3d2/scripts/constants';
import { parseSearchUrl } from '../../history';
import getConfig from '../../../../../s3d2/scripts/getConfig';
import { isMobile } from '../../../../../s3d2/scripts/helpers/helpers_s3d2';
import s3d2spriteIcon from '../../../../../s3d2/scripts/templates/spriteIcon';

function Filter(i18n, filterData = []) {
  const searchParams = parseSearchUrl(window.location);

  const CONFIG = getConfig();

  window.addEventListener('flats-loaded', data => {
    filterData.forEach(singleFilter => {
      const flats = { ...data.detail };

      let valuesForThisFitler = [
        ...new Set(
          Object.values(flats)
            .filter(flat => {
              if (singleFilter.ignoreParams) {
                return Object.entries(singleFilter.ignoreParams).every(
                  ([paramName, paramValue]) => {
                    return !paramValue.includes(flat[paramName]);
                  },
                );
              }
              if (singleFilter.innerParamsFilter) {
                return Object.entries(singleFilter.innerParamsFilter).every(
                  ([paramName, paramValue]) => {
                    return paramValue.includes(flat[paramName]);
                  },
                );
              }
              return true;
            })
            .map(flat => flat[singleFilter.paramaterByWhatWillBeFilter])
            .filter(value => value !== undefined && value !== null),
        ),
      ].sort((a, b) => a - b);
      const containerForThisFilter = document.querySelector(
        `[data-${
          singleFilter.id ? singleFilter.id : singleFilter.paramaterByWhatWillBeFilter
        }-container] .s3d-filter-checkboxes`,
      );

      if (singleFilter.wide || singleFilter.viewType === 'checkbox_with_label') {
        containerForThisFilter.classList.add('s3d-filter__checkbox__row--wide');
      }

      if (singleFilter.needTranslation) {
        containerForThisFilter.style.width = '100%';
        containerForThisFilter.style.flexWrap = 'wrap';
        containerForThisFilter.style.gap = '8px';
      }

      containerForThisFilter.innerHTML = valuesForThisFitler
        .sort((a, b) => a - b)
        .map(singleVlaue => {
          const isInitialyChecked =
            searchParams[
              `${SEARCH_PARAMS_FILTER_PREFIX}${singleFilter.paramaterByWhatWillBeFilter}_${singleVlaue}`
            ] == singleVlaue;

          if (singleFilter.viewType === 'checkbox_with_label') {
            return CheckboxWithLabel({
              name: singleFilter.paramaterByWhatWillBeFilter,
              checked: isInitialyChecked,
              value: singleVlaue,
              title: singleFilter.needTranslation
                ? i18n.t(singleFilter.translationNS + '' + singleVlaue)
                : singleVlaue,
              wide: singleFilter.needTranslation,
            });
          }
          return Checkbox({
            name: singleFilter.paramaterByWhatWillBeFilter,
            value: singleVlaue,
            checked: isInitialyChecked,
            title: singleFilter.needTranslation
              ? i18n.t(singleFilter.translationNS + '' + singleVlaue)
              : singleVlaue,
            wide: singleFilter.needTranslation,
          });
        })
        .join('');
    });
  });

  return `
  <div class="s3d-filter-wrap js-s3d-filter">
    <div class="s3d-filter__top-sticky">
      <div style="display:flex; justify-content: space-between; align-items: center; width: 100%">
        <div class="s3d-filter__title text-style-3-d-fonts-1920-h-2-regular">
          <span>${i18n.t('Filter.title')}</span>
        </div>
        ${$filterClose()}
      </div>
        <div class="s3d-filter__top-results" style="display:flex;justify-content:space-between;align-items: center; width: 100%;  margin: var(--space-5) 0;">
          <div class="text-gray-700 filter-subtitle">
            ${i18n.t('Filter.found')}
            <span class="js-s3d__amount-flat__num"></span>
            ${i18n.t('Filter.from')}
            <span class="js-s3d__amount-flat__num-all"></span>
          </div>

          ${Link({
            text: i18n.t('Filter.reset'),
            attributes: 'id="resetFilter" ',
            iconName: 'Trash',
          })}
        </div>
    </div>

    <div class="s3d-filter__top">


      <div class="s3d-filter">
        ${$ranges(i18n)}
        <div class="s3d-filter__input-wrapper">
          <div class="s3d-filter__param">
            <div class="s3d-filter__param-title filter-subtitle">${i18n.t(
              'Filter.Search by number',
            )}</div>
            ${TextInput({
              attributes: 'data-type="number" ',
              text: i18n.t('Filter.enterUnitNumber'),
              value: searchParams[`${SEARCH_PARAMS_FILTER_PREFIX}number`] || '',
            })}
            <!--<input data-type="number"  type="text" placeholder="Enter Unit Number">-->
          </div>
        </div>
        ${filterData
          .map(
            singleFilter => `
          <div class="s3d-filter__checkboxes-wrapper">
            <div class="s3d-filter__param">
              <div class="s3d-filter__param-title filter-subtitle">${i18n.t(
                singleFilter.title,
              )}</div>
              <div class="js-s3d-filter__checkboxes s3d-filter__checkbox__row" data-${
                singleFilter.id ? singleFilter.id : singleFilter.paramaterByWhatWillBeFilter
              }-container>
                <div class="s3d-filter-checkboxes s3d-filter__checkbox__row">
                </div>
              </div>
            </div>
          </div>
        `,
          )
          .join('')}
      </div>

    </div>
    <div class='s3d-filter__view-type-wrapper'>
      <div class="s3d-filter__view-type">
          <button data-switch-filter-view-type="card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5 4.5C4.72386 4.5 4.5 4.72386 4.5 5V10C4.5 10.2761 4.72386 10.5 5 10.5H10C10.2761 10.5 10.5 10.2761 10.5 10V5C10.5 4.72386 10.2761 4.5 10 4.5H5ZM5.5 9.5V5.5H9.5V9.5H5.5ZM5 13.5C4.72386 13.5 4.5 13.7239 4.5 14V19C4.5 19.2761 4.72386 19.5 5 19.5H10C10.2761 19.5 10.5 19.2761 10.5 19V14C10.5 13.7239 10.2761 13.5 10 13.5H5ZM5.5 18.5V14.5H9.5V18.5H5.5ZM13.5 5C13.5 4.72386 13.7239 4.5 14 4.5H19C19.2761 4.5 19.5 4.72386 19.5 5V10C19.5 10.2761 19.2761 10.5 19 10.5H14C13.7239 10.5 13.5 10.2761 13.5 10V5ZM14.5 5.5V9.5H18.5V5.5H14.5ZM14 13.5C13.7239 13.5 13.5 13.7239 13.5 14V19C13.5 19.2761 13.7239 19.5 14 19.5H19C19.2761 19.5 19.5 19.2761 19.5 19V14C19.5 13.7239 19.2761 13.5 19 13.5H14ZM14.5 18.5V14.5H18.5V18.5H14.5Z" />
              </svg>
          </button>
          <button data-switch-filter-view-type="list">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5.25293 6.25391H5.75293H18.2483H18.7483V7.25391H18.2483H5.75293H5.25293V6.25391ZM5.25293 11.5018H5.75293H18.2483H18.7483V12.5018H18.2483H5.75293H5.25293V11.5018ZM5.75293 16.7498H5.25293V17.7498H5.75293H18.2483H18.7483V16.7498H18.2483H5.75293Z" />
              </svg>
          </button>
        </div>
        <div class="s3d-filter__hide" id="hideFilter" data-hide-text="${i18n.t(
          'Filter.hide',
        )}" data-show-text="${i18n.t('Filter.show')}">
          <span>${i18n.t('Filter.show')}</span>
          ${s3d2spriteIcon('Chevron down')}
        </div>
        </div>
    <div class="s3d-filter__table js-s3d-filter__table">
      <div class="s3d-filter__head js-s3d-filter__head">
          <div class="s3d-filter__tr">
            <div class="s3d-filter__th--offset" data-sort="none"></div>
            <div class="s3d-filter__th" data-sort="floor">
              ${i18n.t('Filter.list.floor')}
              <svg class="s3d-sort__arrow" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.89319 1.63579L9.43974 2.2174L12.4395 5.40965L12.9531 5.9562L11.86 6.9834L11.3464 6.43685L9.64319 4.62433L9.64319 13.5L9.64319 14.25L8.14319 14.25L8.14319 13.5L8.14319 4.62433L6.43995 6.43685L5.92635 6.9834L4.83325 5.9562L5.34685 5.40965L8.34665 2.2174L8.89319 1.63579Z" fill="#6C7A88"/>
              </svg>
            </div>
            <div class="s3d-filter__th" data-sort="rooms">
              ${i18n.t('Filter.list.rooms')}
              <svg class="s3d-sort__arrow" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.89319 1.63579L9.43974 2.2174L12.4395 5.40965L12.9531 5.9562L11.86 6.9834L11.3464 6.43685L9.64319 4.62433L9.64319 13.5L9.64319 14.25L8.14319 14.25L8.14319 13.5L8.14319 4.62433L6.43995 6.43685L5.92635 6.9834L4.83325 5.9562L5.34685 5.40965L8.34665 2.2174L8.89319 1.63579Z" fill="#6C7A88"/>
              </svg>
            </div>
            <!--<div class="s3d-filter__th" data-sort="bathrooms">
              ${i18n.t('Filter.list.bathrooms')}
              <svg class="s3d-sort__arrow" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.89319 1.63579L9.43974 2.2174L12.4395 5.40965L12.9531 5.9562L11.86 6.9834L11.3464 6.43685L9.64319 4.62433L9.64319 13.5L9.64319 14.25L8.14319 14.25L8.14319 13.5L8.14319 4.62433L6.43995 6.43685L5.92635 6.9834L4.83325 5.9562L5.34685 5.40965L8.34665 2.2174L8.89319 1.63579Z" fill="#6C7A88"/>
              </svg>
            </div>-->
            <div class="s3d-filter__th" data-sort="area">
              ${i18n.t('Filter.list.area')} ${!isMobile() ? i18n.t('area_unit') : ''}
              <svg class="s3d-sort__arrow" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.89319 1.63579L9.43974 2.2174L12.4395 5.40965L12.9531 5.9562L11.86 6.9834L11.3464 6.43685L9.64319 4.62433L9.64319 13.5L9.64319 14.25L8.14319 14.25L8.14319 13.5L8.14319 4.62433L6.43995 6.43685L5.92635 6.9834L4.83325 5.9562L5.34685 5.40965L8.34665 2.2174L8.89319 1.63579Z" fill="#6C7A88"/>
              </svg>
            </div>
            <div class="s3d-filter__th" data-sort="price" style="display: ${
              CONFIG.show_prices ? '' : 'none'
            }">
              ${i18n.t('Filter.list.price')} ${i18n.t('currency_label')}
              <svg class="s3d-sort__arrow" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.89319 1.63579L9.43974 2.2174L12.4395 5.40965L12.9531 5.9562L11.86 6.9834L11.3464 6.43685L9.64319 4.62433L9.64319 13.5L9.64319 14.25L8.14319 14.25L8.14319 13.5L8.14319 4.62433L6.43995 6.43685L5.92635 6.9834L4.83325 5.9562L5.34685 5.40965L8.34665 2.2174L8.89319 1.63579Z" fill="#6C7A88"/>
              </svg>
            </div>
            <div class="s3d-filter__th" data-sort="price_m2" style="display: ${
              CONFIG.show_prices ? '' : 'none'
            }">
              ${i18n.t('Filter.list.price')} ${i18n.t('currency_label')} ${i18n.t('area_unit')}
              <svg class="s3d-sort__arrow" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.89319 1.63579L9.43974 2.2174L12.4395 5.40965L12.9531 5.9562L11.86 6.9834L11.3464 6.43685L9.64319 4.62433L9.64319 13.5L9.64319 14.25L8.14319 14.25L8.14319 13.5L8.14319 4.62433L6.43995 6.43685L5.92635 6.9834L4.83325 5.9562L5.34685 5.40965L8.34665 2.2174L8.89319 1.63579Z" fill="#6C7A88"/>
              </svg>
            </div>
            <div class="s3d-filter__th" data-sort="sale">
              ${i18n.t('Filter.list.status')}
              <svg class="s3d-sort__arrow" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.89319 1.63579L9.43974 2.2174L12.4395 5.40965L12.9531 5.9562L11.86 6.9834L11.3464 6.43685L9.64319 4.62433L9.64319 13.5L9.64319 14.25L8.14319 14.25L8.14319 13.5L8.14319 4.62433L6.43995 6.43685L5.92635 6.9834L4.83325 5.9562L5.34685 5.40965L8.34665 2.2174L8.89319 1.63579Z" fill="#6C7A88"/>
              </svg>
            </div>
            <div class="s3d-filter__th" data-sort="none">
              <!--${i18n.t('Filter.list.favourite--add')}-->
            </div>
            <div class="s3d-filter__th--offset" data-sort="none"></div>
          </div>
        </div>
      <table>
        <colgroup>
          <col>
          <col span="5" > <!-- С помощью этой конструкции задаем цвет фона для первых двух столбцов таблицы-->
          <col>
        </colgroup>
        <tbody class="s3d-filter__body js-s3d-filter__body"></tbody>
      </table>
    </div>
    <div class="s3d-filter__grid js-s3d-filter__grid">
    </div>
    <!--${$amountFlat(i18n)}-->
  </div>
  <div class="s3d-filter-desktop-infobox" data-s3d-table-infobox>
    <img src="#" alt="infobox">
  </div>
`;
}

function checkboxItem(name, value, title, wide) {
  return `
    <div class="s3d-filter__checkbox ${wide ? 's3d-filter__checkbox--wide-buttons' : ''}" ${
    wide ? 'style="margin:0"' : ''
  }>
      <input type="checkbox" data-type="${name}" data-${name}="${value}" id="${name}-${value}">
      <label class="s3d-filter__checkbox--label" for="${name}-${value}">${title}</label>
    </div>
  `;
}

export default Filter;
