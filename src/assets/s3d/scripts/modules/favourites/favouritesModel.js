import { gsap } from 'gsap';
import Card from '../templates/card/card';
import xor from 'lodash/xor';
import EventEmitter from '../eventEmitter/EventEmitter';
import dispatchTrigger from '../helpers/triggers';
import CompareItem from '../templates/CompareItem/CompareItem';
import { EmptyFavourites } from '../templates/favourites';
import { numberWithCommas } from '../../../../s3d2/scripts/helpers/helpers_s3d2';
import { BehaviorSubject } from 'rxjs';
import { enableDragScroll } from '../../features/dragScroll';
class FavouritesModel extends EventEmitter {
  constructor(config, i18n) {
    super();
    this.getFlat = config.getFlat;
    this.setFlat = config.setFlat;
    this.updateFsm = config.updateFsm;
    this.history = config.history;
    this.fsm = config.fsm;
    this.animationSpeed = 650;
    this.i18n = i18n;
    this.favouritesIds$ = config.favouritesIds$;
    this.previousFavouritesCount = this.favouritesIds$.value.length;
    this.updateFavouritesBlock = this.updateFavouritesBlock.bind(this);
    this.isShowOnlyPropertiesDifference = new BehaviorSubject(false);
    this.propertiesToShow = [
      {
        keyPath: '_price',
        title: this.i18n.t('Flat.information.price'),
        valueFormat: value => `${this.i18n.t('currency_label')} ${numberWithCommas(value)}`,
      },
      {
        keyPath: 'price_m2',
        title: this.i18n.t('Flat.information.price_m2'),
        valueFormat: value => `${this.i18n.t('currency_label')} ${numberWithCommas(value)}`,
      },
      {
        keyPath: 'sale',
        title: this.i18n.t('Flat.information.sale'),
        valueFormat: value => `${value}`,
      },
      {
        keyPath: 'area',
        title: this.i18n.t('Flat.information.area'),
        valueFormat: value => `${value} ${this.i18n.t('area_unit')}`,
      },
      {
        keyPath: 'life_room',
        title: this.i18n.t('Flat.information.life_area'),
        valueFormat: value => `${value} ${this.i18n.t('area_unit')}`,
      },
      {
        keyPath: 'rooms',
        title: this.i18n.t('Flat.information.rooms'),
      },
      {
        keyPath: 'build',
        title: this.i18n.t('Flat.information.build'),
      },
      {
        keyPath: 'floor',
        title: this.i18n.t('Flat.information.floor'),
      },
      {
        keyPath: 'number',
        title: this.i18n.t('Flat.information.number'),
      },
    ];

    this.show_prices = config.show_prices;

    if (!this.show_prices) {
      this.propertiesToShow = this.propertiesToShow.filter(
        property => property.keyPath !== '_price' && property.keyPath !== 'price_m2',
      );
    }

    document.body.addEventListener('click', event => {
      const target = event.target.closest('[data-favourites-empty-button]');
      if (!target) return;
      this.updateFsm({ type: 'plannings' });
    });

    document.body.addEventListener('change', event => {
      const target = event.target.matches('[data-compare-show-differences]');
      if (!target) return;
      console.log('target', event.target.checked);
      this.isShowOnlyPropertiesDifference.next(event.target.checked);
    });

    this.favouritesIds$.subscribe(favourites => {
      this.emit('updateFavouritesTitle', favourites.length);

      if (favourites.length <= 1) {
        this.isShowOnlyPropertiesDifference.next(false);
        document
          .querySelector('[data-compare-show-differences]')
          .setAttribute('disabled', 'disabled');
        document.querySelector('input[data-compare-show-differences]').checked = false;
      } else {
        document.querySelector('[data-compare-show-differences]').removeAttribute('disabled');
      }

      this.toggleFavouriteButtonVisibility(favourites.length);
    });

    this.isShowOnlyPropertiesDifference.subscribe(isShowOnlyPropertiesDifference => {
      const flats = this.favouritesIds$.value.map(id => this.getFlat(id));

      const allEqual = arr => arr.every(v => v === arr[0]);

      this.propertiesToShow = this.propertiesToShow.map(property => {
        const isEqual = allEqual([...flats.map(flat => flat[property.keyPath])]);
        return {
          ...property,
          hide: isShowOnlyPropertiesDifference && isEqual,
        };
      });

      this.updateFavouritesBlock();
    });
  }

  init(initFavourites = []) {
    this.favouritesIds$.subscribe(favourites => {
      this.emit('updateCountFavourites', favourites.length);
      this.emit('updateFavouritesInput', favourites);

      const isClearedFromNonEmpty =
        this.previousFavouritesCount > 0 && favourites.length === 0;

      if (isClearedFromNonEmpty) {
        this.history.deleteSearchParam('favourites');
      } else if (favourites.length > 0) {
        this.updateHistory({ favourites });
      }

      this.previousFavouritesCount = favourites.length;
    });

    const favouritesStore = this.getFavourites();
    const favouritesIds = favouritesStore.length > 0 ? favouritesStore : initFavourites;
    this.favouritesIds$.next(favouritesIds);
  }

