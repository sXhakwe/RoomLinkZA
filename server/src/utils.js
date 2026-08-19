export function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}
export function pagination(input) {
  const page = Math.max(1, Number(input.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(input.limit) || 12));
  return { page, limit, offset: (page - 1) * limit };
}
export function matchScore(viewer, candidate) {
  const a = viewer.preferences || {}, b = candidate.preferences || {};
  let earned = 0, possible = 0;
  const add = (weight, pass) => { possible += weight; if (pass) earned += weight; };
  if (a.preferred_city && candidate.city) add(25, a.preferred_city.toLowerCase() === candidate.city.toLowerCase());
  if (a.preferred_province && candidate.province) add(10, a.preferred_province === candidate.province);
  if (a.budget_max && b.budget_min != null) add(20, Number(b.budget_min) <= Number(a.budget_max));
  if (a.cleanliness && b.cleanliness) add(15, Math.abs(a.cleanliness - b.cleanliness) <= 1);
  if (a.social_level && b.social_level) add(10, Math.abs(a.social_level - b.social_level) <= 1);
  if (a.sleep_schedule && b.sleep_schedule) add(10, a.sleep_schedule === b.sleep_schedule);
  if (Array.isArray(a.interests) && Array.isArray(b.interests)) add(10, a.interests.some((x) => b.interests.includes(x)));
  return possible ? Math.round(earned / possible * 100) : 50;
}

