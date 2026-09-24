export const calculateDistance = (
  lat1,
  lon1,
  lat2,
  lon2
) => {

  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
};


export const getMatchDetails = (
  donation,
  shelter
) => {

  let score = 0;

  const reasons = [];


  // ITEM TYPE

  if (
    shelter.requiredItemType &&
    donation.itemType ===
      shelter.requiredItemType
  ) {

    score += 40;

    reasons.push(
      "✓ Required item type matches"
    );

  } else {

    reasons.push(
      "✗ Item type does not match"
    );

  }


  // QUANTITY

  if (
    shelter.requiredQuantity &&
    donation.quantity >=
      shelter.requiredQuantity
  ) {

    score += 20;

    reasons.push(
      "✓ Required quantity is available"
    );

  } else {

    reasons.push(
      "✗ Required quantity is not fully available"
    );

  }


  // DISTANCE

  let distance = null;

  if (
    donation.latitude != null &&
    donation.longitude != null &&
    shelter.latitude != null &&
    shelter.longitude != null
  ) {

    distance =
      calculateDistance(
        donation.latitude,
        donation.longitude,
        shelter.latitude,
        shelter.longitude
      );


    if (distance <= 5) {

      score += 30;

      reasons.push(
        `✓ Very close (${distance.toFixed(
          1
        )} km)`
      );

    } else if (distance <= 15) {

      score += 20;

      reasons.push(
        `✓ Nearby (${distance.toFixed(
          1
        )} km)`
      );

    } else if (distance <= 30) {

      score += 10;

      reasons.push(
        `✓ Within 30 km (${distance.toFixed(
          1
        )} km)`
      );

    } else {

      reasons.push(
        `✗ Far away (${distance.toFixed(
          1
        )} km)`
      );

    }

  } else {

    reasons.push(
      "⚠ Location information unavailable"
    );

  }


  // EXPIRY / URGENCY

  let hoursLeft = null;

  if (donation.expiryTime) {

    const expiry =
      new Date(
        donation.expiryTime
      ).getTime();

    hoursLeft =
      (expiry - Date.now()) /
      (1000 * 60 * 60);


    if (
      hoursLeft > 0 &&
      hoursLeft <= 6
    ) {

      score += 10;

      reasons.push(
        "✓ High urgency - expires within 6 hours"
      );

    } else if (
      hoursLeft > 6 &&
      hoursLeft <= 24
    ) {

      score += 5;

      reasons.push(
        "✓ Moderate urgency - expires within 24 hours"
      );

    } else if (
      hoursLeft > 24
    ) {

      reasons.push(
        "Donation has sufficient time"
      );

    } else {

      reasons.push(
        "⚠ Donation may already be expired"
      );

    }

  }


  return {
    score: Math.min(score, 100),
    distance,
    hoursLeft,
    reasons
  };
};


export const calculateMatchScore = (
  donation,
  shelter
) => {

  return getMatchDetails(
    donation,
    shelter
  ).score;

};