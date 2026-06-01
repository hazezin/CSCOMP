import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Player, Match, Season, LeagueConfig, DiscordLog } from './src/types';
import { calculateMatchElo } from './src/utils/elo';

const getFilename = () => {
  try {
    if (typeof __filename !== 'undefined') return __filename;
    // @ts-ignore
    return fileURLToPath(import.meta.url);
  } catch (e) {
    return '';
  }
};
const __filename = getFilename();

const getDirname = () => {
  try {
    if (typeof __dirname !== 'undefined') return __dirname;
    // @ts-ignore
    return path.dirname(fileURLToPath(import.meta.url));
  } catch (e) {
    return process.cwd();
  }
};
const __dirname = getDirname();

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'ladder_data.json');

// Helper to generate a random ID
const uuid = () => Math.random().toString(36).substring(2, 11);

// Standard Starting Maps
const DEFAULT_MAPS = [
  'de_mirage',
  'de_inferno',
  'de_nuke',
  'de_ancient',
  'de_anubis',
  'de_dust2',
  'de_overpass'
];

interface SavedState {
  players: Player[];
  matches: Match[];
  seasons: Season[];
  config: LeagueConfig;
  discordLogs: DiscordLog[];
}

const getInitialState = (): SavedState => {
  const joinDate = new Date('2026-01-15').toISOString().split('T')[0];
  const initialPlayers: Player[] = [
    {
      id: 'p1',
      name: 'ZywOo_Replica',
      elo: 1842,
      initialElo: 1000,
      matchesPlayed: 45,
      wins: 32,
      losses: 12,
      draws: 1,
      kills: 984,
      deaths: 642,
      status: 'active',
      joinDate,
      pictureUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=120&q=80',
      mapStats: {
        de_mirage: { plays: 15, wins: 12 },
        de_inferno: { plays: 12, wins: 8 },
        de_nuke: { plays: 10, wins: 7 },
        de_ancient: { plays: 8, wins: 5 },
      },
      eloHistory: [
        { date: '2026-05-20', elo: 1812 },
        { date: '2026-05-22', elo: 1830 },
        { date: '2026-05-25', elo: 1842, description: 'Won 13:8 on de_mirage' }
      ]
    },
    {
      id: 'p2',
      name: 'Xantares_Fan_99',
      elo: 1680,
      initialElo: 1000,
      matchesPlayed: 52,
      wins: 33,
      losses: 18,
      draws: 1,
      kills: 1120,
      deaths: 890,
      status: 'active',
      joinDate,
      pictureUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      mapStats: {
        de_mirage: { plays: 20, wins: 14 },
        de_inferno: { plays: 18, wins: 10 },
        de_dust2: { plays: 14, wins: 9 },
      },
      eloHistory: [
        { date: '2026-05-21', elo: 1696 },
        { date: '2026-05-23', elo: 1670 },
        { date: '2026-05-25', elo: 1680, description: 'Lost 4:13 on de_inferno' }
      ]
    },
    {
      id: 'p3',
      name: 'Scream_OneTap',
      elo: 1650,
      initialElo: 1000,
      matchesPlayed: 36,
      wins: 22,
      losses: 13,
      draws: 1,
      kills: 812,
      deaths: 580,
      status: 'active',
      joinDate,
      pictureUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
      mapStats: {
        de_nuke: { plays: 12, wins: 9 },
        de_mirage: { plays: 14, wins: 7 },
        de_anubis: { plays: 10, wins: 6 },
      },
      eloHistory: [
        { date: '2026-05-18', elo: 1620 },
        { date: '2026-05-24', elo: 1650 }
      ]
    },
    {
      id: 'p4',
      name: 'KennyS_Peeker',
      elo: 1590,
      initialElo: 1000,
      matchesPlayed: 40,
      wins: 24,
      losses: 15,
      draws: 1,
      kills: 780,
      deaths: 610,
      status: 'active',
      joinDate,
      pictureUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=80',
      mapStats: {
        de_inferno: { plays: 18, wins: 12 },
        de_mirage: { plays: 12, wins: 6 },
        de_ancient: { plays: 10, wins: 6 },
      },
      eloHistory: [
        { date: '2026-05-15', elo: 1560 },
        { date: '2026-05-25', elo: 1590 }
      ]
    },
    {
      id: 'p5',
      name: 'Forest_Old_School',
      elo: 1515,
      initialElo: 1000,
      matchesPlayed: 48,
      wins: 25,
      losses: 21,
      draws: 2,
      kills: 820,
      deaths: 790,
      status: 'active',
      joinDate,
      pictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      mapStats: {
        de_dust2: { plays: 22, wins: 13 },
        de_nuke: { plays: 16, wins: 8 },
        de_inferno: { plays: 10, wins: 4 },
      },
      eloHistory: [
        { date: '2026-05-22', elo: 1515 }
      ]
    },
    {
      id: 'p6',
      name: 'D-Kovács.vpl',
      elo: 1150,
      initialElo: 1000,
      matchesPlayed: 14,
      wins: 7,
      losses: 7,
      draws: 0,
      kills: 215,
      deaths: 230,
      status: 'active',
      joinDate,
      pictureUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=120&q=80',
      mapStats: {
        de_mirage: { plays: 6, wins: 3 },
        de_inferno: { plays: 5, wins: 3 },
        de_overpass: { plays: 3, wins: 1 },
      },
      eloHistory: [
        { date: '2026-05-20', elo: 1140 },
        { date: '2026-05-25', elo: 1150 }
      ]
    },
    {
      id: 'p7',
      name: 'Fallen_Professor',
      elo: 1410,
      initialElo: 1000,
      matchesPlayed: 28,
      wins: 16,
      losses: 11,
      draws: 1,
      kills: 490,
      deaths: 430,
      status: 'active',
      joinDate,
      pictureUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      mapStats: {
        de_mirage: { plays: 10, wins: 6 },
        de_inferno: { plays: 10, wins: 6 },
        de_dust2: { plays: 8, wins: 4 },
      },
      eloHistory: [
        { date: '2026-05-24', elo: 1410 }
      ]
    },
    {
      id: 'p8',
      name: 'm0NESY_Aim',
      elo: 1710,
      initialElo: 1000,
      matchesPlayed: 32,
      wins: 21,
      losses: 10,
      draws: 1,
      kills: 710,
      deaths: 480,
      status: 'active',
      joinDate,
      pictureUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80',
      mapStats: {
        de_mirage: { plays: 12, wins: 8 },
        de_ancient: { plays: 10, wins: 7 },
        de_anubis: { plays: 10, wins: 6 },
      },
      eloHistory: [
        { date: '2026-05-25', elo: 1710 }
      ]
    }
  ];;

  const initialMatches: Match[] = [
    {
      id: 'm_01',
      date: '2026-05-25T14:02:00Z',
      map: 'de_mirage',
      teamA: ['p1', 'p3'], // ZywOo + Scream
      teamB: ['p2', 'p4'], // Xantares + KennyS
      scoreA: 13,
      scoreB: 8,
      winner: 'A',
      seasonId: 's4',
      playersPerformance: {
        p1: { kills: 24, deaths: 12, eloChange: 12 },
        p3: { kills: 18, deaths: 14, eloChange: 9 },
        p2: { kills: 15, deaths: 20, eloChange: -10 },
        p4: { kills: 13, deaths: 22, eloChange: -11 }
      }
    },
    {
      id: 'm_02',
      date: '2026-05-25T13:45:00Z',
      map: 'de_inferno',
      teamA: ['p2', 'p5'], // Xantares + Forest
      teamB: ['p4', 'p6'], // KennyS + D-Kovács
      scoreA: 4,
      scoreB: 13,
      winner: 'B',
      seasonId: 's4',
      playersPerformance: {
        p2: { kills: 9, deaths: 16, eloChange: -16 },
        p5: { kills: 8, deaths: 15, eloChange: -14 },
        p4: { kills: 22, deaths: 6, eloChange: 18 },
        p6: { kills: 14, deaths: 11, eloChange: 10 }
      }
    }
  ];

  const initialSeasons: Season[] = [
    {
      id: 's1',
      name: 'Season 01',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      isActive: false,
      winnerId: 'p1',
      standings: [
        { playerId: 'p1', playerName: 'ZywOo_Replica', elo: 1420, wins: 15, losses: 5, kills: 350, deaths: 220 },
        { playerId: 'p2', playerName: 'Xantares_Fan_99', elo: 1310, wins: 12, losses: 8, kills: 410, deaths: 350 },
        { playerId: 'p3', playerName: 'Scream_OneTap', elo: 1250, wins: 10, losses: 10, kills: 290, deaths: 260 }
      ]
    },
    {
      id: 's2',
      name: 'Season 02',
      startDate: '2026-02-02',
      endDate: '2026-03-30',
      isActive: false,
      winnerId: 'p2',
      standings: [
        { playerId: 'p2', playerName: 'Xantares_Fan_99', elo: 1520, wins: 18, losses: 9, kills: 520, deaths: 400 },
        { playerId: 'p1', playerName: 'ZywOo_Replica', elo: 1510, wins: 16, losses: 10, kills: 480, deaths: 380 },
        { playerId: 'p4', playerName: 'KennyS_Peeker', elo: 1350, wins: 12, losses: 12, kills: 390, deaths: 400 }
      ]
    },
    {
      id: 's3',
      name: 'Season 03',
      startDate: '2026-04-01',
      endDate: '2026-05-01',
      isActive: false,
      winnerId: 'p1',
      standings: [
        { playerId: 'p1', playerName: 'ZywOo_Replica', elo: 1720, wins: 22, losses: 8, kills: 630, deaths: 410 },
        { playerId: 'p3', playerName: 'Scream_OneTap', elo: 1580, wins: 18, losses: 12, kills: 540, deaths: 450 },
        { playerId: 'p5', playerName: 'Forest_Old_School', elo: 1490, wins: 15, losses: 15, kills: 480, deaths: 510 }
      ]
    },
    {
      id: 's4',
      name: 'Season 04',
      startDate: '2026-05-02',
      isActive: true,
      standings: []
    }
  ];

  const initialConfig: LeagueConfig = {
    discordWebhookUrl: '',
    kFactor: 32,
    startingElo: 1000,
    allowedMaps: DEFAULT_MAPS
  };

  const initialLogs: DiscordLog[] = [
    {
      id: 'l1',
      timestamp: new Date('2026-05-25T14:02:40Z').toISOString(),
      payload: {
        username: 'VPL Premier Bot',
        content: '🏆 **MATCH SUBMITTED** // Map: de_mirage\n⚔️ Team Alpha (ZywOo_Replica, Scream_OneTap) defeats Team Omega (Xantares_Fan_99, KennyS_Peeker) [ **13 : 8** ]\n📊 **ELO Adjustments:**\n- ZywOo_Replica: +12 ELO (1830 -> 1842) - MVP performance!\n- Scream_OneTap: +9 ELO\n- Xantares_Fan_99: -10 ELO\n- KennyS_Peeker: -11 ELO'
      },
      status: 'simulated',
      message: 'Notification trigger: Match m_01 verified. Broadcasted successful.'
    },
    {
      id: 'l2',
      timestamp: new Date('2026-05-25T13:46:12Z').toISOString(),
      payload: {
        username: 'VPL Premier Bot',
        content: '🏆 **MATCH SUBMITTED** // Map: de_inferno\n⚔️ Team Omega (KennyS_Peeker, D-Kovács.vpl) defeats Team Alpha (Xantares_Fan_99, Forest_Old_School) [ **13 : 4** ]\n📊 **ELO Adjustments:**\n- KennyS_Peeker: +18 ELO\n- D-Kovács.vpl: +10 ELO\n- Xantares_Fan_99: -16 ELO\n- Forest_Old_School: -14 ELO'
      },
      status: 'simulated',
      message: 'Notification trigger: Match m_02 verified. Broadcasted successful.'
    }
  ];

  return {
    players: initialPlayers,
    matches: initialMatches,
    seasons: initialSeasons,
    config: initialConfig,
    discordLogs: initialLogs
  };
};

