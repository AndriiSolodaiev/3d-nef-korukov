import $ from 'jquery';
import i18next from 'i18next';
import gsap from 'gsap';
import axios from 'axios';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isObject from 'lodash/isObject';
import ScrollTrigger from 'gsap/ScrollTrigger';
import intervalPlural from 'i18next-intervalplural-postprocessor';
import device from 'current-device';
import language from '../../../static/language/index';
import { isDevice } from './modules/checkDevice';
import CreateMarkup from './modules/markup';
import AppController from './modules/app/app.controller';
import AppModel from './modules/app/app.model';
import AppView from './modules/app/app.view';
import Controller from './modules/templates/controller/controller';
import Plannings from './modules/templates/planningsPage/plannings';
import Favourites from './modules/templates/favourites';
import Filter from './modules/templates/filter/filter';
import defaultConfig from '../../../static/settings.json';
import Catcher from './modules/catchers';
import {
  AppContentError,
  AppError,
  AppFloorContentError,
  AppNetworkError,
  AppUrlError,
  NetworkError,
} from './modules/errors';
import ErrorPopup from './modules/errorPopup';
import sendError from './modules/sendError';
import { themeFactory } from './modules/templates/controller/$theme';
import percentLoader from './modules/templates/loaders/percentLoader';
import loader from './modules/templates/loaders/loader';
import './modules/templates/loaders/loader-animation';
import header from './modules/templates/header/header';

import header_2 from '../../s3d2/scripts/templates/header/header_2';
import menu from './modules/templates/header/menu';
import './modules/templates/header/header-animation';
import dispatchTrigger from './modules/helpers/triggers';
import { deviceType, primaryInput } from 'detect-it';
import { detect } from 'detect-browser';
import FlybyController from '../../s3d2/scripts/templates/FlybyController';
import { initMobileFlybyListeners } from '../../s3d2/scripts/templates/s3d2_MobileFlybyController';
import DevelopmentNotificationFactory from './modules/templates/header/development-mode';

const browser = detect();

document.documentElement.classList.add(deviceType);
document.documentElement.classList.add(`primary_input_${primaryInput}`);

{
  if (
    window.screen.height === 1366 &&
    window.screen.width === 1024 &&
    /Macintosh/.test(window.navigator.userAgent)
  ) {
    document.documentElement.classList.add('tablet');
    document.documentElement.classList.remove('desktop');
  }
  if (
    window.screen.width === 1366 &&
    window.screen.height === 1024 &&
    /Macintosh/.test(window.navigator.userAgent)
  ) {
    document.documentElement.classList.add('tablet');
    document.documentElement.classList.remove('desktop');
  }
}

{
  const ipadProDetectExpression = /OS X|OSX/i;
  const biggerSide = Math.max.apply(null, [window.innerWidth, window.innerHeight]);
  if (
    biggerSide < 1380 &&
    biggerSide > 1024 &&
    document.documentElement.classList.contains('desktop') &&
    deviceType !== 'mouseOnly' &&
    window.navigator.userAgent.match(ipadProDetectExpression)
  ) {
    document.documentElement.classList.remove('desktop');
    document.documentElement.classList.add('tablet');
  }
}

Object.values(browser).forEach(el => document.documentElement.classList.add(el.replace(/ /g, '')));

document.addEventListener('DOMContentLoaded', global => {
  init();
});

window.nameProject = '3d';

window.defaultProjectPath = `/wp-content/themes/${window.nameProject}`;
window.defaultModulePath = `/wp-content/themes/${window.nameProject}/assets/s3d`;
window.defaultStaticPath = `/wp-content/themes/${window.nameProject}/static`;
window.status =
  location.hostname.match(/localhost/) || document.documentElement.dataset.mode === 'local'
    ? 'local'
    : 'dev';

global.gsap = gsap;
global.ScrollTrigger = ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);
global.axios = axios;

