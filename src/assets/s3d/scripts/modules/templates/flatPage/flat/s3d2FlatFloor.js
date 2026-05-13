import $s3d2GoToFloor from '../$s3d2GoToFloor';
import $s3d2ApartmentPlanings from './apartmentPlan/s3d2ApartmentPlaning';

export default function s3d2FlatFloorPlan(i18n, flat, floorList, socialMediaLinks, contacts) {
  return `
    <div class="s3d2-apartment__flat-floor-plan-wrap">
        <h2 class="payment__title-icon-container__title mob-v"> ${i18n.t('Flat.layout')}</h2>
        ${$s3d2ApartmentPlanings(i18n, flat, socialMediaLinks, contacts)}
        <!-- ${$s3d2GoToFloor(i18n, flat, floorList)} -->

    </div>
    `;
}