const loadState = (): SavedState => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed reading database file. Reverting to initial:', err);
  }
  const initial = getInitialState();
  saveState(initial);
  return initial;
};

const saveState = (state: SavedState) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed saving database file:', err);
  }
};

// Helper to notify discord webhook
const sendDiscordWebhook = async (webhookUrl: string, content: any, statusLog: Omit<DiscordLog, 'id' | 'timestamp'>) => {
  const logEntry: DiscordLog = {
    id: 'log_' + uuid(),
    timestamp: new Date().toISOString(),
    payload: content,
    status: 'simulated',
    message: statusLog.message
  };

  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });
      if (response.ok) {
        logEntry.status = 'success';
        logEntry.message = `Broadcasted to official Discord: ${response.status} ${response.statusText}`;
      } else {
        logEntry.status = 'failed';
        logEntry.message = `Discord webhook returned error status: ${response.status}`;
      }
    } catch (e: any) {
      logEntry.status = 'failed';
      logEntry.message = `Discord communication failed: ${e.message}`;
    }
  } else {
    logEntry.message = `Webhook simulated (no custom URL set): ${statusLog.message}`;
  }

  return logEntry;
};

// GET current state
app.get('/api/ladder', (req, res) => {
  const state = loadState();
  res.json(state);
});

