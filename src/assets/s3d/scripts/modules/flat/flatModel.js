import $ from 'jquery';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Fancybox } from '@fancyapps/ui/dist/fancybox/';
import Toastify from 'toastify-js';
import get from 'lodash/get';
import size from 'lodash/size';
import PinchZoom from 'pinch-zoom-js';
import magnificPopup from 'magnific-popup';
import addAnimateBtnTabs from '../animation';
import EventEmitter from '../eventEmitter/EventEmitter';
import { preloader } from '../general/General';
import asyncRequest from '../async/async';
import CreateFlat from '../templates/flatPage/flat';
import createFloorSvg from '../templates/floorSvg';
import getFloor from '../getFloor';
import sendError from '../sendError';
import { Swiper, Navigation } from 'swiper';
import { BehaviorSubject } from 'rxjs';
import { deviceType } from 'detect-it';
import { htmlZoom } from '../../../../s3d2/scripts/features/html-zoom';
import dispatchTrigger from '../helpers/triggers';
import {
  isDesktop,
  isDesktopTouchMode,
  isMobile,
  isTablet,
} from '../../../../s3d2/scripts/helpers/helpers_s3d2';

import isObject from 'lodash/isObject';
import debounce from 'lodash/debounce';
import has from 'lodash/has';
import Villa from '../templates/flatPage/villa/villa';
import { FLAT_GALLERY_FANCYBOX } from '../../../../s3d2/scripts/constants';
import { isJson } from '../helpers/helpers';
import {
  SMARTO_TOURS_CONTAINER_SELECTOR,
  SMARTO_TOURS_V3_CONTAINER_SELECTOR,
} from '../../../../s3d2/scripts/modules/AudioAssistant/smartoToursSelectors';
import InstallmentCalculator from './installmentCalculator/installmentCalculator';

const ErrorCallbackUpdateLocation = (i18n, hostname, keyMessage, type = '', newLocation) => err => {
  sendError(i18n, hostname, keyMessage, type, err);
  // errorPopup.setType('withTranslate');
  // errorPopup.open(keyMessage, () => {
  //   location.href = newLocation;
  // });
};
const { origin, pathname, search } = location;

class FlatModel extends EventEmitter {
  constructor(config, i18n) {
    super();
    this.type = config.type;
    this.unit_statuses = config.unit_statuses;
    this.generalWrapId = config.generalWrapId;
    this.labelsToShowInInfoBlock = config.labelsToShowInInfoBlock;
    this.activeFlat = config.activeFlat;
    this.hoverData$ = config.hoverData$;
    this.getFavourites = config.getFavourites;
    this.updateFavourites = config.updateFavourites;
    this.getFlat = config.getFlat;
    this.flatList;
    this.flatList = config.flatList;
    this.updateFsm = config.updateFsm;
    this.floorList$ = config.floorList$;
    this.i18n = i18n;
    this.history = config.history;
    this.favouritesIds$ = config.favouritesIds$;
    this.createWrap();
    this.wrapper = document.querySelector(`.js-s3d__wrapper__${this.type}`);
    this.imagesType = '';
    this.imagesViewType = '';
    this.configProject = this.createConfigProject();
    this.cacheFloor = config.cacheFloor;
    this.g_InfoBox = config.infoBox;
    this.g_currentPage$ = config.currentPage$;
    this.defaultExplicationState = {
      floor: 1,
      type: '2d',
    };
    this.changeZoomButtonsState = this.changeZoomButtonsState.bind(this);
    this.debouncedChangeZoomButtonsState = debounce(this.changeZoomButtonsState, 300);
    this.projectDocs = config.projectDocs;
    this.financialTermsData = config.financialTermsData;
    this.g_constructionProgressData = config.constructionProgressData;
    this.constructionProgressDataList = config.constructionProgressDataList;
    this.exteriorData = config.exteriorData;
    this.explicationState$ = new BehaviorSubject({ ...this.defaultExplicationState });
    this.show_prices = config.show_prices;
    this.floor_page_settings = config.floor_page_settings;
    this.viewType = config.viewType || 'flat';
    this.modalManager = config.modalManager;
    this.social_media_links = config.social_media_links;
    this.manager_info = config.manager_info;
    this.g_contacts = config.g_contacts;
    this.show_phoneNumber = config.show_phoneNumber;
    this.g_contact_advantaged_list = config.g_contact_advantaged_list;
    this.project_google_map_location = config.project_google_map_location;
    this.faq_questions = config.faq_questions || [];
    this.progress_photos = config.progress_photos || [];
    this.brands_list = config.brands_list || [];
    this.payment_list = config.payment_list || [];
    this.contact_block_variant = config.contact_block_variant || '1';

    this.explicationState$.subscribe(state => {
      this.emit('updateExplicationFloorTitle', state);
    });
    this.explicationState$.subscribe(state => {
      const flat = this.getFlat(this.activeFlat);
      if (!flat) return;

      const type = state.type === '2d' ? 'without' : 'with';

      let image = get(flat, `flat_levels_photo[${state.floor}][${type}]`, '');

      if (!image && flat.flat_levels_photo) {
        const levels = Object.keys(flat.flat_levels_photo);
        if (levels.length > 0) {
          image = flat.flat_levels_photo[levels[0]][type];
        }
      }

      if (image) {
        this.emit('updateExplicationImage', image);
      }
    });

    this.explicationState$.subscribe(state => {
      const properties = get(this.getFlat(this.activeFlat), 'properties', {});
      const propertiesOfCurrentFloor = Object.values(properties).filter(
        prop => prop.property_level == state.floor,
      );
      this.emit('updateFloorProperties', propertiesOfCurrentFloor);
    });
    this.explicationState$.subscribe(state => {
      const isCurrentFloorHas3dImage = get(
        this.getFlat(this.activeFlat),
        `flat_levels_photo[${state.floor}].with`,
        false,
      );
      this.emit('updateExplication2d3dBtnVisibility', isCurrentFloorHas3dImage);
    });

    this.wrapper.addEventListener('click', event => {
      const target = event.target.closest('.js-s3d-card');
      if (!target) return;
      if (
        event.target.closest('.js-s3d-add__favourite') ||
        event.target.closest('[data-show-flat-in-flyby]')
      ) {
        return;
      }
      const id = target.dataset.id;
      this.activeFlat = id;
      this.updateFsm({ type: 'flat', id });
    });
    this.wrapper.addEventListener('click', event => {
      const target = event.target.closest('.js-s3d-svg__build[data-type="flat"]');
      if (!target) return;
      const id = target.dataset.id;
      this.activeFlat = id;
      this.updateFsm({ type: 'flat', id });
    });
    this.wrapper.addEventListener(`click`, evt => {
      const target = evt.target.closest(`[${FLAT_GALLERY_FANCYBOX}]`);
      if (!target) return;
      const gallery = get(this.getFlat(this.activeFlat), 'gallery', []);
      if (!gallery || !gallery.length) return;
      console.log(parseInt(target.getAttribute(FLAT_GALLERY_FANCYBOX)));
      Fancybox.show(
        gallery.map(src => ({ src, type: 'image' })),
        {
          startIndex: parseInt(target.getAttribute(FLAT_GALLERY_FANCYBOX)) || 0,
        },
      );
    });
  }

