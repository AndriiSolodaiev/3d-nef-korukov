import $ from 'jquery';
import EventEmitter from '../eventEmitter/EventEmitter';
import center from 'svg-polygon-center';
import get from 'lodash/get';
import $projectLogo from '../templates/$projectLogo';
import SvgFlybyTooltip from '../../../../s3d2/scripts/templates/flyby/tooltips/SvgFlybyTooltip';
import {
  isDesktop,
  isDesktopTouchMode,
  isMobile,
} from '../../../../s3d2/scripts/helpers/helpers_s3d2';
import MobileSvgFlybyTooltip from '../../../../s3d2/scripts/templates/flyby/tooltips/MobileSvgFlybyTooltip';
import { primaryInput } from 'detect-it';
// import Svg from '../Svg';

class SliderView extends EventEmitter {
  constructor(model, elements) {
    super();
    this._model = model;
    this._elements = elements;

    this.wrapper = $(elements.wrapper);

    // attach model listeners
    model.on('hideActiveSvg', () => {
      this.hideActiveSvg();
    });
    model.on('showActiveSvg', () => {
      this.showActiveSvg();
    });
    model.on('showSelectedFlats', ({ flats, isFilterParamsSelected }) => {
      this.showSelectedFlats(flats, isFilterParamsSelected);
    });
    model.on('showSelectedFloors', floors => {
      this.showSelectedFloors(floors);
    });
    model.on('showSelectPolygon', element => {
      this.showSelectPolygon(element);
    });
    model.on('showFlatCountOnBuild', flatsData => {
      this.showFlatCountOnBuild(flatsData);
    });
    model.on('filteredPolygonRemoveClass', typeToRemove => {
      this.filteredPolygonRemoveClass(typeToRemove);
    });
    model.on('changeSvgActive', svg => {
      this.updateSvgActive(svg);
    });
    model.on('changeFlatActive', svg => {
      this.updateFlatActive(svg);
    });
    model.on('removeActiveFlatNewMethod', () => {
      this.removeFlatActive();
    });
    model.on('removeSvgActivePolygons', () => {
      this.removeSvgActivePolygons();
    });
    model.on('updateLoaderProgress', amount => {
      this.updatePreloaderPercent(amount);
    });
    model.on('progressBarHide', () => {
      this.progressBarHide();
    });
    model.on('createArrow', () => {
      this.createArrow();
    });
    model.on('changeContainerCursor', cursor => {
      this.changeContainerCursor(cursor);
    });

    // attach listeners to HTML controls
    this.wrapper.on('mouseleave', () => {
      if (window.matchMedia('(max-width: 1024px)').matches) return;
      if (isDesktopTouchMode() || primaryInput !== 'mouse') return;
      this.emit('disableInfoBox');
    });
    this.wrapper.on('mousedown', event => {
      if (isDesktopTouchMode() || primaryInput !== 'mouse') return;
      this.emit('mouseKeyDown', event);
    });
    this.wrapper.on('mousemove', elements.wrapperEvent, event => {
      if (isDesktopTouchMode() || primaryInput !== 'mouse') return;
      this.emit('mouseMove', event);
    });
    this.wrapper.on('mouseup mouseleave', event => {
      if (isDesktopTouchMode() || primaryInput !== 'mouse') return;
      this.emit('mouseKeyUp', event);
    });
    this.wrapper.on('click touch', 'polygon, circle, g, foreignObject', event => {
      if (isDesktopTouchMode() || !isDesktop()) {
        this._model.touchPolygonMobileHandler(event);
      } else {
        this._model.touchPolygonHandler(event);
      }
      // this.emit('touchPolygon', event);
    });
    window.addEventListener('keydown', event => {
      this.emit('keyPress', event);
    });
  }

  changeContainerCursor(cursor) {
    if (!cursor) return;
    const container = document.querySelector(`.js-s3d__svg-container__${this._model.type}`);
    if (!container) return;
    container.style.cursor = cursor;
  }

  hideActiveSvg() {
    this._model.getSvgActive().css({ opacity: 0 /*pointerEvents: 'none', display: 'none' */ });
  }

  showActiveSvg() {
    this._model.getSvgActive().css({ opacity: 1 /*pointerEvents: 'all', display: ''*/ });
  }

