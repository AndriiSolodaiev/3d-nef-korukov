import $ from 'jquery';
import axios from 'axios';
import { BehaviorSubject } from 'rxjs';
import size from 'lodash/size';
import debounce from 'lodash/debounce';
import EventEmitter from '../eventEmitter/EventEmitter';
import { preloader,  preloaderWithoutPercent } from '../general/General';
import Svg from '../Svg';
import { AppNetworkError } from '../errors';
import gsap from 'gsap';
import { themeFactory } from '../templates/controller/$theme';
import SliderPopup from '../sliderPopup/sliderPopup';
import {
  compareObjectByKeys,
  getBrowser,
  isMobile,
  loader,
  millisToMinutesAndSeconds,
  isFullUrl,
} from '../helpers/helpers';
import dispatchTrigger from '../helpers/triggers';
import browserInfo from '../helpers/browserInfo';
import PinchZoom from 'pinch-zoom-js';
import { detect } from 'detect-browser';
import getMobileScaleContainerTitle, { $mobileScaleSwitcher } from '../templates/slider/getMobileScaleContainerTitle';
import device from 'current-device';
import {
  isDesktop,
  isDesktopTouchMode,
  isTablet,
} from '../../../../s3d2/scripts/helpers/helpers_s3d2';

class SliderModel extends EventEmitter {
  constructor(config, i18n) {
    super();
    this.type = config.type;
    this.id = config.id;
    this.settings = config.settings;
    this.browser = config.browser;
    // this.nextSlideId = config.activeSlide;
    this.imageUrl = config.imageUrl;
    this.sd_imageUrl = config.sd_imageUrl;
    this.imageUrlDark = config.imageUrlDark;
    this.image_format = config.image_format || 'jpg';
    this.activeElem = config.activeSlide;
    this.controlPoint = config.controlPoint;
    this.getFlat = config.getFlat;
    this.activeFlat = config.activeFlat;
    this.hoverData$ = config.hoverData$;
    this.numberSlide = config.numberSlide;
    this.flatsList = config.flatsList;
    this.linksSvg = config.linksSvg;
    this.structureFlats = config.structureFlats;
    this.infoBox = config.infoBox;
    this.typeSelectedFlyby$ = config.typeSelectedFlyby$;
    this.currentFilteredFlatIds$ = config.currentFilteredFlatIds$;
    this.currentFilteredFloorsData$ = config.currentFilteredFloorsData$;
    this.flatList = config.flatList;
    this.pin = config.pin;
    this.sliderPopup = config.sliderPopup;
    this.verticalAlign = config.verticalAlign || 'center';
    this.horizontalAlign = config.horizontalAlign || 'center';

    this.compass = config.compass;
    this.currentCompassDeg = 0;
    this.startDegCompass = config.startDegCompass;

    /**Values for new compass */
    this.horizontalCompass = config.horizontalCompass;
    this.frameWithNorthDirection = config.frameWithNorthDirection;
    this.horizontalCompassX = config.horizontalCompassX;
    this.arrayOfPreparedCompassTranslation = [].fill(0, 0, this.numberSlide.max);
    this.prepareArrayOfCompassTranslation();
    /**Values for new compass END */

    this.i18n = i18n;
    this.theme = config.defaultTheme || 'light';

    this.updateFsm = config.updateFsm;
    this.wrapper = config.wrapper;
    this.wrapperSvg = config.wrapperSvg;
    this.wrapperEvent = '.js-s3d__svgWrap';
    this.preloaderWithoutPercent = preloaderWithoutPercent();
    // images in slider
    this.ctx = this.wrapper.find(`#js-s3d__${this.id}`)[0].getContext('2d'); // Контекст
    this.height = 1080;
    this.width = 1920;
    // images in slider end

    // data for rotate
    this.x = 0;
    this.pret = 0;
    this.amountSlideForChange = 0;
    this.arrayImages = [];
    this.arrayBase64Images = [];
    this.imagesStore = {};
    this.mouseSpeed = config.mouseSpeed;
    this.rotateSpeedDefault = config.rotateSpeedDefault;
    this.rotateSpeed = config.rotateSpeed;
    this.nearestControlPoint = {
      min: config.numberSlide.min,
      max: config.numberSlide.max,
    };
    // data for rotate end

    // flags
    this.isKeyDown = false;
    this.isRotating$ = new BehaviorSubject(false); // вращается сейчас слайдер или нет
    // flags end

    this.activeSvg = null;
    this.animates = () => {};
    this.Activebuild = config.Activebuild;
    this.progress = 0;
    this.preloader = preloader;
    this.browser = config.browser;
    this.sliderDataWithHistory = config.sliderDataWithHistory;
    this.cbOnInit = config.cbOnInit;
    this.init = this.init.bind(this);
    this.changeNext = this.changeNext.bind(this);
    this.changePrev = this.changePrev.bind(this);
    this.toSlideNum = this.toSlideNum.bind(this);
    this.setSvgActive = this.setSvgActive.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.history = config.history;
    this.floorList$ = config.floorList$;
    this.pinsInfo = config.pinsInfo;
    this.assotiated_flat_builds_with_flybys = config.assotiated_flat_builds_with_flybys || {};
    this.flyby_finish_dates = config.flyby_finish_dates || {};

    this.g_getFlybyMinPriceM2 =
      config.getFlybyMinPriceM2 ||
      function() {
        return '';
      };
    this.g_getFlybyMinPrice =
      config.getFlybyMinPrice ||
      function() {
        return '';
      };

    this.enableParalax = config.enableParalax;
    this.enableClouds = config.enableClouds;

    this.PARALAX_AMOUNT = 7; //в пікселях
    this.show_prices = config.show_prices;

    this.isRotating$.subscribe(value => {
      document.querySelectorAll('.s3d-ctr__menu-3d-compass-nav').forEach(el => {
        el.style.pointerEvents = value ? 'none' : '';
        el.style.opacity = value ? '0.5' : '';
      });
    });
    this.video_keyframes = config.video_keyframes || {};
    this.videoKeyframesToRender = {};
    this.SLIDER_MOBILE_FINGER_SWIPE = config.SLIDER_MOBILE_FINGER_SWIPE || false;
    this.DISABLE_MOBILE_ZOOM = config.DISABLE_MOBILE_ZOOM || false;
    this.show_flat_polygons_tooltip = config.show_flat_polygons_tooltip || false;
    this.show_flat_polygons_tooltip_key = config.show_flat_polygons_tooltip_key || false;
    this.parent = config.parent;
    this.slider_scale_container_logo = config.slider_scale_container_logo || null;
    this.g_subscribe_events = config.g_subscribe_events || function() {};
    this.g_subscribe_events('filter-container-switch-view', isOpen => {
      if (!isDesktop()) return;
      this.wrapper[0]
        .querySelector('.js-s3d__wrapper__canvas')
        .classList.toggle('with-filter', isOpen);
    });
  }

