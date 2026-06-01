/**
 * Types declarations for the CS Competitive Ladder application
 */

export interface PlayerPerformance {
  kills: number;
  deaths: number;
  eloChange: number;
}

export interface MapStat {
  plays: number;
  wins: number;
}

export interface Player {
  id: string;
  name: string;
  elo: number;
  initialElo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  kills: number;
  deaths: number;
  mapStats: Record<string, MapStat>; // map name -> stats
  eloHistory: { date: string; elo: number; matchId?: string; description?: string }[];
  status: "active" | "inactive";
  joinDate: string;
  pictureUrl?: string; // Player custom avatar / picture url
}

export interface Match {
  id: string;
  date: string;
  map: string;
  teamA: string[]; // Player IDs
  teamB: string[]; // Player IDs
  scoreA: number;
  scoreB: number;
  winner: "A" | "B" | "Draw";
  playersPerformance: Record<string, PlayerPerformance>; // Player ID -> Performance
  seasonId: string;
}

export interface SeasonStandings {
  playerId: string;
  playerName: string;
  elo: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  standings: SeasonStandings[];
  winnerId?: string;
  isActive: boolean;
}

export interface LeagueConfig {
  discordWebhookUrl: string;
  kFactor: number;
  startingElo: number;
  allowedMaps: string[];
}

export interface LeagueData {
  players: Player[];
  matches: Match[];
  seasons: Season[];
  config: LeagueConfig;
}

export interface DiscordLog {
  id: string;
  timestamp: string;
  payload: any;
  status: "success" | "failed" | "simulated";
  message: string;
}
