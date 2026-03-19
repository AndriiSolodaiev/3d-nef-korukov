import $projectLogo from '../../../../../s3d/scripts/modules/templates/$projectLogo';
import { numberWithCommas } from '../../../helpers/helpers_s3d2';
import s3d2spriteIcon from '../../spriteIcon';

/**
 * Renders an SVG flyby tooltip.
 *
 * @param {object} i18n - Translation
 * @param {number} x - The x-coordinate of the tooltip.
 * @param {number} y - The y-coordinate of the tooltip.
 * @param {string} flyby - The flyby value.
 * @param {string} side - The side value.
 * @param {number} flatsFilteredCountInFlyby - The count of filtered flats in the flyby.
 * @param {string} rightTitle1 - title on right side of tooltip
 * @param {string} rightTitle2 - title on right side of tooltip
 * @returns {string} - The rendered SVG flyby tooltip.
 */
export default function SvgFlybyTooltip({
  i18n,
  x,
  y,
  flyby,
  side,
  flatsFilteredCountInFlyby,
  id,
  flatsFilteredCountInFlybyPostfix,
  totalFlatsInFlyby,
  rightTitle1 = '',
  rightTitle2 = '',
  finishDate,
  title,
}) {
  const $finishDate = finishDate
    ? `<div class="SvgFlybyTooltip__bottom-item">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M2.5 0.5H3H3.5H4.5H5H5.5V1.5H5H4.5V2.5H12H15H15.5V3.5H15H12.5V4.5H14H14.5V5V8V8.5H14H10H9.5V8V5V4.5H10H11.5V3.5H4.5V14.5H6H6.5V15.5H6H4.5H3.5H2H1.5V14.5H2H3.5V3.5H1H0.5V2.5H1H3.5V1.5H3H2.5V0.5ZM10.5 5.5V7.5H13.5V5.5H12H10.5Z" fill="#AEBECC"/>
    </svg>
    ${finishDate}
  </div>`
    : '';

  return `
    <foreignObject class="s3d2-svg-flyby-tooltip"  x="${x}" y="${y}"  width="250" height="160" data-build-flat-count-element data-id="${id}">
      <!--<div xmlns="http://www.w3.org/1999/xhtml" class="SvgFlybyTooltip">

          <div class="SvgFlybyTooltip__title">${title}</div>
          <div class="SvgFlybyTooltip__bottom">
            
            <div class="SvgFlybyTooltip__bottom-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M0.5 1.49988H1H6.66667H15H15.5V1.99988V7.53834V8.03834H15H14.1667V13.9999V14.4999H13.6667H4.5H4V13.9999V11.423H1H0.5V10.923V1.99988V1.49988ZM5 11.423V13.4999H13.1667V8.03834H12H11.5V7.03834H12H13.6667H14.5V2.49988H7.16667V3.99988V4.49988H6.16667V3.99988V2.49988H1.5V10.423H4.5H6.16667V7.99988V6.92296V6.42296H7.16667V6.92296V7.49988H9H9.5V8.49988H9H7.16667V10.923V11.423H6.66667H5Z" fill="#AEBECC"/>
              </svg>
              ${i18n.t('infobox.available')}}
              ${totalFlatsInFlyby} 
            </div>
            ${$finishDate}
          </div>
          <div class="SvgFlybyTooltip__right">
            <div class="SvgFlybyTooltip__right-item">${numberWithCommas(rightTitle1)}</div>
            <div class="SvgFlybyTooltip__right-item">${numberWithCommas(rightTitle2)}</div>
          </div>
          
      </div>-->
      ${
        flatsFilteredCountInFlyby === 0 || flatsFilteredCountInFlyby === totalFlatsInFlyby
          ? ''
          : `<div class="SvgFlybyTooltip-filter-part">${i18n.t('infoBox.filter_results', {
              count: flatsFilteredCountInFlyby,
            })}</div>`
      }
    </foreignObject>
  `;
}