  disableInfoBox() {
    this.infoBox.changeState('static');
    this.infoBox.disable(true);
  }

  sliderRotateEnd(event) {
    if (
      event.target.classList.contains('s3d__button') ||
      event.target.classList.contains('s3d-infoBox__link')
    )
      return;
    this.activeAnimateFrame(false);

    if (this.isKeyDown) {
      this.isKeyDown = false;
      this.emit('changeContainerCursor', 'grab');
      if (!this.controlPoint.includes(this.activeElem)) {
        this.checkDirectionRotate();
      } else {
        this.changeSvgActive(this.activeElem);
        this.emit('showActiveSvg');
        this.infoBox.disable(false);
      }
    }
  }

  sliderRotateStart(event) {
    if (
      event.target.classList.contains('s3d__button') ||
      this.isRotating$.value ||
      event.target.classList.contains('s3d-infoBox__link') // если клик по кнопкам/ссылке или модуль вращается то выходим
    )
      return;
    this.isKeyDown = true;
    this.emit('changeContainerCursor', 'grabbing');
    this.cancelAnimateSlide();
    this.writingStartPosCursor.call(this, event);
    this.activeAnimateFrame(true);
  }

  mouseMoveHandler(event) {
    if (this.isRotating$.value) {
      return;
    }

    if (this.isKeyDown) {
      this.infoBox.disable(true);
      this.emit('hideActiveSvg');
      this.checkMouseMovement.call(this, event);
    } else if (event.target.tagName === 'polygon') {
      const config = {
        ...event.target.dataset,
      };

      this.infoBox.updatePosition(event);
      this.infoBox.changeState('hover', config);
    } else if (event.target.closest('g[data-type]')) {
      const config = {
        ...event.target.closest('g[data-type]').dataset,
      };

      this.infoBox.updatePosition(event);
      this.infoBox.changeState('hover', config);
    } else {
      this.infoBox.changeState('static');
    }

    this.changeFlybyTooltipZPosition(event);
  }

  changeFlybyTooltipZPosition(event) {
    if (event.target.dataset.type === 'flyby') {
      const svgWrap = event.target.closest('svg');
      const id = `tooltip${event.target.dataset.flyby}-${event.target.dataset.side}`;
      svgWrap.querySelectorAll(`[data-build-flat-count-element][data-id="${id}"]`).forEach(el => {
        if (!el.nextElementSibling) return;
        svgWrap.insertAdjacentElement('beforeend', el);
      });
    }
  }

  touchPolygonHandler(event) {
    event.preventDefault();
    if (this.isRotating$.value) {
      return;
    }
    const mapping = {
      slider_popup: (type, id) => {
        if (!this.sliderPopup[id]) {
          console.warn(`slider images with ID ${id} not found`);
          return;
        }
        new SliderPopup(this.sliderPopup[id]).render();
      },
      section: type => this.updateFsm({ type, ...event.currentTarget.dataset }),
      flyby: type => this.updateFsm({ type, ...event.currentTarget.dataset }, true),
      floor: type => this.updateFsm({ type, ...event.currentTarget.dataset }),
      flat: type => this.updateFsm({ type, ...event.currentTarget.dataset }, true, {}),
    };

    // todo: нужно переписать нормально, убрать условные конструкции
    const { type, id } = event.currentTarget.dataset;

    if (
      type === 'flat' &&
      (id == '1081' || id == '1083') &&
      this.settings.flyby == '1' && this.settings.side == 'outside'
    ) {
      let flyby = '1';
      let side = 'inside';
      if (id == '1083') flyby = '2';

      this.createAndAnimate(event);
      this.updateFsm({ type: 'flyby', flyby, side, change: true });
      return;
    }

    if (type === 'flat') {
      if (!id) return;
      const flat = this.getFlat(+id);
      if (flat.sale !== 1) return;
    }

    if (/flyby|flat|floor/.test(type)) {
      this.createAndAnimate(event);
    }

    this.infoBox.changeState('static');
    if (mapping[type]) {
      mapping[type](type, id);
    }
  }

  touchPolygonMobileHandler(event) {
    event.preventDefault();
    if (this.isRotating$.value) {
      return;
    }
    const config = {
      ...event.target.dataset,
    };
    this.emit('showSelectPolygon', event.target);
    dispatchTrigger('infobox-open', {});
    this.infoBox.changeState('hover', config);
  }

  keyPressHandler(event) {
    let data;
    switch (event.keyCode) {
      case 37:
      case 100:
        data = 'prev';
        break;
      case 39:
      case 102:
        data = 'next';
        break;
      default:
        return false;
    }
    this.checkDirectionRotate(data);
    return true;
  }

  createAndAnimate(event) {
    console.log('touchPolygonHandler', this);
    const clonedImage = this.wrapperSvg.cloneNode(true);
    const targetCenterX =
      event.target.getBoundingClientRect().left + event.target.getBoundingClientRect().width / 2;
    const targetCenterY =
      event.target.getBoundingClientRect().top + event.target.getBoundingClientRect().height / 2;
    const targetW = event.target.getBoundingClientRect().width;
    const targetHeight = event.target.getBoundingClientRect().height;

    const ratio = window.innerWidth / targetW;
    console.log('ratio', ratio);

    clonedImage.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      pointer-events: none;
      z-index: 1000;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform-origin: ${targetCenterX}px ${targetCenterY}px;

    `;
    const tempWrap = document.createElement('div');
    tempWrap.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      pointer-events: none;
      z-index: 1000;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform-origin: ${targetCenterX}px ${targetCenterY}px;
    `;
    const svgToAnimate = `
      <svg width="${window.innerWidth}" height="${window.innerHeight}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <mask id="cutout">
            <!-- Все біле — видиме, чорне — прозоре -->
            <rect width="100%" height="100%" fill="white" />
            <rect data-animated-rect x="${targetCenterX}" y="${targetCenterY}" width="1" height="1" fill="black" />
          </mask>
        </defs>
        <g mask="url(#cutout)" style="transform-origin: ${targetCenterX}px ${targetCenterY}px;" >
          <image href="${clonedImage.src}" width="100%" height="100%" fill="#d3d3d3" style="transform-origin: ${targetCenterX}px ${targetCenterY}px;" preserveAspectRatio="xMidYMid slice"/>
        </g>
      </svg>
    

    `;
    // tempWrap.appendChild(clonedImage);
    tempWrap.insertAdjacentHTML('beforeend', svgToAnimate);
    event.target.closest('.js-s3d__slideModule').appendChild(tempWrap);
    // return;
    const svg = tempWrap.querySelector('svg');

    let tl = gsap
      .timeline({
        onComplete: () => {
          tempWrap.remove();
        },
      })
      .fromTo(
        svg.querySelector('image'),
        {
          scale: 1,
        },
        {
          scale: Math.min(ratio, 3),
          duration: 1.75,
          // opacity: 0,
          ease: 'power3.inOut',
        },
      )
      .fromTo(
        svg.querySelector('[mask="url(#cutout)"]'),
        {
          autoAlpha: 1,
        },
        {
          autoAlpha: 0,
          duration: 1.75,
          // opacity: 0,
          ease: 'power3.inOut',
        },
        '<',
      );
    // .fromTo(svg.querySelector('[data-animated-rect]'), {
    //   attr: {
    //     x: targetCenterX,
    //     y:  targetCenterY,
    //     width: 0,
    //     height: 0
    //   },
    // }, {
    //   attr: {
    //     x: 0,
    //     y: 0,
    //     width: window.innerWidth,
    //     height: window.innerHeight,
    //   },
    //   duration: 1.75,
    //   // opacity: 0,
    //   ease: 'power3.inOut'
    // }, '<')
  }