const createHtml = (i18n, config) => {
  const controllerNode = Controller(
    i18n,
    config,
    `
    ${FlybyController(i18n)}
    <div class="s3d-ctr__audio" data-s3d-audio-guide-state-marker>
      <div class="s3d-ctr__audio-canvas-wrap" data-s3d2-audio-assistant>
        <!--<svg class="s3d-ctr__audio-canvas-wrap-icon" width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="s3dblurFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
            </filter>
          </defs>

          <circle cx="100" cy="100" r="50" fill="white" filter="url(#s3dblurFilter)" />
        </svg>-->
        <svg class="s3d-ctr__audio-canvas-wrap__new-icon" viewBox="0 0 499 348" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="93" height="348" fill="#D9D9D9"/>
          <rect x="406" width="93" height="348" fill="#D9D9D9"/>
          <rect x="203" width="93" height="348" fill="#D9D9D9"/>
        </svg>

      </div>
      <div class="s3d-ctr__audio-close" data-s3d-audio-guide-disable>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00008 7.29286L8.35363 7.64642L12.5001 11.7929L16.6465 7.64642L17.0001 7.29286L17.7072 7.99997L17.3536 8.35352L13.2072 12.5L17.3536 16.6464L17.7072 17L17.0001 17.7071L16.6465 17.3535L12.5001 13.2071L8.35363 17.3535L8.00008 17.7071L7.29297 17L7.64652 16.6464L11.793 12.5L7.64652 8.35352L7.29297 7.99997L8.00008 7.29286Z" fill="var(--color-gray-200)"></path>
        </svg>
      </div>
      <div class="s3d-ctr__audio-open" data-s3d-audio-guide-enable>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.29297 11.8535L12.1465 17.707L12.8535 17L8.20703 12.3535H18V11.3535H8.20703L12.8535 6.70703L12.1465 6L6.29297 11.8535Z" fill="var(--s3d2-color-icon-gray-200)"/>
        </svg>
      </div>
    </div>
  `,
  );
  const planningsNode = Plannings(i18n);
  const favouritesNode = Favourites(i18n, 0);
  const filterNode = Filter(i18n, config.filter.checkboxes);
  const moduleContainer = document.querySelector('.js-s3d__slideModule');
  moduleContainer.insertAdjacentHTML(
    'afterbegin',
    [controllerNode, planningsNode, favouritesNode, filterNode].join(''),
  );
  initMobileFlybyListeners();
  document.body.insertAdjacentHTML('beforeend', loader(get(config, 'header.logo_2', null)));
  document.body.insertAdjacentHTML('beforeend', percentLoader(i18n));
  // document.body.insertAdjacentHTML('beforeend', header(i18n));
  document.body.insertAdjacentHTML('beforeend', menu(i18n, config));

  // document.body.insertAdjacentHTML(
  //   'beforeend',
  //   header(i18n, {
  //     menuSelector: get(config, 'header.menu_selector', ''),
  //   }),
  // );
  document.body.insertAdjacentHTML(
    'beforeend',
    header_2(i18n, {
      logo: get(config, 'header.logo', null),
      menuSelector: get(config, 'header.menu_selector', ''),
      config,
    }),
  );
  console.log('TEST');
  console.log(config);
  switchCreationFunction(config);
};
// document.addEventListener('DOMContentLoaded', e => {
//   setTimeout(() => {
//     DevelopmentNotificationFactory.showNotification();
//     DevelopmentNotificationFactory.addNotificationClass();
//     DevelopmentNotificationFactory.removeNotificationClass();
//   }, 7500);
// });
async function init() {
  let Config = defaultConfig;
  try {
    const serverConfig = await axios.get(`${window.defaultModulePath}/settings.json`);
    if (isObject(serverConfig.data)) {
      Config = serverConfig.data;
      window.externalS3dSettings = Config;
      console.error(
        `Loaded configuration from "${window.defaultModulePath}/settings.json", instead of default settings.json fron gh repository.`,
      );
    }
  } catch (error) {
    console.log(error);
  }

  const i18Instance = i18next.createInstance();
  window.createMarkup = CreateMarkup;

  const lang = document.querySelector('html').lang || 'en';
  window.errorPopup = ErrorPopup(i18Instance);
  const callback = (i18n, hostname, keyMessage, type = '') => err => {
    sendError(i18n, hostname, keyMessage, type, {
      ...err,
      data: encodeURIComponent(
        err.stack
          .toString()
          .split('')
          .slice(0, 400)
          .join('')
          .replace(/'|"/g, ''),
      ),
    });
    errorPopup.setType('withoutTranslate');
    errorPopup.open(keyMessage);
  };
  const lowErrorCallback = (i18n, hostname, keyMessage, type = '') => err => {
    sendError(i18n, hostname, keyMessage, type, err);
    errorPopup.setType('withTranslate');
    errorPopup.open(keyMessage, location.reload);
  };
  const ErrorCallbackUpdateLocation = (
    i18n,
    hostname,
    keyMessage,
    type = '',
    newLocation,
  ) => err => {
    sendError(i18n, hostname, keyMessage, type, err);
    errorPopup.setType('withTranslate');
    errorPopup.open(keyMessage, () => {
      location.href = newLocation;
    });
  };
  const { host, pathname, search } = location;
  const catcherHandlers = [
    {
      instance: AppContentError,
      callback: callback(i18Instance, location.href, 'Error-popup.messages.not-find-data', 'high'),
    },
    {
      instance: AppFloorContentError,
      callback: ErrorCallbackUpdateLocation(
        i18Instance,
        location.href,
        'Error-popup.messages.not-all-required-data-received',
        'medium',
        `${host}/${pathname}${search}`,
      ),
    },
    {
      instance: AppUrlError,
      callback: ErrorCallbackUpdateLocation(
        i18Instance,
        location.href,
        'Error-popup.messages.invalid-url',
        'low',
        `${host}/${pathname}`,
      ),
    },
    {
      instance: AppNetworkError,
      callback: callback(i18Instance, location.href, 'Error-popup.messages.failed-request', 'high'),
    },
    {
      instance: NetworkError,
      callback: lowErrorCallback(
        i18Instance,
        location.href,
        'Error-popup.messages.network-error',
        'low',
      ),
    },
    {
      instance: AppError,
      callback: callback(
        i18Instance,
        location.href,
        'Error-popup.messages.application-error',
        'middle',
      ),
    },
    {
      instance: Error,
      callback: callback(
        i18Instance,
        location.href,
        'Error-popup.messages.unknown-error',
        'middle',
      ),
    },
  ];
  const catcher = Catcher(catcherHandlers);
  const setVhDebounced = debounce(setVh, 500);
  $(window).on('resize', setVhDebounced);
  window.addEventListener('gestureend', setVhDebounced);
  // window.addEventListener('resize', setVhDebounced);

  function setVh() {
    document.documentElement.style.setProperty(
      '--vh',
      `${document.documentElement.clientHeight * 0.01}px`,
    );
    const html = document.documentElement;
    if (html.classList.contains('ios') && window.innerHeight < window.innerWidth) {
      html.classList.remove('portrait');
      html.classList.add('landscape');
    }
    if (html.classList.contains('ios') && window.innerHeight > window.innerWidth) {
      html.classList.add('portrait');
      html.classList.remove('landscape');
    }
  }
  window.setVh = setVh;

  try {
    setVh();
    if (isDevice('mobile') || document.documentElement.offsetWidth <= 768) {
      document.querySelector('.js-s3d__slideModule').classList.add('s3d-mobile');
    }
    const initialCurrency = new URLSearchParams(location.search).get('currency');
    const isEnabledCurrencyList = get(Config, 'currency_list', []).length > 1;
    if (initialCurrency && isEnabledCurrencyList) {
      Config.currency_value = initialCurrency;
      Config.currency_label = Config.currency_list.find(el => el.value === initialCurrency).label;
    }
    await i18Instance
      // .use(intervalPlural)
      .init({
        lng: lang,
        debug: window.status === 'local',
        resources: {
          ...language,
          [lang]: {
            translation: {
              ...language[lang],
              currency_label: Config.currency_label
                ? Config.currency_label
                : language[lang]['currency_label'],
            },
          },
        },
        compatibilityJSON: 'v4',
      });
    createHtml(i18Instance, Config);

    const app = new AppModel(Config, i18Instance);
    const appView = new AppView(app, {
      wrapper: $('.js-s3d__slideModule'),
    });
    const appController = new AppController(app, appView);
    await app.init();
  } catch (error) {
    catcher(error);
    dispatchTrigger('module-error', {
      error,
      date: new Date().toLocaleString(),
      ...browser,
      orientation: device.orientation,
      type: device.type,
    });
  }
}

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.shiftKey && event.key === 'S') {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const href = link.getAttribute('href');
      link.setAttribute('href', href);
    }
  }
});

