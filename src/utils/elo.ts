/**
 * ELO calculation algorithms for the CS Competitive Ladder.
 */

interface PlayerMatchInput {
  id: string;
  name: string;
  elo: number;
  kills: number;
  deaths: number;
}

export interface CalculatedEloChange {
  playerId: string;
  name: string;
  kills: number;
  deaths: number;
  kdRatio: number;
  baseChange: number;
  perfBonus: number;
  totalChange: number;
  newElo: number;
  isTopPerformer?: boolean;
}

export interface MatchEloCalculationResult {
  avgEloA: number;
  avgEloB: number;
  expectedA: number;
  expectedB: number;
  roundsFactor: number;
  teamAChanges: CalculatedEloChange[];
  teamBChanges: CalculatedEloChange[];
}

/**
 * Calculates ELO rating adjustments based on team average ratings,
 * round margins, and individual K/D metrics.
 * 
 * Starting standard ELO is 1000.
 */
export function calculateMatchElo(
  teamA: PlayerMatchInput[],
  teamB: PlayerMatchInput[],
  scoreA: number,
  scoreB: number,
  kFactor: number = 32
): MatchEloCalculationResult {
  // 1. Calculate Average Elo for teams
  const avgEloA = teamA.reduce((sum, p) => sum + p.elo, 0) / (teamA.length || 1);
  const avgEloB = teamB.reduce((sum, p) => sum + p.elo, 0) / (teamB.length || 1);

  // Expected outcomes (logistic curve - kept for visual layout/consistency if needed in UI)
  const expectedA = 1 / (1 + Math.pow(10, (avgEloB - avgEloA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (avgEloA - avgEloB) / 400));

  // Determine top 3 fraggers of the entire match across both teams
  const allPlayers = [...teamA, ...teamB];
  const sortedPlayers = [...allPlayers].sort((a, b) => {
    if (b.kills !== a.kills) {
      return b.kills - a.kills;
    }
    return a.deaths - b.deaths;
  });
  const top3Ids = sortedPlayers.slice(0, 3).map((p) => p.id);

  // Let's calculate changes for each player
  const calculatePlayerChanges = (
    players: PlayerMatchInput[],
    enemyTeamAvgElo: number,
    isWinner: boolean,
    isDraw: boolean
  ): CalculatedEloChange[] => {
    return players.map((player) => {
      const kills = player.kills;
      const deaths = Math.max(1, player.deaths);
      const kdRatio = kills / deaths;

      // D = EnemyTeamTrophies - YourTeamTrophies
      // enemyTeamAvgElo as EnemyTeamTrophies, and player's ELO as YourTeamTrophies (Player ELO)
      const D = enemyTeamAvgElo - player.elo;
      const modifier = Math.max(-10, Math.min(10, D / 100));

      const isTop3 = top3Ids.includes(player.id);
      const top3Bonus = isTop3 ? 5 : 0;

      let score = 0;
      let finalWinOrLoss = 0;
      let baseChange = 0;

      if (isDraw) {
        // Neutral outcome with modifier and top 3 bonus
        score = 0 + modifier;
        if (isTop3) {
          score += 5;
        }
        finalWinOrLoss = Math.max(-15, Math.min(15, score));
        baseChange = modifier;
      } else if (isWinner) {
        // WINNERS:
        // Score = 25 + Modifier
        score = 25 + modifier;
        if (isTop3) {
          score += 5;
        }
        // FinalWin = max(15, min(35, Score))
        finalWinOrLoss = Math.max(15, Math.min(35, score));
        baseChange = 25 + modifier;
      } else {
        // LOSERS:
        // Score = -20 + Modifier
        score = -20 + modifier;
        if (isTop3) {
          score += 5;
        }
        // FinalLoss = max(-30, min(-10, Score))
        finalWinOrLoss = Math.max(-30, Math.min(-10, score));
        baseChange = -20 + modifier;
      }

      const totalChange = Math.round(finalWinOrLoss);
      const newElo = Math.max(100, Math.round(player.elo + totalChange));

      return {
        playerId: player.id,
        name: player.name,
        kills,
        deaths,
        kdRatio: parseFloat(kdRatio.toFixed(2)),
        baseChange: Math.round(baseChange),
        perfBonus: top3Bonus,
        totalChange,
        newElo,
        isTopPerformer: isTop3,
      };
    });
  };

  const isDraw = scoreA === scoreB;
  const teamAChanges = calculatePlayerChanges(teamA, avgEloB, scoreA > scoreB, isDraw);
  const teamBChanges = calculatePlayerChanges(teamB, avgEloA, scoreB > scoreA, isDraw);

  return {
    avgEloA: Math.round(avgEloA),
    avgEloB: Math.round(avgEloB),
    expectedA: parseFloat(expectedA.toFixed(3)),
    expectedB: parseFloat(expectedB.toFixed(3)),
    roundsFactor: 1.0,
    teamAChanges,
    teamBChanges,
  };
}