  getSvgActive() {
    return this.activeSvg;
  }

  setSvgActive(svg) {
    if (typeof svg === 'string' || typeof svg === 'number') {
      this.activeSvg = $(`.${this.type}__${this.settings.flyby}__${this.settings.side}__${svg}`);
    } else {
      this.activeSvg = svg;
    }
  }

  infraButtonHandler(value) {
    document.querySelectorAll('.js-s3d-svg__build[data-type="infrastructure"]').forEach(el => {
      const infraPolygon = el;
      infraPolygon.style.display = value ? 'none' : '';
    });
  }

  changeSvgActive(id) {
    this.setSvgActive(id);

    this.emit('changeSvgActive', this.getSvgActive());
  }

  mappingSelectedTypePoly = {
    floor: () => {
      this.emit('filteredPolygonRemoveClass', 'floor');
      const floors = this.currentFilteredFloorsData$.value;
      this.emit('showSelectedFloors', floors);
    },
    flat: () => {
      this.emit('filteredPolygonRemoveClass', 'flat');
      const flats = this.currentFilteredFlatIds$.value;
      this.emit(
        'showSelectedFlats',
        {
          flats,
          isFilterParamsSelected: Object.keys(this.flatList).length === flats.length,
        },
        this.flatList,
      );
      this.emit('showFlatCountOnBuild', {
        filtered: flats
          .map(flatId => this.getFlat(flatId))
          .filter(flat => flat.sale == '1')
          .map(el => el.build),
        allFlatsBuild: Object.values(this.flatsList)
          .filter(flat => flat.sale == '1')
          .map(el => el.build),
        all: Object.values(this.flatsList).filter(flat => flat.sale == '1').length,
      });
    },
  };

  updateCompass(activeSlide) {
    if (activeSlide) {
      this.currentCompassDeg =
        (360 / this.numberSlide.max) * activeSlide +
        (360 / this.numberSlide.max) * this.startDegCompass;
    }
    this.compass(this.currentCompassDeg);
  }

  async init(id, slide) {
    if (id && slide && slide.length > 0) {
      this.activeElem = +slide[0];
      this.hoverData$.next({ id });
      if (this.history.getParam('markedFlat')) {
        this.emit('changeFlatActive', this.settings.markedFlat);
      }
    }
    // this.emit('createSvg', this);
    this.emit('createArrow');

    this.isRotating$.subscribe(value => {
      this.infoBox.disable(value);
    });

    this.typeSelectedFlyby$.subscribe(async type => {
      // this.emit('changeSvg', this, type);
      const svg = new Svg(this);
      await svg.init();
      this.setSvgActive(this.activeElem);
      this.emit('changeFlatActive', this.settings.markedFlat);
      const selectedTypePoly = this.mappingSelectedTypePoly[type];
      selectedTypePoly();
    });

    this.currentFilteredFloorsData$.subscribe(_ => {
      const selectedTypePoly = this.mappingSelectedTypePoly['floor'];
      selectedTypePoly();
    });

    this.pinchZoomOnMobile();

    if (this.enableParalax && document.documentElement.classList.contains('desktop')) {
      this.paralax();
    }
    if (this.enableClouds && document.documentElement.classList.contains('desktop')) {
      this.cloudsEffect();
    }

    this.currentFilteredFlatIds$.subscribe(_ => {
      const selectedTypePoly = this.mappingSelectedTypePoly['flat'];
      selectedTypePoly();
    });

    // firstLoadImage должен быть ниже функций create
    this.uploadPictures();
    this.emit('changeContainerCursor', 'grab');
    this.deb = debounce(this.resizeCanvas.bind(this), 400);
    this.synchronizeThemeButtonWithCurrentTheme();
    window.addEventListener('resize', () => {
      this.deb(false);
    });
    if ((isMobile() || isDesktopTouchMode()) && this.SLIDER_MOBILE_FINGER_SWIPE) {
      this.changeFramesOnSwipe();
    }
  }
  updateHorizontalCompass(activeSlide) {
    this.horizontalCompass(this.arrayOfPreparedCompassTranslation[activeSlide], this.settings);
  }

  updateCompass(activeSlide) {
    if (activeSlide) {
      this.currentCompassDeg =
        (360 / this.numberSlide.max) * activeSlide +
        (360 / this.numberSlide.max) * this.startDegCompass;
    }
    this.compass(this.currentCompassDeg);
    this.addToggleThemeButton();
  }