window.checkValue = val =>
  !val || val === null || val === undefined || (typeof val === 'number' && isNaN(val));

//Перемикач між квартирою та вілою
const switchCreationFunction = Config => {
  const button = document.createElement('button');
  button.id = 'toggleButton';
  button.textContent = Config.flat.viewType === 'flat' ? 'Flat' : 'Villa';

  const style = document.createElement('style');
  style.innerHTML = `
    #toggleButton {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 20px;
      font-size: 16px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      z-index: 1000;
      display: none;
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(button);

  function updateButtonState() {
    if (Config.flat.viewType === 'flat') {
      button.textContent = 'Flat';
    } else if (Config.flat.viewType === 'villa') {
      button.textContent = 'Villa';
    }
  }

  updateButtonState();

  button.addEventListener('click', () => {
    Config.flat.viewType = Config.flat.viewType === 'flat' ? 'villa' : 'flat';
    updateButtonState();
    localStorage.setItem('viewType', Config.flat.viewType);
    window.location.reload();
  });

  const savedViewType = localStorage.getItem('viewType');
  if (savedViewType) {
    Config.flat.viewType = savedViewType;
    updateButtonState();
  }
};

if (/localhost/.test(window.location.href)) {
  window.s3dAdditionalServices = /localhost/.test(window.location.href)
    ? {
        26219: [
          {
            title: 'Interior',
            features: [{ 'total bedrooms': '6' }, { 'full bathrooms': '7' }],
          },
          {
            title: 'Area & Lot',
            features: [{ Status: 'For Sale' }, { 'Living Area': '10,976 Sq.Ft.' }],
          },
        ],
      }
    : {};
}