// POST to report a match
app.post('/api/match', async (req, res) => {
  const { map, scoreA, scoreB, teamA, teamB, performances } = req.body;
  // performances: Record<PlayerId, { kills, deaths }>
  
  if (!map || scoreA === undefined || scoreB === undefined || !teamA || !teamB || !performances) {
    return res.status(400).json({ error: 'Missing required match report data.' });
  }

  const state = loadState();

  // Find active season
  const activeSeason = state.seasons.find(s => s.isActive);
  if (!activeSeason) {
    return res.status(400).json({ error: 'No active league season found. Create a season first.' });
  }

  // Get current player ratings for calculations
  const teamAPlayersInput = teamA.map((id: string) => {
    const p = state.players.find(x => x.id === id);
    return {
      id,
      name: p ? p.name : id,
      elo: p ? p.elo : state.config.startingElo,
      kills: Number(performances[id]?.kills || 0),
      deaths: Number(performances[id]?.deaths || 0)
    };
  });

  const teamBPlayersInput = teamB.map((id: string) => {
    const p = state.players.find(x => x.id === id);
    return {
      id,
      name: p ? p.name : id,
      elo: p ? p.elo : state.config.startingElo,
      kills: Number(performances[id]?.kills || 0),
      deaths: Number(performances[id]?.deaths || 0)
    };
  });

  // Calculate ELO adjustments
  const calculation = calculateMatchElo(
    teamAPlayersInput,
    teamBPlayersInput,
    Number(scoreA),
    Number(scoreB),
    state.config.kFactor
  );

  const matchId = 'm_' + uuid();
  const dateStr = new Date().toISOString();

  // Map winner
  let winnerSymbol: "A" | "B" | "Draw" = 'Draw';
  if (scoreA > scoreB) winnerSymbol = 'A';
  if (scoreB > scoreA) winnerSymbol = 'B';

  const playersPerformance: Record<string, any> = {};

  // Apply changes to Team A players
  calculation.teamAChanges.forEach((change) => {
    const player = state.players.find(p => p.id === change.playerId);
    if (player) {
      player.elo = change.newElo;
      player.matchesPlayed += 1;
      player.kills += change.kills;
      player.deaths += change.deaths;
      
      if (winnerSymbol === 'A') player.wins += 1;
      else if (winnerSymbol === 'B') player.losses += 1;
      else player.draws += 1;

      // Map stats
      if (!player.mapStats[map]) {
        player.mapStats[map] = { plays: 0, wins: 0 };
      }
      player.mapStats[map].plays += 1;
      if (winnerSymbol === 'A') player.mapStats[map].wins += 1;

      // Elo history
      player.eloHistory.push({
        date: dateStr.split('T')[0],
        elo: change.newElo,
        matchId,
        description: `Score ${scoreA}:${scoreB} on ${map}. ELO: ${change.totalChange > 0 ? '+' : ''}${change.totalChange}`
      });
    }

    playersPerformance[change.playerId] = {
      kills: change.kills,
      deaths: change.deaths,
      eloChange: change.totalChange,
      isTopPerformer: change.isTopPerformer,
    };
  });

  // Apply changes to Team B players
  calculation.teamBChanges.forEach((change) => {
    const player = state.players.find(p => p.id === change.playerId);
    if (player) {
      player.elo = change.newElo;
      player.matchesPlayed += 1;
      player.kills += change.kills;
      player.deaths += change.deaths;
      
      if (winnerSymbol === 'B') player.wins += 1;
      else if (winnerSymbol === 'A') player.losses += 1;
      else player.draws += 1;

      // Map stats
      if (!player.mapStats[map]) {
        player.mapStats[map] = { plays: 0, wins: 0 };
      }
      player.mapStats[map].plays += 1;
      if (winnerSymbol === 'B') player.mapStats[map].wins += 1;

      // Elo history
      player.eloHistory.push({
        date: dateStr.split('T')[0],
        elo: change.newElo,
        matchId,
        description: `Score ${scoreA}:${scoreB} on ${map}. ELO: ${change.totalChange > 0 ? '+' : ''}${change.totalChange}`
      });
    }

    playersPerformance[change.playerId] = {
      kills: change.kills,
      deaths: change.deaths,
      eloChange: change.totalChange,
      isTopPerformer: change.isTopPerformer,
    };
  });

  const newMatch: Match = {
    id: matchId,
    date: dateStr,
    map,
    teamA,
    teamB,
    scoreA: Number(scoreA),
    scoreB: Number(scoreB),
    winner: winnerSymbol,
    playersPerformance,
    seasonId: activeSeason.id
  };

  state.matches.unshift(newMatch);

  // Generate beautiful Discord post string
  const generateEmbedContent = () => {
    const mapNameUpper = map.toUpperCase();
    const teamANames = teamAPlayersInput.map(p => p.name).join(', ');
    const teamBNames = teamBPlayersInput.map(p => p.name).join(', ');
    
    let eloSummaryLines = '';
    calculation.teamAChanges.forEach(c => {
      const orig = c.newElo - c.totalChange;
      eloSummaryLines += `- **${c.name}**: ${c.totalChange > 0 ? '+' : ''}${c.totalChange} (K/D: ${c.kills}/${c.deaths}) Rating: ${orig} -> ${c.newElo}\n`;
    });
    calculation.teamBChanges.forEach(c => {
      const orig = c.newElo - c.totalChange;
      eloSummaryLines += `- **${c.name}**: ${c.totalChange > 0 ? '+' : ''}${c.totalChange} (K/D: ${c.kills}/${c.deaths}) Rating: ${orig} -> ${c.newElo}\n`;
    });

    const bodyContent = `🏆 **MATCH REPORT** (Season: ${activeSeason.name})\n` +
      `🗺️ **Map**: \`${mapNameUpper}\`\n\n` +
      `🟢 **Team A** [${scoreA}] : [${scoreB}] **Team B** ⭕\n` +
      `**Team A players**: ${teamANames}\n` +
      `**Team B players**: ${teamBNames}\n\n` +
      `🎯 **ELO AND KD STATISTICS:**\n${eloSummaryLines}`;

    return {
      username: 'VPL Premier Bot',
      avatar_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop&q=60',
      content: bodyContent
    };
  };

  const discordPayload = generateEmbedContent();
  const logResponse = await sendDiscordWebhook(
    state.config.discordWebhookUrl, 
    discordPayload,
    { 
      status: 'simulated', 
      payload: discordPayload, 
      message: `Match calculation complete. Registered ${matchId}.` 
    }
  );

  state.discordLogs.unshift(logResponse);

  saveState(state);
  res.json({ match: newMatch, eloCalculation: calculation, discordLog: logResponse });
});