  async uploadPictures(hd) {
      
    const now = new Date().getTime();
    this.isRotating$.next(true);
    this.ctx.canvas.width = this.width;
    this.ctx.canvas.height = this.height;

    this.preloader.turnOn();
    document.querySelector('[data-flyby-load-element]').classList.add('inLoad');
    
    const self = this;
    const imageSrc = (index) => {
      if (window.status === 'local') {
        return 'images/flyby/masterplan/';
      }
      if (self.theme === 'dark') {
        return self.imageUrlDark;
      }
      if (hd) {
        return self.sd_imageUrl
      }
      if (!self.sd_imageUrl) {
        return self.imageUrl
      }
      if (self.controlPoint.includes(index)) {
        return self.imageUrl;
      }
      if (self.sd_imageUrl && isTablet()) {
        return self.sd_imageUrl;
      }
      if (self.sd_imageUrl && isMobile()) {
        return self.sd_imageUrl;
      }
      return self.sd_imageUrl
    }
    const urlsOfImagesToLoad = [...Array(this.numberSlide.max+1).keys()].map((el, index) => {
      return `${defaultModulePath}/${imageSrc(index)}${index}.${self.image_format}`;
    })


    this.preloader.miniOn();

    this.loadSingleImage(`${defaultModulePath}/${imageSrc(this.activeElem)}${this.activeElem}.${self.image_format}`);

    let yOffset = 0;


    this.arrayImages = await this.uploadNew( urlsOfImagesToLoad,document.querySelector('.fs-preloader-amount'), (image) => {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.drawImage(image,0, yOffset, this.width, this.height );

      this.changeSvgActive(this.activeElem);
      this.emit('showActiveSvg');
      this.infoBox.disable(false);
    });
    this.arrayBase64Images = [ ...this.arrayImages.map(el=>el.src)];
    if (!this.imagesStore[this.theme]) {
      this.imagesStore[this.theme] = [...this.arrayBase64Images];
    }

    // this
    this.loadVideoKeyframes();


    

    this.ctx.clearRect(0, 0, this.width, this.height);
    // this.ctx.drawImage(this.arrayImages[this.activeElem], xOffset, yOffset, this.width, this.height, 0, 0, this.width, this.height);
    if (this.wrapperSvg) {
      this.wrapperSvg.setAttribute('src', this.arrayBase64Images[this.activeElem]);
    }
    // this.ctx.drawImage(this.arrayImages[this.activeElem],0, yOffset, this.width, this.height );
    this.resizeCanvas();
    this.updateCompass(this.activeElem);

    this.isRotating$.next(false);
    document.querySelector('[data-flyby-load-element]').classList.remove('inLoad');
    dispatchTrigger('flybyLoaded', {
      result: 'success',
      timePlain: Math.abs(now - new Date().getTime()),
      time: millisToMinutesAndSeconds(Math.abs(now - new Date().getTime())),
      url: window.location.href,
      flybyId: this.id,
      browser: getBrowser(),
      ...browserInfo(),
    });

    this.parent.emit('change_keyframe', {
      ...this.settings,
      controlPoint: this.activeElem
    });

    setTimeout(() => {
      this.preloader.miniOff();
      this.preloader.turnOff($(this.wrapper).find('.s3d__button'));
      this.preloader.turnOff($('.s3d-ctr__option .js-s3d-nav__btn'));
      this.preloader.turnOff();
      this.preloaderWithoutPercent.hide();
      this.emit('changeFlatActive', this.settings.markedFlat);
      if (typeof this.cbOnInit === 'function') {
        this.cbOnInit();
      }
    }, 500);

    // this.isRotating$.next(false);
    // this.changeSvgActive(this.activeElem);
    // this.emit('showActiveSvg');
    // this.infoBox.disable(false);
    this.isInited = true;
    if (this.sliderDataWithHistory.controlPoint) {
      this.toControlPoint(this.sliderDataWithHistory.flatId || null, this.sliderDataWithHistory.controlPoint);
    }
    if (this.activeFlat) {
      this.emit('changeFlatActive', this.sliderDataWithHistory.flatId);
      this.infoBox.changeState('active', { id: this.activeFlat });
    }
    if (isMobile() && !this.DISABLE_MOBILE_ZOOM) {
      this.initMobileContainerScale();
    }
  }




  enableFlatInfoBoxOnDestopTouchDevices(event) {
    document.querySelector('.js-s3d-infoBox').classList.add('desktop-touch');
  }

  addToggleThemeButton() {
    if (this.isDayNightInited) return;
    const changeThemeRef = document.querySelector('.s3d-ctr__switch');
    const changeThemeContainerRef = document.querySelector(
      '.s3d-ctr__theme.js-s3d-ctr__theme.s3d-ctr__menu-3d-btn-style',
    );
    const themeChanger = themeFactory(changeThemeContainerRef);

    document.body.addEventListener('click', evt => {
      if (this.type !== this.history.history.type) return;
      const target = evt.target.closest('[data-mobile-theme-switcher]');
      if (!target) return;
      const theme = target.getAttribute('data-mobile-theme-switcher');
      this.theme = theme;
      document.querySelectorAll('[data-mobile-theme-switcher]').forEach(el => {
        el.classList.toggle('active', this.theme === el.dataset.mobileThemeSwitcher);
      });
      if (this.checkImageStore(this.theme)) {
        this.switchActiveImages();
        this.drawSingleFrame(this.activeElem);
        return;
      }
      this.uploadPictures();
    });

    if (changeThemeRef) {
      changeThemeRef.addEventListener('change', () => {
        if (this.type !== this.history.history.type) return;
        themeChanger.toggle();

        const theme = this.theme === 'light' ? 'dark' : 'light';

        dispatchTrigger('day-night-view', {
          url: window.location.href,
          type: theme,
        });
        this.theme = theme;
        document.body.classList.toggle('s3d-dark-theme', this.theme == 'dark');
        if (this.checkImageStore(this.theme)) {
          this.switchActiveImages();
          this.drawSingleFrame(this.activeElem);
          return;
        }
        this.uploadPictures();
      });
      this.isDayNightInited = true;
    }
  }

  switchTheme(baseImageUrl) {
    this.imageUrl = baseImageUrl;
    this.uploadPictures();
  }

  // высчитывает прогресс загрузки картинок
  progressBarUpdate() {
    if (this.progress >= this.numberSlide.max) {
      setTimeout(() => {
        this.emit('progressBarHide');
      }, 300);
      return;
    }
    this.progress += 1;
    const percent = this.progress * (100 / (this.numberSlide.max + 1));
    this.emit('updateLoaderProgress', Math.ceil(percent));
  }
  // ---- загрузка картинок слайдера end ----

  resizeCanvas(isCalledFromOutside) {
    const factorW = this.width / this.height;
    const factorH = this.height / this.width;
    const canvas = $(`#js-s3d__${this.id}`);
    const width = this.wrapper.width();
    const height = this.wrapper.height();
    const diffW = this.width / width;
    const diffH = this.height / height;

    if (diffW < diffH) {
      canvas.width(width);
      canvas.height(width * factorH);
    } else {
      canvas.height(height);
      canvas.width(height * factorW);
    }

    this.centerSlider(this.wrapper[0]);

    if (this.isMobileContainerMinified$$ && isCalledFromOutside) {
      this.isMobileContainerMinified$$.next(this.isMobileContainerMinified$$.value);
    }
  }

