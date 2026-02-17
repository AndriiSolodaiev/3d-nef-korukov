import axios from 'axios';
import get from 'lodash/get';
import center from 'svg-polygon-center';
import { AppContentCustomError } from './errors';
import isObject from 'lodash/isObject';
import settings from '../../../../static/settings.json';
import SvgPin from '../../../s3d2/scripts/templates/flyby/svg/pins/SvgPin';
import { VIDEO_FORMATS_REG_EXP } from './helpers/helpers';

const { markers } = settings;

class Svg {
  constructor(data) {
    this.activeSlide = data.activeElem;
    this.type = data.type;
    this.setting = data.settings;
    this.wrapper = data.wrapper[0];
    this.controlPoint = data.controlPoint;
    this.hoverData$ = data.hoverData$;
    this.typeSelectedFlyby$ = data.typeSelectedFlyby$;
    this.linksSvg = data.linksSvg;
    this.pin = data.pin;
    this.pinsInfo = data.pinsInfo;

    this.sliderPopup = data.sliderPopup;
    this.i18n = data.i18n;
    this.floorList$ = data.floorList$;
    this.fillCategories = markers.reduce((acc, marker) => {
      acc[marker.replace(/\.(svg|png|jpg|jpeg|webp)/, '')] = `url(#${marker.replace(
        /\.(svg|png|jpg|jpeg|webp)/,
        '',
      )})`;
      return acc;
    }, {});
    this.pinWidth = 30;
    this.pinHeight = 30;
    this.getFlat = data.getFlat;
    this.verticalAlign = data.verticalAlign;
    this.horizontalAlign = data.horizontalAlign;
    this.show_flat_polygons_tooltip = data.show_flat_polygons_tooltip;
    this.show_flat_polygons_tooltip_key = data.show_flat_polygons_tooltip_key;

    this.verticalAlignmentMaping = {
      top: 'YMin',
      center: 'YMid',
      bottom: 'YMax',
    };

    this.horizontalAlignmentMaping = {
      left: 'xMin',
      center: 'xMid',
      right: 'xMax',
    };
  }

  async init() {
    const container = this.wrapper.querySelector('.s3d__svg-container');
    if (container) container.remove();
    await this.createSvg(this.controlPoint, this.type, this.typeSelectedFlyby$);
  }

