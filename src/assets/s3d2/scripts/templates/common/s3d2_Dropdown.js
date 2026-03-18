import s3d2spriteIcon from '../spriteIcon';

/**
 * Represents a dropdown component.
 * @param {Array<{active: Boolean, attributes: String, className: String, title: String}>} data - The data for the dropdown items.
 * @param {Object} i18n - The internationalization object.
 * @param {string} attributes - Additional attributes for the dropdown element.
 * @returns {string} The HTML string representing the dropdown component.
 */
export default function s3d2_Dropdown(
  data = [],
  title = '',
  iconName = '',
  attributes = '',
  className = '',
) {
  return `
  <div class="s3d2-Dropdown ${className}" ${attributes}>
    <div class="s3d2-Dropdown__title"><span>${title}</span> ${s3d2spriteIcon(iconName, className)}</div>
      <div class="s3d2-Dropdown__content">
        ${data
          .map(item => {
            return `<button ${item.attributes} class="s3d2-Dropdown__item ${item.className}">${item.title}</button>`;
          })
          .join('')}
      </div>
    </div>`;
}
