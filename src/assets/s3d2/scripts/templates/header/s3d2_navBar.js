import { hideElementsAttribute } from '../../../../s3d/scripts/features/hideElementsOnPages';
import getConfig from '../../getConfig';
import Dropdown from '../common/Dropdown';
import s3d2spriteIcon from '../spriteIcon';
import s3d2_Dropdown from '../common/s3d2_Dropdown';
import s3d2_BackButton from '../common/s3d2_BackButton';
import s3d2_ButtonWithoutIcon from '../common/s3d2_ButtonWithoutIcon';

export function defineFlybyDropdownData(config, e = { detail: {} }, i18n) {
  console.log('WINDOW HISTORY', window.history);
  const history = window.history;
  let prevType = '';
  let prevFlyby = '';
  let prevSide = '';
  if (history.prevState && history.prevState.type === 'flyby' && e.detail.type === 'flat') {
    prevType = history.prevState.type;
    prevFlyby = history.prevState.flyby;
    prevSide = history.prevState.side;
  }

  window.addEventListener('updateFsm', evt => {
    const button = document.querySelector('[data-history-back-button]');
    const history = evt.detail.s3dHistory;

    if (history.s3dHistory.length > 1) {
      button.removeAttribute('disabled');
    } else {
      button.setAttribute('disabled', '');
    }

    button.onclick = () => {
      if (history.s3dHistory.length >= 1) {
        window.history.go(-1);
      }
    };
  });

  return Object.entries(config.flyby).reduce((acc, [flyby, flybyData]) => {
    Object.entries(flybyData).map(([side, sideData]) => {
      const isMatchCurrentHistoryState =
        e.detail.type === 'flyby' && e.detail.flyby === flyby && e.detail.side === side;
      const isMatchPrevHistoryState =
        prevType === 'flyby' && prevFlyby === flyby && prevSide === side;

      acc.push({
        attributes: `data-flyby="${flyby}" data-side="${side}" data-type="flyby"`,
        className: isMatchPrevHistoryState
          ? 'js-s3d-nav__btn active-because-prev-history-is-flyby'
          : 'js-s3d-nav__btn',
        title: i18n.t(`ctr.nav.flyby_${flyby}_${side}`),
        active: isMatchCurrentHistoryState ? 'highlighted' : '',
      });
    });
    return acc;
  }, []);
}