  // центрует слайдер (после загрузки или resize)
  centerSlider(elem) {
    const scroll = (elem.scrollWidth - document.documentElement.offsetWidth) / 2;
    this.wrapper.scrollLeft(scroll);
  }

  // записывает начальные позиции мышки
  writingStartPosCursor(e) {
    this.x = e.pageX || e.targetTouches[0].pageX;
    this.pret = e.pageX || e.targetTouches[0].pageX;
  }

  toControlPoint(id, controlPoint, prevMarkedFlat) {
    if (!id && !controlPoint) {
      this.emit('removeActiveFlatNewMethod');
      this.settings = { ...this.settings, markedFlat: null };
      this.synchronizeThemeButtonWithCurrentTheme();
      return;
    }
    if (id) {
      this.settings = { ...this.settings, markedFlat: id };
      if (this.history.getParam('markedFlat'))
        this.emit('changeFlatActive', this.settings.markedFlat);
      this.synchronizeThemeButtonWithCurrentTheme();
    }
    if (!controlPoint) return;

    this.synchronizeThemeButtonWithCurrentTheme();
    this.emit('hideActiveSvg');

    //Новый вариант с плавной прокруткой
    const animate = (current, destionationSlide) => {
      this.infoBox.disable(false);
      this.isRotating$.next(false);
      this.amountSlideForChange = 0;
      this.emit('hideActiveSvg');
      const go = nextSlide => {
        this.updateCompass(nextSlide);
        this.updateHorizontalCompass(nextSlide);
        // this.ctx.drawImage(this.arrayImages[nextSlide], 0, 0, this.width, this.height);
        if (this.wrapperSvg) {
          this.wrapperSvg.setAttribute('src', this.arrayBase64Images[nextSlide]);
        }
        this.emit('hideActiveSvg');
        if (nextSlide === destionationSlide) {
          this.activeElem = +controlPoint;
          this.changeSvgActive(this.activeElem);
          this.emit('showActiveSvg');
          if (this.history.getParam('markedFlat'))
            this.emit('changeFlatActive', this.settings.markedFlat);
          this.history.update({
            controlPoint: controlPoint,
          });
          return;
        }
        setTimeout(() => {
          go(nextSlide === this.numberSlide.max ? 0 : nextSlide + 1);
        }, 1000 / 50);
      };
      go(current);
    };
    animate(this.activeElem, +controlPoint);
    return;
  }

  // start block  change slide functions
  // находит ближайший слайд у которого есть polygon(data-id) при необходимости вращает модуль к нему
  toSlideNum(id, slides, prevMarkedFlat) {
    if (!prevMarkedFlat) {
      this.emit('removeActiveFlatNewMethod');
      this.settings = { ...this.settings, markedFlat: null };
    }
    let needChangeSlide = true;
    let pointsSlide;
    if (slides) {
      needChangeSlide = !slides.includes(this.activeElem);
      pointsSlide = slides;
    }
    if (needChangeSlide) {
      this.checkDirectionRotate(undefined, pointsSlide);
    }
    this.hoverData$.next({ id });
    // this.emit('changeFlatActive', { id });
    this.synchronizeThemeButtonWithCurrentTheme();
    this.scrollWrapToActiveFlat(this.determinePositionActiveFlat(id, pointsSlide[0]));
    this.infoBox.changeState('active', { id });
  }

  // запускает callback (прокрутку слайда) пока активный слайд не совпадёт со следующим (выявленным заранее)
  repeatChangeSlide(fn, nextSlideId) {
    this.isRotating$.next(true);
    const rotateSpeed = this.rotateSpeed.reduce((acc, data) => {
      if (
        (data.min === nextSlideId && data.max === this.activeElem) ||
        (data.max === nextSlideId && data.min === this.activeElem)
      ) {
        return data.ms;
      }
      return acc;
    }, this.rotateSpeedDefault);

    return setInterval(() => {
      fn();
      if (this.activeElem === nextSlideId) {
        this.cancelAnimateSlide();
        this.changeSvgActive(nextSlideId);
        this.emit('showActiveSvg');
        if (this.history.getParam('markedFlat')) {
          this.emit('changeFlatActive', this.history.getParam('markedFlat'));
          this.settings = { ...this.settings, markedFlat: this.history.getParam('markedFlat') };
        } else {
          this.settings = { ...this.settings, markedFlat: null };
        }
        this.history.update({
          controlPoint: nextSlideId,
        });
        this.infoBox.disable(false);
        this.isRotating$.next(false);
        this.amountSlideForChange = 0;

        this.parent.emit('change_keyframe', {
          ...this.settings,
          controlPoint: nextSlideId,
        });
      }
    }, rotateSpeed);
  }

  showDifferentPointWithoutRotate(arrayIdNewPoint, flatId, prevMarkedFlat) {
    if (!prevMarkedFlat) {
      this.emit('removeActiveFlatNewMethod');
      this.settings = { ...this.settings, markedFlat: null };
    }
    if (!arrayIdNewPoint || arrayIdNewPoint.length === 0) {
      this.synchronizeThemeButtonWithCurrentTheme();
      return;
    }

    this.rewindToPoint(arrayIdNewPoint);
    const idNewPoint = arrayIdNewPoint[0];

    if (this.wrapperSvg) {
      this.wrapperSvg.setAttribute('src', this.arrayBase64Images[idNewPoint]);
    }
    this.synchronizeThemeButtonWithCurrentTheme();
    // this.ctx.drawImage(this.arrayImages[idNewPoint], 0, 0, this.width, this.height);
    this.activeElem = idNewPoint;
    this.history.update({
      controlPoint: idNewPoint,
    });
    this.changeSvgActive(idNewPoint);
    this.emit('showActiveSvg');

    this.isRotating$.next(false);

    if (this.history.getParam('markedFlat')) {
      this.hoverData$.next({ id: this.settings.markedFlat });
      this.emit('changeFlatActive', this.settings.markedFlat);
      this.infoBox.changeState('active', { id: this.settings.markedFlat });
    }
  }

  checkDirectionRotate(data, points = this.controlPoint) {
    if (this.isRotating$.value) return;
    if (!this.isThisSliderActive()) {
      return;
    }

    this.emit('hideActiveSvg');
    this.rewindToPoint(points);
    const dataNextPoint = this.checkResult(points, data);
    let fn;
    if (dataNextPoint.direction === 'next') {
      fn = this['changeNext'];
    } else {
      fn = this['changePrev'];
    }
    this.repeat = this.repeatChangeSlide(fn, dataNextPoint.nextPoint);
  }

