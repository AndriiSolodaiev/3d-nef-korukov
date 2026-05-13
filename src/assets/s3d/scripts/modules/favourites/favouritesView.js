import $ from 'jquery';
import isObject from 'lodash/isObject';
import EventEmitter from '../eventEmitter/EventEmitter';
import { delegateHandler } from '../general/General';
import { emptyFavouritesTitle, favouriteTitle } from '../templates/favourites';
import gsap from 'gsap';

class FavouritesView extends EventEmitter {
  constructor(model, elements, i18n) {
    super();
    this._model = model;
    this._elements = elements;
    this.i18n = i18n;
    this.scrollableItemIndex = null;
    this.isAnimating = false;
    this.currentTimeline = null;
    this.syncItemsScrollHandler = this.syncItemsScrollHandler.bind(this);

    window.addEventListener('click', event => {
      const target = event.target.closest('.js-s3d__favourite-open');
      if (!target) return;
      this.emit('clickFavouriteOpen');
    });

    document.querySelector('.js-s3d__slideModule').addEventListener('click', event => {
      const favouriteAdd = delegateHandler('.js-s3d-add__favourite', event);
      if (!isObject(favouriteAdd) || !favouriteAdd || event.target.tagName === 'INPUT') return;
      event.preventDefault();

      this.emit('clickFavouriteHandler', favouriteAdd);
    });

    document.querySelector('#js-s3d__favourites')
      .addEventListener('click', event => {
        const close = delegateHandler('[data-compare-item-close]', event);
        const card = delegateHandler('[data-compare-item-open]', event);

        switch (true) {
            case isObject(close):
              this.emit('removeElement', close);
              break;
            case isObject(card):
              this.emit('clickElementHandler', card);
              break;
            default:
              break;
        }
      });

    model.on('clearAllHtmlTag', tag => { this.clearHtml(tag); });
    model.on('setInPageHtml', tag => { this.addElementInPage(tag); });
    model.on('removeElemInPageHtml', id => { this.removeCardInPage(id); });
    model.on('animateFavouriteElement', data => { this.animateFavouriteElement(data); });

    model.on('updateFavouritesInput', favourites => { this.updateFavouritesInput(favourites); });
    model.on('updateCountFavourites', value => this.updateCountFavourites(value));
    model.on('updateFavouritesTitle', count => this.updateFavouritesTitle(count));
  }

  removeCardInPage(id) {
    document.querySelector(`.js-s3d-fv [data-compare-item="${id}"]`).remove();
  }

  clearHtml(tag) {
    $(tag).remove();
    console.log('clearHtml', tag);
  }

  addElementInPage(favourites) {
    // Скасуємо попередню анімацію, якщо вона ще в процесі
    if (this.currentTimeline) {
      this.currentTimeline.kill();
    }

    this.isAnimating = true;
    this.currentTimeline = gsap.timeline()
      .to('.js-s3d-fv__list', {
        opacity: 0,
        duration: 0.08,
      })
      .add(() => {
        this.clearListAndAddItems(favourites);
      })
      .to('.js-s3d-fv__list', {
        opacity: 1,
        duration: 0.08,
      })
      .add(this.syncItemsScrollHandler)
      .then(() => {
        this.isAnimating = false;
        this.currentTimeline = null;
      });
  }

  clearListAndAddItems(favourites) {
    document.querySelector('.js-s3d-fv__list').innerHTML = '';
    document.querySelector('.js-s3d-fv__list').insertAdjacentHTML('beforeEnd', favourites.join(''));
  }

  updateFavouritesInput(favourites) {
    const prevSelector = '.js-s3d-add__favourite input:checked';
    const selector = '.js-s3d-add__favourite';
    const prevElements = document.querySelectorAll(prevSelector);
    prevElements.forEach(elem => {
      const label = elem.closest('[data-id]');
      // eslint-disable-next-line radix
      const id = parseInt(label.getAttribute('data-id'));
      if (favourites.includes(id)) return;
      
      elem.closest('.js-s3d-add__favourite').classList.remove('added-to-favourites');
      elem.checked = false;
    });


    favourites.forEach(id => {
      const elements = [...document.querySelectorAll(`${selector}[data-id='${id}']`)];
      elements.forEach(elem => {
        const input = elem.querySelector('input');
        if (!input) return;
        input.closest('.js-s3d-add__favourite').classList.add('added-to-favourites');
        input.checked = true;
      });
    });
  }

  updateCountFavourites(count) {
    this.updateCount(count);
    this.updateCountWithText(count);
  }

  updateCount(count) {
    const elements = document.querySelectorAll('.js-s3d__favourite-count');
    elements.forEach(elem => {
      // eslint-disable-next-line no-param-reassign
      elem.innerHTML = count;
      // eslint-disable-next-line no-param-reassign
      elem.setAttribute('data-count', count);
    });
  }

  updateCountWithText(count) {
    const countContainer = document.querySelector('.js-s3d__fv-count');
    if (!countContainer) return;
    countContainer.innerHTML = count;
    countContainer.setAttribute('data-count', count);
  }

  updateFavouritesTitle(count) {
    document.querySelector('[data-favourite-filled-title-wrapper]').style.display = count > 0 ? 'block' : 'none';
    document.querySelector('[data-favourite-empty-title-wrapper]').style.display = count > 0 ? 'none' : 'block';

    document.querySelectorAll('[data-disable-when-compare-empty]').forEach(el => {
      if (count > 0) {
        el.removeAttribute('disabled');
        return;
      } 
      el.setAttribute('disabled', 'disabled');
    });
  }

  syncItemsScrollHandler() {
    const elements = [...document.querySelectorAll('[data-compare-item] .CompareItem__table')];
        
    const handleScroll = (e) => {
      const scrolledEle = e.target;
      elements.filter((item) => item !== scrolledEle).forEach((ele) => {
          this.syncScroll(scrolledEle, ele);
      });
  };

    document.querySelectorAll('[data-compare-item] .CompareItem__table').forEach((ele) => {
        ele.addEventListener("scroll", handleScroll);
    });
  }

  syncScroll(scrolledEle, ele){
    const top = scrolledEle.scrollTop;
    const left = scrolledEle.scrollLeft;
    ele.scrollTo({
        behavior: "instant",
        top,
        left,
    });
  };

}

export default FavouritesView;