export const FLYBY_DROPDOWN_ATTRIBUTES = 'data-s3d2-header-flyby-dropdown';
export default function s3d2_navBar(i18n, { logo }) {
  const FLOOR_PLAN_GROUP = 'data-header-floor-plan-group';
  const FLAT_PLAN_GROUP = 'data-header-flat-plan-group';
  const config = getConfig();

  document.body.addEventListener('click', e => {
    const target = e.target.closest('.s3d2-header__hide-block-opener');
    if (!target) return;
    const block = document.querySelector('.s3d2-header__hide-block');
    const opener = document.querySelector('.s3d2-header__hide-block-opener');
    block.classList.toggle('active');
    opener.classList.toggle('active');
    if (block.classList.contains('active')) {
      gsap
        .timeline()
        .fromTo(
          Array.from(block.children),
          {
            opacity: 1,
          },
          {
            opacity: 0,
            stagger: -0.1,
            duration: 0.1,
          },
        )
        // .to(block, {
        //   duration: 0.15
        //   // duration: 0.13,
        // },'<')

        .to(block, {
          width: 0,
          autoAlpha: 0,
          // autoAlpha: 0,
          ease: 'power4.out',
          duration: 0.15,
          clearProps: 'all',
        })
        .set(block, {
          display: 'none',
        });
    } else {
      gsap
        .timeline()
        .set(block, {
          display: '',
        })
        .fromTo(
          Array.from(block.children),
          {
            autoAlpha: 0,
          },
          {
            autoAlpha: 1,
            stagger: 0.1,
            duration: 0.15,
          },
          '<',
        );
    }
  });

  const dataForFlybyDropdown = defineFlybyDropdownData(config, undefined, i18n);

  // window.addEventListener('updateFsm', e => {
  //   const dataForFlybyDropdown = defineFlybyDropdownData(config, e, i18n);
  //   const history = window.history;
  //   let prevType = '';
  //   if (history.prevState && history.prevState.type === 'flyby' && e.detail.type === 'flat') {
  //     prevType = history.prevState.type;
  //   }
  //   const isCurrentStateIsFlatAndPrevIsFlyby = prevType === 'flyby' && e.detail.type === 'flat';

  //   document
  //     .querySelector(`[${FLYBY_DROPDOWN_ATTRIBUTES}]`)
  //     .insertAdjacentHTML(
  //       'afterend',
  //       Dropdown(
  //         dataForFlybyDropdown,
  //         i18n,
  //         FLYBY_DROPDOWN_ATTRIBUTES,
  //         e.detail.type === 'flyby' || isCurrentStateIsFlatAndPrevIsFlyby ? 'highlighted' : '',
  //       ),
  //     );
  //   document.querySelector(`[${FLYBY_DROPDOWN_ATTRIBUTES}]`).remove();

  //   e.detail.type === 'plannings'
  //     ? document.querySelector('[data-s3d2-header-plannings]').classList.add('highlighted')
  //     : document.querySelector('[data-s3d2-header-plannings]').classList.remove('highlighted');

  //   const headerApartmentButton = document.querySelectorAll(`[${FLAT_PLAN_GROUP}]`);
  //   const headerFloorButton = document.querySelectorAll(`[${FLOOR_PLAN_GROUP}]`);
  //   const headerFlybyDropdown = document.querySelectorAll(`[${FLYBY_DROPDOWN_ATTRIBUTES}]`);

  //   headerApartmentButton.forEach(
  //     el => (el.style.display = /flat/.test(e.detail.type) ? '' : 'none'),
  //   );
  //   headerFloorButton.forEach(
  //     el => (el.style.display = /floor|flat/.test(e.detail.type) ? '' : 'none'),
  //   );
  //   headerFlybyDropdown.forEach(
  //     el => (el.style.display = /genplan/.test(e.detail.type) ? 'none' : ''),
  //   );
  //   if (e.detail.type === 'flat') {
  //     const flat = e.detail.getFlat(e.detail.id);
  //     const { floor, build, section } = flat;
  //     headerFloorButton.forEach(el => {
  //       el.dataset.floor = floor;
  //       el.dataset.build = build;
  //       el.dataset.section = section;
  //     });
  //   }
  // });

  const $logo = logo
    ? `<img src="${logo}" alt="logo">`
    : `
    <svg  width="80" height="28" viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_1602_32828)">
      <path d="M50.0157 9.39762C50.0157 7.10431 50.0257 4.80988 50.0068 2.51657C50.0035 2.14151 50.1046 2.02967 50.4635 2.05452C50.8868 2.08389 51.3157 2.08502 51.7391 2.05339C52.0868 2.02741 52.1702 2.14942 52.1679 2.49285C52.1524 4.37268 52.1724 6.25364 52.1513 8.13347C52.1468 8.52435 52.2379 8.6441 52.6335 8.64071C54.909 8.62151 57.1846 8.61812 59.4602 8.64184C59.8835 8.64636 59.9268 8.48707 59.9235 8.12557C59.9068 6.28301 59.9335 4.44046 59.9035 2.59791C59.8957 2.13247 60.0435 2.02063 60.4602 2.05339C60.8646 2.08615 61.2746 2.07599 61.6801 2.05565C61.9613 2.04209 62.0679 2.12004 62.0679 2.42845C62.0579 7.07268 62.0568 11.7169 62.0635 16.36C62.0635 16.6605 61.9624 16.7531 61.6757 16.7396C61.2513 16.7204 60.8235 16.7113 60.4001 16.7452C60.0013 16.7769 59.9046 16.6244 59.9079 16.2357C59.9257 14.1672 59.9013 12.0987 59.9279 10.0314C59.9335 9.56368 59.8168 9.43603 59.3513 9.44168C57.1313 9.46766 54.9113 9.46879 52.6913 9.44055C52.2268 9.4349 52.1479 9.59645 52.1513 10.0156C52.1691 12.0841 52.1457 14.1526 52.1702 16.2199C52.1757 16.6582 52.0435 16.7859 51.6379 16.7396C51.1113 16.6797 50.4057 16.9757 50.1013 16.6176C49.8413 16.3114 50.0179 15.6155 50.0168 15.0925C50.0135 13.1957 50.0157 11.2967 50.0157 9.39762Z" fill="#1A1E21"/>
      <path d="M40.3401 8.58428C41.4723 8.87462 42.4401 9.27679 43.219 10.0484C45.1379 11.9497 44.7057 15.0507 42.3423 16.3318C41.169 16.9678 39.8912 17.1373 38.5857 17.1486C37.3457 17.1599 36.1057 17.1396 34.8657 17.1554C34.5412 17.1599 34.4235 17.0921 34.4246 16.7261C34.439 11.9858 34.4346 7.24671 34.4379 2.50646C34.4379 2.30424 34.3412 2.04441 34.7301 2.05909C36.2446 2.11558 37.7646 1.94048 39.2735 2.19579C39.7868 2.28278 40.2823 2.42964 40.749 2.66349C41.8479 3.21365 42.5035 4.07675 42.5568 5.35106C42.6123 6.66491 42.0379 7.6229 40.929 8.26797C40.7712 8.35947 40.6079 8.44081 40.3401 8.58428ZM38.739 8.62495C40.1023 8.04767 40.6023 7.01173 40.4923 5.1737C40.4135 3.86663 39.8112 3.19332 38.5457 2.96738C38.0301 2.87474 37.5123 2.92106 36.9968 2.89056C36.6901 2.87248 36.6279 3.00466 36.629 3.2837C36.6346 7.49524 36.6357 11.7079 36.6268 15.9195C36.6257 16.2132 36.709 16.3137 37.0023 16.3036C37.5568 16.2821 38.1146 16.325 38.6668 16.2911C39.7912 16.22 40.8212 15.9161 41.5101 14.9095C42.399 13.6104 42.3779 10.8686 40.729 9.6496C40.1423 9.21579 39.5023 8.91077 38.739 8.62495Z" fill="#1A1E21"/>
      <path d="M22.2525 17.4401C18.1614 17.4401 15.1991 14.6542 14.7825 10.8934C14.5125 8.45438 14.928 6.19157 16.5091 4.2835C18.2514 2.17998 20.5303 1.36885 23.1725 1.90659C25.8536 2.45224 27.5847 4.20329 28.4236 6.79935C29.228 9.28697 29.0436 11.7441 27.7136 14.025C26.388 16.2968 24.348 17.3666 22.2525 17.4401ZM26.6736 9.72078C26.6636 8.14936 26.4447 6.71011 25.7869 5.37028C25.2236 4.22362 24.4247 3.30969 23.2036 2.87023C21.1503 2.12915 19.0369 2.94366 17.9669 5.07655C16.4514 8.09852 16.468 11.2063 18.0136 14.2181C18.7903 15.7308 20.0925 16.5928 21.8414 16.5691C23.588 16.5453 24.7936 15.6201 25.628 14.1334C26.4114 12.7405 26.6491 11.2109 26.6736 9.72078Z" fill="#1A1E21"/>
      <path d="M1.00098 15.0203C2.43098 16.002 3.94098 16.6188 5.68653 16.5364C7.15209 16.4675 8.24209 15.7072 8.50653 14.5266C8.71875 13.5788 8.45431 12.7451 7.85542 12.0085C7.17653 11.1725 6.30542 10.5636 5.45542 9.931C4.44209 9.17636 3.3932 8.46577 2.48987 7.56991C1.81431 6.89999 1.30542 6.13631 1.19764 5.14556C1.04542 3.74359 1.60431 2.56983 2.84098 1.90895C4.46209 1.04246 6.17764 1.02552 7.91209 1.47062C8.44764 1.60845 8.50098 2.19928 8.76987 2.58564C8.79098 2.61614 8.77875 2.70765 8.75098 2.73137C8.62209 2.84096 8.5132 2.73589 8.39875 2.68167C7.46098 2.24221 6.48542 2.00158 5.44431 2.07501C5.05209 2.10326 4.67431 2.1846 4.31431 2.33372C2.99542 2.8805 2.62875 4.27568 3.49875 5.42686C4.02542 6.12502 4.74431 6.5961 5.44431 7.08527C6.61653 7.90543 7.81875 8.68267 8.87987 9.65648C10.0488 10.7286 10.781 11.9983 10.6288 13.6647C10.501 15.0779 9.7932 16.1071 8.53987 16.6957C6.42542 17.6887 4.27987 17.6096 2.13431 16.7657C1.98764 16.7081 1.87764 16.6177 1.8032 16.4833C1.53431 15.9964 1.26875 15.5083 1.00098 15.0203Z" fill="#1A1E21"/>
      <path d="M73.0948 1.67505C73.5693 2.84881 74.0081 3.93333 74.4459 5.01898C76.0059 8.88823 77.5604 12.7608 79.1348 16.6256C79.3148 17.0673 79.2693 17.2074 78.7815 17.1577C78.1982 17.0989 77.4826 17.3768 77.0615 17.0447C76.667 16.7329 76.5715 16.028 76.3526 15.4913C76.0415 14.7299 75.7182 13.9719 75.4404 13.1969C75.3082 12.8286 75.1381 12.6818 74.7304 12.6897C73.1404 12.7179 71.5493 12.7123 69.9581 12.6931C69.6126 12.6885 69.4415 12.7834 69.3126 13.1246C68.8604 14.3131 68.3504 15.4789 67.9026 16.6696C67.7592 17.0515 67.5726 17.1848 67.1792 17.1577C66.8604 17.1351 66.8659 17.047 66.9715 16.7883C67.577 15.3185 68.167 13.8408 68.7604 12.3666C70.1426 8.93003 71.5237 5.49346 72.9059 2.05802C72.9459 1.95973 72.9993 1.86823 73.0948 1.67505ZM72.3626 5.58157C71.5248 7.65459 70.7215 9.62706 69.9315 11.604C69.8126 11.9023 70.0615 11.8334 70.2137 11.8345C71.3615 11.8367 72.5093 11.8379 73.6559 11.839C74.8882 11.8401 74.8904 11.839 74.4181 10.6686C73.7481 9.00798 73.0759 7.34731 72.3626 5.58157Z" fill="#1A1E21"/>
      <path d="M32.5003 27.0482H31.9448C31.9448 27.0482 31.811 26.8077 31.7414 26.7014C31.6541 26.5687 31.4144 26.2089 31.4144 26.2089C31.4144 26.2089 31.3092 26.21 31.1948 26.2089C30.9812 26.2067 30.6114 26.201 30.6114 26.201C30.6114 26.201 30.6114 26.4702 30.6114 26.6529C30.6114 26.8788 30.6114 26.8223 30.6114 27.0482C30.4851 27.0452 30.2225 27.0482 30.1114 27.0482C30.0937 26.8135 30.095 26.7633 30.0937 26.6653C30.0859 25.9151 30.1014 25.1639 30.0837 24.4138C30.0804 24.2737 30.0961 24.1739 30.1476 24.111C30.2019 24.0445 30.2962 24.0192 30.4503 24.0308C30.8725 24.0613 31.3003 23.9901 31.7181 24.0929C32.5014 24.2872 32.7959 25.2102 32.2226 25.7491C32.1079 25.8571 31.9848 26.0315 31.9848 26.0315C31.9848 26.0315 32.1217 26.3626 32.2637 26.5896C32.3386 26.7093 32.5003 27.0482 32.5003 27.0482ZM31.0714 24.4962C30.8966 24.4962 30.6114 24.5064 30.6114 24.5064C30.6114 24.5064 30.6114 24.7323 30.6114 24.8453C30.6114 25.0756 30.6114 25.6926 30.6114 25.6926C30.6114 25.6926 30.8724 25.6992 31.1114 25.6926C31.8892 25.6926 32.0003 25.5525 31.9848 25.1198C31.9648 24.5493 31.5526 24.5064 31.0714 24.4962Z" fill="#1A1E21"/>
      <path d="M35.7925 24.1526V24.5796H34.2365V25.3483H35.6805V25.759H34.2365V26.6131H35.8165V27.0483H33.7405V24.1526H35.7925Z" fill="#1A1E21"/>
      <path d="M38.484 24.1484L39.584 27.0482H39.048L38.776 26.2795H37.648L37.368 27.0482H36.852L37.952 24.1484H38.484ZM38.644 25.8972L38.22 24.6771L37.776 25.8972H38.644Z" fill="#1A1E21"/>
      <path d="M42.72 26.609V27.0483H40.768V24.1526H41.272V26.609H42.72Z" fill="#1A1E21"/>
      <path d="M45.6657 24.1526V24.5918H44.7577V27.0483H44.2577V24.5918H43.3497V24.1526H45.6657Z" fill="#1A1E21"/>
      <path d="M49.2328 24.1526L48.1608 25.8973V27.0483H47.6688V25.8973L46.5928 24.1526H47.1688L47.9248 25.4337L48.6728 24.1526H49.2328Z" fill="#1A1E21"/>
      </g>
      <defs>
      <clipPath id="clip0_1602_32828">
      <rect width="80" height="27" fill="white" transform="translate(0 0.5)"/>
      </clipPath>
      </defs>
    </svg>
  `;

  return `
    <header class="s3d2-header" ${hideElementsAttribute(['intro'])}>
      <a class="s3d2-header__logo" href="3d/?&favourites=&type=flyby&flyby=1&side=outside">
        ${$logo}
      </a>

      <div class="nav-container">
        ${s3d2_ButtonWithoutIcon(
          'js-s3d-nav__btn',
          'data-type="plannings" data-s3d2-header-plannings',
          i18n.t('ctr.nav.availability'),
        )}
        ${s3d2_ButtonWithoutIcon(
          'js-s3d-nav__btn',
          `data-type="floor" ${FLOOR_PLAN_GROUP}`,
          i18n.t('ctr.nav.level'),
        )}
      </div>

      <div class="nav-container">
        ${
           `<button class="s3d2-header__nav-button js-s3d-nav__btn" data-type="flyby" data-flyby="1" data-side="outside">
          ${i18n.t('ctr.nav.fisher_island')}
          </button>`
           
        }
        ${s3d2_Dropdown(
          dataForFlybyDropdown,
          `${i18n.t('ctr.nav.mansion')}`,
          'Chevron down',
          FLYBY_DROPDOWN_ATTRIBUTES,
          'chevron-down',
        )}
        <button class="s3d2-header__nav-button js-s3d-nav__btn" data-type="flat" ${FLAT_PLAN_GROUP}>
            ${i18n.t('ctr.nav.mansion')}
        </button>
      </div>
      ${s3d2_BackButton()}
    </header>
  `;
}