  // получает
  async createSvg(config, name, typeSelectedFlyby$) {
    const svgContainer = createMarkup('div', {
      class: `s3d__svg-container js-s3d__svg-container__${name}`,
    });
    this.wrapper
      .querySelector('.js-s3d__wrapper__canvas')
      .insertAdjacentElement('beforeend', svgContainer);
    const promiseList = config.map(
      key =>
        new Promise(resolve => {
          const svgWrap = document.createElement('div');
          if (+key === +this.activeSlide) {
            svgWrap.classList = `s3d__svgWrap js-s3d__svgWrap ${this.type}__${key} ${this.type}__${this.setting.flyby}__${this.setting.side}__${key} s3d__svg__active`;
          } else {
            svgWrap.classList = `s3d__svgWrap js-s3d__svgWrap ${this.type}__${key} ${this.type}__${this.setting.flyby}__${this.setting.side}__${key}`;
          }
          svgWrap.dataset.id = key;
          svgContainer.insertAdjacentElement('beforeend', svgWrap);
          // $(svgContainer).append(svgWrap);

          let path = '';

          const defaultPath = `${defaultModulePath}/images/svg/default.svg`;

          if (this.setting.type && this.setting.flyby && this.setting.side) {
            path =
              this.linksSvg[this.setting.type][this.setting.flyby][this.setting.side][
                typeSelectedFlyby$.value
              ][key] ?? defaultPath;
            // path = `${defaultModulePath}/images/svg/${typeSelectedFlyby$.value}/${this.setting.type}/${this.setting.flyby}/${this.setting.side}/${key}.svg`;
          } else {
            path = this.linksSvg[this.setting.type][key] ?? defaultPath;
            // path = `${defaultModulePath}/images/svg/${this.setting.type}/${key}.svg`;
          }

          axios
            .get(path)
            .then(({ data }) => {
              const alignX = this.horizontalAlignmentMaping[this.horizontalAlign];
              const alignY = this.verticalAlignmentMaping[this.verticalAlign];
              const aligned = `preserveAspectRatio="${alignX}${alignY} slice"`;
              const svgAligned = data.replace('preserveAspectRatio="xMidYMid slice"', aligned);

              if (typeSelectedFlyby$.value === 'floor') {
                // svgWrap.insertAdjacentHTML(
                //   'beforeend',
                //   this.putFlatIdInFloorPolygon(
                //     svgWrap,
                //     this.assignFlatPolygonsWithFlatData(svgAligned),
                //   ),
                // );
                this.mutateGenplanInfrastructure(
                  svgWrap,
                  this.putFlatIdInFloorPolygon(svgWrap, svgAligned),
                );
                0;
                resolve();
                return;
              }
              if (this.setting.type === 'genplan' || this.setting.type === 'flyby') {
                this.mutateGenplanInfrastructure(
                  svgWrap,
                  this.assignFlatPolygonsWithFlatData(svgAligned),
                );
                resolve();
                return;
              }
              svgWrap.insertAdjacentHTML(
                'beforeend',
                this.assignFlatPolygonsWithFlatData(svgAligned),
              );
              resolve();
            })
            .catch(() => {
              axios
                .get(defaultPath)
                .then(({ data }) => {
                  svgWrap.insertAdjacentHTML(
                    'beforeend',
                    this.assignFlatPolygonsWithFlatData(svgAligned),
                  );
                  resolve();
                })
                .catch(() => {
                  throw new AppContentCustomError({
                    description: `неудалась загрузка svg (${path} и ${defaultPath})`,
                  });
                });
            });
        }),
    );

    return Promise.all(promiseList);
  }
  putFlatIdInFloorPolygon(svgWrap, data) {
    const parser = new DOMParser();
    const $svg = parser.parseFromString(data, 'text/html');
    const $floors = $svg.querySelectorAll('[data-type="floor"]');
    $floors.forEach(floorPolygon => {
      const { build, section, floor } = floorPolygon.dataset;
      const floorDataOfPolygon =
        this.floorList$.value.find(floorData => {
          return (
            floorData.floor == floor && floorData.build == build && floorData.section == section
          );
        }) || {};
      floorPolygon.dataset.flat_ids = floorDataOfPolygon['flatsIds']
        ? floorDataOfPolygon['flatsIds'].join(',')
        : '';
    });
    return $svg.querySelector('svg').outerHTML;
  }

  mutateGenplanInfrastructure(wrap, data) {
    const parser = new DOMParser();
    let $svg = parser.parseFromString(data, 'text/html');

    $svg = this.addInfrastructurePins($svg);

    // $svg.querySelector('svg').insertAdjacentHTML('beforeend',this.addTitlesNearFlybyPolygons($svg));

    this.addRectFillBackgrounds();
    wrap.insertAdjacentHTML('beforeend', $svg.querySelector('svg').outerHTML);

    this.handleMoveSvgPinsOnTop(wrap);

    /**this method must be in the end */
    this.addBackgroundForInsertedTextTitles(wrap);
  }