  showSelectPolygon(elem) {
    $('.js-s3d__svgWrap .polygon__selected').removeClass('polygon__selected');
    $(`.polygon__flat-svg`).removeClass('polygon__flat-svg');
    elem.classList.add('polygon__selected');
  }

  updateSvgActive(svg) {
    this._model.wrapper.find('.s3d__svg__active').removeClass('s3d__svg__active');
    if (!svg) return;
    svg.addClass('s3d__svg__active');
  }

  removeFlatActive() {
    document
      .querySelectorAll('polygon.active[data-type="flat"], polygon.active[data-type="floor"]')
      .forEach(el => {
        el.classList.remove('active');
      });
  }

  updateFlatActive(data) {
    if (typeof data === 'string' || typeof data === 'number') {
      if (document.querySelectorAll(`polygon[data-type="flat"][data-id="${data}"]`).length > 0) {
        this.removeFlatActive();
        document.querySelectorAll(`polygon[data-type="flat"][data-id="${data}"]`).forEach(el => {
          el.classList.add('active');
        });
      }
    }
    if (typeof data === 'string' || typeof data === 'number') {
      if (
        document.querySelectorAll(`polygon[data-type="floor"][data-flat_ids*="${data}"]`).length ===
        0
      )
        return;
      this.removeFlatActive();
      document
        .querySelectorAll(`polygon[data-type="floor"][data-flat_ids*="${data}"]`)
        .forEach(el => {
          el.classList.add('active');
        });
      return;
    }
    // const { id, build, floor } = data;
    // this.removeSvgActivePolygons();
    // if (id) {
    //   $(`.js-s3d__svgWrap [data-id=${id}]`).addClass('polygon__flat-svg');
    // } else {
    //   $(`.js-s3d__svgWrap [data-build=${build}][data-floor=${floor}]`).addClass('polygon__flat-svg');
    // }
  }

  filteredPolygonRemoveClass(typeToRemove) {
    // $('.js-s3d__svgWrap .polygon__filter-select').removeClass('polygon__filter-select');
    document
      .querySelectorAll(`.js-s3d__svgWrap .polygon__filter-select[data-type="${typeToRemove}"]`)
      .forEach(el => {
        el.classList.remove('polygon__filter-select');
      });
  }

  // подсвечивает квартиры на svg облёта
  showSelectedFlats(flats, isFilterParamsSelected) {
    const allPolygons = document.querySelectorAll(
      '#js-s3d__wrapper polygon[data-type="flat"][data-id]',
    );
    allPolygons.forEach(poly => {
      poly.style.pointerEvents = 'none';
      poly.classList.remove('polygon__filter-select');
      poly.classList.add('polygon__filter-deselect');
    });

    flats.forEach(id => {
      const floorPolygon = document.querySelectorAll(`#js-s3d__wrapper polygon[data-id="${id}"]`);
      floorPolygon.forEach(poly => {
        poly.style.pointerEvents = '';
        poly.classList.remove('polygon__filter-deselect');
        if (isFilterParamsSelected) return;
        poly.classList.add('polygon__filter-select');
        poly.classList.remove('polygon__filter-deselect');
      });
    });
  }

  showSelectedFloors(floors) {
    const allPolygons = document.querySelectorAll('#js-s3d__wrapper polygon[data-type="floor"]');
    allPolygons.forEach(poly => {
      // poly.style.pointerEvents = 'none';
      poly.classList.add('polygon__filter-select');
    });
    floors.forEach(floorData => {
      const { build, section, floor } = floorData;
      const floorPolygon = document.querySelectorAll(
        `#js-s3d__wrapper polygon[data-type="floor"][data-build="${build}"][data-section="${section}"][data-floor="${floor}"]`,
      );
      floorPolygon.forEach(poly => {
        poly.style.pointerEvents = '';
        poly.classList.add('polygon__filter-select');
      });
    });
  }

  removeSvgActivePolygons() {
    $('.js-s3d__svgWrap .polygon__flat-svg').removeClass('polygon__flat-svg');
  }

  updatePreloaderPercent(percent) {
    $('.fs-preloader-amount').html(percent);
  }

  progressBarHide() {
    $('.js-fs-preloader-before').removeClass('preloader-active');
  }

  createArrow() {
    window.addEventListener('click', evt => {
      if (evt.target.closest('[class*="js-s3d__button"]') === null) return;
      const target = evt.target.closest('[class*="js-s3d__button"]');
      this._model.checkDirectionRotate(target.dataset.type);
    });
  }