  isThisSliderActive() {
    return compareObjectByKeys(['flyby', 'type', 'side'], this.settings, this.history.history);
  }

  checkResult(points, type) {
    if (
      type === 'next' ||
      (type === undefined &&
        (this.nearestControlPoint.max - this.nearestControlPoint.min) / 2 +
          this.nearestControlPoint.min <=
          this.activeElem)
    ) {
      if (this.nearestControlPoint.max <= this.numberSlide.max) {
        return { direction: 'next', nextPoint: this.nearestControlPoint.max };
      }
      return { direction: 'next', nextPoint: points[0] };
    }
    if (this.nearestControlPoint.min > this.numberSlide.min) {
      return { direction: 'prev', nextPoint: this.nearestControlPoint.min };
    }
    return { direction: 'prev', nextPoint: points[points.length - 1] };
  }

  determinePositionActiveFlat(id, numSlide) {
    const element = $(`.js-s3d__svgWrap[data-id=${numSlide}] polygon[data-id=${id}]`);
    if (size(element) === 0) {
      return 0;
    }
    const pos = element[0].getBBox();
    const left =
      pos.x +
      element[0].getBoundingClientRect().width / 2 -
      document.documentElement.offsetWidth / 2;
    return left < 0 ? 0 : left;
  }

  scrollWrapToActiveFlat(left) {
    this.wrapper.scrollLeft(left);
  }

  // остановка анимации и сброс данных прокрутки
  cancelAnimateSlide() {
    clearInterval(this.repeat);
    this.repeat = undefined;
    this.nearestControlPoint.min = this.numberSlide.min;
    this.nearestControlPoint.max = this.numberSlide.max;
  }

  // меняет слайд на следующий
  changeNext() {
    if (this.activeElem === this.numberSlide.max) {
      this.nearestControlPoint.max = this.controlPoint[0];
      this.nearestControlPoint.min = -1;
      this.activeElem = this.numberSlide.min;
    } else {
      this.activeElem++;
    }
    this.updateCompass(this.activeElem);
    this.updateHorizontalCompass(this.activeElem);

    if (this.wrapperSvg) {
      this.wrapperSvg.setAttribute('src', this.arrayBase64Images[this.activeElem]);
    }
    if (Object.keys(this.video_keyframes).length > 0) this.playVideoKeyframe();
  }

  // меняет слайд на предыдщий
  changePrev() {
    if (this.activeElem === this.numberSlide.min) {
      this.nearestControlPoint.max = this.numberSlide.max + 1;
      this.nearestControlPoint.min = this.controlPoint[this.controlPoint.length - 1];
      this.activeElem = this.numberSlide.max;
    } else {
      this.activeElem--;
    }
    this.updateCompass(this.activeElem);
    this.updateHorizontalCompass(this.activeElem);

    if (this.wrapperSvg) {
      this.wrapperSvg.setAttribute('src', this.arrayBase64Images[this.activeElem]);
    }
    if (Object.keys(this.video_keyframes).length > 0) this.playVideoKeyframe();
    // this.ctx.drawImage(this.arrayImages[this.activeElem], 0, 0, this.width, this.height);
  }

  checkMouseMovement(e) {
    // get amount slide from a touch event
    this.x = e.pageX ?? e.targetTouches[0].pageX;
    const count =
      (this.x - this.pret) / (window.innerWidth / this.numberSlide.max / this.mouseSpeed);
    this.amountSlideForChange -= window.parseInt(count.toFixed(0));
  }

  rewindToPoint(controlPoint) {
    this.cancelAnimateSlide();
    controlPoint.forEach(el => {
      if (+el < this.activeElem && +el > this.nearestControlPoint.min) {
        this.nearestControlPoint.min = +el;
      } else if (+el > this.activeElem && +el < this.nearestControlPoint.max) {
        this.nearestControlPoint.max = +el;
      }
    });

    if (this.nearestControlPoint.min === 0) {
      this.nearestControlPoint.min = controlPoint[controlPoint.length - 1] - this.numberSlide.max;
    }

    if (this.nearestControlPoint.max === this.numberSlide.max) {
      this.nearestControlPoint.max = controlPoint[0] + this.numberSlide.max;
    }
    if (!controlPoint.includes(this.activeElem)) {
      return true;
    }
    return false;
  }

  activeAnimateFrame(flag) {
    if (!flag) {
      window.cancelAnimationFrame(this.animates);
      return;
    }
    this.animates = this.animate();
  }

  animate() {
    if (this.amountSlideForChange >= 1) {
      this.changeNext();
      this.amountSlideForChange -= 1;
      this.pret = this.x;
    } else if (this.amountSlideForChange <= -1) {
      this.changePrev();
      this.amountSlideForChange += 1;
      this.pret = this.x;
    }
    this.animates = requestAnimationFrame(this.animate.bind(this));
  }
  // end block  change slide functions

  prepareArrayOfCompassTranslation() {
    const minFrame = +this.numberSlide.min;
    const maxFrame = +this.numberSlide.max;
    const framesLength = +this.numberSlide.max + 1;

    const compassWrapperWidth = document
      .querySelector('.s3d-ctr__menu-3d__compass')
      .getBoundingClientRect()
      .width.toFixed(0);
    const compassWidth = document
      .querySelector('[data-controller-compass]')
      .getBoundingClientRect()
      .width.toFixed(0);
    const translationXSum = compassWidth - compassWrapperWidth;

    const segmentOfSingleTranslation = translationXSum / framesLength;

    let iterator = 0;
    for (let i = this.frameWithNorthDirection; i <= maxFrame; i++) {
      this.arrayOfPreparedCompassTranslation[i] = iterator * segmentOfSingleTranslation;
      iterator++;
    }
    for (let i = 0; i < this.frameWithNorthDirection; i++) {
      this.arrayOfPreparedCompassTranslation[i] = iterator * segmentOfSingleTranslation;
      iterator++;
    }
  }

  async blobToBase64(blob) {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise(resolve => {
      reader.onloadend = () => {
        resolve(reader.result);
      };
    });
  }

  async loadSingleImage(url) {
    const response = await axios.get(url, { responseType: 'blob' });
    this.resizeCanvas();
    const img = new Image();
    img.src = URL.createObjectURL(response.data);
    img.onload = () => {
      if (this.wrapperSvg) {
        this.wrapperSvg.setAttribute('src', URL.createObjectURL(response.data));
      }
      // this.ctx.drawImage(img, 0, 0, this.width, this.height);
    };
  }