  mouseoverFlatHandler(elem) {
    const config = {
      ...elem.dataset,
      type: 'flat',
    };
    this.g_InfoBox.changeState('hover', config);
  }

  clickFlatHandler(elem) {
    const id = parseInt(elem.getAttribute('data-id'));

    if (isDesktopTouchMode()) {
      const config = {
        ...elem.dataset,
        type: 'flat',
      };
      this.g_InfoBox.changeState('hover', config);
      return;
    }
    switch (deviceType) {
      case 'mouseOnly':
        this.history.update({ type: 'flat', id });
        this.update(id);
        break;

      default:
        const config = {
          ...elem.dataset,
          type: 'flat',
        };
        this.g_InfoBox.changeState('hover', config);
        break;
    }
  }

  hideInfoBox() {
    this.g_InfoBox.changeState('static');
  }

  updateInfoBoxPosition(event) {
    this.g_InfoBox.updatePosition(event);
  }

  showFlatInFlyby(elem) {
    /**Если выбранно отображение этажей переключает на отображение квартир
     * при клике на "посмотреть на 3д модели"
     */
    document.querySelector('[data-choose-type="flat"]').click();
    this.updateFsm(
      {
        ...elem.dataset,
        markedFlat: elem.dataset.flatid,
      },
      true,
      {
        controlPoint: elem.dataset.controlPoint,
        flatId: elem.dataset.flatid,
      },
      () => {},
    );
  }

  createConfigProject() {
    const { build, section, floor } = this.getFlat(this.activeFlat);
    return {
      build,
      section,
      floor,
    };
  }

  init(config) {
    this.preloader = preloader;
  }

  createWrap() {
    // все 3 обертки нужны, без них на мобилке пропадает прокрутка и всё ломается
    const wrap1 = createMarkup('div', {
      class: `s3d__wrap js-s3d__wrapper__${this.type} s3d__wrapper__${this.type}`,
    }); // const wrap2 = createMarkup(conf.typeCreateBlock, { id: `js-s3d__${conf.id}` })
    $(this.generalWrapId).append(wrap1);
  }

  async update(id) {
    this.activeFlat = id;
    this.setPlaneInPage(this.activeFlat);
    this.emit('settimer', this.getFlat(this.activeFlat)['timer']);
    this.configProject = this.createConfigProject();
    this.gallerySliderInit();
    this.constructionSliderInit();
    await this.updateFloor();
    this.explicationState$.next({ ...this.defaultExplicationState });
    this.zoomFloorHandler();
    this.floorListSliderInit();
    this.priceHistoryHandler();

    // if (isMobile()) {
    //   if (this.explicationZoom) {
    //     this.explicationZoom.destroy();
    //   }
    //   this.explicationZoom = new PinchZoom(
    //     document.querySelector('.s3d-flat__explication-screen-slider'),
    //   );
    // }
    document.querySelector(
      '[data-header-flat-plan-group][data-type="flat"]',
    ).textContent = this.getFlat(this.activeFlat).number;

    const flatButton = document.querySelector('[data-header-flat-plan-group][data-type="flat"]');

    if (flatButton) {
      flatButton.innerHTML = `
        ${this.i18n.t('ctr.nav.mansion')} ${this.getFlat(this.activeFlat).number}
      `;
    }

    setTimeout(() => {
      const btn = document.querySelector('.js-s3d__select[data-type="flat"]');
      this.preloader.turnOff(btn);
      this.preloader.hide();
    }, 600);

    this.initSmartoTours();
    this.initSmartoToursV3();
  }