// POST to add/register a player
app.post('/api/player', (req, res) => {
  const { name, pictureUrl } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Player name is required.' });
  }

  const state = loadState();
  if (state.players.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(400).json({ error: 'A player with this name already exists in the closed league.' });
  }

  const defaultAvatars = [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
  ];
  const selectedAvatar = pictureUrl && pictureUrl.trim() !== '' 
    ? pictureUrl.trim() 
    : defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

  const dateStr = new Date().toISOString().split('T')[0];
  const newPlayer: Player = {
    id: 'p_' + uuid(),
    name: name.trim(),
    elo: state.config.startingElo,
    initialElo: state.config.startingElo,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    kills: 0,
    deaths: 0,
    status: 'active',
    joinDate: dateStr,
    pictureUrl: selectedAvatar,
    mapStats: {},
    eloHistory: [
      { date: dateStr, elo: state.config.startingElo, description: 'Joined League.' }
    ]
  };

  state.players.push(newPlayer);
  saveState(state);

  res.json(newPlayer);
});

// POST to update/edit an existing player profile
app.post('/api/player/update', (req, res) => {
  const { id, name, pictureUrl, status } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Player ID is required.' });
  }

  const state = loadState();
  const player = state.players.find(p => p.id === id);
  if (!player) {
    return res.status(404).json({ error: 'Player not found.' });
  }

  if (name && name.trim() !== '') {
    // Check for duplicate name (excluding self)
    const normalizedName = name.trim().toLowerCase();
    const isDuplicate = state.players.some(p => p.id !== id && p.name.toLowerCase() === normalizedName);
    if (isDuplicate) {
      return res.status(400).json({ error: 'Another player already has this name.' });
    }
    player.name = name.trim();
  }

  if (pictureUrl !== undefined) {
    player.pictureUrl = pictureUrl.trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80';
  }

  if (status !== undefined) {
    player.status = status;
  }

  saveState(state);
  res.json(player);
});