  definePinInfo(el) {
    const points = this.normalizepolygonPoints(el.getAttribute('points'));
    let x, y;

    const aspectRatio = this.calculateAspectRatio(points);
    const size = this.calculatePolygonArea(points);
    // ({ x, y } = this.calculateMiddleOfTopLine(points));
    // x -= 30;
    // y += 50;

    if (aspectRatio < 1 && size < 3000) {
      ({ x, y } = center(points));
    } else if (aspectRatio < 1) {
      ({ x, y } = center(points));
    } else if (size < 3000) {
      // ({ x, y } = this.normalizePolygonPointsTop(points));
      // x -= 10;
      // y -= 10;
      ({ x, y } = this.calculateMiddleOfTopLine(points));
      x -= 5;
      y -= 5;
    } else {
      // ({ x, y } = this.normalizePolygonPointsTop(points));
      // x -= 20;
      // y -= 20;
      ({ x, y } = this.calculateMiddleOfTopLine(points));
      x -= 30;
      y += 50;
      // console.log('Middle of top line:', x, y);
    }

    const id = el.dataset.id;
    const {
      iframe,
      type,
      title_i18n,
      img,
      title,
      description,
      filter_type,
      position,
    } = this.pinsInfo[id];

    let pinText = get(title, this.i18n.language, '');

    if (type === 'text') {
      return this.createTextPath(el.getAttribute('points'), pinText);
    }

    if (iframe) {
      return this.createVr360Pin(x, y, this.pinsInfo[id], el);
    }

    if (!iframe) {
      return this.createImagePin(x, y, this.pinsInfo[id], el);
    }

    const { leftmost, top, bottommost, rightmost } = findTopLeftBounds(points);

    switch (position) {
      case 'top_left':
        x = leftmost;
        y = top;
        break;
      case 'bottom_left':
        x = leftmost;
        y = bottommost;
        break;
      case 'bottom_right':
        x = rightmost;
        y = bottommost;
        break;
      case 'top_right':
        x = rightmost;
        y = top;
        break;
      default:
        break;
    }

    if (type === 'text') {
      return this.createTextPath(el.getAttribute('points'), pinText);
    }

    if (iframe) {
      return this.createVr360Pin(x, y, this.pinsInfo[id], el);
    }

    if (!iframe) {
      return this.createImagePin(x, y, this.pinsInfo[id], el);
    }

    const pinFill = this.fillCategories[filter_type] || this.fillCategories.default;
    let className = '';

    if (iframe) className += ' js-s3d-flat__3d-tour';

    if (img) el.dataset.img = img;
    if (get(description, this.i18n.language)) {
      $pin.dataset.text = get(description, this.i18n.language);
    }
    if (type === 'zone') {
      el.classList.value += ' zone';
      className += ' zone';
    }

    const dataHref = iframe ? `data-href="${iframe}"` : '';

    if (dataHref) {
      el.dataset.href = iframe;
    }

    const pinGroup = `
        <g
          data-pinType="${type}"
          data-title="${this.i18n.t(title_i18n)}"
          data-infra-filter="${filter_type}"
          ${dataHref}
          class="${className}"
          data-img="${img}"
          data-id="${id}"
          data-type="infrastructure"
        >
          ${type !== 'zone' ? '' : el.outerHTML}
          <rect
            data-img="${img}"
            data-id="${id}"
            data-type="infrastructure"
            data-title="${this.i18n.t(title_i18n)}"
            x="${x - this.pinWidth / 2}"
            y="${y - this.pinHeight / 2}"
            width="${this.pinWidth}"
            height="${this.pinHeight}"
            fill="${pinFill}"
            data-href="${iframe}"
            class="${className}"
          ></rect>
          <text
            style="pointer-events: none;"
            x="${x + this.pinWidth + 8}"
            y="${y + this.pinHeight / 1.65}"
          >
            ${this.i18n.t(title_i18n)}
          </text>
        </g>
      `;
    return pinGroup;
  }

