import { showOnMobile } from '../../../../../s3d2/scripts/helpers/helpers_s3d2';
import s3d2spriteIcon from '../../../../../s3d2/scripts/templates/spriteIcon';
import planningFilterMobBtn from '../filter/$planningFilterMobBtn';
import ButtonIconLeft from '../../../../../s3d2/scripts/templates/common/ButtonIconLeft';
import s3d2_FilterButton from '../../../../../s3d2/scripts/templates/common/s3d2_FilterButton';

function Plannings(i18n) {
  function setupToggleButtons() {
    console.log('TEST');
    const buttons = document.querySelectorAll('.js-btn-toggle-pl'); // Все кнопки с классом .js-btn-toggle-pl
    const bgElement = document.querySelector('.s3d-pl__toggle-list-buttons-bg'); // Элемент для изменения свойства left
    const listElement = document.querySelector('.s3d-pl__list, .js-s3d-pl__list'); // Элемент списка, куда будем добавлять классы

    console.log(bgElement);

    if (!bgElement || !listElement) return;

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        // Убираем класс active у всех кнопок
        buttons.forEach(btn => btn.classList.remove('active'));

        // Добавляем класс active на ту кнопку, по которой кликнули
        button.classList.add('active');

        // Меняем свойство left у bgElement
        if (bgElement.style.left === '90px') {
          bgElement.style.left = '0'; // Если было 90px, то делаем 0
        } else {
          bgElement.style.left = '90px'; // Если было 0, то делаем 90px
        }

        // Получаем значение data-type у активной кнопки
        const dataType = button.getAttribute('data-type');
        listElement.classList.remove('list');
        listElement.classList.remove('cards');
        // Добавляем новый класс на основе data-type кнопки
        if (dataType) {
          listElement.classList.add(dataType);
        }
      });
    });
  }

  setTimeout(setupToggleButtons, 0);

  return `
  <div class="js-s3d__wrapper__plannings s3d__wrap s3d__wrapper__plannings" id="js-s3d__plannings">
    <div class="s3d-pl">
    ${s3d2_FilterButton(i18n.t('ctr.menu.btn.filter'), "s3d2-filter-call-button--mobile")}
      <!--<div class="s3d-pl__amount-flat">${i18n.t(
        'Plannings.found',
      )}&nbsp;<span class="s3d-pl__amount-flat__num js-s3d__amount-flat__num"></span>&nbsp;${i18n.t(
    'Plannings.found--from',
  )}&nbsp;<span class="s3d-pl__amount-flat__num js-s3d__amount-flat__num-all"></span>&nbsp;${i18n.t(
    'Plannings.found-flats',
  )}</div>-->
    
      <div class="s3d-pl__container" data-plannings-info-container>
        <div class="s3d-pl__container-pending">
          <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
        </div>
        <div class="s3d-pl__not-found js-s3d-pl__not-found">
          <div class="s3d-pl__not-found-top">
            ${s3d2spriteIcon('Warning')}
            ${i18n.t('Plannings.found')}&nbsp;
            <span class="s3d-pl__amount-flat__num js-s3d__amount-flat__num"></span>
            &nbsp;${i18n.t(
              'Plannings.found--from',
            )}&nbsp;<span class="s3d-pl__amount-flat__num js-s3d__amount-flat__num-all"></span>&nbsp;${i18n.t(
    'Plannings.found-flats',
  )}
          </div>
          <div class="s3d-pl__not-found-bottom">
            ${i18n.t('Plannings.notFound')}
          </div>
        </div>
        ${showOnMobile(`
              <div class="s3d-pl__mobile-results js-s3d-pl__found">
                <div class="text-style-3-d-fonts-1920-h-2-regular text-gray-900">
                  ${i18n.t('Filter.title')}
                </div>
                <div class="text-style-3-d-fonts-1920-body-regular text-gray-700">
                  ${i18n.t('Plannings.found')}&nbsp; 
                  <span class="js-s3d__amount-flat__num">77</span> 
                  ${i18n.t(
                    'Plannings.found--with',
                  )}
                  <span class="js-s3d__amount-flat__num-all">77</span>
                </div>
              </div>
            `)}
        <div class="s3d-pl__toggle-list">
          <div>${i18n.t('Plannings.toggle-title')}</div>
          <div class="text-style-3-d-fonts-1920-body-regular text-gray-700 s3d-pl__toggle-list-mobile-amount">
            ${i18n.t('Plannings.found')}&nbsp;
            <span class="js-s3d__amount-flat__num">77</span> 
            ${i18n.t(
              'Plannings.found--with',
            )}
            <span class="js-s3d__amount-flat__num-all">77</span>
          </div>
          <div class="s3d-pl__toggle-list-buttons">
            <div class="s3d-pl__toggle-list-buttons-bg"></div>
            ${ButtonIconLeft(
              'js-btn-toggle-pl active',
              'data-type="cards"',
              i18n.t('Plannings.toggle-title-btn-cards'),
              'pl-cards',
              '',
            )}
            ${ButtonIconLeft(
              'js-btn-toggle-pl',
              'data-type="list"',
              i18n.t('Plannings.toggle-title-btn-list'),
              'pl-list',
              '',
            )}
          </div>
        </div>
        <div class="s3d-pl__list js-s3d-pl__list"></div>
      </div>
      <div class="s3d-pl__filter-container" data-plannings-filter-container></div>
     ${planningFilterMobBtn(i18n)}
    </div>
  </div>`;
}

export default Plannings;