// POST to update Discord/League Config Configuration
app.post('/api/config', (req, res) => {
  const { discordWebhookUrl, kFactor, startingElo, allowedMaps } = req.body;
  const state = loadState();

  if (discordWebhookUrl !== undefined) state.config.discordWebhookUrl = discordWebhookUrl;
  if (kFactor !== undefined) state.config.kFactor = Number(kFactor);
  if (startingElo !== undefined) state.config.startingElo = Number(startingElo);
  if (allowedMaps !== undefined) state.config.allowedMaps = allowedMaps;

  saveState(state);
  res.json(state.config);
});

// POST to test custom Discord Webhook
app.post('/api/discord/test', async (req, res) => {
  const { url } = req.body;
  const testPayload = {
    username: 'VPL Premier Bot Tester',
    content: '🔌 **WEBHOOK INTEGRATION TEST**\nSuccessful communication validated between CS Competitive Ladder and closed Discord Server. ELO validation system operational!'
  };

  const logResponse = await sendDiscordWebhook(
    url,
    testPayload,
    {
      status: 'simulated',
      payload: testPayload,
      message: 'Self-triggered admin webhook test message broadcasted.'
    }
  );

  const state = loadState();
  state.discordLogs.unshift(logResponse);
  saveState(state);

  res.json({ success: true, log: logResponse });
});