  createImagePin(x, y, pinData, $pin) {
    const { iframe, type, img, description, title, filter_type, position, images_for_slider } = pinData;

    $pin.classList.add('js-s3d-flat__3d-tour');
    $pin.dataset.href = img;
    $pin.dataset.img = img;
    if (get(description, this.i18n.language)) {
      $pin.dataset.text = get(description, this.i18n.language);
    }

    let pinText = get(title, this.i18n.language, '');

    $pin.dataset.title = pinText;

    let polygonDataset = Object.entries($pin.dataset).reduce((acc, [key, value]) => {
      acc += ` data-${key}="${value}" `;
      return acc;
    }, '');

    if (Array.isArray(images_for_slider)) {
      $pin.dataset.fancyboxCustomGallery = images_for_slider.join(';');
      $pin.classList.remove('js-s3d-flat__3d-tour');

      polygonDataset += ` data-fancybox-custom-gallery="${$pin.dataset.fancyboxCustomGallery}" `;
    }
    // пін на сафарі фікс
    const isWindows = /Windows/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isSafari || isTouchDevice) {
      const size = 35;
      const isMobileDevice =
        /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
      const scaleFactor = isMobileDevice ? 1 : 1;
      const offsetY = 25 * scaleFactor;

      const polygonSafari = `<polygon points="${x - size},${y - size - offsetY} ${x + size},${y -
        size -
        offsetY} ${x + size},${y + size - offsetY} ${x - size},${y +
        size -
        offsetY}" class="js-s3d-flat__3d-tour pin-polygon-overlay-safari safari-delayed-render" ${polygonDataset} style="fill: rgba(0, 0, 0, 0); stroke: rgba(0, 0, 0, 0); stroke-width: 2; cursor: pointer; pointer-events: all; transform: scale(1); animation: safariRender 0.1s ease 0.15s both;" />`;

      return (
        SvgPin(
          x,
          y,
          img,
          pinText,
          $pin.outerHTML,
          polygonDataset,
          'triangle',
          `data-pin-type="${type}"`,
          pinData,
        ) + polygonSafari
      );}
    return SvgPin(
      x,
      y,
      img,
      pinText,
      $pin.outerHTML,
      polygonDataset,
      'triangle',
      `data-pin-type="${type}"`,
      pinData,
    );
  }

  createVr360Pin(x, y, pinData, $pin) {
    const { iframe, type, img, description, filter_type, position, title } = pinData;

    $pin.classList.add('js-s3d-flat__3d-tour');
    $pin.dataset.img = img;
    $pin.dataset.href = iframe;
    if (get(description, this.i18n.language)) {
      $pin.dataset.text = get(description, this.i18n.language);
    }

    let pinText = get(title, this.i18n.language, '');
    $pin.dataset.title = pinText;

    const polygonDataset = Object.entries($pin.dataset).reduce((acc, [key, value]) => {
      acc += ` data-${key}="${value}" `;
      return acc;
    }, '');

    return SvgPin(
      x,
      y,
      iframe,
      pinText,
      $pin.outerHTML,
      polygonDataset,
      VIDEO_FORMATS_REG_EXP.test(iframe) ? 'video' : 'large',
      `data-pin-type="${type}"`,
      pinData,
    );
  }

  addInfrastructurePins($svg) {
    const { type } = this.setting;
    const pinsHref = get(this, ['pin', type], {});
    $svg.querySelectorAll('polygon[data-type="infrastructure"]').forEach((el, index) => {
      const points = this.normalizepolygonPoints(el.getAttribute('points'));
      const { x, y } = center(points);

      const pinType = el.dataset.id.split('_')[1];

      const pinFill = this.fillCategories[pinType] || this.fillCategories.default;

      const pinID = el.dataset.id;
      el.dataset.title = this.i18n.t('pins.' + (pinID || 'pin'));
      let $hrefAttribute = '';
      if (pinsHref[el.dataset.id]) {
        $hrefAttribute = `data-id="${el.dataset.id}" data-href="${
          pinsHref[el.dataset.id]
        }" class="js-s3d-flat__3d-tour js-click-infra-pin"`;
        el.dataset.href = pinsHref[el.dataset.id];
      }

      const attrs = el.getAttributeNames().reduce((acc, name) => {
        if (name === 'class') return acc;
        acc.push(`${name}="${el.getAttribute(name)}"`);
        return acc;
      }, []);

      const pinGroup = `
        <g
          data-type="pin"
          ${$hrefAttribute}
          ${attrs.join(' ')}
          class="${pinsHref[el.dataset.id] ? 'js-s3d-flat__3d-tour' : ''}"
          data-href="${pinsHref[el.dataset.id] ? pinsHref[el.dataset.id] : ''}"
        >
          ${el.getAttribute('points').split(',').length <= 6 ? '' : el.outerHTML}
          <rect
            x="${x}"
            y="${y}"
            width="${this.pinWidth}"
            height="${this.pinHeight}"
            fill="${pinFill}"
            class="${pinsHref[el.dataset.id] ? 'js-s3d-flat__3d-tour' : ''}"
            data-href="${pinsHref[el.dataset.id] ? pinsHref[el.dataset.id] : ''}"
          >
          </rect>
        </g>
      `;
      $svg
        .querySelector('svg')
        .insertAdjacentHTML(
          'beforeend',
          isObject(this.pinsInfo[pinID]) ? this.definePinInfo(el) : pinGroup,
        );
      el.remove();
    });
    return $svg;
  }

  handleMoveSvgPinsOnTop(wrap) {
    wrap.querySelectorAll('g[data-type="pin"]').forEach(el => {
      el.addEventListener('mouseenter', function(evt) {
        el.parentElement.appendChild(el);
      });
    });
  }

  addBackgroundForInsertedTextTitles(wrapper) {
    wrapper.querySelectorAll('text').forEach(el => {
      const paddingHor = 8,
        paddingVer = 2;
      const { width, height, x, y } = el.getBBox();

      const bgRect = `
        <rect style="pointer-events: none;" class="text-background" x="${x - paddingHor}" y="${y -
        paddingVer}" width="${width + paddingHor * 2}" height="${height +
        paddingVer * 2}" rx="6" ry="6" fill="var(--color-bg-darkblue-color)"></rect>
      `;
      el.insertAdjacentHTML('beforebegin', bgRect);
    });
  }

  addTitlesNearFlybyPolygons($svg) {
    const array = [];
    $svg.querySelectorAll('polygon[data-type="flyby"]').forEach((el, index) => {
      const points = this.normalizepolygonPoints(el.getAttribute('points'));
      const { x, y } = center(points);
      const { leftmost, top } = findTopLeftBounds(points);
      const svgWidth = +el
        .closest('svg')
        .getAttribute('viewBox')
        .split(' ')[2];
      const isMacOs = document.documentElement.classList.contains('macos');
      const transformPin = isMacOs ? '' : '';
      const pinGroup =
        isMacOs && svgWidth < 1920
          ? `
        <g ${transformPin}  style="
          transform-origin: center center;
          transform-box: fill-box;
        ">
          <text style="fill: white; font-weight: 400; font-size: 10px" x="${x}" y="${y}">${this.i18n.t(
              `infoBox.flyby--${el.dataset.flyby}--${el.dataset.side}`,
            )}</text>
        </g>
        `
          : `
        <g ${transformPin}  style="
          transform-origin: center center;
          transform-box: fill-box;
        ">
          <text style="fill: white; font-weight: 400" x="${x}" y="${y}">${this.i18n.t(
              `infoBox.flyby--${el.dataset.flyby}--${el.dataset.side}`,
            )}</text>
        </g>
      `;
      array.push(pinGroup);
      // $svg.querySelector('svg').insertAdjacentHTML('beforeend',pinGroup);
    });
    return array.join('');
  }
  /**
   *  С девбейза приходят координаты все через запятую. Для поиска центра переводит их в корректный формат.
   * https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/points
   * */
  normalizepolygonPoints(points) {
    const splitedPoints = points.split(',');
    const normalized = [`${splitedPoints[0]}`];
    const lastElement = '' + splitedPoints.pop();

    for (let i = 1; i <= splitedPoints.length - 1; i += 2) {
      normalized.push(`${splitedPoints[i]} ${splitedPoints[i + 1]}`);
    }
    normalized.push(lastElement);

    // console.log('normalized', normalized.join(','));
    return normalized.join(',');
  }

  normalizePolygonPointsTop(points) {
    const splitedPoints = points.split(',').map(coord => coord.split(' ').map(Number));
    const flattened = splitedPoints.flat();

    const pairedPoints = [];
    for (let i = 0; i < flattened.length; i += 2) {
      pairedPoints.push({ x: flattened[i], y: flattened[i + 1] });
    }

    const topPoint = pairedPoints.reduce((top, current) => (current.y < top.y ? current : top));

    const centerX = pairedPoints.reduce((sum, point) => sum + point.x, 0) / pairedPoints.length;

    return { x: centerX, y: topPoint.y };
  }
  calculateAspectRatio(points) {
    const splitedPoints = points.split(',').map(coord => coord.split(' ').map(Number));
    const flattened = splitedPoints.flat();

    const pairedPoints = [];
    for (let i = 0; i < flattened.length; i += 2) {
      pairedPoints.push({ x: flattened[i], y: flattened[i + 1] });
    }

    // Find min and max values for x and y
    const minX = Math.min(...pairedPoints.map(point => point.x));
    const maxX = Math.max(...pairedPoints.map(point => point.x));
    const minY = Math.min(...pairedPoints.map(point => point.y));
    const maxY = Math.max(...pairedPoints.map(point => point.y));

    // Calculate width, height, and aspect ratio
    const width = maxX - minX;
    const height = maxY - minY;

    if (height === 0) {
      console.warn('Height is zero; cannot calculate aspect ratio');
      return null;
    }

    const aspectRatio = width / height;

    // console.log(`Aspect Ratio: ${aspectRatio.toFixed(2)}`);
    return aspectRatio;
  }

  calculatePolygonArea(points) {
    const pairedPoints = points.split(' ').map(coord => coord.split(',').map(Number));

    let area = 0;
    const n = pairedPoints.length;

    for (let i = 0; i < n; i++) {
      const [x1, y1] = pairedPoints[i];
      const [x2, y2] = pairedPoints[(i + 1) % n]; // Wrap to the first point
      area += x1 * y2 - y1 * x2;
    }

    return Math.abs(area / 2);
  }

  calculateMiddleOfTopLine(points) {
    // Step 1: Parse the points into { x, y } format
    const pairedPoints = points.split(' ').map(point => {
      const [x, y] = point.split(',').map(Number);
      return { x, y };
    });

    // Step 2: Find the minimum y-value (topmost in screen coordinates)
    const minY = Math.min(...pairedPoints.map(point => point.y));

    // Step 3: Find all points that have this minimum y-value
    const topmostPoints = pairedPoints.filter(point => point.y === minY);

    // Step 4: If we have exactly one topmost point, we need to find connected points
    if (topmostPoints.length === 1) {
      // Find the point with the next lowest y-value
      const remainingPoints = pairedPoints.filter(point => point.y !== minY);
      const nextMinY = Math.min(...remainingPoints.map(point => point.y));
      const nextTopmostPoints = pairedPoints.filter(point => point.y === nextMinY);

      // For simplicity, we'll use the middle of the line between the topmost point
      // and the average of the x-coordinates of the next highest points
      const topPoint = topmostPoints[0];
      const avgX = nextTopmostPoints.reduce((sum, p) => sum + p.x, 0) / nextTopmostPoints.length;

      return { x: (topPoint.x + avgX) / 2, y: minY };
    }
    // Step 5: If we have multiple topmost points (points with the same minimum y)
    else {
      // Sort by x-coordinate to find leftmost and rightmost
      topmostPoints.sort((a, b) => a.x - b.x);
      const leftmost = topmostPoints[0];
      const rightmost = topmostPoints[topmostPoints.length - 1];

      // Return the middle point of the line between leftmost and rightmost topmost points
      return {
        x: (leftmost.x + rightmost.x) / 2,
        y: minY,
      };
    }
  }

  addRectFillBackgrounds() {
    if (document.querySelector('[data-rect-fill-backgrounds]') !== null) return;
    document.body.insertAdjacentHTML(
      'afterbegin',
      `
      <svg data-rect-fill-backgrounds width="700" height="660" style=" width: 0; height: 0; overflow: hidden; position: absolute;">
        <defs>
          <filter x="0" y="0" width="1" height="1" id="solid">
            <feFlood flood-color="#0E0E0E" result="bg" />
            <feMerge>
              <feMergeNode in="bg"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          ${markers
            .map(marker => {
              return `<pattern id="${marker.replace(
                /\.(svg|png|jpg|jpeg|webp)/,
                '',
              )}" x="0" y="0" height="1" width="1">
            <image preserveAspectRatio="none" width="${this.pinWidth}" height="${
                this.pinHeight
              }"  xlink:href="${window.defaultModulePath}/images/markers/${marker}"></image>
          </pattern>`;
            })
            .join('')}
        </defs>
      </svg>
    `,
    );
  }

  /**Синхронізує дані в полігоні квартири (Дані в полігоні можуть відрізнятися від актуальних даних про квартиру) */
  assignFlatPolygonsWithFlatData(data) {
    const parser = new DOMParser();
    const $svg = parser.parseFromString(data, 'text/html').querySelector('svg');

    $svg.querySelectorAll('[data-type="flat"]').forEach(el => {
      const flat = this.getFlat(el.dataset.id);
      if (!flat) return;
      el.dataset.sale = flat.sale;
      Object.entries(el.dataset).map(snglDataset => {
        if (snglDataset[0] == 'id' || snglDataset[0] == 'type') return;
        el.dataset[snglDataset[0]] = flat[snglDataset[0]];
      });

      if (!this.show_flat_polygons_tooltip) return;

      const points = this.normalizepolygonPoints(el.getAttribute('points'));
      const { x, y } = center(points);
      const width = 135;
      const height = 30;
      const tooltip = `
        <foreignObject x="${x - width / 2}" y="${y -
        height /
          2}" style="transform: none" width="${width}" height="${height}" class="s3d-svg-flat-tooltip">
          <div class="s3d-svg-flat-tooltip__content">
            <div data-tooltip-sale="${flat.sale}" class="s3d-svg-flat-tooltip__inner">
            </div>
            <div class="s3d-svg-flat-tooltip__title">
              ${flat[this.show_flat_polygons_tooltip_key]}
            </div>
          </div>
        </foreignObject>
      `;
      $svg.insertAdjacentHTML('beforeend', tooltip);
    });

    return $svg.outerHTML;
  }

  createTextPath(polyPoints, text) {
    // Розбиття рядка координат полігона на окремі значення

    const textColor = 'white';
    const textSize = '25px';

    const coordinates = polyPoints.split(',').map(Number);

    // Знаходження координат вершин полігона
    const x1 = coordinates[0];
    const y1 = coordinates[1];
    const x2 = coordinates[2];
    const y2 = coordinates[3];

    // Створення унікального ідентифікатора для textPath
    const textPathId =
      'textPath' +
      Math.random()
        .toString(16)
        .substr(2, 8);

    // Формування рядка шляху для textPath
    const pathString = `M${x1},${y1} L${x2},${y2}`;

    // Створення SVG елементів за допомогою DOM API
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('id', textPathId);
    pathElement.setAttribute('d', pathString);

    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const textPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
    textPathElement.setAttribute('href', `#${textPathId}`);
    textPathElement.textContent = text;
    textPathElement.setAttribute('fill', textColor);
    textPathElement.setAttribute('font-size', textSize);

    textElement.appendChild(textPathElement);

    // Створення об'єкта з SVG елементами
    const svgElements = {
      path: pathElement,
      text: textElement,
    };

    return `
      <g>
        ${svgElements.path.outerHTML}
        ${svgElements.text.outerHTML}
      </g>
    `;
  }
}