  async updateFloor() {
    const isThisFloorCached = this.floorList$.value.some(
      floor =>
        floor.cached &&
        floor.build === this.configProject.build &&
        floor.section === this.configProject.section &&
        floor.floor === this.configProject.floor,
    );
    const floorData = isThisFloorCached
      ? this.floorList$.value.find(
          floor =>
            floor.cached &&
            floor.build === this.configProject.build &&
            floor.section === this.configProject.section &&
            floor.floor === this.configProject.floor,
        ).async_data
      : await getFloor(this.configProject);

    if (!isThisFloorCached && this.cacheFloor) {
      this.cacheFloor(this.configProject, floorData);
    }

    if (!floorData) {
      ErrorCallbackUpdateLocation(
        this.i18n,
        location.href,
        'Error-popup.messages.not-find-data',
        'medium',
        `${origin}${pathname}${search}`,
      )({
        requestData: this.configProject,
        data: {
          message: 'Floor data is not recieved',
          build: this.configProject.build,
          section: this.configProject.section,
          floor: this.configProject.floor,
          flatId: this.activeFlat,
        },
        response: floorData,
      });
      document
        .querySelectorAll('.s3d-flat__floor-plan-container')
        .forEach(el => (el.style.display = 'none'));
      return;
    }
    if (!floorData.url || !floorData.flatsIds) {
      ErrorCallbackUpdateLocation(
        this.i18n,
        location.href,
        'Error-popup.messages.not-all-required-data-received',
        'medium',
        `${origin}${pathname}${search}`,
      )({
        requestData: this.configProject,
        data: {
          message: 'Floor data is broken, redirected to the main page',
          build: this.configProject.build,
          section: this.configProject.section,
          floor: this.configProject.floor,
          flatId: this.activeFlat,
        },
        response: floorData,
      });
      document
        .querySelectorAll('.s3d-flat__floor-plan-container')
        .forEach(el => (el.style.display = 'none'));
      return;
    }

    this.setFloorInPage(floorData);
    this.emit('updateActiveFlatInFloor', this.activeFlat);
  }

  preparationFlats(flatsIds) {
    return flatsIds.map(id => this.getFlat(id));
  }

  // вставляем разметку в DOM вешаем эвенты
  setPlaneInPage(flatId) {
    const flat = this.getFlat(+flatId);

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    const flatsArray = Object.values(this.flatList);
    const getFlatById = flatsArray.find(f => f.id == flatId);

    if (!getFlatById) {
      console.error(`No flat found with id ${flatId}`);
      return;
    }

    const getFlatType = getFlatById.type;

    shuffleArray(flatsArray);

    const otherTypeFlats = flatsArray.reduce((acc, val) => {
      if (val.id === flatId || val.sale != '1') return acc;
      acc.push(val);

      return acc;
    }, []);

    const floorList = this.floorList$.value
      .filter(floor => {
        return floor.build == flat.build && floor.section == flat.section;
      })
      .sort((a, b) => a.floor - b.floor);

    const htmlMapping = {
      flat: CreateFlat,
      villa: Villa,
    };

    const html = htmlMapping[this.viewType]({
      i18n: this.i18n,
      flat: flat,
      favouritesIds$: this.favouritesIds$,
      otherTypeFlats: otherTypeFlats,
      labelsToShowInInfoBlock: this.labelsToShowInInfoBlock,
      unit_statuses: this.unit_statuses,
      floorList: floorList,
      projectDocs: this.projectDocs,
      exteriorData: this.exteriorData,
      financialTermsData: this.financialTermsData,
      g_constructionProgressData: this.g_constructionProgressData,
      constructionProgressDataList: this.constructionProgressDataList,
      show_prices: this.show_prices,
      getFlat: this.getFlat,

      social_media_links: this.social_media_links,
      manager_info: this.manager_info,
      g_contacts: this.g_contacts,
      show_phoneNumber: this.show_phoneNumber,
      g_contact_advantaged_list: this.g_contact_advantaged_list,
      project_google_map_location: this.project_google_map_location,
      faq_questions: this.faq_questions,
      progress_photos: this.progress_photos,
      brands_list: this.brands_list,
      payment_list: this.payment_list,
      contact_block_variant: this.contact_block_variant,
    });

    this.emit('setFlat', html);
    this.checkPlaning();

    if (document.querySelector('[data-flat-explication-image]')) {
      $('[data-flat-explication-image]').magnificPopup({
        type: 'image',
        showCloseBtn: true,
        callbacks: {
          elementParse: function(item) {
            item.src = item.el[0].src;
          },
        },
      });
    }

    const is3dImageOfFlatAviable = flat.images && Object.keys(flat.images).length > 1;
    const $changeFlatImageView = document.querySelector('.js-s3d-flat__buttons-view');
    if ($changeFlatImageView) {
      $changeFlatImageView.style.display = is3dImageOfFlatAviable ? 'flex' : 'none';
    }

    addAnimateBtnTabs('.s3d-flat__button', '.js-s3d__btn-tab-svg');

    setTimeout(() => {
      const dataFlatExplicationButton = document.querySelector('[data-flat-explication-button]');
      if (dataFlatExplicationButton) dataFlatExplicationButton.click();
    }, 3000);
    setTimeout(() => {
      const container = this.wrapper.querySelector('.js-installment-calculator');
      if (!container || container.classList.contains('is-initialized')) return;

      container.classList.add('is-initialized');

      new InstallmentCalculator({
        currency_rate: flat.currency_rate,
        currency_id: flat.currency_id,
        i18n: this.i18n,
        container: this.wrapper.querySelector('.js-installment-calculator'),
        price_base_m2: flat.price_m2,
        price: flat.price,
        area: +flat.area,
        currency_label: this.i18n.t('currency_label'),
        flatId: flat.id,
      }).init();
    }, 0);
  }