  async uploadNew(urls, progressElement, onLoadFirstKeyFrame = () => {}) {
    const startLoadTime = new Date().getTime();
    this.preloaderWithoutPercent.hide();
    let total = '';
    let imagesLoaded = 0;

    const controlPointsImages = await Promise.all(
      this.controlPoint.map(async (el, index) => {
        let res = await axios.get(urls[el] + `?device=${device.type}`, { responseType: 'blob' });
        const img = new Image();
        const imgSrc = await this.blobToBase64(res.data);
        img.src = imgSrc;
        imagesLoaded++;
        if (el === this.activeElem) {
          onLoadFirstKeyFrame(img);
        }
        return img;
      }),
    );

    const restOfImages = await Promise.all(
      urls.map(async (url, index) => {
        if (this.controlPoint.includes(index)) {
          const indexInLoadedImages = this.controlPoint.indexOf(index);
          return Promise.resolve(controlPointsImages[indexInLoadedImages]);
        }

        const res = await axios.get(url + `?device=${device.type}`, { responseType: 'blob' });
        const img = new Image();
        const imgSrc = await this.blobToBase64(res.data);
        img.src = imgSrc;
        if (index === this.activeElem) {
          onLoadFirstKeyFrame(img);
        }
        imagesLoaded++;

        document.querySelectorAll('.fs-preloader-amount').forEach(el => {
          el.innerHTML = Math.ceil((imagesLoaded * 100) / urls.length) + '%';
        });
        document.querySelectorAll('[data-flyby-visual-load-element]').forEach(el => {
          el.style.transform = `scaleX(${imagesLoaded / urls.length})`;
        });
        return img;
      }),
    );

    document.querySelectorAll('.fs-preloader-amount').forEach(el => {
      el.innerHTML = `360°`;
    });

    const endLoadTime = new Date().getTime();
    dispatchTrigger('flybyLoading', {
      timePlain: Math.abs(startLoadTime - endLoadTime),
      url: window.location.href,
      flybyId: this.id,
      flybySize: total,
      deviceType: device.type,
      date: new Date().getTime(),
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      browser: detect(),
    });

    return restOfImages;
  }

  pinchZoomOnMobile() {
    // if (isMobile()) {

    //   const pzoom = new PinchZoom(this.wrapper[0], {
    //     lockDragAxis: true,
    //     use2d: false,
    //     // minZoom: 1,
    //     draggableUnzoomed: false
    //   });
    // }
  }

  synchronizeThemeButtonWithCurrentTheme() {
    const themeSwitcher = document.querySelector('.js-s3d-ctr__theme');

    if (!themeSwitcher) return;

    themeSwitcher.querySelector('input').checked = this.theme === 'dark';

    if (this.theme === 'dark') {
      themeSwitcher.classList.add(`dark-theme`);
    } else {
      themeSwitcher.classList.remove('dark-theme');
    }
    themeSwitcher.classList.toggle('s3d-display-none', !!this.imageUrlDark === false);

    document.querySelectorAll('[data-mobile-theme-switcher]').forEach(el => {
      el.classList.toggle('active', this.theme === el.dataset.mobileThemeSwitcher);
    });
  }

  paralax() {
    this.wrapper[0].querySelector('.js-s3d__wrapper__canvas').style.transform = 'scale(1.05)';
    this.wrapper[0]
      .querySelector('.js-s3d__wrapper__canvas')
      .addEventListener('mousemove', this.moveWrapper.bind(this));
  }

  moveWrapper(e) {
    const wrapperSizes = this.wrapper[0]
      .querySelector('.js-s3d__wrapper__canvas')
      .getBoundingClientRect();
    const xOffset = gsap.utils.mapRange(
      0,
      wrapperSizes.width,
      this.PARALAX_AMOUNT,
      this.PARALAX_AMOUNT * -1,
      e.clientX,
    );
    const yOffset = gsap.utils.mapRange(
      0,
      wrapperSizes.height,
      this.PARALAX_AMOUNT,
      this.PARALAX_AMOUNT * -1,
      e.clientY,
    );
    this.wrapper[0].querySelector(
      '.js-s3d__wrapper__canvas',
    ).style.transform = `scale(1.05) translate(${xOffset}px, ${yOffset}px)`;
  }

  cloudsEffect() {
    this.wrapper[0].insertAdjacentHTML(
      'beforeend',
      `<div class="s3d__clouds">
          <img src="${window.defaultModulePath}/images/black-clouds-png-4.png"/>
        </div>`,
    );
  }

  loadVideoKeyframes() {
    Object.entries(this.video_keyframes).forEach(el => {
      const [keyframe, url] = el;
      const video = document.createElement('video');
      video.src = isFullUrl(url) ? url : window.defaultProjectPath + url;
      video.loop = true;
      video.addEventListener('loadeddata', () => {
        this.videoKeyframesToRender[keyframe] = video;
        this.playVideoKeyframe();
      });
      video.load();
    });
  }
  playVideoKeyframe() {
    if (this.videoKeyframesToRender[this.activeElem]) {
      this.wrapper[0].querySelector('video').src = this.videoKeyframesToRender[this.activeElem].src;
      this.wrapper[0].querySelector('video').opacity = 1;
      this.wrapper[0].querySelector('video').play();
    } else {
      this.wrapper[0].querySelector('video').src = '';
      this.wrapper[0].querySelector('video').opacity = 0;
      this.wrapper[0].querySelector('video').pause();
    }
  }

  checkImageStore(theme) {
    return this.imagesStore[theme] ? true : false;
  }

