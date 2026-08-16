-- Part 2 of the zone taxonomy migration (see 038) — deterministic backfill
-- of profiles.zone from profiles.state, using Nigeria's official assignment
-- of all 36 states + FCT to one of the 6 geopolitical zones. Only runs
-- where state is populated, so no arbiter gets a guessed zone.

BEGIN;

UPDATE public.profiles SET zone = (CASE state
  WHEN 'Benue' THEN 'North Central'
  WHEN 'Kogi' THEN 'North Central'
  WHEN 'Kwara' THEN 'North Central'
  WHEN 'Nasarawa' THEN 'North Central'
  WHEN 'Niger' THEN 'North Central'
  WHEN 'Plateau' THEN 'North Central'
  WHEN 'Abuja' THEN 'North Central'
  WHEN 'FCT' THEN 'North Central'
  WHEN 'Federal Capital Territory' THEN 'North Central'
  WHEN 'Adamawa' THEN 'North East'
  WHEN 'Bauchi' THEN 'North East'
  WHEN 'Borno' THEN 'North East'
  WHEN 'Gombe' THEN 'North East'
  WHEN 'Taraba' THEN 'North East'
  WHEN 'Yobe' THEN 'North East'
  WHEN 'Jigawa' THEN 'North West'
  WHEN 'Kaduna' THEN 'North West'
  WHEN 'Kano' THEN 'North West'
  WHEN 'Katsina' THEN 'North West'
  WHEN 'Kebbi' THEN 'North West'
  WHEN 'Sokoto' THEN 'North West'
  WHEN 'Zamfara' THEN 'North West'
  WHEN 'Abia' THEN 'South East'
  WHEN 'Anambra' THEN 'South East'
  WHEN 'Ebonyi' THEN 'South East'
  WHEN 'Enugu' THEN 'South East'
  WHEN 'Imo' THEN 'South East'
  WHEN 'Akwa Ibom' THEN 'South South'
  WHEN 'Bayelsa' THEN 'South South'
  WHEN 'Cross River' THEN 'South South'
  WHEN 'Delta' THEN 'South South'
  WHEN 'Edo' THEN 'South South'
  WHEN 'Rivers' THEN 'South South'
  WHEN 'Ekiti' THEN 'South West'
  WHEN 'Lagos' THEN 'South West'
  WHEN 'Ogun' THEN 'South West'
  WHEN 'Ondo' THEN 'South West'
  WHEN 'Osun' THEN 'South West'
  WHEN 'Oyo' THEN 'South West'
  ELSE NULL
END)::public.zone_type
WHERE state IS NOT NULL
  AND state != ''
  AND (CASE state
    WHEN 'Benue' THEN 'North Central' WHEN 'Kogi' THEN 'North Central' WHEN 'Kwara' THEN 'North Central'
    WHEN 'Nasarawa' THEN 'North Central' WHEN 'Niger' THEN 'North Central' WHEN 'Plateau' THEN 'North Central'
    WHEN 'Abuja' THEN 'North Central' WHEN 'FCT' THEN 'North Central' WHEN 'Federal Capital Territory' THEN 'North Central'
    WHEN 'Adamawa' THEN 'North East' WHEN 'Bauchi' THEN 'North East' WHEN 'Borno' THEN 'North East'
    WHEN 'Gombe' THEN 'North East' WHEN 'Taraba' THEN 'North East' WHEN 'Yobe' THEN 'North East'
    WHEN 'Jigawa' THEN 'North West' WHEN 'Kaduna' THEN 'North West' WHEN 'Kano' THEN 'North West'
    WHEN 'Katsina' THEN 'North West' WHEN 'Kebbi' THEN 'North West' WHEN 'Sokoto' THEN 'North West'
    WHEN 'Zamfara' THEN 'North West' WHEN 'Abia' THEN 'South East' WHEN 'Anambra' THEN 'South East'
    WHEN 'Ebonyi' THEN 'South East' WHEN 'Enugu' THEN 'South East' WHEN 'Imo' THEN 'South East'
    WHEN 'Akwa Ibom' THEN 'South South' WHEN 'Bayelsa' THEN 'South South' WHEN 'Cross River' THEN 'South South'
    WHEN 'Delta' THEN 'South South' WHEN 'Edo' THEN 'South South' WHEN 'Rivers' THEN 'South South'
    WHEN 'Ekiti' THEN 'South West' WHEN 'Lagos' THEN 'South West' WHEN 'Ogun' THEN 'South West'
    WHEN 'Ondo' THEN 'South West' WHEN 'Osun' THEN 'South West' WHEN 'Oyo' THEN 'South West'
    ELSE NULL
  END) IS NOT NULL;

COMMIT;