  radioTypeHandler(types) {
    const imgUrlObj = this.getFlat(this.activeFlat).images[types];
    this.imagesType = types;
    this.emit('changeClassShow', { element: '.js-s3d-flat__buttons-view', flag: false });
    const keys = Object.keys(imgUrlObj);
    if (keys.length > 1) {
      this.emit('changeClassShow', { element: '.js-s3d-flat__buttons-view', flag: true });
    }

    const radioView = document.querySelector(`.js-s3d__radio-view[data-type="${keys[0]}"]`);
    if (radioView) {
      const input = radioView.querySelector('input');
      input.checked = true;
    }
    this.radioViewHandler(keys[0]);
  }

  toFloorPlan() {
    const { build, floor, section } = this.getFlat(this.activeFlat);
    this.updateFsm({
      type: 'floor',
      build,
      floor,
      section,
    });
  }

  look3d() {
    this.updateFsm({ type: 'flyby', id: this.activeFlat });
  }

  checkPlaning() {
    this.emit('changeClassShow', { element: '.js-s3d-flat__buttons-view.show', flag: false });
    const flat = this.getFlat(this.activeFlat);
    const imagesCount = size(flat.images);
    if (imagesCount === 0) {
      this.emit('updateImg', '/assets/s3d/images/examples/no-image.png');
      return;
    }
    const keys = Object.keys(flat.images);

    this.imagesType = keys[0];
    this.imagesViewType = Object.keys(flat.images[keys[0]])[0];
    this.emit('clearRadioElement', '.js-s3d-flat__buttons-type');

    if (imagesCount > 1) {
      this.emit('createRadioSvg', '.js-s3d-flat__buttons-type');
      for (const imageKey in flat.images) {
        this.emit('createRadioElement', {
          wrap: '.js-s3d-flat__buttons-type',
          type: imageKey,
          name: 'type',
        });
      }

      const radioBtn = document.querySelector(
        `.js-s3d__radio-type[data-type=${this.imagesType}] input`,
      );

      if (radioBtn) {
        radioBtn.checked = true;
      } else {
        console.warn(`Елемент не знайдено для типу: ${this.imagesType}`);
      }
      // radioBtn.checked = true;
    }

    this.radioTypeHandler(this.imagesType);
  }

  radioViewHandler(viewType) {
    this.imagesViewType = viewType;
    const obj = this.getFlat(this.activeFlat).images;
    const image = obj[this.imagesType][viewType];
    const checked = document.querySelector('.js-s3d__radio-view-change input');
    const target = document.querySelector(`.js-s3d__radio-view[data-type="${viewType}"] input`);
    if (target) {
      target.checked = true;
    }
    if (viewType === '2d') {
      checked.checked = false;
    } else {
      checked.checked = true;
    }
    this.emit('updateImg', image);
  }

  radioCheckedHandler(value) {
    if (value) {
      document.querySelector('.js-s3d__radio-view[data-type="3d"]').click();
    } else {
      document.querySelector('.js-s3d__radio-view[data-type="2d"]').click();
    }
  }

  setFloorInPage(response) {
    const { url = '', flatsIds = [], size: sizeImage } = response;

    const preparedFlats = this.preparationFlats(flatsIds).map(flat => {
      if (!flat) return;
      const flatId = flat.id || undefined;
      if (flatId === undefined) return { ...flat };
      if (!response.cords) return { ...flat };
      return { ...flat, sortedFromServer: response.cords ? response.cords[flat.id] : flat.sorts };
    });

    const flatValueToRenderInPoygon = get(
      this,
      'floor_page_settings.polygonValueToRender1',
      undefined,
    );
    const flatValueToRenderInPoygon2 = get(
      this,
      'floor_page_settings.polygonValueToRender2',
      undefined,
    );

    const floorSvg = createFloorSvg(
      this.i18n,
      url,
      preparedFlats,
      sizeImage,
      this.activeFlat,
      flatValueToRenderInPoygon,
      flatValueToRenderInPoygon2,
    );
    this.emit('removeFloorSvg');
    this.emit('setFloor', floorSvg);
    this.emit('updateFlatIdChoose', this.activeFlat);
    this.checkChangeFloor();
  }