function findTopLeftBounds(pointsAttr) {
  const pointsArr = pointsAttr.split(' ');
  let leftmost = parseFloat(pointsArr[0].split(',')[0]);
  let topmost = parseFloat(pointsArr[0].split(',')[1]);
  let rightmost = parseFloat(pointsArr[0].split(',')[0]);
  let bottommost = parseFloat(pointsArr[0].split(',')[1]);

  for (let i = 1; i < pointsArr.length; i++) {
    const point = pointsArr[i].split(',');
    const x = parseFloat(point[0]);
    const y = parseFloat(point[1]);

    if (x < leftmost) {
      leftmost = x;
    }

    if (x > rightmost) {
      rightmost = x;
    }

    if (y < topmost) {
      topmost = y;
    }
    if (y > bottommost) {
      bottommost = y;
    }
  }

  return {
    top: topmost,
    leftmost: leftmost,
    bottommost: bottommost,
    rightmost: rightmost,
  };
}

export default Svg;

export function calculatePolygonArea(pointsString) {
  // Розділяємо рядок координат на масив
  const points = pointsString.split(',');
  // Перетворюємо кожне двійкове число в масиві на число
  const coordinates = points.map(coord => parseFloat(coord));

  let area = 0;
  // Застосовуємо формулу Гауса для обчислення площі
  for (let i = 0; i < coordinates.length; i += 2) {
    const x1 = coordinates[i];
    const y1 = coordinates[i + 1];
    const x2 = coordinates[(i + 2) % coordinates.length];
    const y2 = coordinates[(i + 3) % coordinates.length];
    area += x1 * y2 - x2 * y1;
  }
  area = Math.abs(area) / 2;
  return area;
}
