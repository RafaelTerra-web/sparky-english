import { musicAchievements, musicDifficulties, musicRecordLimits, musicRank, musicRanks, MUSIC_POINTS_PER_HIT, unlockedMusicAchievements, type MusicPerformance } from '@/lib/music-performance';
import { t } from '@/lib/interface-language';

const difficultyNames = { level1: 'Nível 1', level2: 'Nível 2', level3: 'Nível 3', level4: 'Nível 4' };
export default function MusicAchievements({ performance }: { performance: MusicPerformance }) {
  const unlocked = new Set(unlockedMusicAchievements(performance).map(a => a.id));
  return <section className="music-awards" aria-labelledby="music-awards-title">
    <span className="music-kicker">{t('SEU PALCO')}</span><h2 id="music-awards-title">{t('Recordes e conquistas')}</h2><p>{t('Cada acerto vale 100 pontos. Seus recordes ficam salvos nesta música, por dificuldade.')}</p>
    <div className="music-records">{musicDifficulties.map(mode => {
      const record = performance[mode], points = record.correct * MUSIC_POINTS_PER_HIT, rank = musicRank(record.correct / musicRecordLimits[mode] * 2400);
      return <div key={mode}><span className="music-rank" data-rank={rank.name}>{rank.name}</span><div><strong>{t(difficultyNames[mode])}</strong><span>{points.toLocaleString('pt-BR')} pts · {record.streak} {t('seguidas')}</span></div></div>;
    })}</div>
    <div className="music-rank-scale" aria-label="Percentual de acertos por rank">{musicRanks.map(rank => <span key={rank.name}><b>{rank.name}</b>{Math.ceil(rank.points / 24)}%</span>)}</div>
    <h3>{t('Conquistas')} <small>{unlocked.size}/{musicAchievements.length}</small></h3>
    <div className="music-achievement-grid">{musicAchievements.map(achievement => <article key={achievement.id} data-achievement={achievement.id} data-unlocked={unlocked.has(achievement.id)}><span className="music-achievement-icon" aria-hidden="true">{achievement.icon}</span><div><h4>{t(achievement.title)}</h4><p>{t(achievement.detail)}</p><span>{t(unlocked.has(achievement.id) ? 'Conquistada' : 'A conquistar')}</span></div></article>)}</div>
  </section>;
}
