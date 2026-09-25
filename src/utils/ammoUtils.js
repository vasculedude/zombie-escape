export const MAX_TOTAL_AMMO = 100;

export function applyAmmoPickup({
  magazineAmmo,
  reserveAmmo,
  pickupAmount,
  maxAmmo = MAX_TOTAL_AMMO
}) {
  const totalAmmo = magazineAmmo + reserveAmmo;
  const roomLeft = maxAmmo - totalAmmo;

  if (roomLeft <= 0) {
    return { magazineAmmo, reserveAmmo };
  }

  const ammoToAdd = Math.min(pickupAmount, roomLeft);

  return {
    magazineAmmo,
    reserveAmmo: reserveAmmo + ammoToAdd
  };
}