  checkChangeFloor() {
    const {
      build: currentBuild,
      section: currentSection,
      floor: currentFloor,
    } = this.configProject;
    const listFloors = this.floorList$.value
      .filter(data => data.build === currentBuild && data.section === currentSection)
      .map(data => window.parseInt(data.floor))
      .sort(function(a, b) {
        return a - b;
      });

    const index = listFloors.indexOf(currentFloor);
    const changeFloorData = {
      prev: listFloors[index - 1] ?? null,
      next: listFloors[index + 1] ?? null,
    };
    if (index === 0) {
      changeFloorData.prev = null;
    }
    if (index === listFloors.length - 1) {
      changeFloorData.next = null;
    }
    this.changeFloorData = changeFloorData;
    this.emit('renderCurrentFloor', this.configProject);
    this.emit('renderFloorChangeButtons', this.changeFloorData);
  }

  changeFloorHandler(direction) {
    const nextFloor = this.changeFloorData[direction];
    if (nextFloor === null || undefined) return;

    this.configProject = {
      ...this.configProject,
      floor: nextFloor,
    };

    this.updateFloor();
  }
  changeFloorHandlerByNumber(number) {
    if (number === null || undefined) return;

    this.configProject = {
      ...this.configProject,
      floor: +number,
    };

    this.updateFloor();
  }

  async parseFlatPointsOnFlyby(flatId, flatlink) {
    const response = await axios.get(flatlink);
    const parser = new DOMParser();
    if (!get(response, 'data')) return false;
    const $svg = parser.parseFromString(response.data, 'text/html').querySelector('svg');
    const $flat = $svg.querySelector(`polygon[data-id="${flatId}"]`);
    if ($flat) {
      return $flat.getAttribute('points');
    }
    return false;
  }