  drawSingleFrame(number) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.wrapperSvg) {
      this.wrapperSvg.setAttribute('src', this.arrayBase64Images[this.activeElem]);
    }
  }

  switchActiveImages() {
    this.arrayBase64Images = [...this.imagesStore[this.theme]];
  }
  changeFramesOnSwipe() {
    this.swipeHammer = new Hammer(this.wrapper[0], {});
    this.wrapper[0].style.overflow = 'hidden';

    this.swipeHammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
    const directions = {
      4: 'next',
      2: 'prev',
    };
    this.swipeHammer.on('swipe', event => {
      if (this.isRotating$.value) return;
      if (directions[event.direction]) this.checkDirectionRotate(directions[event.direction]);
    });
  }

  initMobileContainerScale() {
    this.isMobileContainerAnimating = false;
    if (this.mobileScaleInitialized) return;
    this.mobileScaleInitialized = true;
    this.isMobileContainerMinified$$ = new BehaviorSubject(null);
    const canvasDefaultWidth = this.wrapper[0].querySelector('canvas').width;
    this.wrapper[0].insertAdjacentHTML('beforeend', $mobileScaleSwitcher());
    
    const afterChange = (scale) => {
      this.wrapper[0].style.touchAction = scale ? 'pan-x' : 'pan-x';

      const video = this.wrapper[0].querySelector('video');
      const img = this.wrapper[0].querySelector('img');

      this.wrapper[0].style.overflowX = scale ? 'hidden' : 'auto';
      img.style.objectFit = scale ? 'contain' : 'cover';
      img.classList.toggle('zoom-in', scale);
      if (video) video.style.objectFit = scale ? 'contain' : 'cover';

      this.wrapper[0].querySelectorAll('svg[preserveAspectRatio]').forEach(svg => {
        const [ align ] = svg.getAttribute('preserveAspectRatio').split(' ');
        svg.setAttributeNS(null, 'preserveAspectRatio', `${scale ? "XMidYMid": align} ${scale ? 'meet' : 'slice'}`);
      });
      this.wrapper[0].querySelectorAll('[data-slider-mobile-scale-container]').forEach(el => el.remove())
      if (scale) {
         this.wrapper[0].insertAdjacentHTML('beforeend', getMobileScaleContainerTitle(this.i18n, this.slider_scale_container_logo));
      }

      this.wrapper[0].querySelector('[data-slider-mobile-scale-switcher]').classList.toggle('zoom-in', scale);
    }

    this.isMobileContainerMinified$$.subscribe(scale => {
      if (scale === null) return;
      const canvas = this.wrapper[0].querySelector('canvas');
      this.wrapper[0].querySelector('img').classList.add('zoom-in', scale);
      if (scale) {
        this.centerSlider(this.wrapper[0]);
        this.onMobileContainerZoomIn(() => {
          canvas.style.width = window.innerWidth + 'px';
          afterChange(scale);
        }, scale);
        
      } else {
        this.onMobileContainerZoomOut(() => {
          canvas.style.width = canvasDefaultWidth + 'px';
          this.resizeCanvas();
          afterChange(scale);
        }, scale);
      }
    });

    this.initMobileContainerScale_pinchEvents();
    this.initMobileContainerScale_rotationEvents();

    this.wrapper[0].addEventListener('click', (event) => {
      const target = event.target.closest('[data-slider-mobile-scale-switcher]');
      if (!target) return;
      if (this.isMobileContainerAnimating) return;
      this.isMobileContainerMinified$$.next(!this.isMobileContainerMinified$$.value);
    })

    // setTimeout(() => {
    //   this.isMobileContainerMinified$$.next(true);
    // }, 500);

  }

  initMobileContainerScale_pinchEvents() {
    const hammer = new Hammer(this.wrapper[0], {
      touchAction: 'auto',
    });
    hammer.get('pinch').set({ enable: true });

    const pinchInFn = debounce((e) => {
      e.preventDefault();
      if (this.isMobileContainerAnimating) return;
      if (this.isMobileContainerMinified$$.value) return;
      this.isMobileContainerMinified$$.next(true);
    }, 100);
    const pinchOutFn = debounce((e) => {
      e.preventDefault();
      if (this.isMobileContainerAnimating) return;
      if (!this.isMobileContainerMinified$$.value) return;
      this.isMobileContainerMinified$$.next(false);
    }, 100);

    hammer.on('pinchin', pinchInFn);
    hammer.on('pinchout', pinchOutFn);
  }

  initMobileContainerScale_rotationEvents() {
    this.wrapper[0].addEventListener('touchstart', (e) => {
        if (!this.isMobileContainerMinified$$.value) return;
        this.sliderRotateStart(e);
        this.emit('hideActiveSvg');
      });
      this.wrapper[0].addEventListener('touchmove', (e) => {
      if (!this.isMobileContainerMinified$$.value) return;
      this.checkMouseMovement.call(this, e);
    });
    this.wrapper[0].addEventListener('touchend', (e) => {
      if (!this.isMobileContainerMinified$$.value) return;
      this.sliderRotateEnd(e);
    });
  }

  onMobileContainerZoomIn(onBeforeAnimElementDelete = () => {}, scale) {
    if (scale == 'noAnimate') {
      onBeforeAnimElementDelete();
      return;
    }
    const svgCopy = this.wrapper[0].querySelector('.s3d__svg__active').cloneNode(true);
    const imgCopy = this.wrapperSvg.cloneNode(true);
    const copyContainerForAnimation = document.createElement('div');
    copyContainerForAnimation.classList.add('s3d__flyby-mobile-scale-zoom-out-animation-container');
    copyContainerForAnimation.style.width = (this.width * window.innerHeight / this.height) + 'px';
    copyContainerForAnimation.style.height = window.innerHeight + 'px';
    imgCopy.style.objectFit = 'cover';
    copyContainerForAnimation.appendChild(imgCopy);
    copyContainerForAnimation.appendChild(svgCopy);
    document.querySelector('.js-s3d__slideModule').appendChild(copyContainerForAnimation);

    const scaleRatio = window.innerWidth / (this.width * window.innerHeight / this.height);

    gsap.timeline()

      .add(onBeforeAnimElementDelete)
      .to(copyContainerForAnimation, { duration: 1.25, ease: "power4.inOut", scale: scaleRatio, onComplete: () => {
        document.querySelector('.js-s3d__slideModule').removeChild(copyContainerForAnimation);
      } })

  }
  onMobileContainerZoomOut(onBeforeAnimElementDelete = () => {}) {
    const svgCopy = this.wrapper[0].querySelector('.s3d__svg__active').cloneNode(true);
    const imgCopy = this.wrapperSvg.cloneNode(true);
    const copyContainerForAnimation = document.createElement('div');
    copyContainerForAnimation.classList.add('s3d__flyby-mobile-scale-zoom-out-animation-container');
    copyContainerForAnimation.style.width = '100%';
    imgCopy.style.objectFit = 'contain';
    imgCopy.style.objectPosition = 'center center';
    copyContainerForAnimation.appendChild(imgCopy);
    copyContainerForAnimation.appendChild(svgCopy);
    document.querySelector('.js-s3d__slideModule').appendChild(copyContainerForAnimation);

    const ratio = (this.width * window.innerHeight / this.height) / window.innerWidth;
    svgCopy.style.opacity = '0';
    gsap.to(copyContainerForAnimation, { duration: 1.25, ease: "power4.inOut", scale: ratio, onComplete: () => {
      onBeforeAnimElementDelete();
      document.querySelector('.js-s3d__slideModule').removeChild(copyContainerForAnimation);
    } });
  }

}

export default SliderModel;
