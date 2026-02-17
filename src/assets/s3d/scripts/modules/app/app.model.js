import { BehaviorSubject } from 'rxjs';
import $ from 'jquery';
import transform from 'lodash/transform';
import isNaN from 'lodash/isNaN';
import has from 'lodash/has';
import cloneDeep from 'lodash/cloneDeep';
import size from 'lodash/size';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import find from 'lodash/find';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import Toastify from 'toastify-js';
import { fsm, fsmConfig } from '../fsm';
import addAnimateBtnTabs from '../animation';
import { delegateHandler, preloader } from '../general/General';
import asyncRequest from '../async/async';
import EventEmitter from '../eventEmitter/EventEmitter';
import History from '../history';
import Helper from '../helper';
import InfoBox from '../infoBox';
import FilterModel from '../filter/filterModel';
import FilterView from '../filter/filterView';
import FilterController from '../filter/filterController';
import FlatsList from '../flatsList';
import PopupChangeFlyby from '../popupChangeFlyby';
import FavouritesModel from '../favourites/favouritesModel';
import FavouritesController from '../favourites/favouritesController';
import FavouritesView from '../favourites/favouritesView';
import { AppContentCustomError, AppUrlCustomError } from '../errors';
import sendError from '../sendError';
import ErrorPopup from '../errorPopup';
import FormView from '../form/form/formView';
import faqView from '../faq/faqView';
import constructionProgressView from '../construction-progress/constructionProgressView';
import Popup from '../popup/PopupView';
import dispatchTrigger from '../helpers/triggers';
import { deviceType, primaryInput } from 'detect-it';
import { share } from '../../features/share';
import modalManager from '../../managers/modalManager';
import { handleHidingElements } from '../../features/hideElementsOnPages';
import { handleShowElementsOnPage } from '../../features/showElementsOnPage';
import * as asyncGetFloor from '../getFloor';
import {
  SEARCH_PARAMS_FILTER_PREFIX,
  TOOLTIP_ATTR_DONT_SHOW_WHEN_HAVE_CLASSNAME,
  TOOLTIP_ATTRIBUTE,
} from '../../../../s3d2/scripts/constants';
import tippy from 'tippy.js';
import $touchModePopup from '../templates/$touchModePopup';
import { isDesktop, isDesktopTouchMode } from '../../../../s3d2/scripts/helpers/helpers_s3d2';
import AudioAssistant from '../../../../s3d2/scripts/modules/AudioAssistant/AudioAssistant';
import { isMobile } from './../helpers/helpers';
import { Fancybox } from '@fancyapps/ui';

const ErrorGetFlatsData = (i18n, hostname, keyMessage, type = '', newLocation) => err => {
  sendError(i18n, hostname, keyMessage, type, err);
};

class AppModel extends EventEmitter {
  constructor(data, i18n) {
    super();
    this.config = data;
    this.unit_statuses = data.unit_statuses;
    this.i18n = i18n;
    this.preloader = preloader;
    this.defaultFlybySettings = {};
    this.getFlat = this.getFlat.bind(this);
    this.getFloor = this.getFloor.bind(this);
    this.updateFsm = this.updateFsm.bind(this);
    this.checkNextFlyby = this.checkNextFlyby.bind(this);
    this.changePopupFlyby = this.changePopupFlyby.bind(this);

    this.browser = data.browser;
    this.typeSelectedFlyby$ = new BehaviorSubject('flat'); // flat, floor
    this.highlightFlybySvgElements$ = new BehaviorSubject(true);
    this.compass = this.compass.bind(this);
    this.horizontalCompass = this.horizontalCompass.bind(this);

    this.currentFilteredFlatIds$ = new BehaviorSubject([]);
    this.currentFilteredFlatIdsAviableStatus$ = new BehaviorSubject([]);

    this.currentFilteredFloorsData$ = new BehaviorSubject([]);
    this.hoverData$ = new BehaviorSubject({});
    this.flatList = {};
    this.floorList$ = new BehaviorSubject({});
    this.favouritesIds$ = new BehaviorSubject([]);
    this.fsmConfig = fsmConfig();
    this.fsm = fsm();
    this.pin = data.pin;
    this.pinsInfo = data.pinsInfo;
    this.sliderPopup = data.sliderPopup;
    this.modalManager = modalManager;
    this.currentPage$ = new BehaviorSubject('flat');
    this.getFlybyFinishDate = this.getFlybyFinishDate.bind(this);
    this.getFlybyMinPriceM2 = this.getFlybyMinPriceM2.bind(this);
    this.getFlybyMinPrice = this.getFlybyMinPrice.bind(this);
    this.getCurrency = this.getCurrency.bind(this);
    this.cacheFloor = this.cacheFloor.bind(this);
    this.infoBoxesConfig = data.infoBoxes;
    this.handleHighlightFlybySvgElements();
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);

