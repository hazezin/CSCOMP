import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Send, 
  Server, 
  Flame, 
  History, 
  Plus, 
  Search, 
  TrendingUp, 
  Settings, 
  MapPin, 
  Calendar, 
  X, 
  UserPlus, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Hash, 
  Percent, 
  Activity,
  Sword,
  ArrowLeft,
  Edit2,
  Camera,
  Check,
  Crown,
  Lock,
  Layers,
  RotateCcw
} from 'lucide-react';
import { Player, Match, Season, LeagueConfig, DiscordLog } from './types';
import { calculateMatchElo } from './utils/elo';

export default function App() {
  // Application Data States
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [config, setConfig] = useState<LeagueConfig>({
    discordWebhookUrl: '',
    kFactor: 32,
    startingElo: 1000,
    allowedMaps: ['de_mirage', 'de_inferno', 'de_nuke', 'de_ancient', 'de_anubis', 'de_dust2', 'de_overpass']
  });
  const [discordLogs, setDiscordLogs] = useState<DiscordLog[]>([]);

  // UI Navigation / Control States
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history' | 'archive' | 'admin'>('leaderboard');
  const [viewedPlayerId, setViewedPlayerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modal / Feedback state
  const [playerActionSuccess, setPlayerActionSuccess] = useState<string | null>(null);

  // New Player Form State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPic, setNewPlayerPic] = useState('');

  // Editing Player profile state
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingPicUrl, setEditingPicUrl] = useState('');
  const [editingStatus, setEditingStatus] = useState<'active' | 'inactive'>('active');

  // Match Submission Form State (Admin Panel)
  const [matchMap, setMatchMap] = useState('de_mirage');
  const [scoreA, setScoreA] = useState<number>(13);
  const [scoreB, setScoreB] = useState<number>(10);
  const [teamAIds, setTeamAIds] = useState<string[]>([]);
  const [teamBIds, setTeamBIds] = useState<string[]>([]);
  const [matchPerf, setMatchPerf] = useState<Record<string, { kills: number; deaths: number }>>({});
  const [matchError, setMatchError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Discord Configuration
  const [testWebhookUrl, setTestWebhookUrl] = useState('');
  const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  // Fetch complete state from the full-stack server
  const fetchState = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ladder');
      if (!res.ok) throw new Error('Failed to retrieve competitive ladder logs.');
      const data = await res.json();
      setPlayers(data.players || []);
      setMatches(data.matches || []);
      setSeasons(data.seasons || []);
      setConfig(data.config || config);
      setDiscordLogs(data.discordLogs || []);
      setErrorMessage(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Offline Mode. Running on local sandbox simulation.');
      loadLocalState();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalState = () => {
    const saved = localStorage.getItem('cs_ladder_local_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlayers(parsed.players);
        setMatches(parsed.matches);
        setSeasons(parsed.seasons);
        setConfig(parsed.config);
        setDiscordLogs(parsed.discordLogs);
        return;
      } catch (e) {
        console.error(e);
      }
    }
    setPlayers(INITIAL_PLAYERS);
    setMatches(INITIAL_MATCHES);
    setSeasons(INITIAL_SEASONS);
    setDiscordLogs(INITIAL_LOGS);
  };

  const saveLocalState = (p: Player[], m: Match[], s: Season[], c: LeagueConfig, l: DiscordLog[]) => {
    const state = { players: p, matches: m, seasons: s, config: c, discordLogs: l };
    localStorage.setItem('cs_ladder_local_state', JSON.stringify(state));
  };

  useEffect(() => {
    fetchState();
  }, []);

  useEffect(() => {
    if (config.discordWebhookUrl) {
      setTestWebhookUrl(config.discordWebhookUrl);
    }
  }, [config]);

  // Handle Player Registration (Submit form)
  const handleRegisterPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      const res = await fetch('/api/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newPlayerName.trim(), 
          pictureUrl: newPlayerPic.trim() 
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to register player.');
      }

      const newPlayer = await res.json();
      const updatedPlayers = [...players, newPlayer];
      setPlayers(updatedPlayers);
      setNewPlayerName('');
      setNewPlayerPic('');
      setPlayerActionSuccess(`Player "${newPlayer.name}" successfully registered into the competitive ladder!`);
      setTimeout(() => setPlayerActionSuccess(null), 4000);
      saveLocalState(updatedPlayers, matches, seasons, config, discordLogs);
    } catch (err: any) {
      setPlayerActionSuccess(`Error: ${err.message}`);
      setTimeout(() => setPlayerActionSuccess(null), 4000);
      simulateOfflineRegisterPlayer();
    }
  };

  const simulateOfflineRegisterPlayer = () => {
    if (!newPlayerName.trim()) return;
    const defaultAvatars = [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80',
      'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=120&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
    ];
    const pickedAvatar = newPlayerPic.trim() || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
    const dateStr = new Date().toISOString().split('T')[0];

    const localNewPlayer: Player = {
      id: 'p_offline_' + Math.random().toString(36).substring(2, 9),
      name: newPlayerName.trim(),
      elo: config.startingElo,
      initialElo: config.startingElo,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      kills: 0,
      deaths: 0,
      status: 'active',
      joinDate: dateStr,
      pictureUrl: pickedAvatar,
      mapStats: {},
      eloHistory: [
        { date: dateStr, elo: config.startingElo, description: 'Joined League.' }
      ]
    };

    const updated = [...players, localNewPlayer];
    setPlayers(updated);
    setNewPlayerName('');
    setNewPlayerPic('');
    setPlayerActionSuccess(`Player "${localNewPlayer.name}" successfully registered (Demo Mode)!`);
    setTimeout(() => setPlayerActionSuccess(null), 4000);
    saveLocalState(updated, matches, seasons, config, discordLogs);
  };

  // Open Edit profile UI
  const handleStartEditProfile = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingName(player.name);
    setEditingPicUrl(player.pictureUrl || '');
    setEditingStatus(player.status);
  };

  // Submit Player edits
  const handleSavePlayerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayerId) return;

    try {
      const res = await fetch('/api/player/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlayerId,
          name: editingName.trim(),
          pictureUrl: editingPicUrl.trim(),
          status: editingStatus
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update player.');
      }

      const updatedPlayer = await res.json();
      const updatedList = players.map(p => p.id === editingPlayerId ? updatedPlayer : p);
      setPlayers(updatedList);
      setEditingPlayerId(null);
      setPlayerActionSuccess(`Player profile updated successfully.`);
      setTimeout(() => setPlayerActionSuccess(null), 3000);
      saveLocalState(updatedList, matches, seasons, config, discordLogs);
    } catch (err: any) {
      // Offline fallback edit
      const updatedList = players.map(p => {
        if (p.id === editingPlayerId) {
          return {
            ...p,
            name: editingName.trim(),
            pictureUrl: editingPicUrl.trim() || p.pictureUrl,
            status: editingStatus
          };
        }
        return p;
      });
      setPlayers(updatedList);
      setEditingPlayerId(null);
      setPlayerActionSuccess(`Profile edit saved successfully (Demo Mode).`);
      setTimeout(() => setPlayerActionSuccess(null), 3000);
      saveLocalState(updatedList, matches, seasons, config, discordLogs);
    }
  };

  // Handle custom config update
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordWebhookUrl: testWebhookUrl,
          kFactor: config.kFactor,
          startingElo: config.startingElo
        })
      });

      if (res.ok) {
        const savedConfig = await res.json();
        setConfig(savedConfig);
        setPlayerActionSuccess('League configuration parameters updated.');
        setTimeout(() => setPlayerActionSuccess(null), 3000);
      } else {
        const nextConfig = { ...config, discordWebhookUrl: testWebhookUrl };
        setConfig(nextConfig);
        saveLocalState(players, matches, seasons, nextConfig, discordLogs);
        alert('Config updated locally (Demo Mode).');
      }
    } catch (e) {
      const nextConfig = { ...config, discordWebhookUrl: testWebhookUrl };
      setConfig(nextConfig);
      saveLocalState(players, matches, seasons, nextConfig, discordLogs);
      alert('Config updated locally (Demo Mode).');
    }
  };

  // Test Discord Webhook connection live
  const handleTestWebhook = async () => {
    if (!testWebhookUrl.trim()) {
      alert('Provide a valid Discord Webhook URL to test.');
      return;
    }
    setWebhookTestStatus('testing');
    try {
      const res = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testWebhookUrl.trim() })
      });
      const data = await res.json();
      if (res.ok && data.log) {
        setWebhookTestStatus('success');
        setDiscordLogs([data.log, ...discordLogs]);
        setTimeout(() => setWebhookTestStatus('idle'), 3000);
      } else {
        setWebhookTestStatus('failed');
      }
    } catch (e) {
      setWebhookTestStatus('failed');
      // Simulated local test log block
      const tempLog: DiscordLog = {
        id: 'log_' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        payload: { content: 'Plug webhook alert test.' },
        status: 'simulated',
        message: 'Pre-flight check simulation: Webhook test channel live validation successful.'
      };
      setDiscordLogs([tempLog, ...discordLogs]);
    }
  };

  // Trigger Season Reset and rating compression
  const handleSeasonResetAndTrigger = async () => {
    try {
      const res = await fetch('/api/season/reset', { method: 'POST' });
      if (res.ok) {
        fetchState();
        setPlayerActionSuccess('Elite CS competitive ladder season reset completed! Season refreshed.');
        setTimeout(() => setPlayerActionSuccess(null), 5000);
      } else {
        simulateClientSeasonReset();
      }
    } catch (e) {
      simulateClientSeasonReset();
    }
  };

  const simulateClientSeasonReset = () => {
    const activeIdx = seasons.findIndex(s => s.isActive);
    const resetDate = new Date().toISOString().split('T')[0];

    let nextSeasons = [...seasons];
    let activeSeasonName = 'Unknown Season';

    if (activeIdx !== -1) {
      const currentActive = seasons[activeIdx];
      activeSeasonName = currentActive.name;
      const standings = players
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

      const endedSeason: Season = {
        ...currentActive,
        isActive: false,
        endDate: resetDate,
        standings,
        winnerId: standings[0]?.playerId
      };

      nextSeasons = [...seasons.filter(s => s.id !== currentActive.id), endedSeason];
    }

    // Turn off active flags on any other season
    nextSeasons = nextSeasons.map(s => s.isActive ? { ...s, isActive: false, endDate: s.endDate || resetDate } : s);

    const nextSeasonNum = nextSeasons.length + 1;
    const newActiveSeason: Season = {
      id: `s${nextSeasonNum}`,
      name: nextSeasonNum < 10 ? `Season 0${nextSeasonNum}` : `Season ${nextSeasonNum}`,
      startDate: resetDate,
      isActive: true,
      standings: []
    };
    nextSeasons.push(newActiveSeason);

    // Soft rating compression formula towards starting level
    const compressedPlayers = players.map(p => {
      const diff = p.elo - config.startingElo;
      const compressed = Math.round(config.startingElo + diff * 0.40);
      return {
        ...p,
        elo: compressed,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        kills: 0,
        deaths: 0,
        mapStats: {},
        eloHistory: [
          { date: resetDate, elo: compressed, description: `Season Reset Squeeze config.` }
        ]
      };
    });

    const newLogs: DiscordLog[] = [
      {
        id: 'log_' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        payload: { content: 'New Season began.' },
        status: 'simulated',
        message: `Season Reset initiated. Completed ${activeSeasonName}. Fresh standings initialized on ${newActiveSeason.name}.`
      },
      ...discordLogs
    ];

    setPlayers(compressedPlayers);
    setMatches([]);
    setSeasons(nextSeasons);
    setDiscordLogs(newLogs);
    saveLocalState(compressedPlayers, [], nextSeasons, config, newLogs);
    setPlayerActionSuccess('Soft Elo compression simulated client-side. Season Standings archived.');
    setTimeout(() => setPlayerActionSuccess(null), 5000);
  };

  // Team building tools in Match Submission form
  const handleAddRemovePlayer = (playerId: string, team: 'A' | 'B') => {
    if (team === 'A') {
      if (teamAIds.includes(playerId)) {
        setTeamAIds(teamAIds.filter(id => id !== playerId));
        const nextPerf = { ...matchPerf };
        delete nextPerf[playerId];
        setMatchPerf(nextPerf);
      } else {
        if (teamBIds.includes(playerId)) {
          setTeamBIds(teamBIds.filter(id => id !== playerId));
        }
        setTeamAIds([...teamAIds, playerId]);
        setMatchPerf(prev => ({ ...prev, [playerId]: prev[playerId] || { kills: 15, deaths: 15 } }));
      }
    } else {
      if (teamBIds.includes(playerId)) {
        setTeamBIds(teamBIds.filter(id => id !== playerId));
        const nextPerf = { ...matchPerf };
        delete nextPerf[playerId];
        setMatchPerf(nextPerf);
      } else {
        if (teamAIds.includes(playerId)) {
          setTeamAIds(teamAIds.filter(id => id !== playerId));
        }
        setTeamBIds([...teamBIds, playerId]);
        setMatchPerf(prev => ({ ...prev, [playerId]: prev[playerId] || { kills: 15, deaths: 15 } }));
      }
    }
  };

  const handleUpdatePerformance = (playerId: string, stat: 'kills' | 'deaths', val: number) => {
    const safeVal = Math.max(0, val);
    setMatchPerf({
      ...matchPerf,
      [playerId]: {
        ...matchPerf[playerId] || { kills: 15, deaths: 15 },
        [stat]: safeVal
      }
    });
  };

  const getAverageTeamElo = (playerIds: string[]) => {
    if (playerIds.length === 0) return 0;
    const total = playerIds.reduce((sum, id) => {
      const p = players.find(x => x.id === id);
      return sum + (p ? p.elo : config.startingElo);
    }, 0);
    return Math.round(total / playerIds.length);
  };

  const teamAAvg = getAverageTeamElo(teamAIds);
  const teamBAvg = getAverageTeamElo(teamBIds);

  const testEloCalculation = () => {
    if (teamAIds.length === 0 || teamBIds.length === 0) return null;
    
    const teamAInput = teamAIds.map(id => {
      const p = players.find(x => x.id === id);
      return {
        id,
        name: p ? p.name : 'Unknown',
        elo: p ? p.elo : config.startingElo,
        kills: matchPerf[id]?.kills ?? 15,
        deaths: matchPerf[id]?.deaths ?? 15
      };
    });

    const teamBInput = teamBIds.map(id => {
      const p = players.find(x => x.id === id);
      return {
        id,
        name: p ? p.name : 'Unknown',
        elo: p ? p.elo : config.startingElo,
        kills: matchPerf[id]?.kills ?? 15,
        deaths: matchPerf[id]?.deaths ?? 15
      };
    });

    return calculateMatchElo(teamAInput, teamBInput, scoreA, scoreB, config.kFactor);
  };

  const eloPreview = testEloCalculation();

  // Submit report to system
  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatchError(null);

    if (teamAIds.length === 0 || teamBIds.length === 0) {
      setMatchError('Roster assign failed: Both teams require at least one player to compete.');
      return;
    }

    const payload = {
      map: matchMap,
      scoreA,
      scoreB,
      teamA: teamAIds,
      teamB: teamBIds,
      performances: matchPerf
    };

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server error reporting match.');
      }

      const outcome = await res.json();
      
      // Update local state dynamically based on recalculations
      setPlayers(prev => {
        return prev.map(p => {
          const changeA = outcome.eloCalculation.teamAChanges.find((c: any) => c.playerId === p.id);
          const changeB = outcome.eloCalculation.teamBChanges.find((c: any) => c.playerId === p.id);
          const change = changeA || changeB;
          
          if (change) {
            const isWinner = (changeA && scoreA > scoreB) || (changeB && scoreB > scoreA);
            const isDraw = scoreA === scoreB;
            
            const pWins = isWinner ? p.wins + 1 : p.wins;
            const pLosses = (!isWinner && !isDraw) ? p.losses + 1 : p.losses;
            const pDraws = isDraw ? p.draws + 1 : p.draws;
            
            const nextHistory = [...p.eloHistory, {
              date: new Date().toISOString().split('T')[0],
              elo: change.newElo,
              description: `Score ${scoreA}:${scoreB} on ${matchMap}.`
            }];

            const mapStats = { ...p.mapStats };
            if (!mapStats[matchMap]) {
              mapStats[matchMap] = { plays: 0, wins: 0 };
            }
            mapStats[matchMap].plays += 1;
            if (isWinner) mapStats[matchMap].wins += 1;

            return {
              ...p,
              elo: change.newElo,
              matchesPlayed: p.matchesPlayed + 1,
              wins: pWins,
              losses: pLosses,
              draws: pDraws,
              kills: p.kills + change.kills,
              deaths: p.deaths + change.deaths,
              mapStats,
              eloHistory: nextHistory
            };
          }
          return p;
        });
      });

      setMatches(prev => [outcome.match, ...prev]);
      setDiscordLogs(prev => [outcome.discordLog, ...prev]);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setTeamAIds([]);
        setTeamBIds([]);
        setMatchPerf({});
        alert('Match Submission Broadcast Successful.');
      }, 1500);

    } catch (e: any) {
      console.warn('Simulating submission locally since server has failed:', e.message);
      simulateClientMatchSubmission();
    }
  };

  const simulateClientMatchSubmission = () => {
    const eloResult = testEloCalculation();
    if (!eloResult) return;

    const matchId = 'm_offline_' + Math.random().toString(36).substring(2, 6);
    const dateStr = new Date().toISOString();
    let winnerSymbol: "A" | "B" | "Draw" = 'Draw';
    if (scoreA > scoreB) winnerSymbol = 'A';
    if (scoreB > scoreA) winnerSymbol = 'B';

    const pPerformance: Record<string, any> = {};

    const updatedPlayers = players.map(p => {
      const scoreInA = teamAIds.includes(p.id);
      const scoreInB = teamBIds.includes(p.id);

      if (scoreInA) {
        const change = eloResult.teamAChanges.find(c => c.playerId === p.id)!;
        pPerformance[p.id] = { kills: change.kills, deaths: change.deaths, eloChange: change.totalChange };

        const mapStats = { ...p.mapStats };
        if (!mapStats[matchMap]) mapStats[matchMap] = { plays: 0, wins: 0 };
        mapStats[matchMap].plays += 1;
        if (winnerSymbol === 'A') mapStats[matchMap].wins += 1;

        return {
          ...p,
          elo: change.newElo,
          matchesPlayed: p.matchesPlayed + 1,
          wins: winnerSymbol === 'A' ? p.wins + 1 : p.wins,
          losses: winnerSymbol === 'B' ? p.losses + 1 : p.losses,
          draws: winnerSymbol === 'Draw' ? p.draws + 1 : p.draws,
          kills: p.kills + change.kills,
          deaths: p.deaths + change.deaths,
          mapStats,
          eloHistory: [...p.eloHistory, {
            date: dateStr.split('T')[0],
            elo: change.newElo,
            description: `Match ${scoreA}:${scoreB} on ${matchMap}.`
          }]
        };
      } else if (scoreInB) {
        const change = eloResult.teamBChanges.find(c => c.playerId === p.id)!;
        pPerformance[p.id] = { kills: change.kills, deaths: change.deaths, eloChange: change.totalChange };

        const mapStats = { ...p.mapStats };
        if (!mapStats[matchMap]) mapStats[matchMap] = { plays: 0, wins: 0 };
        mapStats[matchMap].plays += 1;
        if (winnerSymbol === 'B') mapStats[matchMap].wins += 1;

        return {
          ...p,
          elo: change.newElo,
          matchesPlayed: p.matchesPlayed + 1,
          wins: winnerSymbol === 'B' ? p.wins + 1 : p.wins,
          losses: winnerSymbol === 'A' ? p.losses + 1 : p.losses,
          draws: winnerSymbol === 'Draw' ? p.draws + 1 : p.draws,
          kills: p.kills + change.kills,
          deaths: p.deaths + change.deaths,
          mapStats,
          eloHistory: [...p.eloHistory, {
            date: dateStr.split('T')[0],
            elo: change.newElo,
            description: `Match ${scoreA}:${scoreB} on ${matchMap}.`
          }]
        };
      }
      return p;
    });

    const activeSeason = seasons.find(s => s.isActive) || seasons[seasons.length - 1];

    const localNewMatch: Match = {
      id: matchId,
      date: dateStr,
      map: matchMap,
      teamA: teamAIds,
      teamB: teamBIds,
      scoreA,
      scoreB,
      winner: winnerSymbol,
      playersPerformance: pPerformance,
      seasonId: activeSeason.id
    };

    let disLines = '';
    eloResult.teamAChanges.forEach(c => {
      disLines += `- ${c.name}: ${c.totalChange > 0 ? '+' : ''}${c.totalChange} ELO (${c.kills}/${c.deaths})\n`;
    });
    eloResult.teamBChanges.forEach(c => {
      disLines += `- ${c.name}: ${c.totalChange > 0 ? '+' : ''}${c.totalChange} ELO (${c.kills}/${c.deaths})\n`;
    });

    const localDiscLog: DiscordLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 6),
      timestamp: dateStr,
      payload: {
        username: 'VPL Premier Bot',
        content: `🏆 **MATCH REPORT** on \`${matchMap.toUpperCase()}\` [ **${scoreA} : ${scoreB}** ]\n📊 ELO Details:\n${disLines}`
      },
      status: 'simulated',
      message: `Match submission logged & simulated via Discord bot.`
    };

    const nextMatches = [localNewMatch, ...matches];
    const nextLogs = [localDiscLog, ...discordLogs];

    setPlayers(updatedPlayers);
    setMatches(nextMatches);
    setDiscordLogs(nextLogs);
    saveLocalState(updatedPlayers, nextMatches, seasons, config, nextLogs);

    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setTeamAIds([]);
      setTeamBIds([]);
      setMatchPerf({});
      alert('Match reported locally (Sandbox database updated).');
    }, 1500);
  };

  // Derived Stats Calculations
  const getRank = (player: Player) => {
    const activePlayers = players.filter(p => p.status === 'active');
    const sorted = [...activePlayers].sort((a, b) => b.elo - a.elo);
    const index = sorted.findIndex(p => p.id === player.id);
    return index !== -1 ? index + 1 : '--';
  };

  const getPlayerWinrate = (p: Player) => {
    if (p.matchesPlayed === 0) return 0;
    return Math.round((p.wins / p.matchesPlayed) * 100);
  };

  const getPlayerKD = (p: Player) => {
    if (p.deaths === 0) return p.kills.toFixed(2);
    return (p.kills / p.deaths).toFixed(2);
  };

  const getPlayerWinstreak = (playerId: string): number => {
    const playerMatches = matches.filter(m => 
      m.teamA.includes(playerId) || m.teamB.includes(playerId)
    );
    const sorted = [...playerMatches].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    for (const match of sorted) {
      const isWin = (match.winner === 'A' && match.teamA.includes(playerId)) || 
                    (match.winner === 'B' && match.teamB.includes(playerId));
      if (isWin) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Filter & Search Active Players
  const sortedActivePlayers = [...players]
    .filter(p => p.status === 'active')
    .sort((a, b) => b.elo - a.elo);

  const filteredPlayers = sortedActivePlayers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Top Three variables for high profile podium highlight
  const topThree = sortedActivePlayers.slice(0, 3);

  // Viewed player profile detail selection
  const selectedProfilePlayer = players.find(p => p.id === viewedPlayerId);

  // Player matches stats collection
  const viewedPlayerMatches = matches.filter(m => 
    m.teamA.includes(viewedPlayerId || '') || m.teamB.includes(viewedPlayerId || '')
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#EDEDED] flex flex-col font-sans select-none antialiased">
      
      {/* Header Navigation */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-8 bg-[#0F0F12] shrink-0">
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="text-xl sm:text-2xl font-black italic tracking-tighter text-[#FFB800] flex items-center gap-2">
            <Sword className="w-5 h-5 align-middle text-[#FFB800]" />
            VPL // PREMIER
          </span>
          <div className="h-4 w-[1px] bg-white/20 hidden sm:block"></div>
          <div className="flex gap-4 sm:gap-6 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/60">
            <button 
              onClick={() => {
                setActiveTab('leaderboard');
                setViewedPlayerId(null);
              }}
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'leaderboard' && !viewedPlayerId ? 'text-[#FFB800] border-b-2 border-[#FFB800] pb-1 font-black' : ''}`}
            >
              Leaderboard
            </button>
            <button 
              onClick={() => {
                setActiveTab('history');
                setViewedPlayerId(null);
              }}
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'history' ? 'text-[#FFB800] border-b-2 border-[#FFB800] pb-1 font-black' : ''}`}
            >
              Match Log
            </button>
            <button 
              onClick={() => {
                setActiveTab('archive');
                setViewedPlayerId(null);
              }}
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'archive' ? 'text-[#FFB800] border-b-2 border-[#FFB800] pb-1 font-black' : ''}`}
            >
              Archive
            </button>
            <button 
              onClick={() => {
                setActiveTab('admin');
                setViewedPlayerId(null);
              }}
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'admin' ? 'text-[#FFB800] border-b-2 border-[#FFB800] pb-1 font-black' : ''}`}
            >
              Admin Desk
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Leagues</span>
              <span className="text-xs font-bold text-[#FFB800]">CS Competitive Ladder</span>
            </div>
            <div className="w-10 h-10 rounded bg-[#FFB800] flex items-center justify-center text-[#0A0A0B] font-black italic shadow-lg shadow-[#FFB800]/10">
              CS
            </div>
          </div>
        </div>
      </nav>

      {/* Main Hero Banner with Title / Context */}
      <header className="px-4 sm:px-8 py-5 sm:py-7 relative flex flex-col justify-end border-b border-white/5 bg-gradient-to-r from-[#0F0F12] to-[#121216] shrink-0">
        <div className="absolute top-5 sm:top-7 right-4 sm:right-8 text-right hidden sm:block">
          <div className="text-4xl sm:text-5xl font-black text-white/5 leading-none tracking-widest font-sans">VALKYRIE PREMIER</div>
          <div className="text-[10px] font-mono text-[#FFB800] mt-1 flex items-center justify-end gap-1.5 uppercase font-bold tracking-wider">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            Competitive Arena Active Standings
          </div>
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter leading-none m-0 uppercase flex items-baseline gap-2">
          COMPETITIVE <span className="text-[#FFB800]">LADDER</span>
          <span className="text-sm font-semibold tracking-normal text-white/30 lowercase italic ml-2">closed league</span>
        </h1>
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-[#FFB800]/60 mt-1 sm:mt-2">
          Counter Strike Manual & Discord Integrated ELO Ledger System
        </p>

        {errorMessage && (
          <div className="mt-3 px-3 py-1.5 bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-xs font-mono rounded flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#FFB800] animate-pulse"></span>
            {errorMessage}
          </div>
        )}

        {playerActionSuccess && (
          <div className="mt-2 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-sans rounded flex items-center gap-2 font-bold uppercase">
            <Check className="w-4 h-4 text-green-400 shrink-0" />
            {playerActionSuccess}
          </div>
        )}
      </header>

      {/* Main Hub Grid Container */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-y-auto lg:overflow-hidden min-h-0">
        
        {/* VIEW 1: DEDICATED INDIVIDUAL PLAYER PROFILE PAGE */}
        {viewedPlayerId && selectedProfilePlayer ? (
          <main className="col-span-12 p-4 sm:p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-6">
            
            {/* Nav Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <button 
                onClick={() => setViewedPlayerId(null)}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FFB800] hover:text-white transition-colors bg-white/5 px-4 py-2 border border-white/10 hover:border-white/20 rounded cursor-pointer self-start"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Leaderboard
              </button>
              <div className="text-[10px] uppercase font-mono text-white/40 tracking-widest bg-black px-3 py-1 rounded inline-block">
                Registered Profile: {selectedProfilePlayer.id}
              </div>
            </div>

            {/* Profile Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile Card Center */}
              <div className="bg-[#121214] border border-white/10 p-6 rounded relative overflow-hidden group flex flex-col items-center">
                <div className="absolute -right-6 -bottom-6 text-9xl font-black italic text-white/[0.01] uppercase select-none pointer-events-none">
                  CS
                </div>

                <div className="relative mb-4">
                  <img 
                    src={selectedProfilePlayer.pictureUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80'} 
                    alt={selectedProfilePlayer.name}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-[#FFB800] object-cover bg-black"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80';
                    }}
                  />
                  <div className="absolute bottom-2 right-2 bg-[#FFB800] text-black text-[10px] font-black px-2 py-0.5 rounded italic">
                    RANK #{getRank(selectedProfilePlayer)}
                  </div>
                </div>

                <h2 className="text-3xl font-black tracking-tight text-white uppercase italic text-center leading-tight">
                  {selectedProfilePlayer.name}
                </h2>
                <p className="text-[10px] font-mono uppercase bg-[#FFB800]/20 text-[#FFB800] font-bold px-2 py-0.5 rounded mt-1">
                  Active Competitor
                </p>

                <p className="text-[10px] text-white/30 font-mono mt-4">
                  JOINED COHORT: {selectedProfilePlayer.joinDate}
                </p>

                {/* Main Dynamic ELO Circle Indicator */}
                <div className="mt-6 text-center w-full bg-black/40 p-4 rounded border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest block">COMPETITIVE RATING</span>
                  <div className="text-5xl font-black tracking-tight text-[#FFB800] mt-1 tabular-nums">
                    {selectedProfilePlayer.elo}
                  </div>
                  <span className="text-[10px] font-mono text-white/30 block mt-1 uppercase">
                    Initial state: {selectedProfilePlayer.initialElo} ELO
                  </span>
                </div>
              </div>

              {/* Stats Breakdown Column */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Block 1: Winrates */}
                <div className="bg-[#121214] border border-white/5 p-5 rounded flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-white/40 tracking-wider flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-[#FFB800]" />
                      Season Win Rate
                    </span>
                    <span className="text-[10px] bg-[#FFB800]/10 text-[#FFB800] px-2 py-0.5 rounded font-bold font-mono">
                      {selectedProfilePlayer.matchesPlayed} Placed
                    </span>
                  </div>
                  <div className="my-4">
                    <div className="text-6xl font-black italic tracking-tighter text-white tabular-nums leading-none">
                      {getPlayerWinrate(selectedProfilePlayer)}%
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded mt-3 overflow-hidden">
                      <div 
                        className="bg-green-400 h-full rounded" 
                        style={{ width: `${getPlayerWinrate(selectedProfilePlayer)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs font-mono text-white/60">
                    <span>Wins: <strong className="text-green-400">{selectedProfilePlayer.wins}</strong></span>
                    <span>Losses: <strong className="text-red-400">{selectedProfilePlayer.losses}</strong></span>
                    <span>Draws: <strong>{selectedProfilePlayer.draws}</strong></span>
                  </div>
                </div>

                {/* Block 2: K/D statistics */}
                <div className="bg-[#121214] border border-white/5 p-5 rounded flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-white/40 tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-[#FFB800]" />
                      Combat Efficiency
                    </span>
                    <span className="text-[10.5px] bg-[#FFB800]/10 text-[#FFB800] px-2 py-0.5 rounded font-black font-mono">
                      K/D Ratio: {getPlayerKD(selectedProfilePlayer)}
                    </span>
                  </div>
                  <div className="my-4 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-white/40 text-xs uppercase">Overall Kills:</span>
                      <span className="text-3xl font-black text-white italic tabular-nums">{selectedProfilePlayer.kills}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-white/40 text-xs uppercase">Overall Deaths:</span>
                      <span className="text-3xl font-black text-white/70 italic tabular-nums">{selectedProfilePlayer.deaths}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/30 font-mono block">
                    Average of {selectedProfilePlayer.matchesPlayed > 0 ? (selectedProfilePlayer.kills / selectedProfilePlayer.matchesPlayed).toFixed(1) : 0} kills per game.
                  </span>
                </div>

                {/* Block 3: Map Specific Standings */}
                <div className="bg-[#121214] border border-white/5 p-5 rounded sm:col-span-2">
                  <span className="text-[10px] uppercase font-black text-white/40 tracking-widest block mb-4">CS Map Records (Wins & Play Distribution)</span>
                  
                  {Object.keys(selectedProfilePlayer.mapStats).length === 0 ? (
                    <div className="text-center py-6 text-white/30 italic text-xs border border-dashed border-white/5 rounded">
                      No competitive arena games played on this player's active records.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(selectedProfilePlayer.mapStats).map(([mapName, stats]: [string, any]) => {
                        const rate = stats.plays > 0 ? Math.round((stats.wins / stats.plays) * 100) : 0;
                        return (
                          <div key={mapName} className="bg-black/40 p-3 rounded border border-white/5 flex flex-col justify-between">
                            <span className="font-mono text-xs text-white/50 block truncate uppercase tracking-tighter">
                              {mapName.replace('de_', '')}
                            </span>
                            <div className="my-2">
                              <span className="text-xl font-black text-white italic tabular-nums">{rate}%</span>
                              <span className="text-[9px] text-[#FFB800] block">Win rate</span>
                            </div>
                            <span className="text-[10px] font-mono text-white/30 uppercase leading-none mt-1">
                              {stats.wins}W / {stats.plays}P
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* Individual Matches history */}
            <div className="bg-[#121214] border border-white/5 p-5 rounded space-y-4">
              <h3 className="text-sm font-black uppercase text-[#FFB800] tracking-widest flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-[#FFB800]" />
                Personal Match History Logs ({viewedPlayerMatches.length} Matches)
              </h3>
              
              <div className="space-y-3">
                {viewedPlayerMatches.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/30 italic border border-dashed border-white/5 rounded">
                    This player did not record any match submissions inside chronological history logs.
                  </div>
                ) : (
                  viewedPlayerMatches.map((m) => {
                    const isTeamA = m.teamA.includes(selectedProfilePlayer.id);
                    const isWinner = (isTeamA && m.winner === 'A') || (!isTeamA && m.winner === 'B');
                    const isDraw = m.winner === 'Draw';
                    
                    const pPerf = m.playersPerformance[selectedProfilePlayer.id] || { kills: 0, deaths: 0, eloChange: 0 };
                    
                    return (
                      <div key={m.id} className="bg-black/50 p-4 rounded border border-white/5 hover:border-white/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-bold">
                        
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded italic text-center shrink-0 w-20 select-none ${
                            isDraw ? 'bg-white/10 text-white' : isWinner ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {isDraw ? 'DRAW' : isWinner ? 'VICTORY' : 'DEFEAT'}
                          </span>
                          
                          <div>
                            <span className="text-[10.5px] uppercase font-mono text-white/40 block">
                              {new Date(m.date).toLocaleDateString()} // Map: <strong className="text-white">{m.map.toUpperCase()}</strong>
                            </span>
                            <div className="text-xs text-white/80 mt-0.5 font-mono">
                              Score: <strong className="text-white">{m.scoreA} : {m.scoreB}</strong> 
                              <span className="text-white/30 font-sans ml-2">
                                (with {isTeamA ? 'Team Alpha' : 'Team Omega'})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* KD & ELO Change breakdown pill */}
                        <div className="flex items-center gap-6 self-end sm:self-center">
                          <div className="text-right font-mono">
                            <span className="text-[9px] uppercase font-bold text-white/40 block">Round KD</span>
                            <span className="text-xs text-white">
                              {pPerf.kills}k / {pPerf.deaths}d
                            </span>
                          </div>

                          <div className="text-right font-mono min-w-[70px]">
                            <span className="text-[9px] uppercase font-bold text-white/40 block">ELO Shift</span>
                            <span className={`text-base font-black ${pPerf.eloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pPerf.eloChange >= 0 ? `+${pPerf.eloChange}` : pPerf.eloChange}
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Timeline elo tracker logs */}
            <div className="bg-[#121214] border border-white/5 p-5 rounded space-y-4">
              <span className="text-xs font-black uppercase text-white/40 tracking-wider block">CHRONOLOGICAL ELO AUDIT TRAIL</span>
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-2">
                {selectedProfilePlayer.eloHistory.slice().reverse().map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-xs bg-black/40 p-2.5 rounded border border-white/5">
                    <div>
                      <span className="font-mono text-white/40 block">{h.date}</span>
                      <p className="text-white/80 mt-0.5 leading-tight font-bold">{h.description || 'Adjustment transaction settled'}</p>
                    </div>
                    <span className="font-extrabold font-mono text-[#FFB800] bg-[#FFB800]/10 px-2.5 py-1 rounded">
                      {h.elo} ELO
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </main>
        ) : (
          <>
            {/* VIEW 2: SPLIT SCREEN (LEADERBOARD / MATCH HISTORY / GENERAL LEAGUE) */}
            
            {/* LEFT PROFILE HIGHLIGHT / QUICK VIEW (STANDBY COMPONENT) */}
            <aside className="col-span-12 lg:col-span-3 border-r border-white/5 p-4 sm:p-6 bg-[#0E0E10] flex flex-col justify-between overflow-y-auto shrink-0">
              <div className="space-y-6">
                
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-[#FFB800]" />
                    Featured Rank Champion
                  </h3>
                </div>

                {sortedActivePlayers.length > 0 ? (
                  (() => {
                    const champ = sortedActivePlayers[0];
                    return (
                      <div className="bg-gradient-to-b from-[#16161a] to-[#111112] p-4 rounded border border-[#FFB800]/30 relative overflow-hidden group">
                        
                        {/* Crown icon decoration */}
                        <div className="absolute right-3 top-3 text-[#FFB800] opacity-80 animate-bounce">
                          <Crown className="w-5 h-5 fill-[#FFB800]" />
                        </div>

                        <div className="flex flex-col items-center py-4">
                          <img 
                            src={champ.pictureUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80'} 
                            alt={champ.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-[#FFB800]"
                          />
                          <h4 className="text-lg font-black text-white uppercase italic mt-3 tracking-wide">{champ.name}</h4>
                          <span className="text-[9px] font-mono font-bold text-[#FFB800] uppercase bg-[#FFB800]/10 px-2 py-0.5 rounded mt-1">
                            #1 Ladder Leader
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4 text-center text-xs border-t border-white/5 pt-4">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-white/40 block">Elo Rating</span>
                            <span className="font-extrabold text-[#FFB800] text-lg font-mono">{champ.elo}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-white/40 block">Win rate</span>
                            <span className="font-extrabold text-white text-lg font-mono">{getPlayerWinrate(champ)}%</span>
                          </div>
                        </div>

                        {/* Big button to click directly */}
                        <button 
                          onClick={() => setViewedPlayerId(champ.id)}
                          className="w-full mt-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold py-2 text-[10px] tracking-wider uppercase rounded transition-colors cursor-pointer"
                        >
                          Inspect Champion Profile →
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-6 text-white/30 italic text-xs">No active players on the competitive ladder.</div>
                )}

                {/* CS:GO Predefined Map pool info bar */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded text-xs space-y-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#FFB800] block">Ladder Active Map Pool</span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[9px] text-white/60">
                    {config.allowedMaps.map(m => (
                      <span key={m} className="bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{m.replace('de_', '')}</span>
                    ))}
                  </div>
                </div>

                {/* Rapid Quick report tip */}
                <div className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded text-[11px] text-white/60 leading-relaxed">
                  📢 <strong>Admin Warning:</strong> Always input correct individual metrics (kills & deaths) inside match submissions. The state solver uses these metrics to award performance multipliers!
                </div>

              </div>

              {/* Central quick Navigation switchers */}
              <div className="space-y-2.5 mt-6 pt-4 border-t border-white/5">
                <button 
                  onClick={() => {
                    setActiveTab('admin');
                  }}
                  className="w-full bg-[#FFB800] text-black font-black py-3.5 italic text-xs tracking-tighter hover:bg-[#FFC840] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-black" />
                  GOTO ADMIN COCKPIT & MATCH REPORT Form
                </button>
              </div>
            </aside>

            {/* CENTER SLOT CONTENT CONTAINER */}
            <main className="col-span-12 lg:col-span-6 flex flex-col bg-[#0A0A0B] overflow-y-auto lg:overflow-hidden">
              
              {/* TAB CONTAINER 1: LEADERBOARD LADDER INDEX */}
              {activeTab === 'leaderboard' && (
                <div className="flex-1 flex flex-col min-h-0">
                  
                  {/* SEARCH & TITLE BAR */}
                  <div className="px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-white/5 bg-[#121214] gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-black uppercase tracking-widest text-[#FFB800] flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5" />
                        Closed Ladder Rankings
                      </h2>
                      <span className="text-[10px] font-mono text-white/40">({filteredPlayers.length} Active CS Profiles)</span>
                    </div>
                    
                    <div className="relative">
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        type="text"
                        placeholder="Search gamertag..."
                        className="w-full sm:w-48 bg-black/60 border border-white/15 px-3 py-1 text-xs text-white placeholder-white/30 rounded focus:outline-none focus:border-[#FFB800] pl-8 transition-colors uppercase font-mono"
                      />
                      <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* HIGHLIGHTED TOP THREE PODIUM (MATCH MANDATE!) */}
                  <div className="p-4 sm:p-6 bg-gradient-to-b from-[#121215] to-[#0A0A0B] border-b border-white/5 shrink-0">
                    <h3 className="text-center text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 flex items-center justify-center gap-1.5">
                      <Crown className="w-4 h-4 text-[#FFB800] fill-[#FFB800]" />
                      THE LADDER TOP THREE COMPETITORS
                    </h3>

                    {topThree.length === 0 ? (
                      <div className="text-center py-4 text-xs italic text-white/30">No active competitive records registered inside the league yet.</div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto items-end pt-3 text-center">
                        
                        {/* SECOND PLACE (SILVER) */}
                        {topThree[1] ? (
                          <div 
                            onClick={() => setViewedPlayerId(topThree[1].id)}
                            className="bg-[#121214]/60 border border-white/5 hover:border-white/20 p-3 sm:p-4 rounded flex flex-col items-center cursor-pointer transition-all hover:scale-105"
                          >
                            <div className="relative">
                              <img 
                                src={topThree[1].pictureUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80'} 
                                alt={topThree[1].name}
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-300"
                              />
                              <span className="absolute -bottom-1 -right-1 bg-slate-300 text-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">🥈</span>
                            </div>
                            <span className="text-xs font-black text-white tracking-tight uppercase truncate max-w-[100px] mt-2 flex items-center justify-center gap-1">
                              {topThree[1].name}
                              {getPlayerWinstreak(topThree[1].id) >= 3 && (
                                <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500/20 animate-pulse shrink-0" title={`${getPlayerWinstreak(topThree[1].id)} Match Winstreak`} />
                              )}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-[#FFB800] truncate block">{topThree[1].elo} ELO</span>
                            <span className="text-[9px] font-mono text-white/40 truncate block">{getPlayerWinrate(topThree[1])}% WR</span>
                          </div>
                        ) : (
                          <div className="bg-white/[0.01] border border-dashed border-white/5 py-8 text-[11px] italic text-white/20">Empty slot</div>
                        )}

                        {/* FIRST PLACE (GOLD) */}
                        {topThree[0] ? (
                          <div 
                            onClick={() => setViewedPlayerId(topThree[0].id)}
                            className="bg-gradient-to-b from-[#241F14] to-[#121214] border-2 border-[#FFB800] shadow-lg shadow-[#FFB800]/5 p-4 sm:p-5 rounded flex flex-col items-center cursor-pointer transition-all hover:scale-105 relative -top-3"
                          >
                            <div className="relative">
                              <img 
                                src={topThree[0].pictureUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80'} 
                                alt={topThree[0].name}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#FFB800]"
                              />
                              <span className="absolute -bottom-1 -right-1 bg-[#FFB800] text-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">🥇</span>
                            </div>
                            <span className="text-sm font-black text-white tracking-tight uppercase truncate max-w-[120px] mt-2 flex items-center justify-center gap-1">
                              {topThree[0].name}
                              {getPlayerWinstreak(topThree[0].id) >= 3 && (
                                <Flame className="w-4 h-4 text-red-500 fill-red-500/20 animate-pulse shrink-0" title={`${getPlayerWinstreak(topThree[0].id)} Match Winstreak`} />
                              )}
                            </span>
                            <span className="text-xs font-mono font-black text-[#FFB800] truncate block">{topThree[0].elo} ELO</span>
                            <span className="text-[9.5px] font-mono text-white/50 truncate block">{getPlayerWinrate(topThree[0])}% WR</span>
                          </div>
                        ) : (
                          <div className="bg-white/[0.01] border border-dashed border-white/5 py-8 text-[11px] italic text-white/20">Empty slot</div>
                        )}

                        {/* THIRD PLACE (BRONZE) */}
                        {topThree[2] ? (
                          <div 
                            onClick={() => setViewedPlayerId(topThree[2].id)}
                            className="bg-[#121214]/60 border border-white/5 hover:border-white/20 p-3 sm:p-4 rounded flex flex-col items-center cursor-pointer transition-all hover:scale-105"
                          >
                            <div className="relative">
                              <img 
                                src={topThree[2].pictureUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80'} 
                                alt={topThree[2].name}
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#D77F17]"
                              />
                              <span className="absolute -bottom-1 -right-1 bg-[#D77F17] text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">🥉</span>
                            </div>
                            <span className="text-xs font-black text-white tracking-tight uppercase truncate max-w-[100px] mt-2 flex items-center justify-center gap-1">
                              {topThree[2].name}
                              {getPlayerWinstreak(topThree[2].id) >= 3 && (
                                <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500/20 animate-pulse shrink-0" title={`${getPlayerWinstreak(topThree[2].id)} Match Winstreak`} />
                              )}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-[#FFB800] truncate block">{topThree[2].elo} ELO</span>
                            <span className="text-[9px] font-mono text-white/40 truncate block">{getPlayerWinrate(topThree[2])}% WR</span>
                          </div>
                        ) : (
                          <div className="bg-white/[0.01] border border-dashed border-white/5 py-8 text-[11px] italic text-white/20">Empty slot</div>
                        )}

                      </div>
                    )}

                  </div>

                  {/* LADDER TABLE LIST */}
                  <div className="flex-1 overflow-x-auto lg:overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 bg-black/45 bg-opacity-40 select-none">
                          <th className="px-5 py-3.5 text-center w-16">Rank</th>
                          <th className="px-5 py-3.5">Competitor Gamer Profile</th>
                          <th className="px-5 py-3.5 tabular-nums text-center w-28">ELO Rating</th>
                          <th className="px-5 py-3.5 text-center w-24">Played</th>
                          <th className="px-5 py-3.5 text-center w-24">Win Rate</th>
                          <th className="px-5 py-3.5 text-center w-24">K/D Ratio</th>
                          <th className="px-5 py-3.5 text-right pr-6 w-28">inspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-bold">
                        {filteredPlayers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-xs italic text-white/40">
                              No active competitors registered. Click "Admin Desk" to register new players.
                            </td>
                          </tr>
                        ) : (
                          filteredPlayers.map((player, index) => {
                            const rankNumber = index + 1;
                            const winrate = getPlayerWinrate(player);
                            const kd = getPlayerKD(player);
                            const winstreak = getPlayerWinstreak(player.id);

                            return (
                              <tr 
                                key={player.id} 
                                onClick={() => setViewedPlayerId(player.id)}
                                className={`cursor-pointer transition-all hover:bg-white/[0.02] text-white/80`}
                              >
                                {/* Rank */}
                                <td className="px-5 py-3.5 text-center font-black italic">
                                  {rankNumber === 1 ? (
                                    <span className="inline-flex items-center gap-1 text-[#FFB800]">
                                      🥇 #01
                                    </span>
                                  ) : rankNumber === 2 ? (
                                    <span className="inline-flex items-center gap-1 text-slate-300">
                                      🥈 #02
                                    </span>
                                  ) : rankNumber === 3 ? (
                                    <span className="inline-flex items-center gap-1 text-[#D77F17]">
                                      🥉 #03
                                    </span>
                                  ) : rankNumber < 10 ? (
                                    `#0${rankNumber}`
                                  ) : (
                                    `#${rankNumber}`
                                  )}
                                </td>

                                {/* Player Gamer Profile (NAME AND MANDATORY PLAYER PICTURE!) */}
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={player.pictureUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80'} 
                                      alt={player.name}
                                      className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0 bg-black"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80';
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold tracking-tight uppercase block text-white hover:text-[#FFB800] transition-colors">{player.name}</span>
                                        {winstreak >= 3 && (
                                          <span className="inline-flex items-center gap-0.5 bg-red-500/10 text-red-500 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-widest shrink-0 animate-pulse select-none">
                                            <Flame className="w-2.5 h-2.5 text-red-500 fill-red-500/30" />
                                            {winstreak} Streak
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[9px] text-white/30 font-mono leading-none mt-0.5">joined {player.joinDate}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* ELO */}
                                <td className="px-5 py-3.5 tabular-nums text-center">
                                  <span className="text-white font-extrabold bg-white/5 px-2.5 py-1 rounded border border-white/5 font-mono text-xs">
                                    {player.elo}
                                  </span>
                                </td>

                                {/* Matches Count */}
                                <td className="px-5 py-3.5 text-center font-mono text-xs opacity-75 tabular-nums">
                                  {player.matchesPlayed}
                                </td>

                                {/* Win Rate */}
                                <td className="px-5 py-3.5 text-center font-mono text-xs tabular-nums">
                                  <span className={`px-1.5 py-0.5 rounded font-bold ${winrate >= 60 ? 'text-green-400 bg-green-500/5' : winrate >= 45 ? 'text-white' : 'text-red-400 bg-red-400/5'}`}>
                                    {winrate}%
                                  </span>
                                </td>

                                {/* K/D Ratio */}
                                <td className="px-5 py-3.5 text-center font-mono text-xs tabular-nums">
                                  <span className={Number(kd) >= 1.15 ? 'text-green-400' : Number(kd) >= 0.9 ? 'text-white' : 'text-red-400'}>
                                    {kd}
                                  </span>
                                </td>

                                {/* Inspection Link */}
                                <td className="px-5 py-3.5 text-right pr-6">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewedPlayerId(player.id);
                                    }}
                                    className="text-[10px] font-black uppercase tracking-wider text-[#FFB800] hover:underline cursor-pointer bg-transparent border-0"
                                  >
                                    Inspect Profile →
                                  </button>
                                </td>

                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

              {/* TAB CONTAINER 2: HISTORY OF COMPETITIVE MATCH SUBMISSIONS */}
              {activeTab === 'history' && (
                <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 space-y-4">
                  <h2 className="text-xl font-black italic tracking-tighter text-[#FFB800] uppercase flex items-center gap-2">
                    <History className="w-5 h-5 text-[#FFB800]" />
                    League Match Ledger
                  </h2>
                  <p className="text-xs text-white/50 leading-relaxed max-w-xl">
                    Archive of manually reported CS scores, maps, and precise round-validated ELO modifications per competitor.
                  </p>

                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                    {matches.length === 0 ? (
                      <div className="py-12 border border-dashed border-white/10 rounded text-center text-white/40 text-xs italic bg-[#121214]/30">
                        No matches registered yet. Go to Admin Desk tab to load fresh map results!
                      </div>
                    ) : (
                      matches.map((m) => {
                        const winnerText = m.winner === 'A' ? 'Team Alpha Wins' : m.winner === 'B' ? 'Team Omega Wins' : 'Draw';
                        return (
                          <div key={m.id} className="bg-white/[0.02] border border-white/5 rounded p-4 flex flex-col hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded text-xs select-none">
                              <span className="font-mono text-white/40">{new Date(m.date).toLocaleString()}</span>
                              <span className="font-extrabold uppercase tracking-widest text-[#FFB800] font-mono">{m.map}</span>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-3 py-4 text-center select-text">
                              <div className="text-left">
                                <span className="text-[10px] text-white/40 uppercase tracking-widest block font-extrabold">Team ALPHA</span>
                                <div className="font-mono mt-1 text-xs text-white truncate max-w-[150px]">
                                  {m.teamA.map(id => players.find(p => p.id === id)?.name || id).join(', ')}
                                </div>
                              </div>

                              <div>
                                <div className="text-3xl font-black tracking-tight flex items-center justify-center gap-3 italic">
                                  <span className={m.scoreA > m.scoreB ? 'text-green-400 font-extrabold' : ''}>{m.scoreA}</span>
                                  <span className="text-white/20 font-sans font-normal text-xl">:</span>
                                  <span className={m.scoreB > m.scoreA ? 'text-green-400 font-extrabold' : ''}>{m.scoreB}</span>
                                </div>
                                <span className="text-[9px] font-black uppercase text-[#FFB800] bg-[#FFB800]/10 px-2 py-0.5 mt-1 rounded inline-block">
                                  {winnerText}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-white/40 uppercase tracking-widest block font-extrabold">Team OMEGA</span>
                                <div className="font-mono mt-1 text-xs text-white truncate max-w-[150px]">
                                  {m.teamB.map(id => players.find(p => p.id === id)?.name || id).join(', ')}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 pt-3 border-t border-white/5">
                              <span className="text-[9px] uppercase font-bold text-white/40 block mb-1.5">Elo & Player Breakdown</span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                                {Object.entries(m.playersPerformance).map(([pId, perf]: [string, any]) => {
                                  const p = players.find(x => x.id === pId);
                                  return (
                                    <div key={pId} className={`p-1.5 rounded text-[10px] border ${perf.isTopPerformer ? 'bg-[#FFB800]/10 border-[#FFB800]/30' : 'bg-black/30 border-white/5'}`}>
                                      <div className="font-extrabold text-white truncate flex items-center justify-between gap-1">
                                        <span>{p ? p.name : 'Competitor'}</span>
                                        {perf.isTopPerformer && (
                                          <span className="text-[8px] bg-[#FFB800] text-black px-1 rounded font-black scale-90 whitespace-nowrap">TOP</span>
                                        )}
                                      </div>
                                      <div className="flex justify-between items-center text-white/50 font-mono mt-0.5">
                                        <span>K/D: {perf.kills}/{perf.deaths}</span>
                                        <span className={`font-bold ${perf.eloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                          {perf.eloChange >= 0 ? `+${perf.eloChange}` : perf.eloChange}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTAINER 3: SEASONS ARCHIVES */}
              {activeTab === 'archive' && (
                <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 space-y-4">
                  <h2 className="text-xl font-black italic tracking-tighter text-[#FFB800] uppercase flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#FFB800]" />
                    Archived Seasons Standings
                  </h2>
                  <p className="text-xs text-white/50 leading-relaxed max-w-xl font-sans">
                    Standings and archives from settled cohorts. Historical ratings are archived below for transparency and records auditing.
                  </p>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {seasons.map((s) => (
                      <div key={s.id} className="bg-white/[0.02] border border-white/5 rounded p-4 flex flex-col space-y-2.5">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <div>
                            <h4 className="text-base font-extrabold text-white uppercase italic tracking-wider flex items-center gap-1.5">
                              {s.name} 
                              {s.isActive && (
                                <span className="text-[9px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full inline-block animate-pulse-slow">
                                  ● ACTIVE NOW
                                </span>
                              )}
                            </h4>
                            <span className="text-[10px] font-mono text-white/40 block mt-0.5">
                              Begun: {s.startDate} {s.endDate ? `// Ended: ${s.endDate}` : ''}
                            </span>
                          </div>

                          {!s.isActive && s.winnerId && (
                            <div className="text-right">
                              <span className="text-[9px] uppercase font-bold text-white/40 block">Season Champion Medal</span>
                              <span className="text-xs font-mono font-bold text-[#FFB800]">
                                🏆 {players.find(p => p.id === s.winnerId)?.name || 'ZywOo_Replica'}
                              </span>
                            </div>
                          )}
                        </div>

                        {!s.isActive && s.standings && s.standings.length > 0 ? (
                          <div className="space-y-1.5 pt-1.5">
                            <span className="text-[9px] uppercase font-bold text-white/40 block tracking-widest">Archived Leaders</span>
                            {s.standings.slice(0, 3).map((st, idx) => (
                              <div key={st.playerId} className="flex justify-between items-center text-xs bg-black/40 px-3 py-2 rounded">
                                <span className="font-extrabold text-white font-sans uppercase">
                                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {st.playerName}
                                </span>
                                <div className="flex gap-4 font-mono text-white/60">
                                  <span>WR: {st.wins > 0 ? Math.round((st.wins / Math.max(1, st.wins + st.losses)) * 100) : 0}%</span>
                                  <span>K/D: {(st.kills / Math.max(1, st.deaths)).toFixed(2)}</span>
                                  <span className="font-extrabold text-[#FFB800]">{st.elo} ELO</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : s.isActive ? (
                          <div className="text-xs text-white/50 italic bg-black/25 p-3 rounded border border-white/5">
                            Season {s.name} is currently running on the active server. Standings will archive once seasonal reset is triggered inside the "Admin Desk" cockpit parameters panel.
                          </div>
                        ) : (
                          <div className="text-xs text-white/30 italic">No archived standings recorded in league database.</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTAINER 4: COMPLETE ADMIN DESK (REGISTER, EDIT, AND MANUAL SUBMISSIONS) */}
              {activeTab === 'admin' && (
                <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 space-y-6">
                  
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
                    <div>
                      <h2 className="text-xl font-black italic tracking-tighter text-[#FFB800] uppercase flex items-center gap-1.5">
                        <Lock className="w-5 h-5 text-[#FFB800] shrink-0" />
                        Admin Strategy Desk
                      </h2>
                      <span className="text-[10px] text-white/50 block mt-0.5">Edit players, register competitors, submit match parameters & manage season lifecycles</span>
                    </div>
                  </div>

                  {/* Form 1: Register New Competitor with custom Name and custom Picture/Avatar URL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    
                    {/* Register box */}
                    <div className="bg-[#121214] border border-white/5 p-4 rounded flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] block mb-1">REGISTER COMPETITOR Profile</span>
                        <p className="text-[11px] text-white/50 leading-relaxed mb-4">Add a player to the closed league roster list. Initial rating begins at {config.startingElo} ELO.</p>
                        
                        <form onSubmit={handleRegisterPlayerSubmit} className="space-y-3">
                          <div>
                            <label className="text-[9px] uppercase font-bold tracking-widest text-white/40 block mb-1">Gamer Nickname / Gamertag</label>
                            <input
                              type="text"
                              required
                              value={newPlayerName}
                              onChange={(e) => setNewPlayerName(e.target.value)}
                              placeholder="e.g. coldzera, Fallen, flusha"
                              className="w-full bg-black/60 border border-white/10 px-3 py-2 text-xs text-white uppercase rounded focus:outline-none focus:border-[#FFB800]"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-bold tracking-widest text-white/40 block mb-1">Player Avatar / Profile Picture URL</label>
                            <input
                              type="url"
                              value={newPlayerPic}
                              onChange={(e) => setNewPlayerPic(e.target.value)}
                              placeholder="https://images.unsplash.com/photo-..."
                              className="w-full bg-black/60 border border-white/10 px-3 py-2 text-xs text-white rounded focus:outline-none focus:border-[#FFB800]"
                            />
                            <span className="text-[9.5px] text-white/30 block mt-1">Leave blank to assign a cool random gamer icon automatically.</span>
                          </div>

                          <button
                            type="submit"
                            className="bg-[#FFB800] hover:bg-[#FFC840] text-black font-black italic text-xs uppercase px-4 py-2.5 rounded tracking-wide transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5 pt-3"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Confirm Player Registration
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* EDIT PLAYER PROFILES PANEL (MANDATE!) */}
                    <div className="bg-[#121214] border border-white/5 p-4 rounded flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] block mb-1">EDIT REGISTERED PROFILES</span>
                      <p className="text-[11px] text-white/50 leading-relaxed mb-4">Select any player profile below to alter their Gamer Name or Player custom picture URL.</p>
                      
                      {editingPlayerId ? (
                        <form onSubmit={handleSavePlayerEdit} className="space-y-3.5 bg-black/40 p-3 rounded border border-white/5">
                          <span className="text-[10px] font-mono text-white/40 uppercase block">Editing Profile UID: {editingPlayerId}</span>
                          
                          <div>
                            <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">Altered Gamer Name</label>
                            <input 
                              type="text"
                              required
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full bg-black border border-white/10 px-3 py-1.5 text-xs text-white rounded focus:outline-none focus:border-[#FFB800] uppercase"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">Profile custom picture URL</label>
                            <input 
                              type="url"
                              value={editingPicUrl}
                              onChange={(e) => setEditingPicUrl(e.target.value)}
                              placeholder="URL to player picture avatar"
                              className="w-full bg-black border border-white/10 px-3 py-1.5 text-xs text-white rounded focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">Ladder Status</label>
                            <select
                              value={editingStatus}
                              onChange={(e) => setEditingStatus(e.target.value as 'active' | 'inactive')}
                              className="w-full bg-black border border-white/10 px-3 py-1.5 text-xs text-white rounded focus:outline-none"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive / Banned</option>
                            </select>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button 
                              type="button" 
                              onClick={() => setEditingPlayerId(null)}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/70 text-xs rounded"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit"
                              className="px-4 py-1.5 bg-[#FFB800] hover:bg-[#FFC840] text-black font-extrabold text-xs rounded"
                            >
                              Update Profile
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex-1 overflow-y-auto max-h-[180px] space-y-1.5 pr-1">
                          {players.map(p => (
                            <div key={p.id} className="flex justify-between items-center text-xs bg-black/35 px-3 py-2 border border-white/5 rounded">
                              <div className="flex items-center gap-2 truncate">
                                <img 
                                  src={p.pictureUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80'} 
                                  alt={p.name}
                                  className="w-6 h-6 rounded-full object-cover bg-black"
                                />
                                <span className="font-extrabold text-white truncate uppercase">{p.name}</span>
                                <span className="text-[9px] text-[#FFB800]">({p.elo})</span>
                                {p.status === 'inactive' && (
                                  <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded">BANNED</span>
                                )}
                              </div>
                              <button 
                                onClick={() => handleStartEditProfile(p)}
                                className="text-[10px] bg-white/5 border border-white/10 text-[#FFB800] px-2 py-0.5 rounded hover:bg-white/15 cursor-pointer"
                              >
                                Edit Profile
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Form 2: Manual Match Results submission form (MANDATE!) */}
                  <div className="bg-[#121214] border border-white/5 p-5 rounded space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] block mb-1">MANUAL MATCH RESULT SUBMISSION DESK</span>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        Input actual completed games with map, team scores, and round-by-round statistics for player ELO update calculation.
                      </p>
                    </div>

                    {submitSuccess && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 text-xs rounded font-bold">
                        ✔ Match manual state entered! ELO recalculated and logged. Discord alert broadcast simulation triggered.
                      </div>
                    )}

                    {matchError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 text-xs rounded font-mono font-bold">
                        {matchError}
                      </div>
                    )}

                    <form onSubmit={handleMatchSubmit} className="space-y-4">
                      
                      {/* Sub-block A: Score and Selector Map */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/40 p-3 rounded border border-white/5">
                        <div>
                          <label className="text-[9px] font-bold text-white/40 uppercase block mb-1">Active Map Played</label>
                          <select 
                            value={matchMap}
                            onChange={(e) => setMatchMap(e.target.value)}
                            className="w-full bg-[#121214] border border-white/10 text-xs px-2 py-1.5 uppercase font-mono text-white focus:outline-none"
                          >
                            {config.allowedMaps.map(m => (
                              <option key={m} value={m}>{m.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-white/40 uppercase block mb-1">Team Alpha Score</label>
                          <input 
                            type="number"
                            min={0}
                            value={scoreA}
                            onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                            className="w-full bg-[#121214] border border-white/10 text-xs px-2 py-1.5 font-mono text-white focus:outline-none text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-white/40 uppercase block mb-1">Team Omega Score</label>
                          <input 
                            type="number"
                            min={0}
                            value={scoreB}
                            onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                            className="w-full bg-[#121214] border border-white/10 text-xs px-2 py-1.5 font-mono text-white focus:outline-none text-center font-bold"
                          />
                        </div>
                      </div>

                      {/* Sub-block B: Rosters building arrays */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        
                        {/* Team Alpha selection */}
                        <div className="border border-white/5 p-3 rounded bg-[#16161a] space-y-3">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-bold text-green-400 uppercase">Team ALPHA Roster</span>
                            <span className="text-[9px] font-mono text-white/30">AVG ELO: {teamAAvg}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 max-h-[120px] overflow-y-auto pr-1">
                            {players.filter(p => p.status === 'active').map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleAddRemovePlayer(p.id, 'A')}
                                className={`px-2 py-1 flex justify-between items-center border text-[10px] rounded font-bold ${
                                  teamAIds.includes(p.id) 
                                    ? 'bg-green-500/10 border-green-500 text-green-400' 
                                    : 'bg-black/35 border-white/5 text-white/60 hover:border-white/15'
                                }`}
                              >
                                <span className="truncate">{p.name}</span>
                                <span className="text-white/20">({p.elo})</span>
                              </button>
                            ))}
                          </div>

                          {/* Round stats inputs for Team Alpha selected */}
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <span className="text-[8.5px] uppercase font-bold text-white/40 tracking-wider block">ALPHA METRICS LOGS</span>
                            {teamAIds.length === 0 ? (
                              <span className="text-[10px] text-white/30 italic block text-center py-2">Select players above to configure scores.</span>
                            ) : (
                              teamAIds.map(id => {
                                const p = players.find(x => x.id === id);
                                return (
                                  <div key={id} className="flex justify-between items-center bg-black/40 p-1.5 rounded text-[10px]">
                                    <span className="font-extrabold text-[#FFB800] uppercase truncate max-w-[80px]">{p ? p.name : id}</span>
                                    <div className="flex gap-2">
                                      <input 
                                        type="number"
                                        placeholder="K"
                                        min={0}
                                        value={matchPerf[id]?.kills ?? 15}
                                        onChange={(e) => handleUpdatePerformance(id, 'kills', parseInt(e.target.value) || 0)}
                                        className="w-10 bg-black text-center font-mono py-0.5 text-xs text-white border border-white/10"
                                        title="Kills"
                                      />
                                      <input 
                                        type="number"
                                        placeholder="D"
                                        min={0}
                                        value={matchPerf[id]?.deaths ?? 15}
                                        onChange={(e) => handleUpdatePerformance(id, 'deaths', parseInt(e.target.value) || 0)}
                                        className="w-10 bg-black text-center font-mono py-0.5 text-xs text-white border border-white/10"
                                        title="Deaths"
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Team Omega selection */}
                        <div className="border border-white/5 p-3 rounded bg-[#16161a] space-y-3">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-bold text-red-400 uppercase">Team OMEGA Roster</span>
                            <span className="text-[9px] font-mono text-white/30">AVG ELO: {teamBAvg}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 max-h-[120px] overflow-y-auto pr-1">
                            {players.filter(p => p.status === 'active').map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleAddRemovePlayer(p.id, 'B')}
                                className={`px-2 py-1 flex justify-between items-center border text-[10px] rounded font-bold ${
                                  teamBIds.includes(p.id) 
                                    ? 'bg-red-500/10 border-red-500 text-red-500' 
                                    : 'bg-black/35 border-white/5 text-white/60 hover:border-white/15'
                                }`}
                              >
                                <span className="truncate">{p.name}</span>
                                <span className="text-white/20">({p.elo})</span>
                              </button>
                            ))}
                          </div>

                          {/* Round stats inputs for Team Omega selected */}
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <span className="text-[8.5px] uppercase font-bold text-white/40 tracking-wider block">OMEGA METRICS LOGS</span>
                            {teamBIds.length === 0 ? (
                              <span className="text-[10px] text-white/30 italic block text-center py-2">Select players above to configure scores.</span>
                            ) : (
                              teamBIds.map(id => {
                                const p = players.find(x => x.id === id);
                                return (
                                  <div key={id} className="flex justify-between items-center bg-black/40 p-1.5 rounded text-[10px]">
                                    <span className="font-extrabold text-[#FFB800] uppercase truncate max-w-[80px]">{p ? p.name : id}</span>
                                    <div className="flex gap-2">
                                      <input 
                                        type="number"
                                        placeholder="K"
                                        min={0}
                                        value={matchPerf[id]?.kills ?? 15}
                                        onChange={(e) => handleUpdatePerformance(id, 'kills', parseInt(e.target.value) || 0)}
                                        className="w-10 bg-black text-center font-mono py-0.5 text-xs text-white border border-white/10"
                                        title="Kills"
                                      />
                                      <input 
                                        type="number"
                                        placeholder="D"
                                        min={0}
                                        value={matchPerf[id]?.deaths ?? 15}
                                        onChange={(e) => handleUpdatePerformance(id, 'deaths', parseInt(e.target.value) || 0)}
                                        className="w-10 bg-black text-center font-mono py-0.5 text-xs text-white border border-white/10"
                                        title="Deaths"
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                      </div>

                      {/* ELO solver dynamic preview block */}
                      {eloPreview && (
                        <div className="bg-[#FFB800]/5 border border-[#FFB800]/15 p-3 rounded font-mono text-[10.5px] text-white/80 space-y-2">
                          <span className="text-[8.5px] font-sans font-bold uppercase text-[#FFB800] tracking-widest block">Live Calculated ELO Shift Expectancy</span>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <strong className="text-green-400 block pb-1 border-b border-white/5 uppercase text-[9px] font-sans">Alpha Ratings Result</strong>
                              {eloPreview.teamAChanges.map(c => (
                                <div key={c.playerId} className="truncate">
                                  {c.name}: <span className="font-black">{c.totalChange >= 0 ? `+${c.totalChange}` : c.totalChange}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <strong className="text-red-400 block pb-1 border-b border-white/5 uppercase text-[9px] font-sans">Omega Ratings Result</strong>
                              {eloPreview.teamBChanges.map(c => (
                                <div key={c.playerId} className="truncate">
                                  {c.name}: <span className="font-black">{c.totalChange >= 0 ? `+${c.totalChange}` : c.totalChange}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="bg-[#FFB800] hover:bg-[#FFC840] text-black font-black italic text-xs uppercase px-5 py-3 rounded tracking-wider transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-4 h-4" />
                        SUBMIT VERIFIED MATCH & CALC ELO
                      </button>

                    </form>
                  </div>

                  {/* Seasonal reset cockpits */}
                  <div className="bg-[#121214] border border-white/5 p-4 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block">Dangerous Action Zone</span>
                      <p className="text-[11px] text-white/50 leading-relaxed mt-0.5 max-w-xl">
                        Soft season reset squeezes ratings closer to {config.startingElo} ELO point and archives active rankings records inside the archive catalog. Active matches are reset.
                      </p>
                    </div>
                    {showResetConfirm ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="bg-white/5 hover:bg-white/10 text-white/70 font-black text-[10px] uppercase px-3 py-2 rounded transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowResetConfirm(false);
                            handleSeasonResetAndTrigger();
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-black italic text-[11px] uppercase px-4 py-2 rounded transition-all cursor-pointer flex items-center gap-1.5 animate-pulse"
                        >
                          <Flame className="w-3.5 h-3.5 text-white" />
                          Confirm Reset Now
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-black italic text-xs uppercase px-4 py-2.5 rounded transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Season Reset ELO
                      </button>
                    )}
                  </div>

                </div>
              )}

            </main>

            {/* RIGHT SIDEBAR PANEL: DISCORD NOTIFICATIONS SYSTEM CONTROLLER (DEMO HUB) */}
            <aside className="col-span-12 lg:col-span-3 border-l border-white/5 p-4 sm:p-6 bg-[#0A0A0B] flex flex-col justify-between overflow-y-auto shrink-0">
              <div className="space-y-6">
                
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-[#5865F2] rounded-full animate-pulse-slow"></div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] select-none">
                    Discord Bot notification Stream
                  </h3>
                </div>

                <div className="bg-[#5865F2]/5 p-4 rounded border border-[#5865F2]/20 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold tracking-wider text-[#5865F2] uppercase font-mono select-none">Live Connection API</span>
                    <span className="font-bold text-[9px] text-[#FFB800] uppercase">Simulation ready</span>
                  </div>
                  <p className="text-white/60 text-[11px] leading-relaxed">
                    Custom reported matches automatically formulate styled rich alert embeds payload and logs them immediately to the ledger below.
                  </p>
                </div>

                {/* Live Discord Config webhook address input block */}
                <div className="space-y-3 pt-2">
                  <label className="text-[9px] uppercase font-bold tracking-widest text-white/40 block">League Webhook alert Destination URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testWebhookUrl}
                      onChange={(e) => setTestWebhookUrl(e.target.value)}
                      placeholder="Paste real Discord Link URL here..."
                      className="flex-1 bg-black/60 border border-white/10 px-2.5 py-1.5 text-[11px] text-white placeholder-white/30 rounded focus:outline-none focus:border-[#FFB800]"
                    />
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={webhookTestStatus === 'testing'}
                      className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-extrabold px-3 py-1.5 text-xs uppercase tracking-wider rounded cursor-pointer disabled:opacity-50"
                    >
                      {webhookTestStatus === 'testing' ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                  {webhookTestStatus === 'success' && (
                    <span className="text-[10px] text-green-400 font-mono block">✔ Success! Alert triggered.</span>
                  )}
                  {webhookTestStatus === 'failed' && (
                    <span className="text-[10px] text-red-500 font-mono block">✘ Failed response. Re-enter address.</span>
                  )}
                </div>

                {/* Visual Terminal logs stream representing the Discord events */}
                <div className="border-t border-white/5 pt-4">
                  <span className="text-[9px] uppercase font-bold text-[#FFB800] tracking-widest block mb-3">Live Notification Terminal Logs</span>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {discordLogs.map((log) => (
                      <div key={log.id} className="bg-black/80 font-mono p-3 rounded text-[10px] space-y-2 border border-white/5">
                        <div className="flex justify-between items-center text-white/30 border-b border-white/5 pb-1 text-[9px]">
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className={`font-bold uppercase ${log.status === 'success' ? 'text-green-400' : log.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>
                            {log.status}
                          </span>
                        </div>
                        <div className="text-white/80 select-text break-words font-sans">{log.message}</div>
                        {log.payload && log.payload.content && (
                          <div className="bg-white/[0.03] p-1.5 rounded text-[9.5px] text-white/45 select-text whitespace-pre-wrap leading-normal font-mono">
                            {log.payload.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/30 uppercase select-none">
                <span>Valkyrie Integrity server</span>
                <span className="text-green-500 font-black flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Connected
                </span>
              </div>
            </aside>
          </>
        )}

      </div>

      {/* FOOTER STATUS MARGINS */}
      <footer className="h-8 border-t border-white/5 bg-[#0F0F12] flex items-center justify-between px-4 sm:px-8 text-[9px] font-bold text-white/40 tracking-widest shrink-0 uppercase select-none">
        <div className="flex gap-4 sm:gap-6">
          <span>VPL COMP SYSTEM v3.4.1</span>
          <span className="text-green-400">● SECURITY INTEGRITY PROTOCOL ACTIVE</span>
        </div>
        <div className="hidden sm:block">
          © 2026 CS CLOSED LEAGUE COMPETITIVE INTERACTIVE LADDER
        </div>
      </footer>

    </div>
  );
}

// ==========================================
// STATIC CONSTANT INITIAL_DATA WITH PICTURES (FALLBACKS)
// ==========================================

const INITIAL_PLAYERS: Player[] = [
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
    joinDate: '2026-01-15',
    pictureUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=120&q=80',
    mapStats: {
      de_mirage: { plays: 15, wins: 12 },
      de_inferno: { plays: 12, wins: 8 },
      de_nuke: { plays: 10, wins: 7 }
    },
    eloHistory: [
      { date: '2026-05-20', elo: 1812 },
      { date: '2026-05-22', elo: 1830 },
      { date: '2026-05-25', elo: 1842, description: 'Won 13:8 on de_mirage.' }
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
    joinDate: '2026-01-15',
    pictureUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    mapStats: {
      de_mirage: { plays: 20, wins: 14 },
      de_inferno: { plays: 18, wins: 10 }
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
    joinDate: '2026-01-15',
    pictureUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    mapStats: {
      de_nuke: { plays: 12, wins: 9 },
      de_mirage: { plays: 14, wins: 7 }
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
    joinDate: '2026-01-15',
    pictureUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=80',
    mapStats: {
      de_inferno: { plays: 18, wins: 12 },
      de_mirage: { plays: 12, wins: 6 }
    },
    eloHistory: [
      { date: '2026-05-15', elo: 1560 },
      { date: '2026-05-25', elo: 1590 }
    ]
  }
];

const INITIAL_MATCHES: Match[] = [
  {
    id: 'm_01',
    date: '2026-05-25T14:02:00Z',
    map: 'de_mirage',
    teamA: ['p1', 'p3'],
    teamB: ['p2', 'p4'],
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
    teamA: ['p2', 'p1'],
    teamB: ['p4', 'p3'],
    scoreA: 4,
    scoreB: 13,
    winner: 'B',
    seasonId: 's4',
    playersPerformance: {
      p2: { kills: 9, deaths: 16, eloChange: -16 },
      p1: { kills: 8, deaths: 15, eloChange: -14 },
      p4: { kills: 22, deaths: 6, eloChange: 18 },
      p3: { kills: 14, deaths: 11, eloChange: 10 }
    }
  }
];

const INITIAL_SEASONS: Season[] = [
  {
    id: 's1',
    name: 'Season 01',
    startDate: '2026-01-01',
    endDate: '2026-03-01',
    isActive: false,
    winnerId: 'p1',
    standings: [
      { playerId: 'p1', playerName: 'ZywOo_Replica', elo: 1420, wins: 15, losses: 5, kills: 350, deaths: 220 },
      { playerId: 'p2', playerName: 'Xantares_Fan_99', elo: 1310, wins: 12, losses: 8, kills: 410, deaths: 350 }
    ]
  },
  {
    id: 's4',
    name: 'Season 04',
    startDate: '2026-05-01',
    isActive: true,
    standings: []
  }
];

const INITIAL_LOGS: DiscordLog[] = [
  {
    id: 'l1',
    timestamp: new Date().toISOString(),
    payload: { content: 'Simulated startup' },
    status: 'simulated',
    message: 'Closed competitive league roster files loaded successfully. System fully synchronised.'
  }
];