// POST to Reset Current Season
app.post('/api/season/reset', async (req, res) => {
  const state = loadState();
  const resetDate = new Date().toISOString().split('T')[0];

  // Find currently active season
  const activeIdx = state.seasons.findIndex(s => s.isActive);
  if (activeIdx !== -1) {
    const active = state.seasons[activeIdx];
    active.isActive = false;
    active.endDate = resetDate;

    // Build Standings at time of archival
    const standings = state.players
      .filter(p => p.matchesPlayed > 0)
      .map(p => ({
        playerId: p.id,
        playerName: p.name,
        elo: p.elo,
        wins: p.wins,
        losses: p.losses,
        kills: p.kills,
        deaths: p.deaths
      }))
      .sort((a, b) => b.elo - a.elo);

    active.standings = standings;
    if (standings.length > 0) {
      active.winnerId = standings[0].playerId;
    }
  }

  // Set old players state to inactive / soft reset ELO parameters
  // We Soft-Reset active player ratings back towards the standard starting ELO.
  // Standard ELO reset compression: newElo = startingElo + (currentElo - startingElo) * 0.5
  state.players.forEach(p => {
    const difference = p.elo - state.config.startingElo;
    const compressedElo = Math.round(state.config.startingElo + difference * 0.4); // soft-squeeze
    const desc = activeIdx !== -1 
      ? `Season Reset Squeeze from S${activeIdx + 1}.` 
      : 'Season Reset Squeeze.';
    
    p.elo = compressedElo;
    p.matchesPlayed = 0;
    p.wins = 0;
    p.losses = 0;
    p.draws = 0;
    p.kills = 0;
    p.deaths = 0;
    p.mapStats = {};
    p.eloHistory = [
      { date: resetDate, elo: compressedElo, description: desc }
    ];
  });

  // Turn off any other seasons that might have been left active by accident
  state.seasons.forEach(s => {
    if (s.isActive) {
      s.isActive = false;
      if (!s.endDate) {
        s.endDate = resetDate;
      }
    }
  });

  // Generate new season sequence
  const nextSeasonNum = state.seasons.length + 1;
  const newSeason: Season = {
    id: `s${nextSeasonNum}`,
    name: nextSeasonNum < 10 ? `Season 0${nextSeasonNum}` : `Season ${nextSeasonNum}`,
    startDate: resetDate,
    isActive: true,
    standings: []
  };

  state.seasons.push(newSeason);

  // Clear all matches to represent fresh new dynamic season history (stored in seasons rankings)
  state.matches = [];

  // Log Discord announcement
  const announcement = {
    username: 'VPL Premier Bot',
    content: `🚨 **SEASON RESET INITIATED** 🚨\n🏆 **New season ${newSeason.name} is now LIVE!** All active profiles soft-compressed to ladder ELO starting points.\n📊 Season final scores are archived in the historical archives logs.`
  };
  
  const log = await sendDiscordWebhook(state.config.discordWebhookUrl, announcement, {
    status: 'simulated',
    payload: announcement,
    message: `Season reset triggered. Created ${newSeason.name}.`
  });

  state.discordLogs.unshift(log);
  saveState(state);

  res.json({ newSeason, players: state.players });
});

// DEV / PRODUCTION SERVER BINDINGS
const startServer = async () => {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    // In dev mode, create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Fallback index.html router for Vite SPA routes
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Development full-stack Express server listening on http://localhost:${PORT}`);
    });
  } else {
    // Production serving static client files
    app.use(express.static(path.join(__dirname, 'dist')));
    
    // Fallback all other routes to production index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Production full-stack server listening on http://localhost:${PORT}`);
    });
  }
};

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