  toggleFavouriteButtonVisibility(count) {
    const favouriteContainer = document.querySelector('.js-s3d__favourite-open');
    if (!favouriteContainer) return;

    if (count === 0) {
      favouriteContainer.classList.add('is-hidden');
    } else {
      favouriteContainer.classList.remove('is-hidden');
    }
  }

  update() {
    this.updateFavouritesBlock();
    this.emit('updateFvCount', this.favouritesIds$.value.length);
  }

  selectElementHandler(id) {
    this.updateFsm({ type: 'flat', id });
  }

  updateHistory(name) {
    if (this['history'] && this['history'].update) {
      this.history.update(name);
      return true;
    }
    return false;
  }

  removeElement(id) {
    this.emit('removeElemInPageHtml', id);
  }

  getFavourites() {
    if (!this.isSessionStorageSupported()) {
      return [];
    }

    const storage = JSON.parse(sessionStorage.getItem('favourites'));
    const result = (storage || [])
      .filter(el => !checkValue(el))
      .reduce((previous, el) => {
        if (previous.indexOf(+el) < 0) {
          previous.push(+el);
        }
        return previous;
      }, []);
    return result;
  }

  openFavouritesHandler() {
    this.updateFsm({ type: 'favourites' });
  }

  updateFavouritesBlock() {
    console.log('updateFavouritesBlock');
    this.emit(
      'clearAllHtmlTag',
      '.js-s3d-fv__list .js-s3d-card, .js-s3d-fv__list .EmptyFavourites',
    );

    // const html = this.favouritesIds$.value.map(id => Card(this.i18n, this.getFlat(id), this.favouritesIds$));
    const html =
      this.favouritesIds$.value.length > 0
        ? this.favouritesIds$.value.map(id =>
            CompareItem({
              flat: this.getFlat(id),
              i18n: this.i18n,
              id,
              propertiesToShow: this.propertiesToShow,
            }),
          )
        : [EmptyFavourites(this.i18n)];
    this.emit('setInPageHtml', html);
    const list = document.querySelector('.js-s3d-fv__list');
    if (list) enableDragScroll(list);
  }

  changeFavouritesHandler(element, isAnimate) {
    // eslint-disable-next-line radix
    const id = parseInt(element.getAttribute('data-id'));
    if (!id) return;

    const favourites = this.favouritesIds$.value;
    const updatedFavourites = xor(favourites, [id]);
    if (!this.isSessionStorageSupported()) {
      return [];
    }
    sessionStorage.setItem('favourites', JSON.stringify(updatedFavourites));
    dispatchTrigger(
      updatedFavourites.includes(id) ? 'add-object-to-favourites' : 'delete-object-from-favourites',
      {
        url: window.location.href,
        id: id,
      },
    );

    if (isAnimate) {
      this.moveToFavouriteEffectHandler(element, !updatedFavourites.includes(id));
    }
    this.favouritesIds$.next(updatedFavourites);
    if (updatedFavourites.length === 0 && this.fsm.state === 'favourites') {
      this.history.deleteSearchParam('favourites');
    }
  }

  // animation transition heart from/to for click
  moveToFavouriteEffectHandler(target, reverse) {
    const animatingIcon = target.querySelector('svg');
    const endPositionElement = document.querySelector('.js-s3d__favourite-icon');
    const distance = this.getBetweenDistance(animatingIcon, endPositionElement);
    this.animateFavouriteElement(endPositionElement, animatingIcon, distance, reverse);
  }

  getBetweenDistance(animatingIcon, endPositionElement) {
    if (!animatingIcon || !endPositionElement) return { x: 0, y: 0 };
    const animate = animatingIcon.getBoundingClientRect();
    const endAnimate = endPositionElement.getBoundingClientRect();
    const animateX = animate.left + animate.width / 2;
    const animateY = animate.top + animate.height / 2;
    const endAnimateX = endAnimate.left + endAnimate.width / 2;
    const endAnimateY = endAnimate.top + endAnimate.height / 2;
    return {
      x: endAnimateX - animateX,
      y: endAnimateY - animateY,
    };
  }

