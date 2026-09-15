export const streakMilestones = [10, 30, 50, 90, 100, 150, 200, 365] as const;

export function streakTargets(count: number): number[] {
  const targets: number[] = [...streakMilestones];
  if (count >= 365) {
    const nextCentury = (Math.floor(count / 100) + 1) * 100;
    for (let day = 400; day <= nextCentury; day += 100) targets.push(day);
  }
  return targets;
}

export function isStreakMilestone(count: number) {
  return streakMilestones.some(day => day === count) || (count >= 400 && count % 100 === 0);
}