    window.addEventListener('faq-open', () => {
      this.modalManager.closeAll();
    });
    window.addEventListener('infobox-open', () => {
      this.modalManager.closeAll();
    });
    this.initTouchMode();
    document.body.addEventListener('click', evt => {
      const target = evt.target.closest('[data-fancybox-custom-gallery]');
      if (!target) return;
      Fancybox.show(
        target.dataset.fancyboxCustomGallery.split(';').map(src => ({ src, type: 'image' })),
      );

    });
  }

  initTouchMode() {
    if (!isDesktop()) return;
    this.touchModeClickEvents = {
      open: target => {
        this.renderTouchModePopup();
      },
      close: target => {
        gsap
          .timeline()
          .to('[data-s3d-touch-mode-popup]', { yPercent: '100', duration: 0.75 })
          .add(() => {
            document
              .querySelectorAll('[data-s3d-touch-mode-popup]')
              .forEach(popup => popup.remove());
          });
      },
      choose: target => {
        if (document.body === target) return;

        this.defineTouchMode(target.dataset.s3dTouchMode);
        gsap
          .timeline()
          .to(target.closest('[data-s3d-touch-mode-popup]'), { yPercent: '100', duration: 0.75 })
          .add(() => {
            target.closest('[data-s3d-touch-mode-popup]').remove();
            Toastify({
              position: 'center',
              text: this.i18n.t(`touchModePopup.changeMode`, {
                mode: this.i18n.t(`touchModePopup.${target.dataset.s3dTouchMode}`),
              }),
              duration: 1500,
            }).showToast();
          });
      },
    };

    const defaultMode = localStorage.getItem('s3d_touchMode') || 'mouse';
    if (
      !localStorage.getItem('s3d_touchMode') &&
      deviceType === 'hybrid' &&
      isDesktop() &&
      !this.touchMode
    )
      this.renderTouchModePopup();

    this.defineTouchMode(defaultMode);

    document.body.addEventListener('click', event => {
      const delegateElements = {
        open: delegateHandler('[data-s3d-touch-mode-popup-open]', event),
        close: delegateHandler('[data-s3d-touch-mode-popup-close]', event),
        choose: delegateHandler('[data-s3d-touch-mode]', event),
      };

      const entries = Object.entries(delegateElements);
      entries.map(([key, value]) => isObject(value) && this.touchModeClickEvents[key](value));
    });
  }

  defineTouchMode(mode) {
    this.touchMode = mode;
    document.body.dataset.s3dTouchMode = mode;
    localStorage.setItem('s3d_touchMode', mode);
  }

  renderTouchModePopup() {
    if (document.querySelector('[data-s3d-touch-mode-popup]')) return;
    document.body.insertAdjacentHTML('beforeend', $touchModePopup(this.i18n));
  }

  ErrorCallbackUpdateLocation(i18n, hostname, keyMessage, type = '', newLocation) {
    return err => {
      errorPopup.setType('withTranslate');
      sendError(i18n, hostname, keyMessage, type, err);
      errorPopup.open(
        keyMessage,
        () => {
          location.href = newLocation;
        },
        15,
      );
    };
  }

  // todo replace get/set normal
  set activeFlat(value) {
    this._activeFlat = window.parseInt(value);
  }

  get activeFlat() {
    return this._activeFlat;
  }

  // todo mb remove it function
  convertType(value) {
    try {
      return new Function(`return ${value} ;`)();
    } catch (e) {
      return value;
    }
  }

  selectSlideHandler(target) {
    const { type, flyby, side, id } = target.dataset;
    if (
      type === 'floor' &&
      target.dataset.build &&
      target.dataset.floor &&
      target.dataset.section
    ) {
      this.updateFsm({
        type,
        build: target.dataset.build,
        floor: target.dataset.floor,
        section: target.dataset.section,
      });
      return;
    }

    if (type === 'flat' && id) {
      this.updateFsm({
        type,
        id,
      });
    }

    if (
      type &&
      (type !== this.fsm.state ||
        flyby !== this.fsm.settings.flyby ||
        side !== this.fsm.settings.side)
    ) {
      this.updateFsm({
        type,
        flyby,
        side,
        id,
      });
    }
  }

  getFlat(val) {
    return val ? this.flatList[val] : this.flatList;
  }

  getFloor(data) {
    const values = this.floorList$.value;
    const { floor, build, section } = data;
    if (floor && build && section) {
      this.cacheFloor({
        floor,
        build,
        section,
      });
      return values.find(
        value => value.section === +section && value.floor === +floor && value.build === +build,
      );
    }
    return values;
  }

  cacheFloor(data, serverResponse) {
    const { floor, build, section } = data;
    const values = this.floorList$.value;
    const isFloorAlreadyCached = values.some(
      value =>
        value.cached &&
        value.section === +section &&
        value.floor === +floor &&
        value.build === +build,
    );
    if (this.asyncInProgress || isFloorAlreadyCached) return;

    if (serverResponse) {
      this.setSingleCachedFloor(serverResponse, floor, build, section);
      return;
    }

    this.asyncInProgress = true;
    asyncGetFloor.default({ floor, build, section }).then(response => {
      this.setSingleCachedFloor(response, floor, build, section);
      this.asyncInProgress = false;
    });
  }

  setSingleCachedFloor(response, floor, build, section) {
    const clonedFloors = cloneDeep(this.floorList$.value);
    const index = clonedFloors.findIndex(
      value => value.section === +section && value.floor === +floor && value.build === +build,
    );
    clonedFloors[index] = { ...clonedFloors[index], async_data: response, cached: true };

    this.floorList$.next(clonedFloors);
    dispatchTrigger('floor-cached', { floor, build, section, response });
  }

  // setFloor(val) {
  //   this.floorList$.next({ ...this.floorList$.value, [val.id]: val });
  // }

  initMobileNavigationMenu() {
    this.mobileNavigationMenuState$ = new BehaviorSubject(false);

    this.modalManager.push({
      close: () => {
        this.mobileNavigationMenuState$.next(false);
      },
      id: 'mobile-navigation-menu',
    });

    document.body.addEventListener('click', evt => {
      const target = evt.target.closest('[data-mobile-navigation-menu-open]');
      if (!target) return;
      this.mobileNavigationMenuState$.next(!this.mobileNavigationMenuState$.value);
      this.modalManager.open('mobile-navigation-menu');
    });
    document.body.addEventListener('click', evt => {
      const target = evt.target.closest('[data-mobile-navigation-menu-close]');
      if (!target) return;
      this.mobileNavigationMenuState$.next(false);
    });

    this.mobileNavigationMenuState$.subscribe(val => {
      document.querySelectorAll('[data-mobile-navigation-menu]').forEach(el => {
        el.classList.toggle('active', val);
      });

      document.querySelectorAll('[data-mobile-navigation-menu-open]').forEach(el => {
        el.classList.toggle('me-open-some-element', val);
      });
    });
  }

  initMobileFunctionsMenu() {
    this.mobileFunctionMenuState$ = new BehaviorSubject(false);

    this.modalManager.push({
      close: () => {
        this.mobileFunctionMenuState$.next(false);
      },
      id: 'mobile-functions-menu',
    });

    document.body.addEventListener('click', evt => {
      const target = evt.target.closest('[data-mobile-functions-menu-open]');
      if (!target) return;
      this.mobileFunctionMenuState$.next(!this.mobileFunctionMenuState$.value);
      this.modalManager.open('mobile-functions-menu');
    });
    document.body.addEventListener('click', evt => {
      const target = evt.target.closest('[data-mobile-functions-menu-close]');
      if (!target) return;
      this.mobileFunctionMenuState$.next(false);
    });

    this.mobileFunctionMenuState$.subscribe(val => {
      document.querySelectorAll('[data-mobile-functions-menu]').forEach(el => {
        el.classList.toggle('active', val);
      });

      document.querySelectorAll('[data-mobile-functions-menu-open]').forEach(el => {
        el.classList.toggle('me-open-some-element', val);
      });
    });
  }

  initMobileFloorFunctionsMenu() {
    this.mobileFloorFunctionMenuState$ = new BehaviorSubject(false);

    const modalId = 'mobile-floor-functions-menu';
    const modalSelector = 'data-mobile-floor-functions-menu';

    this.modalManager.push({
      close: () => {
        this.mobileFloorFunctionMenuState$.next(false);
      },
      id: modalId,
    });

    document.body.addEventListener('click', evt => {
      const target = evt.target.closest(`[${modalSelector}-open]`);
      if (!target) return;
      this.mobileFloorFunctionMenuState$.next(!this.mobileFloorFunctionMenuState$.value);
      this.modalManager.open(modalId);
    });
    document.body.addEventListener('click', evt => {
      const target = evt.target.closest(`[${modalSelector}-close]`);
      if (!target) return;
      this.mobileFloorFunctionMenuState$.next(false);
    });

    this.mobileFloorFunctionMenuState$.subscribe(val => {
      document.querySelectorAll(`[${modalSelector}]`).forEach(el => {
        el.classList.toggle('active', val);
      });

      document.querySelectorAll(`[${modalSelector}-open]`).forEach(el => {
        el.classList.toggle('me-open-some-element', val);
      });
    });
  }

  initHandlers() {
    this.initMobileFunctionsMenu();
    this.initMobileFloorFunctionsMenu();
    this.initMobileNavigationMenu();

    window.addEventListener('updateFsm', evt => {
      this.currentPage$.next({ ...evt.detail });
    });

    this.floorList$.subscribe(val => {
      dispatchTrigger('floor-list-init', val);
    });

    document.body.addEventListener('click', elem => {
      if (elem.target.closest('.js-click-infra-pin') === null) return;
      const target = elem.target.closest('.js-click-infra-pin');
      dispatchTrigger('click-infrastructure-pin', {
        src: window.location.href,
        ...target.dataset,
      });
    });

    document.body.addEventListener('click', elem => {
      if (elem.target.closest('.js-s3d-flat__3d-tour') === null) return;
      const target = elem.target.closest('.js-s3d-flat__3d-tour');
      elem.preventDefault();

      if (
        ((primaryInput !== 'mouse' && deviceType === 'hybrid') ||
          deviceType === 'touchOnly' ||
          isDesktopTouchMode()) &&
        target.tagName.match(/g|rect|polygon/i)
      ) {
        /**opening handler in touch devices will be sliderModel.js and infobox*/
        return;
      }
      if(elem.target.closest('.js-s3d-flat__3d-tour').getAttribute('data-fancybox-custom-gallery')) {return}
      new Popup(
        elem.target.closest('.js-s3d-flat__3d-tour').getAttribute('data-href'),
        elem.target.closest('.js-s3d-flat__3d-tour').getAttribute('data-title'),
        elem.target.closest('.js-s3d-flat__3d-tour').getAttribute('data-text'),
      ).render();
      dispatchTrigger('vr-popup-open', {
        href: elem.target.closest('.js-s3d-flat__3d-tour').getAttribute('data-href'),
        url: window.location.href,
      });
    });

    document.body.addEventListener('click', evt => {
      const target = evt.target.closest('[data-s3d-share]');
      if (!target) return;
      // share(target);

      // Toastify({
      //   text: this.i18n.t('ctr.share.link-copied'),
      //   duration: 1500,
      // alert(navigator.canShare);
      // }).showToast();
      navigator
        .share({
          url: window.location.href,
          text: 'Share Mansion On Fisher',
        })
        .catch(() => {
          // console.log('Share failed');
        });
    });

    window.addEventListener('updateFsm', evt => {
      const { type } = evt.detail;
      if (type === 'genplan' && this.typeSelectedFlyby$.value === 'floor') {
        this.changeChooseActive('flat');
        // console.log('i here');
      }
    });

    this.on('updateFsm', data => {
      setTimeout(() => {
        handleHidingElements(this.fsm.settings);
        handleShowElementsOnPage(this.fsm.settings);
      }, 0);
    });

    this.handleMobile3dButtonsMenu();

    this.typeSelectedFlyby$.subscribe(val => {
      document.querySelectorAll('[data-choose-type]').forEach(el => {
        el.classList.remove('current');
        if (el.dataset.chooseType === val) {
          el.classList.add('current');
        }
      });
    });
  }

  async init() {
    this.initHandlers();

    this.history = new History({ updateFsm: this.updateFsm });

    this.currencySwitchHandler();

    this.emit('translatePreloaderPercent', this.i18n);
    this.preloader.show();

    this.infoBox = new InfoBox({
      activeFlat: this.activeFlat,
      updateFsm: this.updateFsm,
      getFlat: this.getFlat,
      getFloor: this.getFloor,
      getFlybyMinPriceM2: this.getFlybyMinPriceM2,
      getFlybyMinPrice: this.getFlybyMinPrice,
      getFlybyFinishDate: this.getFlybyFinishDate,
      getCurrency: this.getCurrency,
      hoverData$: this.hoverData$,
      infoBoxesConfig: {
        ...this.infoBoxesConfig,
        show_prices: this.config.show_prices,
      },
      typeSelectedFlyby$: this.typeSelectedFlyby$,
      i18n: this.i18n,
    });
    const flats = await this.requestGetFlats();
    await this.asyncGetDocumentation();
    await this.asyncGetExterior();
    await this.asyncGetFinancialTerms();
    await this.asyncGetConstructionProgress();
    await this.asyncGetConstructionProgressList();

    this.setDefaultConfigFlyby(this.config);
    this.helper = new Helper(this.i18n);
    this.initTooltip();
    await this.flatJsonIsLoaded(flats);
  }

  currencySwitchHandler() {
    if (!this.config.show_prices) {
      this.history.deleteSearchParam('currency');
      return;
    }
    if (!this.config.currency_list || this.config.currency_list.length <= 1) {
      this.history.deleteSearchParam('currency');
      return;
    }
    this.currency = this.history.getParam('currency');

    if (this.currency) {
      this.config.currency_label = this.config.currency_list.find(
        currency => currency.value === this.currency,
      ).label;

      this.i18n.addResourceBundle(
        this.i18n.language,
        'translation',
        {
          currency_label: this.config.currency_label,
        },
        true,
        true,
      );
    }

    if (!this.currency) {
      this.currency = this.config.currency_value;
      this.history.pushSingleSearchParam('currency', this.currency);
    }

    document.body.addEventListener('click', evt => {
      const target = evt.target.closest('[data-currency-value]');
      if (!target) return;
      this.history.pushSingleSearchParam('currency', target.dataset.currencyValue);
      window.location.reload();
    });
  }

  initTooltip() {
    document.body.addEventListener('mouseover', evt => {
      if (isMobile()) return;

      const target = evt.target.closest(`[${TOOLTIP_ATTRIBUTE}]`);
      if (!target) return;
      if (target.tooltip) {
        target.tooltip.show();
        return;
      }
      const tooltipText = target.getAttribute(TOOLTIP_ATTRIBUTE);
      target.tooltip = tippy(target, {
        content: tooltipText,
        onShow: instance => {
          instance.popper.classList.toggle(
            'StatusTooltip--hidden',
            instance.reference.classList.contains(
              instance.reference.getAttribute(TOOLTIP_ATTR_DONT_SHOW_WHEN_HAVE_CLASSNAME),
            ),
          );
        },
        onCreate: instance => {
          instance.popper.classList.add('StatusTooltip');
        },
      });
    });
  }

  setDefaultConfigFlyby(config) {
    if (config['intro']) {
      this.defaultFlybySettings = {
        type: 'intro',
      };
    } else if (config['genplan']) {
      this.defaultFlybySettings = {
        type: 'genplan',
      };
    } else {
      const configFlyby = config.flyby;
      const type = 'flyby';
      const flyby = Object.keys(configFlyby)[0];
      const side = Object.keys(configFlyby[flyby])[0];
      this.defaultFlybySettings = {
        type,
        flyby,
        side,
      };
    }
  }

  async getDataFlybys() {
    const url =
      status === 'prod' || status === 'dev'
        ? '/wp-admin/admin-ajax.php'
        : `${defaultStaticPath}/structureFlats.json`;
    const response = await asyncRequest({
      url,
      method: 'post',
      data: {
        action: 'getStructureSvg',
      },
    });

    return response;
  }

  getParamDefault() {
    return this.defaultFlybySettings;
  }

  getParamFlyby(searchParams) {
    const conf = {
      type: searchParams.type ?? 'flyby',
      flyby: searchParams.flyby ?? '1',
      side: searchParams.side ?? 'outside',
    };
    if (this.history.history.markedFlat) {
      conf.markedFlat = this.history.history.markedFlat;
    }
    const flatId = searchParams.id;
    /**Старый вариант перехода для подсветки квартиры (пока не удалять) */
    // const updated = this.checkNextFlyby(conf, flatId);
    const id = flatId && this.getFlat(flatId) ? { id: flatId } : {};

    dispatchTrigger('visit-flyby-page', {
      src: window.location.href,
      ...conf,
    });
    return { ...conf, /* ...updated, */ ...id };
  }

  getParamGenplan() {
    dispatchTrigger('visit-flyby-page', {
      src: window.location.href,
      type: 'genplan',
    });
    return {
      type: 'genplan',
    };
  }
  getParamIntro() {
    dispatchTrigger('visit-flyby-page', {
      src: window.location.href,
      type: 'intro',
    });
    return {
      type: 'intro',
    };
  }

  getParamFloor(searchParams) {
    const config = this.floorList$.value;
    const { type } = searchParams;
    const build = this.convertType(searchParams.build) || config[0].build;
    let floor = this.convertType(searchParams.floor) || config[0].floor;
    if (searchParams.floor === 0 || searchParams.floor === '0') {
      floor = 0;
    }
    const section = this.convertType(searchParams.section) || config[0].section;

    dispatchTrigger('visit-floor-page', {
      src: window.location.href,
      build,
      section,
      floor,
    });

    return {
      type,
      build,
      floor,
      section,
    };
  }

  getParamFlat(searchParams) {
    if (!searchParams.id) {
      return this.getParamDefault(searchParams);
    }
    dispatchTrigger('visit-appartment-page', {
      src: window.location.href,
    });
    return {
      type: 'flat',
      id: searchParams.id,
    };
  }

  getParamFavourites(searchParams) {
    dispatchTrigger('visit-favourites-page', {
      src: window.location.href,
    });
    return {
      type: 'favourites',
    };
  }

  getParamPlannings() {
    dispatchTrigger('visit-plannings-page', {
      src: window.location.href,
    });
    return {
      type: 'plannings',
    };
  }

  getParams(searchParams) {
    const config = {
      genplan: 'getParamGenplan',
      flyby: 'getParamFlyby',
      plannings: 'getParamPlannings',
      floor: 'getParamFloor',
      flat: 'getParamFlat',
      intro: 'getParamIntro',
      favourites: 'getParamFavourites',
    };

    let getParam = config[searchParams['type']];

    if (!getParam && searchParams['type']) {
      const { host, pathname, hostname } = location;
      this.ErrorCallbackUpdateLocation(
        this.i18n,
        hostname,
        'Error-popup.messages.invalid-url',
        'low',
        `${host}/${pathname}`,
      )({
        data: {
          urlData: searchParams,
        },
      });
      getParam = 'getParamDefault';
    } else if (!getParam) {
      getParam = 'getParamDefault';
    }
    return this[getParam](searchParams);
  }

  checkFlatInSVG(flyby, id) {
    // получает id квартиры, отдает объект с ключами где есть квартиры
    const result = {};
    for (const num in flyby) {
      for (const side in flyby[num]) {
        const type = flyby[num][side];
        for (const slide in type) {
          for (const list in type[slide]) {
            const hasId = type[slide][list].includes(id.toString());
            if (hasId && !has(result, [num])) {
              result[num] = {};
            }
            if (hasId && !has(result, [num, side])) {
              result[num][side] = [];
            }
            if (hasId) {
              result[num][side].push(+slide);
            }
          }
        }
      }
    }
    return result;
  }

  prepareFlats(flats) {
    const currentFilterFlatsId = flats.reduce((previous, current) => {
      const flat = transform(current, (acc, value, key) => {
        const newValue = +value;
        const params = acc;
        if (!isNaN(newValue) && key !== 'sorts') {
          params[key] = newValue;
        } else {
          params[key] = value;
        }
        return params;
      });
      const key = flat.id;
      return { ...previous, [key]: flat };
    }, {});
    return currentFilterFlatsId;
  }

  async flatJsonIsLoaded(data) {
    this.flatList = this.prepareFlats(data);
    this.availableFlatList = [...Object.entries(this.flatList).filter(el => el[1].sale == 1)];
    this.floorList$.next(this.createFloorsData(data));

    const currentFilterFlatsId = Object.keys(this.flatList);
    this.currentFilteredFlatIds$.next(currentFilterFlatsId);

    const availableFlatsFromList = Object.entries(this.flatList)
      .filter(el => {
        return el[1].sale == 1;
      })
      .map(el => el[0]);

    this.currentFilteredFlatIdsAviableStatus$.next(availableFlatsFromList);

    const generalConfig = {
      getFlat: this.getFlat,
      updateFsm: this.updateFsm,
      fsm: this.fsm,
      typeSelectedFlyby$: this.typeSelectedFlyby$,
      currentFilteredFlatIds$: this.currentFilteredFlatIds$,
      currentFilteredFlatIdsAviableStatus$: this.currentFilteredFlatIdsAviableStatus$,
      availableFlatList: this.availableFlatList,
      currentFilteredFloorsData$: this.currentFilteredFloorsData$,
      activeFlat: this.activeFlat,
      favouritesIds$: this.favouritesIds$,
      show_prices: this.config.show_prices,
      history: this.history,
    };

    dispatchTrigger('flats-loaded', this.flatList);

    const filterModel = new FilterModel(
      {
        flats: this.getFlat(),
        availableFlatList: this.availableFlatList,
        currentFilteredFlatIds$: this.currentFilteredFlatIds$,
        currentFilteredFlatIdsAviableStatus$: this.currentFilteredFlatIdsAviableStatus$,
        currentFilteredFloorsData$: this.currentFilteredFloorsData$,
        typeSelectedFlyby$: this.typeSelectedFlyby$,
        config: this.config.filter,
        currentPage$: this.currentPage$,
        highlightFlybySvgElements$: this.highlightFlybySvgElements$,
        modalManager: this.modalManager,
        updateFsm: this.updateFsm,
        history: this.history,
        show_prices: this.config.show_prices,
        i18n: this.i18n,
        g_notify: (a, b) => {
          this.emit(a, b);
        },
        onChangeFilterState: (state, filterConfig) => {
          if (isEmpty(filterConfig)) return;

          const filterSearchParamsPrefix = SEARCH_PARAMS_FILTER_PREFIX;

          const searchParamsOfFilterState = Object.entries(state).reduce((acc, [key, value]) => {
            const filterName = value[0];
            const filterType = value[1].type;
            switch (filterType) {
              case 'range':
                const rangeInstance = filterConfig[filterName].elem;

                if (rangeInstance.result.from !== rangeInstance.result.min) {
                  acc[`${filterSearchParamsPrefix}${filterName}_min`] = value[1].min;
                }
                if (rangeInstance.result.to !== rangeInstance.result.max) {
                  acc[`${filterSearchParamsPrefix}${filterName}_max`] = value[1].max;
                }
                break;
              case 'checkbox':
                value[1].value.forEach(val => {
                  acc[`${filterSearchParamsPrefix}${filterName}_${val}`] = val;
                });
                break;
              case 'text':
                if (value[1].value) {
                  acc[`${filterSearchParamsPrefix}${filterName}`] = value[1].value;
                }
                break;
            }
            return acc;
          }, {});

          const regExp = new RegExp(`${SEARCH_PARAMS_FILTER_PREFIX}`);

          this.history.removeParamsByRegExp(regExp);

          this.history.pushParams(searchParamsOfFilterState);
        },
      },
      this.i18n,
    );
    const filterView = new FilterView(filterModel, {});
    const filterController = new FilterController(filterModel, filterView);
    this.filter = filterModel;
    filterModel.init();

    const listFlat = new FlatsList(this, this.filter);

    this.popupChangeFlyby = new PopupChangeFlyby(this, this.i18n);

    const searchParams = this.history.parseSearchUrl(window.location);
    const favouritesIds =
      (searchParams?.favourites && searchParams.favourites.split(',').map(id => +id)) || [];

    const fvModel = new FavouritesModel(generalConfig, this.i18n);
    const fvView = new FavouritesView(fvModel, {}, this.i18n);
    const fvController = new FavouritesController(fvModel, fvView);
    this.favourites = fvModel;
    this.favourites.init(favouritesIds);
    const { structure: structureFlats, linksSvg } = await this.getDataFlybys();

    dispatchTrigger('load-svg-structure', { name: 'load-svg-structure' });

    this.structureFlats = structureFlats;
    this.linksSvg = linksSvg;
    this.determineFlybysWhereFlatIsSpecified();
    this.determineFlybysWhereFloorWithFlatIsSpecified();

    // якщо форма з сайту - закоментувати
    this.initForm();

    this.audioAssistant = new AudioAssistant({
      parent: this,
      needToInitialize: get(this.config, 'audioAssistant.needToInitialize', false),
      config: get(this.config, 'audioAssistant.files', false),
      events: ['updateFsm', 'change_keyframe'],
    });

    this.updateFsm(searchParams);
    setTimeout(() => {
      addAnimateBtnTabs('[data-choose-type]', '.js-s3d__choose--flat--button-svg');
      document.querySelector('.js-s3d__choose--flat label').classList.add('active');
    }, 500);
  }

  initForm() {
    this.callbackForm = new FormView({
      modalManager: this.modalManager,
      config: this.config.form,
      i18n: this.i18n,
    });

    this.faqPopup = new faqView({
      modalManager: this.modalManager,
      config: this.config,
      i18n: this.i18n,
    });
    this.progressPopup = new constructionProgressView({
      modalManager: this.modalManager,
      config: this.config,
      i18n: this.i18n,
    });

    window.addEventListener('updateFsm', evt => {
      const data = evt.detail || {};
      const fieldsToPutInForm = [
        { name: 'url', value: window.location.pathname + window.location.search },
      ];

      const fieldMappings = {
        flat: [{ name: 'id', value: data.id }],
        flyby: [{ name: 'page', value: `${data.type}_${data.flyby}_${data.side}` }],
        floor: [
          { name: 'page', value: data.type },
          { name: 'build', value: data.build },
          { name: 'floor', value: data.floor },
          { name: 'section', value: data.section },
        ],
      };

      fieldsToPutInForm.push(...(fieldMappings[data.type] || [{ name: 'page', value: data.type }]));
      this.callbackForm.updateHiddenFields(fieldsToPutInForm);
    });
  }

  determineFlybysWhereFlatIsSpecified() {
    const self = this;
    if (!isObject(this.structureFlats)) return;
    Object.entries(this.structureFlats).forEach(([flyby, flybyValue]) => {
      if (!isObject(flybyValue)) return;
      Object.entries(flybyValue).forEach(([side, sideValue]) => {
        if (!isObject(sideValue)) return;
        Object.entries(sideValue).forEach(([controlPoint, value], index) => {
          if (!isArray(value['flat'])) return;
          value['flat'].forEach(flatId => {
            const flat = this.flatList[flatId];
            if (!flat) return;
            const addParams = {};
            const imageLink = get(self, ['config', 'flyby', flyby, side]);

            const flatSvgLink = get(this.linksSvg, ['flyby', flyby, side, 'flat', controlPoint]);

            if (!flat.flatSvgLink) {
              flat.flatSvgLink = flatSvgLink;
            }

            if (isObject(imageLink)) {
              /* Це для нової пдфки, використовується ця змінна у flatModel */
              addParams.frame_image_url =
                window.location.origin +
                window.defaultModulePath +
                '/' +
                imageLink.imageUrl +
                controlPoint +
                '.' +
                imageLink.image_format;
            }
            if (flatSvgLink) {
              /* Це для нової пдфки, щоб отримати координати квартири на обльоті, використовується ця змінна у flatModel */
              addParams.flatSvgLink = flatSvgLink;
            }
            if (isArray(flat.specifiedFlybys)) {
              flat.specifiedFlybys.push({
                flyby,
                side,
                controlPoint,
                controlPointTitle: index + 1,
                ...addParams,
              });
            } else {
              flat.specifiedFlybys = [
                { flyby, side, controlPoint, controlPointTitle: index + 1, ...addParams },
              ];
            }

            const thisFlybySettings = get(this.config, ['flyby', flyby, side], {});
            const { imageUrl, image_format } = thisFlybySettings;
            const flatSvgFlybyImageHref =
              window.defaultModulePath + '/' + imageUrl + controlPoint + '.' + image_format;

            if (!flat.flybyImageHref) {
              flat.flybyImageHref = flatSvgFlybyImageHref;
            }
          });
        });
      });
    });
  }

  determineFlybysWhereFloorWithFlatIsSpecified() {
    if (!isObject(this.structureFlats)) return;
    Object.entries(this.structureFlats).forEach(([flyby, flybyValue]) => {
      if (!isObject(flybyValue)) return;
      Object.entries(flybyValue).forEach(([side, sideValue]) => {
        if (!isObject(sideValue)) return;
        Object.entries(sideValue).forEach(([controlPoint, value], index) => {
          if (!isArray(value['floor'])) return;
          value['floor'].forEach(flatId => {
            const flat = this.flatList[flatId];
            if (!flat) return;
            if (isArray(flat.specifiedFloorFlybys)) {
              flat.specifiedFlybys.push({
                flyby,
                side,
                controlPoint,
                controlPointTitle: index + 1,
              });
            } else {
              flat.specifiedFloorFlybys = [
                { flyby, side, controlPoint, controlPointTitle: index + 1 },
              ];
            }
          });
        });
      });
    });
  }

  createStructureSvg() {
    const types = ['floor', 'flat'];
    const flyby = {};
    const conf = this.config.flyby;
    for (const num in conf) {
      flyby[num] = {};
      for (const side in conf[num]) {
        const type = conf[num][side];
        flyby[num][side] = {};
        type.controlPoint.forEach(slide => {
          flyby[num][side][slide] = {};
          types.forEach(typeSvg => {
            flyby[num][side][slide][typeSvg] = [];
            $.ajax(`./assets/s3d/images/svg/${typeSvg}/flyby/${num}/${side}/${slide}.svg`).then(
              responsive => {
                const list = [...responsive.querySelectorAll('polygon')];
                const ids = list.map(el => +el.dataset.id).filter(el => el);
                flyby[num][side][slide][typeSvg] = ids;
              },
            );
          });
        });
      }
    }
    setTimeout(() => {
      // console.log(JSON.stringify(flyby));
    }, 10000);
  }

  changePopupFlyby(config, id) {
    this.popupChangeFlyby.updateContent(id);
    this.popupChangeFlyby.openPopup(config);
  }

  compass(deg) {
    this.emit('updateCompassRotate', deg);
  }

  horizontalCompass(translateX, activeFlyby) {
    if (
      this.fsm.settings.type == activeFlyby.type &&
      this.fsm.settings.flyby == activeFlyby.flyby &&
      this.fsm.settings.side == activeFlyby.side
    ) {
      this.emit('updateHorizontalCompass', translateX);
    }
  }

  updateLastVisitedFloor(data) {
    document.querySelectorAll('.js-s3d-nav__btn[data-type="floor"]').forEach(el => {
      if (el.closest('[data-dont-make-me-active]')) return;
      Object.entries(data).forEach(configPoint => {
        el.dataset[configPoint[0]] = configPoint[1];
      });
    });
  }

  nextHistory(name, dontUpdateLocalHistory) {
    if (this['history'] && this['history'].next) {
      this.history.next(name, dontUpdateLocalHistory);
      return true;
    }
    return false;
  }

  changeViewBlock(name, delay = 400) {
    const self = this;
    setTimeout(() => {
      self.emit('changeBlockActive', name);
    }, delay);
  }

  async requestGetFlats() {
    const url =
      status === 'prod' || status === 'dev'
        ? '/wp-admin/admin-ajax.php'
        : `${defaultStaticPath}/grand-burge-flats.json`;

    const method = status === 'prod' || status === 'dev' ? 'post' : 'get';
    const params = { action: 'getFlats' };

    if (this.currency) {
      params.currency = this.currency;
    }
    const data = await asyncRequest({
      url,
      method,
      data: params,
    });
    if (!data) {
      ErrorGetFlatsData(
        this.i18n,
        window.location.href,
        'Не отримані дані про квартири',
        'high',
      )({ data: 'Flat data is not recieved, test flats are showed' });
      console.error('Flat data is not recieved, test flats are showed');
      return mockFlats;
      throw AppContentCustomError({
        requestData: {
          url,
          method,
          data: { action: 'getFlats' },
        },
        response: data,
      });
    }
    return data;
  }

  createFloorsData(flats) {
    let data = flats.reduce((acc, flat) => {
      const isIndexFloor = acc.findIndex(
        cur =>
          +cur.floor === +flat.floor &&
          +cur.build === +flat.build &&
          +cur.section === +flat.section,
      );

      if (flat.level == '2' && isIndexFloor >= 0) {
        const { free } = acc[isIndexFloor];
        const currentFloor = cloneDeep(acc[isIndexFloor]);
        currentFloor.count += 1;
        currentFloor.free = flat.sale === '1' ? free + 1 : free;
        currentFloor.flatsIds.push(+flat.id);
        acc[isIndexFloor] = currentFloor;
        const filteredFlatsForSecondLevel = flats.filter(
          flat1 =>
            flat1.level === '2' &&
            +flat1.floor === +flat.floor &&
            +flat1.section === +flat.section &&
            +flat1.build === +flat.build,
        );
        // return acc;
        if (
          acc.some(el => {
            return (
              el.floor == +flat.floor + 1 && el.build == +flat.build && el.section == +flat.section
            );
          })
        ) {
          return [...acc];
        }
        return [
          ...acc,
          {
            floor: +flat.floor + 1,
            build: +flat.build,
            section: +flat.section,
            count: filteredFlatsForSecondLevel.map(el => el.id).length,
            flatsIds: filteredFlatsForSecondLevel.map(el => el.id),
            free: filteredFlatsForSecondLevel.map(el => el.id).length,
          },
        ];
      }
      if (isIndexFloor >= 0) {
        const { free } = acc[isIndexFloor];
        const currentFloor = cloneDeep(acc[isIndexFloor]);
        currentFloor.count += 1;
        currentFloor.free = flat.sale === '1' ? free + 1 : free;
        currentFloor.flatsIds.push(+flat.id);
        acc[isIndexFloor] = currentFloor;
        return acc;
      }
      return [
        ...acc,
        {
          floor: +flat.floor,
          build: +flat.build,
          section: +flat.section,
          count: 1,
          flatsIds: [+flat.id],
          free: +(flat.sale === '1'),
        },
      ];
    }, []);
    return this.addDataToFloorsList(data);
  }

  addDataToFloorsList(floorList = []) {
    const propertiesList = get(
      this,
      ['config', 'floor', 'flatPropertiesToShowInFloor'],
      (() => {
        console.warn('config.floor.flatPropertiesToShowInFloor is not defined');
        return [];
      })(),
    );

    return floorList.map(floor => {
      const floorProperties = propertiesList.reduce((acc, property) => {
        const values = floor.flatsIds.map(flatId => {
          const flat = this.getFlat(flatId);
          return flat[property['key']];
        });

        const finalPropertyValue = [
          this.i18n.t(get(property, 'prefix', '')),
          Math.min(...values),
          this.i18n.t(get(property, 'postfix', '')),
        ].join(' ');

        return {
          ...acc,
          [property['key']]: {
            value: finalPropertyValue,
            value_raw: Math.min(...values),
            type: property.type,
            size: property.size,
          },
        };
      }, {});
      return {
        ...floor,
        properties: floorProperties,
        // price_from: Math.min(...prices),
      };
    });
  }

  changeChooseActive(type) {
    this.typeSelectedFlyby$.next(type);
  }
  /**
   *
   * @param {*} data
   * @param {*} nextHistory
   * @param {*} sliderData - Обьект с параметрами (controlPoint - ключевой кадр куда перейдет модель, id - квартира, которая подсветится)
   * @param {*} cb - функция которая срабатывает при первой загрузке SliderModel когда изображения для облета загружены
   * @returns
   */
  updateFsm(data, nextHistory = true, sliderData, cb) {
    const settings = this.getParams(data);
    dispatchTrigger('visit-page', {
      page: settings['type'],
      url: window.location.href,
    });
    const { type, flyby, side, id } = settings;
    const config = has(this.config, [type, flyby, side])
      ? this.config[type][flyby][side]
      : this.config[type];
    if (type === this.fsm.state && this.fsm.state !== 'flyby' && this.fsm.state !== 'flat') return;
    if (id) {
      this.activeFlat = +id;
      config.flatId = +id;
    }
    // prepare settings params before use
    if (nextHistory) {
      const favourites =
        this.favouritesIds$.value.length > 0 ? { favourites: this.favouritesIds$.value } : {};

      const currentSearchParams = Object.entries(this.history.parseSearchUrl(window.location))
        .filter(([key, value]) => {
          return !/flyby|side/.test(key);
        })
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
      const urlParams = {
        ...currentSearchParams,
        ...settings,
        ...favourites,
      };
      if (data.markedFlat) {
        urlParams.markedFlat = data.markedFlat;
      }
      if (nextHistory === 'dontUpdateLocalHistory') {
        this.nextHistory(urlParams, 'dontUpdateLocalHistory');
      } else {
        this.nextHistory(urlParams);
      }
      this.emit('updateFsm', data);
      dispatchTrigger('updateFsm', {
        ...data,
        getFlat: this.getFlat,
        getFloor: this.getFloor,
        s3dHistory: this.history,
      });
      dispatchTrigger('visit-page', {
        page: settings['type'],
        url: window.location.href,
      });
      this.modalManager.closeAll();
    }

    config.type = data.type;
    config.activeFlat = this.activeFlat;
    config.hoverData$ = this.hoverData$;
    config.compass = this.compass; // ?
    config.horizontalCompass = this.horizontalCompass; // ?
    config.updateFsm = this.updateFsm;
    config.linksSvg = this.linksSvg;
    config.pin = this.pin;
    config.sliderPopup = this.sliderPopup;
    config.pinsInfo = this.pinsInfo;
    config.structureFlats = this.structureFlats;
    config.history = this.history;
    config.getFlat = this.getFlat;
    config.flatsList = this.flatList;
    config.typeSelectedFlyby$ = this.typeSelectedFlyby$;
    config.currentFilteredFlatIds$ = this.currentFilteredFlatIds$;
    config.currentFilteredFlatIdsAviableStatus$ = this.currentFilteredFlatIdsAviableStatus$;
    config.currentFilteredFloorsData$ = this.currentFilteredFloorsData$;
    config.infoBox = this.infoBox;
    config.floorList$ = this.floorList$;
    config.browser = this.browser;
    config.favouritesIds$ = this.favouritesIds$;
    config.updateLastVisitedFloor = this.updateLastVisitedFloor;
    config.flatList = this.flatList;
    config.getFlybyMinPriceM2 = this.getFlybyMinPriceM2;
    config.getFlybyMinPrice = this.getFlybyMinPrice;
    config.highlightFlybySvgElements$ = this.highlightFlybySvgElements$;
    config.currentPage$ = this.currentPage$;
    config.unit_statuses = this.unit_statuses;
    config.cacheFloor = this.cacheFloor;
    config.assotiated_flat_builds_with_flybys = this.config.assotiated_flat_builds_with_flybys;
    config.flyby_finish_dates = this.config.flyby_finish_dates;
    config.projectDocs = this.projectDocs;
    config.exteriorData = this.exteriorData;
    config.financialTermsData = this.financialTermsData;
    config.constructionProgressData = this.constructionProgressData;
    config.constructionProgressDataList = this.constructionProgressDataList;
    config.modalManager = this.modalManager;
    config.social_media_links = this.config.social_media_links;
    config.manager_info = this.config.manager_info;
    config.g_contacts = this.config.g_contacts;
    config.show_phoneNumber = this.config.show_phoneNumber;
    config.g_contact_advantaged_list = this.config.g_contact_advantaged_list;
    config.project_google_map_location = this.config.project_google_map_location;
    config.slider_scale_container_logo = this.config.slider_scale_container_logo;

    // config.constructionProgressItemById = this.constructionProgressItemById;
    config.show_prices = this.config.show_prices;
    config.floor_page_settings = this.config.floor;
    config.parent = this;
    config.g_notify = this.emit;
    config.g_subscribe_events = this.on;

    this.fsm.dispatch(settings, this, config, this.i18n, sliderData, cb);
  }

  mappingConfiguration = {
    filterShow: flag =>
      this.emit('changeClass', { target: '.js-s3d-filter', flag, changeClass: 's3d-show' }),
    planningFilterShow: flag =>
      this.emit('changeClass', {
        target: '.js-s3d-filter',
        flag,
        changeClass: 's3d-planning-filter-wrap',
      }),
    controllerInfoBox: flag =>
      this.emit('changeClass', { target: '.js-s3d-infoBox', flag, changeClass: 's3d-show' }),

    controllerCompass: flag =>
      this.emit('changeClass', { target: '.js-s3d__compass', flag, changeClass: 's3d-display' }),

    controllerTabs: flag =>
      this.emit('changeClass', { target: '#js-s3d-ctr__elem', flag, changeClass: 's3d-display' }),

    controllerMenu: flag =>
      this.emit('changeClass', { target: '.js-s3d-ctr__menu-3d', flag, changeClass: 's3d-show' }),
    controllerMenuButtons: flag =>
      this.emit('changeClass', {
        target: '.js-s3d-ctr__menu-3d-buttons',
        flag,
        changeClass: 's3d-display',
      }),

    controllerFilter: flag =>
      this.emit('changeClass', { target: '.js-s3d-ctr__filter', flag, changeClass: 's3d-display' }),
    controllerHelper: flag =>
      this.emit('changeClass', { target: '.js-s3d-ctr__helper', flag, changeClass: 's3d-display' }),
    controllerInfrastructure: flag =>
      this.emit('changeClass', {
        target: '.js-s3d-ctr__infra-button',
        flag,
        changeClass: 's3d-display',
      }),
    controllerChoose: flag =>
      this.emit('changeClass', {
        target: '.js-s3d__choose--flat',
        flag,
        changeClass: 's3d-display',
      }),
    controllerThemeChoose: flag =>
      this.emit('changeClass', { target: '.js-s3d-ctr__theme', flag, changeClass: 's3d-display' }),

    preloaderMini: flag =>
      this.emit('changeClass', {
        target: '.js-fs-preloader-before',
        flag,
        changeClass: 's3d-show',
      }),
  };

  iteratingConfig(delay = 400) {
    const width = document.documentElement.offsetWidth;
    const typeDevice = width > 992 ? 'desktop' : 'mobile';
    if (!this.fsm.state) return;
    const state = this.fsmConfig[this.fsm.state][typeDevice];
    const settings = Object.keys(state);
    const updatedSettings = () =>
      settings.forEach(name => {
        if (this.mappingConfiguration[name]) {
          this.mappingConfiguration[name](state[name]);
        }
      });
    setTimeout(updatedSettings, delay);
  }

  checkNextFlyby(data, id) {
    if (id === undefined) {
      return null;
    }
    // :todo  пересмотреть нужна ли эта функция
    const includes = this.checkFlatInSVG(this.structureFlats, id);
    const setting = this.fsm.settings;

    if (size(includes) === 0) {
      console.warn('flat are not found in svg  id №:', id);
      return null;
    }

    if (has(includes, [data.flyby, data.side])) {
      return {
        type: 'flyby',
        flyby: data.flyby,
        side: data.side,
        slides: includes[data.flyby][data.side],
        change: false,
      };
    }

    if (has(includes, [setting.flyby, setting.side])) {
      return {
        type: 'flyby',
        flyby: setting.flyby,
        side: setting.side,
        method: 'search',
        slide: includes[setting.flyby][setting.side],
        change: false,
      };
    }

    const key1 = Object.keys(includes);
    const key2 = Object.keys(includes[key1[0]]);
    const slides = includes[key1[0]][key2[0]];
    let change = false;
    if (setting.type !== 'flyby' || setting.flyby !== key1 || setting.side !== key2) {
      change = true;
    }

    return {
      type: 'flyby',
      flyby: key1[0],
      side: key2[0],
      slides,
      change,
    };
  }

  getCurrency() {
    return this.currency ? this.currency : Object.keys(this.flatList)[0].currency || 'USD';
  }

  /**
   * Retrieves the minimum price for a given flyby and side.
   *
   * @param {string} flyby - The flyby identifier.
   * @param {string} side - The side identifier.
   * @returns {number} The minimum price for the specified flyby and side.
   */
  getFlybyMinPrice(flyby, side) {
    const key = `${flyby}-${side}`;

    const flybyAndBuildNamesMap = get(this, ['config', 'assotiated_flat_builds_with_flybys'], {});

    if (!this.flybyMinPriceM2Cache) {
      this.flybyMinPriceCache = {};
    }
    const cached = this.flybyMinPriceCache[key];
    if (cached) {
      return cached;
    }
    Object.values(this.flatList).forEach(flat => {
      if (!flat.price || flat.price == 0) return;
      const priceFormatted = +flat.price.toString().replace(/\s/g, '');
      if (flat.sale != 1) return;
      if (
        !flybyAndBuildNamesMap[key] ||
        flybyAndBuildNamesMap[key].includes(flat.build.toString()) === false
      )
        return;
      if (!this.flybyMinPriceCache[key]) {
        this.flybyMinPriceCache[key] = priceFormatted;
      } else {
        this.flybyMinPriceCache[key] = Math.min(this.flybyMinPriceCache[key], priceFormatted);
      }
    });
    return this.flybyMinPriceCache[key];
  }

  /**
   * Retrieves the minimum price per square meter for a given flyby and side.
   *
   * @param {string} flyby - The flyby identifier.
   * @param {string} side - The side identifier.
   * @returns {number} The minimum price per square meter.
   */
  getFlybyMinPriceM2(flyby, side) {
    const key = `${flyby}-${side}`;
    const flybyAndBuildNamesMap = get(this, ['config', 'assotiated_flat_builds_with_flybys'], {});

    if (!this.flybyMinPriceM2Cache) {
      this.flybyMinPriceM2Cache = {};
    }
    const cached = this.flybyMinPriceM2Cache[key];
    if (cached) {
      return cached;
    }
    Object.values(this.flatList).forEach(flat => {
      if (!flat.price_m2 || flat.price_m2 == 0) return;
      const priceFormatted = +flat.price_m2.toString().replace(/\s/g, '');
      if (flat.sale != 1) return;
      if (
        !flybyAndBuildNamesMap[key] ||
        flybyAndBuildNamesMap[key].includes(flat.build.toString()) === false
      )
        return;
      if (!this.flybyMinPriceM2Cache[key]) {
        this.flybyMinPriceM2Cache[key] = priceFormatted;
      } else {
        this.flybyMinPriceM2Cache[key] = Math.min(this.flybyMinPriceM2Cache[key], priceFormatted);
      }
    });
    return this.flybyMinPriceM2Cache[key];
  }

  handleHighlightFlybySvgElements() {
    document.querySelector(
      '[data-hightlight-svg-elements]',
    ).checked = this.highlightFlybySvgElements$.value;

    document.querySelector('[data-hightlight-svg-elements]').addEventListener('change', () => {
      this.highlightFlybySvgElements$.next(!this.highlightFlybySvgElements$.value);
    });

    this.highlightFlybySvgElements$.subscribe(val => {
      document.querySelector('[data-hightlight-svg-elements]').checked = val;
      this.emit('highlight-flyby-svg-elements', val);
    });
  }

  handleMobile3dButtonsMenu() {
    if (!document.documentElement.classList.contains('mobile')) return;
    const menuButton = document.querySelector('#js-s3d-ctr__menu-3d-buttons-mobile');
    const menu = document.querySelector('.js-s3d-ctr__menu-3d-buttons');
    menuButton.addEventListener('change', () => {
      if (menuButton.checked) {
        menu.classList.add('s3d-show');
        this.modalManager.open('mobile-3d-buttons-menu');
      } else {
        menu.classList.remove('s3d-show');
      }
    });

    this.modalManager.push({
      close: () => {
        menuButton.checked = false;
        menu.classList.remove('s3d-show');
      },
      id: 'mobile-3d-buttons-menu',
    });
  }

  /**
   * Retrieves the finish date for a specific flyby and side.(no translation)
   *
   * @param {string} flyby - The flyby identifier.
   * @param {string} side - The side identifier.
   * @returns {Date|undefined} The finish date for the specified flyby and side, or undefined if not found.
   */
  getFlybyFinishDate(flyby, side) {
    const finishDate = get(this, ['config', 'flyby_finish_dates', `${flyby}-${side}`], undefined);

    if (finishDate === undefined) return undefined;
    let $finishDate = finishDate;

    const regex = /\[\[\d+\]\]/;
    const isNeedToExtractFinishDateFromFlatList = finishDate.match(regex);

    if (isNeedToExtractFinishDateFromFlatList) {
      const ectractedBuildName = $finishDate.match(/\d+/)[0];
      const flatWithFinishDate = Object.values(this.flatList).find(
        flat => flat.build == ectractedBuildName,
      );
      if (flatWithFinishDate) {
        $finishDate = flatWithFinishDate.project_deadline;
      }
    }

    return $finishDate;
  }

  /**
   * Retrieves documentation data asynchronously.
   * @async
   * @function asyncGetDocumentation
   * @memberof AppModel
   * @returns {Promise<void>} A promise that resolves when the documentation data is retrieved.
   */
  async asyncGetDocumentation() {
    if (this.config.hideDocumentation) return;
    const url =
      window.status === 'local'
        ? `${defaultStaticPath}/documentation-mock.json`
        : '/wp-admin/admin-ajax.php';
    const method = window.status === 'local' ? 'get' : 'post';

    try {
      const docsData = await asyncRequest({
        url,
        method,
        data: {
          action: 'getDocumentation',
        },
      });
      if (Array.isArray(docsData)) {
        this.projectDocs = [...docsData];
      }
    } catch (err) {}
  }

  async asyncGetExterior() {
    if (this.config.hideExterior) return;
    const url =
      window.status === 'local'
        ? `${defaultStaticPath}/exterior-mock.json`
        : '/wp-admin/admin-ajax.php';
    const method = window.status === 'local' ? 'get' : 'post';

    try {
      const exteriorData = await asyncRequest({
        url,
        method,
        data: {
          action: 'getExterior',
        },
      });
      if (Array.isArray(exteriorData)) {
        this.exteriorData = [...exteriorData];
      }
    } catch (err) {}
  }

  async asyncGetFinancialTerms() {
    if (this.config.hideFinancialTerms) return;
    const url =
      window.status === 'local'
        ? `${defaultStaticPath}/financial-terms-mock.json`
        : '/wp-admin/admin-ajax.php';
    const method = window.status === 'local' ? 'get' : 'post';

    try {
      const docsData = await asyncRequest({
        url,
        method,
        data: {
          action: 'getFinancialTerms',
        },
      });
      if (Array.isArray(docsData)) {
        this.financialTermsData = [...docsData];
      }
    } catch (err) {}
  }
  async asyncGetConstructionProgress() {
    if (this.config.hideConstructionProgress) return;
    const url =
      window.status === 'local'
        ? `${defaultStaticPath}/construction-progress-mock.json`
        : '/wp-admin/admin-ajax.php';
    const method = window.status === 'local' ? 'get' : 'post';

    try {
      const constructionProgressData = await asyncRequest({
        url,
        method,
        data: {
          action: 'getConstructionProgress',
        },
      });
      if (isObject(constructionProgressData)) {
        this.constructionProgressData = { ...constructionProgressData };
      }
    } catch (err) {}
  }
  async asyncGetConstructionProgressList() {
    if (this.config.hideConstructionProgress) return;

    const url =
      window.status === 'local'
        ? `${defaultStaticPath}/construction-progress-mock-list.json`
        : '/wp-admin/admin-ajax.php';
    const method = window.status === 'local' ? 'get' : 'post';

    try {
      const constructionProgressDataList = await asyncRequest({
        url,
        method,
        data: {
          action: 'getConstructionProgressList',
        },
      });

      if (Array.isArray(constructionProgressDataList)) {
        this.constructionProgressDataList = constructionProgressDataList;
      } else {
        console.warn(
          'Expected an array for constructionProgressDataList, but received:',
          constructionProgressDataList,
        );
        this.constructionProgressDataList = []; // Default to empty array
      }
    } catch (err) {
      console.error('Error fetching construction progress data:', err);
    }
  }

  async asyncGetConstructionProgressItemById(id) {
    if (this.config.hideConstructionProgress) return;
    const url =
      window.status === 'local'
        ? `${defaultStaticPath}/construction-progress-mock-id.json`
        : '/wp-admin/admin-ajax.php';
    const method = window.status === 'local' ? 'get' : 'post';

    try {
      const constructionItemData = await asyncRequest({
        url,
        method,
        data: {
          action: 'getConstructionProgressItemById',
          id,
        },
      });
      if (isObject(constructionItemData)) {
        this.constructionProgressDataItemById = [...constructionItemData];
      }
    } catch (err) {
      console.warn(err);
    }
  }
}

export default AppModel;