  isSessionStorageSupported() {
    try {
      var storage = window.sessionStorage;
      storage.setItem('test', 'test');
      storage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }

  getSpeedAnimateHeart(offsetObj) {
    return Math.abs(offsetObj.x) + Math.abs(offsetObj.y);
  }

  animateFavouriteElement(destination, element, distance, reverse) {
    if (gsap === undefined || !destination || !element) return;

    const host = document.querySelector('.js-s3d__slideModule');
    if (!host) return;

    const sourceRect = element.getBoundingClientRect();
    const destRect = destination.getBoundingClientRect();
    const sourceCenter = {
      x: sourceRect.left + sourceRect.width / 2,
      y: sourceRect.top + sourceRect.height / 2,
    };
    const destCenter = {
      x: destRect.left + destRect.width / 2,
      y: destRect.top + destRect.height / 2,
    };

    const startPoint = reverse ? destCenter : sourceCenter;
    const endPoint = reverse ? sourceCenter : destCenter;
    const travelDistance = {
      x: endPoint.x - startPoint.x,
      y: endPoint.y - startPoint.y,
    };

    const distanceWeight = Math.max(0.85, this.getSpeedAnimateHeart(travelDistance) / 800);
    const travelDuration = Math.min(1.25, (this.animationSpeed / 1000) * distanceWeight);
    const shatterDuration = 0.09;
    const particleCount = 10;
    const shardShapes = [
      'polygon(0 0, 70% 8%, 55% 52%, 8% 72%)',
      'polygon(22% 0, 100% 12%, 88% 70%, 30% 62%)',
      'polygon(0 30%, 52% 0, 84% 42%, 34% 96%)',
      'polygon(8% 14%, 74% 0, 100% 54%, 18% 88%)',
      'polygon(0 12%, 48% 0, 100% 24%, 42% 100%)',
      'polygon(12% 0, 88% 10%, 72% 96%, 0 70%)',
    ];
    const particles = [];

    for (let i = 0; i < particleCount; i += 1) {
      const particle = element.cloneNode(true);
      particle.classList.add('s3d-favourite__pulse');
      particle.style.animation = 'none';
      particle.style.pointerEvents = 'none';
      const particleSizeFactor = 0.44 + Math.random() * 0.32;
      const particleWidth = Math.max(10, sourceRect.width * particleSizeFactor);
      const particleHeight = Math.max(10, sourceRect.height * particleSizeFactor);
      particle.style.width = `${particleWidth}px`;
      particle.style.height = `${particleHeight}px`;
      particle.style.left = `${startPoint.x - particleWidth / 2}px`;
      particle.style.top = `${startPoint.y - particleHeight / 2}px`;
      particle.style.clipPath = shardShapes[i % shardShapes.length];
      particle.style.webkitClipPath = shardShapes[i % shardShapes.length];
      particle.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))';
      particle.style.zIndex = '2002';
      host.insertAdjacentElement('beforeend', particle);
      particles.push(particle);
    }

    const pulseTarget = reverse ? element : destination;
    gsap.to(pulseTarget, {
      duration: 0.14,
      scale: reverse ? 0.84 : 1.18,
      ease: 'power4.out',
      yoyo: true,
      repeat: 1,
      overwrite: true,
    });

    particles.forEach((particle, index) => {
      const spread = 18 + Math.random() * 20;
      const angle = (Math.PI * 2 * index) / particleCount + Math.random() * 0.35;
      const burstX = Math.cos(angle) * spread;
      const burstY = Math.sin(angle) * spread - 6;

      const endJitter = reverse ? 4 : 10;
      const finalX = travelDistance.x + (Math.random() - 0.5) * endJitter;
      const finalY = travelDistance.y + (Math.random() - 0.5) * endJitter;

      const initialScale = reverse ? 0.28 + Math.random() * 0.2 : 0.5 + Math.random() * 0.25;
      const midScale = reverse ? 0.62 + Math.random() * 0.2 : 0.42 + Math.random() * 0.2;
      const finalScale = reverse ? 0.72 : 0.2;
      const burstRotate = (Math.random() - 0.5) * 240;

      const tl = gsap.timeline({
        delay: index * 0.012,
        onComplete: () => particle.remove(),
      });

      tl.set(particle, {
        x: 0,
        y: 0,
        opacity: reverse ? 0.45 : 1,
        scale: initialScale,
        rotate: (Math.random() - 0.5) * 45,
        transformOrigin: '50% 50%',
      });

      tl.to(particle, {
        scale: initialScale * (reverse ? 1.22 : 1.34),
        opacity: reverse ? 0.62 : 1,
        duration: 0.04,
        ease: 'power4.out',
      });

      tl.to(particle, {
        x: burstX,
        y: burstY,
        opacity: reverse ? 0.88 : 0.98,
        scale: midScale,
        rotate: burstRotate,
        duration: shatterDuration,
        ease: 'expo.out',
      });

      tl.to(particle, {
        x: finalX,
        y: finalY,
        opacity: reverse ? 1 : 0.2,
        scale: finalScale,
        rotate: 0,
        duration: travelDuration,
        ease: reverse ? 'power3.out' : 'power3.inOut',
      });
    });
  }
}

export default FavouritesModel;
