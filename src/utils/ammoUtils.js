export const MAX_TOTAL_AMMO = 100;

export function applyAmmoPickup({
  magazineAmmo,
  reserveAmmo,
  pickupAmount,
  maxAmmo = MAX_TOTAL_AMMO
}) {
  if (
    !Number.isFinite(magazineAmmo) ||
    !Number.isFinite(reserveAmmo) ||
    !Number.isFinite(pickupAmount) ||
    !Number.isFinite(maxAmmo)
  ) {
    return { magazineAmmo, reserveAmmo };
  }

  const safeMagazineAmmo = Math.max(0, magazineAmmo);
  const safeReserveAmmo = Math.max(0, reserveAmmo);
  const safePickupAmount = Math.max(0, pickupAmount);
  const safeMaxAmmo = Math.max(0, maxAmmo);

  if (safePickupAmount <= 0 || safeMaxAmmo <= 0) {
    return { magazineAmmo: safeMagazineAmmo, reserveAmmo: safeReserveAmmo };
  }

  const totalAmmo = safeMagazineAmmo + safeReserveAmmo;
  const roomLeft = safeMaxAmmo - totalAmmo;

  if (roomLeft <= 0) {
    return { magazineAmmo: safeMagazineAmmo, reserveAmmo: safeReserveAmmo };
  }

  const ammoToAdd = Math.min(Math.floor(safePickupAmount), roomLeft);

  return {
    magazineAmmo: safeMagazineAmmo,
    reserveAmmo: safeReserveAmmo + ammoToAdd
  };
}

export function distributeAmmoPickup(
  weaponSlots,
  pickupAmount,
  maxAmmo = MAX_TOTAL_AMMO
) {
  const updatedSlots = weaponSlots.map(slot => ({ ...slot }));
  if (
    !Number.isFinite(pickupAmount) ||
    !Number.isFinite(maxAmmo) ||
    maxAmmo <= 0
  ) {
    return { weaponSlots: updatedSlots, ammoAdded: 0 };
  }

  let remainingAmmo = Math.max(0, Math.floor(pickupAmount));
  const safeMaxAmmo = Math.floor(maxAmmo);
  let eligibleSlots = updatedSlots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) =>
      slot.weapon &&
      !slot.weapon.isMelee &&
      Number.isFinite(slot.magazineAmmo) &&
      Number.isFinite(slot.reserveAmmo) &&
      slot.magazineAmmo + slot.reserveAmmo < safeMaxAmmo
    );
  const pickupSize = remainingAmmo;

  while (remainingAmmo > 0 && eligibleSlots.length > 0) {
    const share = Math.max(1, Math.floor(remainingAmmo / eligibleSlots.length));
    const nextEligibleSlots = [];

    for (const { slot, index } of eligibleSlots) {
      const room = Math.max(
        0,
        safeMaxAmmo - slot.magazineAmmo - slot.reserveAmmo
      );
      const ammoToAdd = Math.min(share, room, remainingAmmo);
      slot.reserveAmmo += ammoToAdd;
      remainingAmmo -= ammoToAdd;

      if (slot.magazineAmmo + slot.reserveAmmo < safeMaxAmmo) {
        nextEligibleSlots.push({ slot, index });
      }

      if (remainingAmmo === 0) {
        break;
      }
    }

    eligibleSlots = nextEligibleSlots;
  }

  return {
    weaponSlots: updatedSlots,
    ammoAdded: pickupSize - remainingAmmo
  };
}