  showFlatCountOnBuild({ filtered: flats, all, allFlatsBuild }) {
    /**Після перенесення даних у загальні налаштування треба змінювати формат об'єкту
     * з "1-outside": ["1","2","3"] --->      "1-2-3": 'flyby--1--outside',
     */
    const flybyAndBuildNamesMap = Object.entries(
      this._model.assotiated_flat_builds_with_flybys,
    ).reduce((acc, [flyby, builds]) => {
      acc[builds.join('-')] = 'flyby--' + flyby.replace('-', '--');
      return acc;
    }, {});

    document.querySelectorAll('[data-build-flat-count-element]').forEach(el => el.remove());

    Object.entries(flybyAndBuildNamesMap).forEach(([build_name, flybyName]) => {
      // count flats in defined before flybys
      let flatsFilteredCountInFlyby = build_name.split('-');
      flatsFilteredCountInFlyby = flatsFilteredCountInFlyby.reduce((acc, build) => {
        acc += flats.filter(flat => flat == build).length;
        return acc;
      }, 0);

      let totalFlatsInFlyby = build_name.split('-');
      totalFlatsInFlyby = totalFlatsInFlyby.reduce((acc, build) => {
        acc += allFlatsBuild.filter(flat => flat == build).length;
        return acc;
      }, 0);

      const [type, flyby, side] = flybyName.split('--');

      const minPrice = this._model.g_getFlybyMinPrice(flyby, side);
      const minPriceM2 = this._model.g_getFlybyMinPriceM2(flyby, side);

      document
        .querySelectorAll(
          `polygon[data-type="${type}"][data-flyby="${flyby}"][data-side="${side}"]`,
        )
        .forEach(el => {
          el.dataset.flatsCount = flatsFilteredCountInFlyby;
          // const { x, y } = center(normalizepolygonPoints(el.getAttribute('points')));
          let { x, y } = normalizePolygonPointsTop(el.getAttribute('points'));
          x -= 40;
          y -= 40;

          const finishDate = get(this._model, ['flyby_finish_dates', `${flyby}-${side}`], '');
          let $finishDate = finishDate;

          const regex = /\[\[\d+\]\]/;
          const isNeedToExtractFinishDateFromFlatList = finishDate.match(regex);

          if (isNeedToExtractFinishDateFromFlatList) {
            const ectractedBuildName = $finishDate.match(/\d+/)[0];
            const flatWithFinishDate = Object.values(this._model.flatsList).find(
              flat => flat.build == ectractedBuildName,
            );
            if (flatWithFinishDate) {
              $finishDate = flatWithFinishDate.project_deadline;
            }
          }

          const $tooltip = SvgFlybyTooltip({
                i18n: this._model.i18n,
                title: this._model.i18n.t(`ctr.nav.tooltip_${flyby}`),
                x,
                y,
                flyby,
                id: `tooltip${flyby}-${side}`,
                side,
                flatsFilteredCountInFlybyPostfix: this._model.i18n.t('ctr.nav.flat_shot'),
                flatsFilteredCountInFlyby,
                rightTitle1:
                  this._model.show_prices === true
                    ? `${this._model.i18n.t('from')} ${this._model.i18n.t(
                        'currency_label',
                      )} ${minPrice}`
                    : '',
                rightTitle2:
                  this._model.show_prices === true
                    ? `${this._model.i18n.t('from')} ${this._model.i18n.t(
                        'currency_label',
                      )} ${minPriceM2} ${this._model.i18n.t('Floor.information.per_m2')}`
                    : '',
                totalFlatsInFlyby,
                finishDate: $finishDate,
              });
          el.closest('svg').insertAdjacentHTML('beforeend', $tooltip);
        });
    });
  }
}

function normalizepolygonPoints(points) {
  const splitedPoints = points.split(',');
  const normalized = [`${splitedPoints[0]}`];
  const lastElement = '' + splitedPoints.pop();

  for (let i = 1; i <= splitedPoints.length - 1; i += 2) {
    normalized.push(`${splitedPoints[i]} ${splitedPoints[i + 1]}`);
  }
  normalized.push(lastElement);
  return normalized.join(',');
}
function normalizePolygonPointsTop(points) {
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
export default SliderView;