  async getPdfLink() {
    const additionalParams = {};
    const urlParams = new URLSearchParams(window.location.search);
    const currency = urlParams.get('currency') || 'USD';
    additionalParams.currency = currency;

    const flybyWhereFlatIsSpecified = get(this.getFlat(this.activeFlat), 'specifiedFlybys.0', null);
    if (flybyWhereFlatIsSpecified) {
      additionalParams.flyby_img = flybyWhereFlatIsSpecified.frame_image_url;
      additionalParams.flyby_width = '1920';
      additionalParams.flyby_height = '1080';
      const points = await this.parseFlatPointsOnFlyby(
        this.activeFlat,
        flybyWhereFlatIsSpecified.flatSvgLink,
      );
      if (points) {
        additionalParams.flyby_points = points;
      }
    }

    dispatchTrigger('pdf-file-download', {
      objectId: this.activeFlat,
      href: window.location.href,
    });

    const toast = Toastify({
      position: 'center',
      gravity: 'bottom',
      text: this.i18n.t('pdf_preparing'),
    }).showToast();

    asyncRequest({
      url:
        window.status === 'local'
          ? `/wp-content/themes/${window.nameProject}/static/pdf.txt`
          : '/wp-admin/admin-ajax.php',
      method: window.status === 'local' ? 'get' : 'post',
      data: {
        action: 'createPdf',
        id: this.activeFlat,
        currency: additionalParams.currency,
        ...additionalParams,
      },
    })
      .then(resp => resp)
      .then(data => {
        return new Promise((resolve, reject) => {
          setTimeout(
            () => {
              resolve(data);
            },
            window.status === 'local' ? 2000 : 0,
          );
        });
      })
      .then(url => {
        if (!url) {
          Toastify({
            position: 'center',
            gravity: 'bottom',
            close: true,
            text: this.i18n.t('pdf_error'),
            duration: 4000,
          }).showToast();
          return;
        }
        Swal.fire({
          title: this.i18n.t('pdf_ready'),
          customClass: {
            container: 's3d-pdf-popup',
          },
          width: 386,
          preConfirm: () => {
            return false;
          },
          allowOutsideClick: false,
          showCloseButton: true,
          closeButtonHtml: `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00008 7.29297L8.35363 7.64652L12.5001 11.793L16.6465 7.64652L17.0001 7.29297L17.7072 8.00008L17.3536 8.35363L13.2072 12.5001L17.3536 16.6465L17.7072 17.0001L17.0001 17.7072L16.6465 17.3536L12.5001 13.2072L8.35363 17.3536L8.00008 17.7072L7.29297 17.0001L7.64652 16.6465L11.793 12.5001L7.64652 8.35363L7.29297 8.00008L8.00008 7.29297Z" fill="#1A1E21"/>
          </svg>
          `,
          html: `
          <div class="pdf-icon">
            <svg width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.87531 1.79154C9.81298 1.7599 9.7057 1.73228 9.51696 1.76385C9.20646 1.81578 9.00412 2.00094 8.87612 2.38739C8.73861 2.80254 8.71385 3.39569 8.78949 4.10604C8.89422 5.0896 9.17927 6.19582 9.49125 7.14906C9.83473 6.06033 10.1894 4.5918 10.2452 3.41602C10.2759 2.76752 10.2106 2.28938 10.0703 2.01194C10.006 1.88489 9.93784 1.82327 9.87531 1.79154ZM8.98145 8.67531C8.97968 8.67124 8.9779 8.66717 8.97612 8.6631L8.97294 8.65581L8.97 8.64842C8.51342 7.50282 7.9586 5.74725 7.79511 4.21192C7.71398 3.45003 7.72281 2.68895 7.92684 2.07297C8.14037 1.42829 8.5875 0.905427 9.35198 0.77755C9.70073 0.719213 10.0339 0.750593 10.3279 0.899823C10.6217 1.04895 10.8258 1.29007 10.9626 1.56058C11.2245 2.07827 11.2767 2.77454 11.2441 3.46341C11.1775 4.86547 10.7371 6.5765 10.358 7.71853C10.2702 7.99546 10.1696 8.30009 10.057 8.62757C11.1388 10.9468 12.6067 12.601 14.108 13.7362C16.101 13.3606 17.3821 13.3581 18.3929 13.3581C19.7833 13.3581 20.8649 13.701 21.4012 14.3162C21.6871 14.644 21.821 15.0606 21.7125 15.4961C21.6093 15.9106 21.3081 16.2553 20.9105 16.5213C20.6485 16.6967 20.3065 16.7881 19.9489 16.8275C19.5823 16.8679 19.1564 16.8583 18.6925 16.7982C17.7641 16.6779 16.6464 16.3506 15.481 15.7657C14.9513 15.4999 14.4107 15.1803 13.8724 14.8017C12.3391 15.1165 10.3838 15.6547 7.81651 16.5747C7.24054 16.795 6.71031 17.0147 6.22286 17.2325C5.25974 18.898 4.18761 20.4043 3.05946 21.4142C2.44814 22.0232 1.73069 22.3471 1.118 22.2219C0.79045 22.1549 0.504804 21.9552 0.355935 21.6304C0.213576 21.3197 0.227116 20.9634 0.335287 20.6197C0.549049 19.9403 1.17743 19.1454 2.29001 18.3116C3.07876 17.7204 4.13423 17.092 5.51492 16.4556C5.9159 15.7458 6.30142 15.0016 6.66648 14.2471C7.62756 12.2606 8.42847 10.242 8.98145 8.67531ZM6.99551 15.8217C7.19198 15.444 7.38255 15.0631 7.56665 14.6826C8.36684 13.0287 9.05751 11.3546 9.59126 9.92516C10.5206 11.6387 11.6568 12.9785 12.8479 14.0034C11.4087 14.3405 9.65401 14.8538 7.47415 15.6351L7.47412 15.635L7.4643 15.6387C7.30485 15.6997 7.14861 15.7607 6.99551 15.8217ZM4.53455 18.0665C3.87499 18.4295 3.33184 18.7805 2.88974 19.1118C1.84676 19.8935 1.41135 20.5315 1.28918 20.9198C1.22939 21.1098 1.25692 21.1961 1.26504 21.2138C1.26516 21.2141 1.26529 21.2144 1.26543 21.2148C1.26714 21.2195 1.27188 21.2327 1.3183 21.2421C1.45792 21.2707 1.8555 21.2058 2.36166 20.6978L2.37203 20.6874L2.383 20.6776C3.11644 20.0233 3.841 19.1172 4.53455 18.0665ZM15.3287 14.5474C15.5304 14.6642 15.7309 14.7723 15.9295 14.8719C17.0037 15.411 18.0137 15.7019 18.821 15.8065C19.225 15.8588 19.569 15.8633 19.8393 15.8335C20.1185 15.8027 20.2805 15.7397 20.3544 15.6902C20.6287 15.5067 20.7194 15.3457 20.7422 15.2544C20.7596 15.1842 20.7536 15.0951 20.6475 14.9733C20.4 14.6895 19.69 14.3581 18.3929 14.3581H18.3731C17.6075 14.3581 16.6684 14.3581 15.3287 14.5474Z" fill="#1A1E21"/>
            </svg>
          </div>
          `,
          confirmButtonText: `
          <a href="${url}" target='_blank'>
            <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.52556 14.3176L16.6836 7.60691L17.3675 8.33645L9.36753 15.8364L9.02556 16.157L8.68359 15.8364L0.683593 8.33645L1.36753 7.60691L8.52556 14.3176L8.52556 0.47168L9.52556 0.47168L9.52556 14.3176Z" fill="#FAFBFE"/>
            </svg>
            <span>${this.i18n.t('pdf_download')}</span></a>
          `,
          confirmButtonColor: 'var(--color-brand-800)',
        });
        return url;
      })
      .finally(() => {
        toast.hideToast();
      });
  }

