import { supabase } from '@/lib/supabase/client';

/**
 * Calculate waitlist position from points using the scoring algorithm.
 * Higher points = lower (better) waitlist position.
 */
export const calculateWaitlistPosition = (points: number): number => {
  const maxScore = 175;
  const minPosition = 1;
  const maxPosition = 100;
  
  const normalizedScore = Math.min(points, maxScore) / maxScore;
  const basePosition = Math.round(maxPosition - (normalizedScore * (maxPosition - minPosition)));
  const randomOffset = Math.floor(Math.random() * 5) - 2;
  
  return Math.max(1, Math.min(100, basePosition + randomOffset));
};

/**
 * Update applicant points and recalculate waitlist position.
 * Returns the updated values.
 */
export const updateApplicantPoints = async (
  applicantId: string,
  newPoints: number
): Promise<{ points: number; waitlist_position: number }> => {
  const newPosition = calculateWaitlistPosition(newPoints);
  
  const { error } = await supabase
    .from('applicants')
    .update({ 
      points: newPoints,
      waitlist_position: newPosition
    })
    .eq('id', applicantId);

  if (error) throw error;

  return { points: newPoints, waitlist_position: newPosition };
};

/**
 * Add points to an applicant and update their waitlist position.
 * Use this when completing challenges or earning points.
 */
export const addApplicantPoints = async (
  applicantId: string,
  currentPoints: number,
  pointsToAdd: number
): Promise<{ points: number; waitlist_position: number }> => {
  const newPoints = currentPoints + pointsToAdd;
  return updateApplicantPoints(applicantId, newPoints);
};