  gallerySliderInit() {
    // data-flat-gallery-slider
    if (this.gallerySliderInstance) this.gallerySliderInstance.destroy();
    if (this.wrapper.querySelector('[data-flat-gallery-slider]')) {
      this.gallerySliderInstance = new Swiper('[data-flat-gallery-slider]', {
        modules: [Navigation],
        on: {
          slideChange: instance => {
            const currentSlide = instance.realIndex + 1;
            const $currentSlide = this.wrapper.querySelector(
              '[data-flat-gallery-swiper-current-slide]',
            );
            $currentSlide.textContent = currentSlide;
          },
        },
        slidesPerView: 1,
        loop: true,
        navigation: {
          nextEl: '[data-flat-gallery-swiper-button-next]',
          prevEl: '[data-flat-gallery-swiper-button-prev]',
        },
      });

      return;
    }
    console.log('gallerySliderInit', 'no gallery slider container found');
  }

  constructionSliderInit() {
    // if (this.galleryConstructionSliderInstance) this.gallerySliderInstance.destroy();
    if (this.wrapper.querySelector('[data-flat-construction-gallery-swiper]')) {
      this.galleryConstructionSliderInstance = new Swiper(
        '[data-flat-construction-gallery-swiper]',
        {
          modules: [Navigation],
          on: {
            slideChange: instance => {
              const currentSlide = instance.realIndex + 1;
              const $currentSlide = this.wrapper.querySelector(
                '[data-flat-construction-gallery-swiper-current-slide]',
              );
              $currentSlide.textContent = currentSlide;
            },
          },
          slidesPerView: 1,
          loop: true,
          navigation: {
            nextEl: '[data-flat-construction-gallery-swiper-button-next]',
            prevEl: '[data-flat-construction-gallery-swiper-button-prev]',
          },
        },
      );

      return;
    }
    console.log('galleryConstructionSliderInit', 'no construction gallery slider container found');
  }

  changeFlatExplication(type, value) {
    const newState = {
      ...this.explicationState$.value,
      [type]: value,
    };
    if (type === 'floor') newState.type = '2d';
    this.explicationState$.next(newState);
  }

  flatFloorZoomKeyDown(evt) {
    if (evt.key === 'Control') {
      // document.querySelector('.s3d-flat__floor-info').style.pointerEvents = '';
    }
  }
  flatFloorZoomKeyUp(evt) {
    // document.querySelector('.s3d-flat__floor-info').style.pointerEvents = 'none';
  }

  changeZoomButtonsState(instance) {
    const isMaxZoom = instance.content.currentScale === instance.content.maxScale;
    const isMinZoom = instance.content.currentScale === instance.content.minScale;
    this.wrapper.querySelectorAll('[data-flat-floor-zoom-button-up]').forEach(button => {
      button.disabled = isMaxZoom;
    });
    this.wrapper.querySelectorAll('[data-flat-floor-zoom-button-down]').forEach(button => {
      button.disabled = isMinZoom;
    });
  }

  zoomFloorHandler() {
    if (isDesktop()) {
      window.removeEventListener('keydown', this.flatFloorZoomKeyDown);
      window.removeEventListener('keyup', this.flatFloorZoomKeyUp);
      document.querySelectorAll('.s3d-flat__floor-info').forEach(el => {
        // el.style.pointerEvents = 'none';
      });
    }

    if (!this.scrollInitialized) {
      let elementToObserveScroll = isDesktop()
        ? this.wrapper.querySelector('.s3d-flat__content-wrapper')
        : this.wrapper;
      if (isTablet()) {
        elementToObserveScroll = this.wrapper.querySelector('.js-s3d-flat');
      }
      if (elementToObserveScroll) {
        elementToObserveScroll.addEventListener('scroll', () => {
          if (this.floorZoom) {
            this.floorZoom.prepare();
          }
        });
      }
      this.wrapper.addEventListener('click', evt => {
        if (evt.target.closest('[data-flat-floor-zoom-button-up]')) {
          this.floorZoom.zoomUp();
        }
        if (evt.target.closest('[data-flat-floor-zoom-button-down]')) {
          this.floorZoom.zoomDown();
        }
      });
      if (isDesktop()) {
        window.addEventListener('keydown', this.flatFloorZoomKeyDown);
        window.addEventListener('keyup', this.flatFloorZoomKeyUp);
      }
    }
    if (this.floorZoom) this.floorZoom.destroy();
    // this.floorZoom = htmlZoom(this.wrapper, '.s3d-flat__floor-info', {
    //   rescale: this.debouncedChangeZoomButtonsState,
    //   disableWheelZoom: true,
    // });
    console.log('zoomFloorHandler', this.floorZoom);
  }

  floorListSliderInit() {
    if (this.floorListSliderInstance) this.floorListSliderInstance.destroy();
    if (this.wrapper.querySelector('[data-flat-floor-list]')) {
      this.floorListSliderInstance = new Swiper('[data-flat-floor-list]', {
        slidesPerView: 1,
        centeredSlides: true,
        spaceBetween: 8,
      });
      setTimeout(() => {
        const elementToFindIndex = Array.from(
          this.floorListSliderInstance.slides,
        ).find((el, index) => el.classList.contains('active'));
        if (elementToFindIndex) {
          this.floorListSliderInstance.slideTo(elementToFindIndex.dataset.index);
          console.log('floorListSliderInit', this.floorListSliderInstance);
        }
      }, 1000);
    }
  }

  priceHistoryHandler() {
    console.log('priceHistoryHandler', this.priceHistoryInstance);

    // if (has(this.priceHistoryInstance, 'destroy')) this.priceHistoryInstance.destroy();

    const priceHistory = this.getFlat(this.activeFlat).price_history;
    if (!priceHistory || priceHistory.length === 0) {
      console.log('priceHistoryHandler', 'no price history data');
      return;
    }

    // this.priceHistoryInstance = priceHistoryGraphic(this.getFlat(this.activeFlat).price_history.reverse(), this.i18n, 'chart');
  }

  toggleAnimationCircle(dataId) {
    document
      .querySelector(`.SvgFloorPolygonTooltip__title[data-id="${dataId}"]`)
      .classList.toggle('active');
  }

  initSmartoTours() {
    const tourDataUrl = this.getFlat(this.activeFlat)['3d_tour_v2'];

    if (!tourDataUrl) return;

    const $container = document.querySelector(SMARTO_TOURS_CONTAINER_SELECTOR);
    if (!$container) return;

    asyncRequest({
      url: tourDataUrl,
      method: 'get',
    })
      .then(data => {
        if (!data) {
          console.error('No data received for Smarto Tours');
          return;
        }

        if (!isJson(data)) {
          console.error('Invalid JSON received for Smarto Tours');
          return;
        }

        const parsedData = JSON.parse(data);
        console.log('Smarto Tours data received:', parsedData);

        const urlParamsOfTourDataUrl = new URLSearchParams(tourDataUrl.split('?')[1]);
        const defaultSceneIndex = urlParamsOfTourDataUrl.get('scene') || null;
        let additionalConfigs = {};

        if (this.getFlat(this.activeFlat).id == '1081') {
          additionalConfigs = {
            customFloorTitles: {
              '1': 'Floor 1',
              '2': 'Floor 2',
              '3': 'Garage',
              '4': 'Landscape',
            },
            customNavFloorsOrders: ['3', '4', '1', '2'],
          };
        }

        return import(
          /* webpackChunkName: "smarto-tours-v2" */ '../../../../s3d2/scripts/modules/AudioAssistant/SmartoTours'
        ).then(({ default: SmartoTours }) => {
          const smartoTours = new SmartoTours({
            $container,
            data: parsedData,
            scrollableElement: document.querySelector('.s3d-flat-new.s3d-villa'),
            ...additionalConfigs,
            i18n: this.i18n,
            defaultSceneIndex: defaultSceneIndex,
          });
          return Promise.resolve(smartoTours.init());
        });
      })
      .catch(error => {
        console.error('Error initializing Smarto Tours:', error);
      });
  }

  initSmartoToursV3() {
    const tourDataUrl = this.getFlat(this.activeFlat)['3d_tour_v3'];

    if (!tourDataUrl) return;

    const $container = document.querySelector(SMARTO_TOURS_V3_CONTAINER_SELECTOR);
    if (!$container) return;

    asyncRequest({
      url: tourDataUrl,
      method: 'get',
    })
      .then(data => {
        if (!data) {
          console.error('No data received for Smarto Tours');
          return;
        }

        if (!isJson(data)) {
          console.error('Invalid JSON received for Smarto Tours');
          return;
        }

        const tour3Data = JSON.parse(data);
        console.log('Smarto Tours data received:', tour3Data);

        const premises = tour3Data.data;
        premises.forEach((premise, index) => {
          if (isJson(premise.tour_v2_premise_hotspots)) {
            premises[index].tour_v2_premise_hotspots = JSON.parse(premise.tour_v2_premise_hotspots);
          }
        });

        console.log('tour3Data', tour3Data);

        return import(
          /* webpackChunkName: "smarto-tours-v3" */ '../../../../s3d2/scripts/modules/AudioAssistant/SmartoToursV3'
        ).then(({ default: SmartoToursV3 }) => {
          const smartoTours = new SmartoToursV3({
            $container,
            data: premises,
            scrollableElement: document.querySelector('.s3d-flat-new.s3d-villa'),
            flat_level_photos: tour3Data.flat_level_photos,
            flat_plan: tour3Data.flat_plan,
            infoHotspotTranslations: tour3Data.infoHotspotTranslations,
            i18n: this.i18n,
          });
          Promise.resolve(smartoTours.init()).catch(error => {
            console.error('Error initializing Smarto Tours V3:', error);
          });
          window.addEventListener(
            'updateFsm',
            () => {
              smartoTours.destroy();
            },
            { once: true },
          );
        });
      })
      .catch(error => {
        console.error('Error initializing Smarto Tours:', error);
      });
  }
}

export default FlatModel;
