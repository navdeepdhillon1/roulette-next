'use client';
   
   import React, { useState } from 'react';
   
  
// Type definitions
interface Bets {
  [key: string]: number;
}

interface BetType {
  payout: number;
  label: string;
}

interface BetTypes {
  [key: string]: BetType;
}

interface ChipDesign {
  value: number;
  colors: string;
  border: string;
  inner: string;
  text: string;
  name: string;
}

interface WinningBet {
  type: string;
  bet: number;
  payout: number;
  total: number;
}

interface LosingBet {
  type: string;
  bet: number;
}

interface ChipStackProps {
  amount: number;
}

export default function Simulator() {
  const [balance, setBalance] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [chipValue, setChipValue] = useState(1);
  const [showCustomChip, setShowCustomChip] = useState(false);
  const [customChipAmount, setCustomChipAmount] = useState('');
  const [bets, setBets] = useState<Bets>({});
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [message, setMessage] = useState('Place your bets to get started!');
  const [winningBets, setWinningBets] = useState<WinningBet[]>([]);
  const [losingBets, setLosingBets] = useState<LosingBet[]>([]);
  const [totalWagered, setTotalWagered] = useState(0);
  const [totalReturned, setTotalReturned] = useState(0);
  const [lastBets, setLastBets] = useState<Bets>({});
  
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const wheelNumbers = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

  const chipDesigns: ChipDesign[] = [
    { value: 1, colors: 'from-gray-100 via-white to-gray-200', border: 'border-gray-400', inner: '#E5E7EB', text: '#1F2937', name: 'White' },
    { value: 10, colors: 'from-blue-400 via-blue-500 to-blue-600', border: 'border-blue-300', inner: '#3B82F6', text: 'white', name: 'Blue' },
    { value: 50, colors: 'from-green-500 via-green-600 to-green-700', border: 'border-green-400', inner: '#10B981', text: 'white', name: 'Green' },
    { value: 100, colors: 'from-gray-800 via-black to-gray-900', border: 'border-gray-600', inner: '#1F2937', text: 'white', name: 'Black' },
    { value: 250, colors: 'from-orange-400 via-orange-500 to-orange-600', border: 'border-orange-300', inner: '#F97316', text: 'white', name: 'Orange' },
    { value: 500, colors: 'from-purple-500 via-purple-600 to-purple-700', border: 'border-purple-400', inner: '#9333EA', text: 'white', name: 'Purple' },
  ];

  const betTypes: BetTypes = {
    '0': { payout: 35, label: '0' }, '1': { payout: 35, label: '1' }, '2': { payout: 35, label: '2' },
    '3': { payout: 35, label: '3' }, '4': { payout: 35, label: '4' }, '5': { payout: 35, label: '5' },
    '6': { payout: 35, label: '6' }, '7': { payout: 35, label: '7' }, '8': { payout: 35, label: '8' },
    '9': { payout: 35, label: '9' }, '10': { payout: 35, label: '10' }, '11': { payout: 35, label: '11' },
    '12': { payout: 35, label: '12' }, '13': { payout: 35, label: '13' }, '14': { payout: 35, label: '14' },
    '15': { payout: 35, label: '15' }, '16': { payout: 35, label: '16' }, '17': { payout: 35, label: '17' },
    '18': { payout: 35, label: '18' }, '19': { payout: 35, label: '19' }, '20': { payout: 35, label: '20' },
    '21': { payout: 35, label: '21' }, '22': { payout: 35, label: '22' }, '23': { payout: 35, label: '23' },
    '24': { payout: 35, label: '24' }, '25': { payout: 35, label: '25' }, '26': { payout: 35, label: '26' },
    '27': { payout: 35, label: '27' }, '28': { payout: 35, label: '28' }, '29': { payout: 35, label: '29' },
    '30': { payout: 35, label: '30' }, '31': { payout: 35, label: '31' }, '32': { payout: 35, label: '32' },
    '33': { payout: 35, label: '33' }, '34': { payout: 35, label: '34' }, '35': { payout: 35, label: '35' },
    '36': { payout: 35, label: '36' },
    'red': { payout: 1, label: 'Red' }, 'black': { payout: 1, label: 'Black' },
    'even': { payout: 1, label: 'Even' }, 'odd': { payout: 1, label: 'Odd' },
    'low': { payout: 1, label: '1-18' }, 'high': { payout: 1, label: '19-36' },
    'dozen1': { payout: 2, label: '1st 12' }, 'dozen2': { payout: 2, label: '2nd 12' }, 'dozen3': { payout: 2, label: '3rd 12' },
    'column1': { payout: 2, label: 'Col 1' }, 'column2': { payout: 2, label: 'Col 2' }, 'column3': { payout: 2, label: 'Col 3' },
  };

  const placeBet = (betType: string) => {
    if (balance >= chipValue) {
      setBets(prev => ({ ...prev, [betType]: (prev[betType] || 0) + chipValue }));
      setBalance(prev => prev - chipValue);
      setCurrentBet(prev => prev + chipValue);
    } else {
      setMessage('Insufficient balance! Reduce bet size or reset.');
    }
  };

  const clearBets = () => {
    setBalance(prev => prev + currentBet);
    setBets({});
    setCurrentBet(0);
    setMessage('Bets cleared. Place new bets!');
  };

  const rebetLast = () => {
    if (Object.keys(lastBets).length === 0) {
      setMessage('No previous bets to repeat!');
      return;
    }
    let totalRebet = 0;
    Object.values(lastBets).forEach(amount => { if (amount) totalRebet += amount; });
    if (balance >= totalRebet) {
      setBets({...lastBets});
      setBalance(prev => prev - totalRebet);
      setCurrentBet(totalRebet);
      setMessage('Previous bets placed again!');
    } else {
      setMessage('Insufficient balance to repeat last bets!');
    }
  };

  const doubleBets = () => {
    let totalDouble = 0;
    Object.values(bets).forEach(amount => { if (amount) totalDouble += amount; });
    if (balance >= totalDouble) {
      const doubledBets: Bets = {};
      Object.entries(bets).forEach(([betType, amount]) => {
        if (amount) doubledBets[betType] = amount * 2;
      });
      setBets(doubledBets);
      setBalance(prev => prev - totalDouble);
      setCurrentBet(prev => prev + totalDouble);
      setMessage('Bets doubled!');
    } else {
      setMessage('Insufficient balance to double bets!');
    }
  };

  const checkWin = (number: number, betType: string): boolean => {
    if (betType === number.toString()) return true;
    if (betType === 'red' && redNumbers.includes(number)) return true;
    if (betType === 'black' && !redNumbers.includes(number) && number !== 0) return true;
    if (betType === 'even' && number !== 0 && number % 2 === 0) return true;
    if (betType === 'odd' && number % 2 === 1) return true;
    if (betType === 'low' && number >= 1 && number <= 18) return true;
    if (betType === 'high' && number >= 19 && number <= 36) return true;
    if (betType === 'dozen1' && number >= 1 && number <= 12) return true;
    if (betType === 'dozen2' && number >= 13 && number <= 24) return true;
    if (betType === 'dozen3' && number >= 25 && number <= 36) return true;
    if (betType === 'column1' && number !== 0 && number % 3 === 1) return true;
    if (betType === 'column2' && number !== 0 && number % 3 === 2) return true;
    if (betType === 'column3' && number !== 0 && number % 3 === 0) return true;
    return false;
  };

  const spin = () => {
    if (currentBet === 0) {
      setMessage('Place some bets first!');
      return;
    }
    setIsSpinning(true);
    setMessage('Spinning...');
    setWinningBets([]);
    setLosingBets([]);
    
    setTimeout(() => {
      const number = Math.floor(Math.random() * 37);
      setLastNumber(number);
      setHistory(prev => [number, ...prev.slice(0, 19)]);
      
      let totalWin = 0;
      const wins: WinningBet[] = [];
      const losses: LosingBet[] = [];
      
      Object.entries(bets).forEach(([betType, amount]) => {
        if (amount && typeof amount === 'number') {
          const won = checkWin(number, betType);
          if (won) {
            const payout = betTypes[betType].payout;
            const winAmount = amount * (payout + 1);
            totalWin += winAmount;
            wins.push({ 
              type: betTypes[betType].label, 
              bet: amount, 
              payout: winAmount - amount,
              total: winAmount 
            });
          } else {
            losses.push({ 
              type: betTypes[betType].label, 
              bet: amount 
            });
          }
        }
      });

      setWinningBets(wins);
      setLosingBets(losses);
      setTotalWagered(prev => prev + currentBet);
      setTotalReturned(prev => prev + totalWin);
      setBalance(prev => prev + totalWin);
      
      const profit = totalWin - currentBet;
      if (totalWin > 0) {
        setMessage(`Number ${number}! Won ${totalWin} (Profit: ${profit >= 0 ? '+' : ''}${profit})`);
      } else {
        setMessage(`Number ${number}! Lost all bets (${currentBet})`);
      }
      
      setLastBets(bets);
      setBets({});
      setCurrentBet(0);
      setIsSpinning(false);
    }, 3000);
  };

  const reset = () => {
    setBalance(1000);
    setBets({});
    setCurrentBet(0);
    setHistory([]);
    setLastNumber(null);
    setMessage('Reset! Start fresh with $1000.');
    setTotalWagered(0);
    setTotalReturned(0);
  };

  const houseEdge = totalWagered > 0 ? (((totalWagered - totalReturned) / totalWagered) * 100).toFixed(2) : '0';

  // Render chips component
  const ChipStack: React.FC<ChipStackProps> = ({ amount }) => {
    if (!amount) return null;
    
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
        <div className="bg-black/90 text-yellow-400 px-3 py-1.5 rounded-full text-sm font-bold shadow-xl border-2 border-yellow-400/70">
          ${amount}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="text-center mb-4 bg-gradient-to-b from-black/60 to-transparent py-6 rounded-xl">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-600 via-yellow-700 to-yellow-600 bg-clip-text text-transparent">
            PRACTICE ROULETTE SIMULATOR
          </h1>
          <p className="text-yellow-600/80 tracking-wide">Learn the game risk-free • No real money involved</p>
        </div>

        <div className="bg-gray-800 backdrop-blur rounded-xl border border-yellow-400/30 p-4 mb-4 grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-300">Balance</p>
            <p className="text-2xl font-bold text-green-400">${balance}</p>
          </div>
          <div>
            <p className="text-xs text-gray-300">Current Bet</p>
            <p className="text-2xl font-bold text-yellow-400">${currentBet}</p>
          </div>
          <div>
            <p className="text-xs text-gray-300">Total Wagered</p>
            <p className="text-lg font-bold text-gray-200">${totalWagered}</p>
          </div>
          <div>
            <p className="text-xs text-gray-300">House Edge</p>
            <p className={`text-lg font-bold ${Number(houseEdge) < 0 ? 'text-green-400' : 'text-red-400'}`}>
              {Number(houseEdge) < 0 ? '+' : ''}{Math.abs(Number(houseEdge))}%
            </p>
            <p className="text-xs text-gray-400">{Number(houseEdge) < 0 ? "You're ahead!" : "Casino advantage"}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl border-2 border-yellow-500/40 mb-4 relative overflow-hidden" style={{minHeight: '420px'}}>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative h-full flex">
            {/* Left side - Wheel */}
            <div className="flex-1 relative">
              {/* Hot and Cold Numbers - Left Side */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
                {/* Info Header */}
                {history.length < 6 && (
                  <div className="bg-yellow-900/70 backdrop-blur rounded-lg p-2 mb-3 border-2 border-yellow-600/40 shadow-lg">
                    <p className="text-xs text-yellow-200 text-center font-semibold">
                      📊 Stats appear after {6 - history.length} more spin{6 - history.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  {/* Hot Numbers */}
                  <div className="bg-black/70 backdrop-blur rounded-lg p-3 border-2 border-red-500/40 shadow-lg">
                    <div className="text-xs font-bold text-red-400 mb-2 text-center">🔥 Hot</div>
                    <div className="space-y-1">
                      {history.length >= 6 ? (
                        Array.from(new Set(history.slice(0, 20))).slice(0, 6).map((num, idx) => (
                          <div key={idx} className={`w-9 h-9 rounded flex items-center justify-center text-sm font-bold shadow-md border-2 ${
                            num === 0 ? 'bg-green-600 border-green-400' : redNumbers.includes(num) ? 'bg-red-600 border-red-400' : 'bg-gray-800 border-gray-600'
                          }`}>
                            {num}
                          </div>
                        ))
                      ) : (
                        Array(6).fill(0).map((_, idx) => (
                          <div key={idx} className="w-9 h-9 rounded flex items-center justify-center text-xs font-bold bg-gray-700/50 text-gray-500 border-2 border-gray-600/50">-</div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Cold Numbers */}
                  <div className="bg-black/70 backdrop-blur rounded-lg p-3 border-2 border-blue-500/40 shadow-lg">
                    <div className="text-xs font-bold text-blue-400 mb-2 text-center">❄️ Cold</div>
                    <div className="space-y-1">
                      {history.length >= 6 ? (
                        [...Array(37).keys()].filter(n => !history.includes(n)).slice(0, 6).map((num, idx) => (
                          <div key={idx} className={`w-9 h-9 rounded flex items-center justify-center text-sm font-bold shadow-md border-2 ${
                            num === 0 ? 'bg-green-600/50 border-green-400/50' : redNumbers.includes(num) ? 'bg-red-600/50 border-red-400/50' : 'bg-gray-800/50 border-gray-600/50'
                          }`}>
                            {num}
                          </div>
                        ))
                      ) : (
                        Array(6).fill(0).map((_, idx) => (
                          <div key={idx} className="w-9 h-9 rounded flex items-center justify-center text-xs font-bold bg-gray-700/50 text-gray-500 border-2 border-gray-600/50">-</div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative h-full flex items-center justify-center py-6 z-20 ml-24">
                {isSpinning ? (
                  <div className="relative w-full max-w-4xl px-8 flex items-center justify-center">
                    <svg viewBox="0 0 600 300" className="w-full h-full" style={{filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))'}}>
                      <defs>
                        <radialGradient id="woodGrain" cx="50%" cy="30%">
                          <stop offset="0%" stopColor="#8B5A2B" />
                          <stop offset="30%" stopColor="#A0522D" />
                          <stop offset="60%" stopColor="#6B4423" />
                          <stop offset="100%" stopColor="#3E2723" />
                        </radialGradient>
                        <radialGradient id="metalRim" cx="30%" cy="30%">
                          <stop offset="0%" stopColor="#FFF4E0" />
                          <stop offset="20%" stopColor="#FFD700" />
                          <stop offset="40%" stopColor="#FFA500" />
                          <stop offset="60%" stopColor="#DAA520" />
                          <stop offset="80%" stopColor="#B8860B" />
                          <stop offset="100%" stopColor="#8B6914" />
                        </radialGradient>
                        <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="white" stopOpacity="0.6"/>
                          <stop offset="30%" stopColor="white" stopOpacity="0.2"/>
                          <stop offset="70%" stopColor="white" stopOpacity="0"/>
                          <stop offset="100%" stopColor="black" stopOpacity="0.3"/>
                        </linearGradient>
                        <radialGradient id="gloss" cx="30%" cy="30%">
                          <stop offset="0%" stopColor="white" stopOpacity="0.8"/>
                          <stop offset="40%" stopColor="white" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="white" stopOpacity="0"/>
                        </radialGradient>
                        <radialGradient id="redPocket" cx="40%" cy="30%">
                          <stop offset="0%" stopColor="#FF6B6B" />
                          <stop offset="40%" stopColor="#EF4444" />
                          <stop offset="100%" stopColor="#B91C1C" />
                        </radialGradient>
                        <radialGradient id="blackPocket" cx="40%" cy="30%">
                          <stop offset="0%" stopColor="#4B5563" />
                          <stop offset="40%" stopColor="#374151" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </radialGradient>
                        <radialGradient id="greenPocket" cx="40%" cy="30%">
                          <stop offset="0%" stopColor="#34D399" />
                          <stop offset="40%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#047857" />
                        </radialGradient>
                        <radialGradient id="centerHub" cx="40%" cy="25%">
                          <stop offset="0%" stopColor="#6B7280" />
                          <stop offset="30%" stopColor="#4B5563" />
                          <stop offset="60%" stopColor="#1F2937" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </radialGradient>
                        <filter id="wheelGlow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      <ellipse cx="300" cy="150" rx="260" ry="130" fill="black" opacity="0.3" filter="blur(10px)"/>
                      <ellipse cx="300" cy="150" rx="250" ry="125" fill="url(#woodGrain)" filter="url(#wheelGlow)"/>
                      <ellipse cx="300" cy="150" rx="245" ry="122.5" fill="url(#metalRim)"/>
                      <ellipse cx="300" cy="150" rx="243" ry="121.5" fill="url(#gloss)" opacity="0.6"/>
                      <ellipse cx="300" cy="150" rx="240" ry="120" fill="url(#woodGrain)"/>
                      
                      <g transform="translate(300, 150)">
                        {wheelNumbers.map((num, i) => {
                          const angle = (i * 360 / 37);
                          const nextAngle = ((i + 1) * 360 / 37);
                          const midAngle = (angle + nextAngle) / 2;
                          const isRed = redNumbers.includes(num);
                          const isGreen = num === 0;
                          
                          const outerRadius = 230;
                          const outerRadiusY = 115;
                          const innerRadius = 110;
                          const innerRadiusY = 55;
                          
                          const x1 = outerRadius * Math.cos((angle - 90) * Math.PI / 180);
                          const y1 = outerRadiusY * Math.sin((angle - 90) * Math.PI / 180);
                          const x2 = outerRadius * Math.cos((nextAngle - 90) * Math.PI / 180);
                          const y2 = outerRadiusY * Math.sin((nextAngle - 90) * Math.PI / 180);
                          const x3 = innerRadius * Math.cos((nextAngle - 90) * Math.PI / 180);
                          const y3 = innerRadiusY * Math.sin((nextAngle - 90) * Math.PI / 180);
                          const x4 = innerRadius * Math.cos((angle - 90) * Math.PI / 180);
                          const y4 = innerRadiusY * Math.sin((angle - 90) * Math.PI / 180);
                          
                          const numRadius = 175;
                          const numRadiusY = 87.5;
                          const numX = numRadius * Math.cos((midAngle - 90) * Math.PI / 180);
                          const numY = numRadiusY * Math.sin((midAngle - 90) * Math.PI / 180);
                          
                          return (
                            <g key={i}>
                              <path
                                d={`M ${x1},${y1} A ${outerRadius},${outerRadiusY} 0 0,1 ${x2},${y2} L ${x3},${y3} A ${innerRadius},${innerRadiusY} 0 0,0 ${x4},${y4} Z`}
                                fill={isGreen ? "url(#greenPocket)" : isRed ? "url(#redPocket)" : "url(#blackPocket)"}
                                stroke="#B8860B"
                                strokeWidth="1"
                              />
                              <path
                                d={`M ${x1},${y1} A ${outerRadius},${outerRadiusY} 0 0,1 ${x2},${y2} L ${x3},${y3} A ${innerRadius},${innerRadiusY} 0 0,0 ${x4},${y4} Z`}
                                fill="url(#shine)"
                                opacity="0.5"
                              />
                              <text x={numX} y={numY + 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" style={{textShadow: '0 1px 3px rgba(0,0,0,0.8)'}}>
                                {num}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                      
                      <ellipse cx="300" cy="150" rx="110" ry="55" fill="none" stroke="url(#metalRim)" strokeWidth="4"/>
                      <ellipse cx="300" cy="150" rx="108" ry="54" fill="url(#gloss)" opacity="0.4"/>
                      <ellipse cx="300" cy="150" rx="95" ry="47.5" fill="url(#centerHub)"/>
                      <ellipse cx="300" cy="145" rx="85" ry="42.5" fill="url(#centerHub)"/>
                      <ellipse cx="300" cy="140" rx="70" ry="35" fill="url(#gloss)" opacity="0.5"/>
                      
                      <g>
                        <circle r="7" fill="white" opacity="0.95">
                          <animateMotion dur="1.2s" repeatCount="indefinite" path="M 110,150 A 190,95 0 0,1 490,150 A 190,95 0 0,1 110,150" />
                        </circle>
                      </g>
                    </svg>
                  </div>
                ) : lastNumber !== null ? (
                  <div className="relative w-full max-w-4xl px-8">
                    <svg viewBox="0 0 600 300" className="w-full h-full" style={{filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))'}}>
                      <defs>
                        <radialGradient id="woodGrain2" cx="50%" cy="30%">
                          <stop offset="0%" stopColor="#8B5A2B" />
                          <stop offset="30%" stopColor="#A0522D" />
                          <stop offset="60%" stopColor="#6B4423" />
                          <stop offset="100%" stopColor="#3E2723" />
                        </radialGradient>
                        <radialGradient id="metalRim2" cx="30%" cy="30%">
                          <stop offset="0%" stopColor="#FFF4E0" />
                          <stop offset="20%" stopColor="#FFD700" />
                          <stop offset="40%" stopColor="#FFA500" />
                          <stop offset="60%" stopColor="#DAA520" />
                          <stop offset="80%" stopColor="#B8860B" />
                          <stop offset="100%" stopColor="#8B6914" />
                        </radialGradient>
                        <radialGradient id="centerHub2" cx="40%" cy="25%">
                          <stop offset="0%" stopColor="#6B7280" />
                          <stop offset="30%" stopColor="#4B5563" />
                          <stop offset="60%" stopColor="#1F2937" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </radialGradient>
                        <linearGradient id="shine2" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="white" stopOpacity="0.6"/>
                          <stop offset="30%" stopColor="white" stopOpacity="0.2"/>
                          <stop offset="70%" stopColor="white" stopOpacity="0"/>
                          <stop offset="100%" stopColor="black" stopOpacity="0.3"/>
                        </linearGradient>
                        <radialGradient id="gloss2" cx="30%" cy="30%">
                          <stop offset="0%" stopColor="white" stopOpacity="0.8"/>
                          <stop offset="40%" stopColor="white" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="white" stopOpacity="0"/>
                        </radialGradient>
                        <radialGradient id="redPocket2" cx="40%" cy="30%">
                          <stop offset="0%" stopColor="#FF6B6B" />
                          <stop offset="40%" stopColor="#EF4444" />
                          <stop offset="100%" stopColor="#B91C1C" />
                        </radialGradient>
                        <radialGradient id="blackPocket2" cx="40%" cy="30%">
                          <stop offset="0%" stopColor="#4B5563" />
                          <stop offset="40%" stopColor="#374151" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </radialGradient>
                        <radialGradient id="greenPocket2" cx="40%" cy="30%">
                          <stop offset="0%" stopColor="#34D399" />
                          <stop offset="40%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#047857" />
                        </radialGradient>
                        <filter id="wheelGlow2">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      <ellipse cx="300" cy="150" rx="260" ry="130" fill="black" opacity="0.3" filter="blur(10px)"/>
                      <ellipse cx="300" cy="150" rx="250" ry="125" fill="url(#woodGrain2)" filter="url(#wheelGlow2)"/>
                      <ellipse cx="300" cy="150" rx="245" ry="122.5" fill="url(#metalRim2)"/>
                      <ellipse cx="300" cy="150" rx="243" ry="121.5" fill="url(#gloss2)" opacity="0.6"/>
                      <ellipse cx="300" cy="150" rx="240" ry="120" fill="url(#woodGrain2)"/>
                      
                      <g transform="translate(300, 150)">
                        {wheelNumbers.map((num, i) => {
                          const angle = (i * 360 / 37);
                          const nextAngle = ((i + 1) * 360 / 37);
                          const midAngle = (angle + nextAngle) / 2;
                          const isRed = redNumbers.includes(num);
                          const isGreen = num === 0;
                          const isWinning = num === lastNumber;
                          
                          const outerRadius = 230;
                          const outerRadiusY = 115;
                          const innerRadius = 110;
                          const innerRadiusY = 55;
                          
                          const x1 = outerRadius * Math.cos((angle - 90) * Math.PI / 180);
                          const y1 = outerRadiusY * Math.sin((angle - 90) * Math.PI / 180);
                          const x2 = outerRadius * Math.cos((nextAngle - 90) * Math.PI / 180);
                          const y2 = outerRadiusY * Math.sin((nextAngle - 90) * Math.PI / 180);
                          const x3 = innerRadius * Math.cos((nextAngle - 90) * Math.PI / 180);
                          const y3 = innerRadiusY * Math.sin((nextAngle - 90) * Math.PI / 180);
                          const x4 = innerRadius * Math.cos((angle - 90) * Math.PI / 180);
                          const y4 = innerRadiusY * Math.sin((angle - 90) * Math.PI / 180);
                          
                          const numRadius = 175;
                          const numRadiusY = 87.5;
                          const numX = numRadius * Math.cos((midAngle - 90) * Math.PI / 180);
                          const numY = numRadiusY * Math.sin((midAngle - 90) * Math.PI / 180);
                          
                          return (
                            <g key={i}>
                              <path
                                d={`M ${x1},${y1} A ${outerRadius},${outerRadiusY} 0 0,1 ${x2},${y2} L ${x3},${y3} A ${innerRadius},${innerRadiusY} 0 0,0 ${x4},${y4} Z`}
                                fill={isGreen ? "url(#greenPocket2)" : isRed ? "url(#redPocket2)" : "url(#blackPocket2)"}
                                stroke="#B8860B"
                                strokeWidth="1"
                                opacity={isWinning ? "1" : "0.9"}
                              />
                              <path
                                d={`M ${x1},${y1} A ${outerRadius},${outerRadiusY} 0 0,1 ${x2},${y2} L ${x3},${y3} A ${innerRadius},${innerRadiusY} 0 0,0 ${x4},${y4} Z`}
                                fill="url(#shine2)"
                                opacity="0.5"
                              />
                              {isWinning && (
                                <>
                                  <path
                                    d={`M ${x1},${y1} A ${outerRadius},${outerRadiusY} 0 0,1 ${x2},${y2} L ${x3},${y3} A ${innerRadius},${innerRadiusY} 0 0,0 ${x4},${y4} Z`}
                                    fill="#FBBF24"
                                    opacity="0.5"
                                    className="animate-pulse"
                                  />
                                  <circle cx={numX} cy={numY} r="9" fill="white" opacity="0.95" className="animate-pulse" />
                                </>
                              )}
                              <text x={numX} y={numY + 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" style={{textShadow: '0 1px 3px rgba(0,0,0,0.8)'}}>
                                {num}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                      
                      <ellipse cx="300" cy="150" rx="110" ry="55" fill="none" stroke="url(#metalRim2)" strokeWidth="4"/>
                      <ellipse cx="300" cy="150" rx="108" ry="54" fill="url(#gloss2)" opacity="0.4"/>
                      <ellipse cx="300" cy="150" rx="95" ry="47.5" fill="url(#centerHub2)"/>
                      <ellipse cx="300" cy="145" rx="85" ry="42.5" fill="url(#centerHub2)"/>
                      <ellipse cx="300" cy="140" rx="70" ry="35" fill="url(#gloss2)" opacity="0.5"/>
                      
                      <text x="300" y="165" textAnchor="middle" fontSize="56" fontWeight="bold" 
                        fill={lastNumber === 0 ? "#10B981" : redNumbers.includes(lastNumber) ? "#EF4444" : "#F3F4F6"}
                        style={{textShadow: `0 0 20px ${lastNumber === 0 ? 'rgba(16,185,129,0.5)' : redNumbers.includes(lastNumber) ? 'rgba(239,68,68,0.5)' : 'rgba(243,244,246,0.5)'}`}}>
                        {lastNumber}
                      </text>
                    </svg>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-3xl mb-4 font-bold text-gray-400">🎰 Ready to Spin</div>
                    <p className="text-gray-500 text-lg">Select your chips and place your bets below</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Vertical Status Bar */}
            <div className="w-64 border-l border-yellow-500/30 flex flex-col p-6 min-h-full">
              <div className={`w-full rounded-xl border-2 p-6 transition-all mb-4 ${
                message.includes('Won') ? 'bg-green-900/70 border-green-400 shadow-lg shadow-green-500/20' :
                message.includes('Lost') ? 'bg-red-900/70 border-red-400 shadow-lg shadow-red-500/20' :
                message.includes('Spinning') ? 'bg-blue-900/70 border-blue-400 shadow-lg shadow-blue-500/20' :
                'bg-gray-800 border-gray-600'
              }`}>
                <div className="text-center">
                  <div className={`text-3xl mb-3 ${
                    message.includes('Won') ? 'text-green-300' :
                    message.includes('Lost') ? 'text-red-300' :
                    message.includes('Spinning') ? 'text-blue-300' :
                    'text-gray-300'
                  }`}>
                    {message.includes('Won') ? '🎉' :
                     message.includes('Lost') ? '💸' :
                     message.includes('Spinning') ? '🎰' :
                     '🎲'}
                  </div>
                  <p className={`font-bold text-base leading-snug ${
                    message.includes('Won') ? 'text-green-300' :
                    message.includes('Lost') ? 'text-red-300' :
                    message.includes('Spinning') ? 'text-blue-300' :
                    'text-gray-300'
                  }`}>
                    {message}
                  </p>
                </div>
              </div>

              {/* Winning Bets */}
              {winningBets.length > 0 && (
                <div className="w-full rounded-xl border-2 border-green-400 bg-green-900/70 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">✅</span>
                    <h3 className="font-bold text-green-300 text-sm">Winning Bets</h3>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {winningBets.map((win, idx) => (
                      <div key={idx} className="bg-black/30 rounded p-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-green-200 font-semibold">{win.type}</span>
                          <span className="text-green-400 font-bold">+${win.payout}</span>
                        </div>
                        <div className="text-green-300/70 text-[10px]">Bet: ${win.bet} → Won: ${win.total}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Losing Bets */}
              {losingBets.length > 0 && (
                <div className="w-full rounded-xl border-2 border-red-400 bg-red-900/70 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">❌</span>
                    <h3 className="font-bold text-red-300 text-sm">Lost Bets</h3>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {losingBets.map((loss, idx) => (
                      <div key={idx} className="bg-black/30 rounded p-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-red-200 font-semibold">{loss.type}</span>
                          <span className="text-red-400 font-bold">-${loss.bet}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spacer to push button to bottom */}
              <div className="flex-1"></div>

              {/* SPIN Button at Bottom */}
              <button
                onClick={spin}
                className="w-full py-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl font-bold text-3xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all border-2 border-green-400"
                style={{
                  animation: !isSpinning && currentBet > 0 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                }}
                disabled={isSpinning || currentBet === 0}
              >
                {isSpinning ? '⏳ SPINNING...' : '🎰 SPIN'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-black/60 backdrop-blur rounded-xl border border-yellow-400/30 p-5 mb-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-3 items-center flex-wrap flex-1">
              <p className="text-sm text-gray-300 mr-2 font-semibold">
                Select Chip: {!chipDesigns.find(c => c.value === chipValue) && chipValue > 0 && (
                  <span className="text-purple-400">${chipValue} Custom</span>
                )}
              </p>
              {chipDesigns.map(({ value, colors, border, inner, text }) => (
                <button
                  key={value}
                  onClick={() => { setChipValue(value); setShowCustomChip(false); }}
                  className={`relative w-14 h-14 rounded-full font-bold transition-all transform ${
                    chipValue === value && !showCustomChip ? 'scale-125 ring-4 ring-yellow-400 shadow-2xl' : 'hover:scale-110'
                  } bg-gradient-to-br ${colors} ${border} border-4 flex items-center justify-center shadow-xl`}
                  style={{
                    boxShadow: chipValue === value && !showCustomChip
                      ? '0 0 30px rgba(250, 204, 21, 0.8), inset 0 -4px 10px rgba(0,0,0,0.5), inset 0 4px 10px rgba(255,255,255,0.4)' 
                      : 'inset 0 -4px 10px rgba(0,0,0,0.5), inset 0 4px 10px rgba(255,255,255,0.4), 0 4px 10px rgba(0,0,0,0.3)'
                  }}
                >
                  <div className="absolute inset-1 rounded-full border-2 border-white/30"></div>
                  <div className="absolute inset-2 rounded-full border border-white/20"></div>
                  
                  <div 
                    className="relative z-10 rounded-full w-10 h-10 flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: inner }}
                  >
                    <div className="text-center">
                      <div style={{ color: text }} className="text-xs font-bold leading-none">$</div>
                      <div style={{ color: text }} className="text-base font-bold leading-tight">{value}</div>
                    </div>
                  </div>
                  
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <div
                      key={angle}
                      className="absolute w-1.5 h-3 bg-white/80 rounded-full"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-24px)`
                      }}
                    ></div>
                  ))}
                </button>
              ))}
              
              <div className="relative">
                <button
                  onClick={() => setShowCustomChip(!showCustomChip)}
                  className={`relative w-16 h-16 rounded-full font-bold transition-all transform ${
                    showCustomChip ? 'scale-125 ring-4 ring-yellow-400 shadow-2xl' : 'hover:scale-110'
                  } bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 border-4 border-pink-300 flex items-center justify-center shadow-xl`}
                  style={{
                    boxShadow: showCustomChip
                      ? '0 0 30px rgba(250, 204, 21, 0.8), inset 0 -4px 10px rgba(0,0,0,0.5), inset 0 4px 10px rgba(255,255,255,0.4)' 
                      : 'inset 0 -4px 10px rgba(0,0,0,0.5), inset 0 4px 10px rgba(255,255,255,0.4), 0 4px 10px rgba(0,0,0,0.3)'
                  }}
                >
                  <div className="absolute inset-1 rounded-full border-2 border-white/30"></div>
                  <div className="absolute inset-2 rounded-full border border-white/20"></div>
                  
                  <div 
                    className="relative z-10 rounded-full w-10 h-10 flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: '#7C3AED' }}
                  >
                    <div className="text-white text-2xl font-bold">✏️</div>
                  </div>
                  
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <div
                      key={angle}
                      className="absolute w-1.5 h-3 bg-white/80 rounded-full"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-24px)`
                      }}
                    ></div>
                  ))}
                </button>
                
                {showCustomChip && (
                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-4 shadow-2xl border-2 border-yellow-400 z-[9999] w-64">
                    <p className="text-xs text-gray-300 mb-2 font-semibold">Custom Chip Amount:</p>
                    <div className="flex flex-col gap-2">
                      <input
                        type="number"
                        value={customChipAmount}
                        onChange={(e) => setCustomChipAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-400 focus:outline-none text-sm"
                        min="1"
                        max={balance}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const amount = parseInt(customChipAmount);
                            if (amount > 0 && amount <= balance) {
                              setChipValue(amount);
                              setShowCustomChip(false);
                              setCustomChipAmount('');
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded font-bold text-sm hover:bg-yellow-500 transition-colors"
                        >
                          Set ${customChipAmount || '?'}
                        </button>
                        <button
                          onClick={() => setShowCustomChip(false)}
                          className="px-4 py-2 bg-gray-600 text-white rounded font-bold text-sm hover:bg-gray-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={clearBets} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold disabled:opacity-50" disabled={currentBet === 0}>
                Clear Bets
              </button>
              <button onClick={rebetLast} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold disabled:opacity-50" disabled={Object.keys(lastBets).length === 0}>
                Re-bet
              </button>
              <button onClick={doubleBets} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold disabled:opacity-50" disabled={currentBet === 0 || balance < currentBet}>
                Double Bet
              </button>
              <button onClick={reset} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-bold">
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/80 to-green-950/80 rounded-xl border-4 border-yellow-600/50 p-8 mb-4">
          <div className="flex gap-2">
            <div className="w-16">
              <button onClick={() => placeBet('0')} className="w-full bg-green-700/80 hover:bg-green-600 rounded-lg font-bold text-2xl relative border-2 border-white/20 flex items-center justify-center" style={{height: '200px'}}>
                <div className="text-white">0</div>
                {bets['0'] && <ChipStack amount={bets['0']} />}
              </button>
            </div>

            <div className="flex-1 space-y-2">
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[3,6,9,12,15,18,21,24,27,30,33,36].map(num => (
                    <button key={num} onClick={() => placeBet(num.toString())} className={`flex-1 h-16 rounded font-bold text-white relative border-2 border-white/20 ${redNumbers.includes(num) ? 'bg-red-700/80 hover:bg-red-600' : 'bg-gray-900/80 hover:bg-gray-800'}`}>
                      {num}
                      {bets[num.toString()] && <ChipStack amount={bets[num.toString()]} />}
                    </button>
                  ))}
                  <button onClick={() => placeBet('column3')} className="w-16 h-16 bg-green-800/80 hover:bg-green-700 rounded font-bold text-xs border-2 border-white/20 relative">
                    2:1
                    {bets['column3'] && <ChipStack amount={bets['column3']} />}
                  </button>
                </div>
                <div className="flex gap-1">
                  {[2,5,8,11,14,17,20,23,26,29,32,35].map(num => (
                    <button key={num} onClick={() => placeBet(num.toString())} className={`flex-1 h-16 rounded font-bold text-white relative border-2 border-white/20 ${redNumbers.includes(num) ? 'bg-red-700/80 hover:bg-red-600' : 'bg-gray-900/80 hover:bg-gray-800'}`}>
                      {num}
                      {bets[num.toString()] && <ChipStack amount={bets[num.toString()]} />}
                    </button>
                  ))}
                  <button onClick={() => placeBet('column2')} className="w-16 h-16 bg-green-800/80 hover:bg-green-700 rounded font-bold text-xs border-2 border-white/20 relative">
                    2:1
                    {bets['column2'] && <ChipStack amount={bets['column2']} />}
                  </button>
                </div>
                <div className="flex gap-1">
                  {[1,4,7,10,13,16,19,22,25,28,31,34].map(num => (
                    <button key={num} onClick={() => placeBet(num.toString())} className={`flex-1 h-16 rounded font-bold text-white relative border-2 border-white/20 ${redNumbers.includes(num) ? 'bg-red-700/80 hover:bg-red-600' : 'bg-gray-900/80 hover:bg-gray-800'}`}>
                      {num}
                      {bets[num.toString()] && <ChipStack amount={bets[num.toString()]} />}
                    </button>
                  ))}
                  <button onClick={() => placeBet('column1')} className="w-16 h-16 bg-green-800/80 hover:bg-green-700 rounded font-bold text-xs border-2 border-white/20 relative">
                    2:1
                    {bets['column1'] && <ChipStack amount={bets['column1']} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-1">
                {['dozen1', 'dozen2', 'dozen3'].map((bet, i) => (
                  <button key={bet} onClick={() => placeBet(bet)} className="flex-1 py-3 bg-green-800/80 hover:bg-green-700 rounded font-bold text-sm border-2 border-white/20 relative">
                    {i === 0 ? '1ST 12' : i === 1 ? '2ND 12' : '3RD 12'}
                    {bets[bet] && <ChipStack amount={bets[bet]} />}
                  </button>
                ))}
              </div>

              <div className="flex gap-1">
                <button onClick={() => placeBet('low')} className="flex-1 py-4 bg-blue-800/80 hover:bg-blue-700 rounded font-bold text-sm border-2 border-white/20 relative">
                  1 to 18
                  {bets['low'] && <ChipStack amount={bets['low']} />}
                </button>
                <button onClick={() => placeBet('even')} className="flex-1 py-4 bg-purple-800/80 hover:bg-purple-700 rounded font-bold text-sm border-2 border-white/20 relative">
                  EVEN
                  {bets['even'] && <ChipStack amount={bets['even']} />}
                </button>
                <button onClick={() => placeBet('red')} className="flex-1 py-4 bg-red-700/80 hover:bg-red-600 rounded font-bold text-sm border-2 border-white/20 relative">
                  RED
                  {bets['red'] && <ChipStack amount={bets['red']} />}
                </button>
                <button onClick={() => placeBet('black')} className="flex-1 py-4 bg-gray-900/80 hover:bg-gray-800 rounded font-bold text-sm border-2 border-white/20 relative">
                  BLACK
                  {bets['black'] && <ChipStack amount={bets['black']} />}
                </button>
                <button onClick={() => placeBet('odd')} className="flex-1 py-4 bg-orange-800/80 hover:bg-orange-700 rounded font-bold text-sm border-2 border-white/20 relative">
                  ODD
                  {bets['odd'] && <ChipStack amount={bets['odd']} />}
                </button>
                <button onClick={() => placeBet('high')} className="flex-1 py-4 bg-teal-800/80 hover:bg-teal-700 rounded font-bold text-sm border-2 border-white/20 relative">
                  19 to 36
                  {bets['high'] && <ChipStack amount={bets['high']} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/60 backdrop-blur rounded-xl border border-yellow-400/30 p-4 mb-4">
          <h3 className="text-lg font-bold text-yellow-400 mb-3">Last 20 Numbers</h3>
          <div className="flex gap-2 flex-wrap">
            {history.length === 0 ? (
              <p className="text-gray-400 text-sm">No spins yet - place a bet and spin to start!</p>
            ) : (
              history.map((num, idx) => (
                <div key={idx} className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${num === 0 ? 'bg-green-600' : redNumbers.includes(num) ? 'bg-red-600' : 'bg-black border-2 border-gray-600'} text-white`}>
                  {num}
                </div>
              ))
            )}
          </div>
        </div>

        {history.length > 0 && (
          <div className="bg-black/60 backdrop-blur rounded-xl border border-yellow-400/30 p-4 mb-4">
            <h3 className="text-lg font-bold text-yellow-400 mb-3">Spin History Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-yellow-400 font-semibold">#</th>
                    <th className="px-3 py-2 text-center text-yellow-400 font-semibold">Number</th>
                    <th className="px-3 py-2 text-center text-yellow-400 font-semibold">Color</th>
                    <th className="px-3 py-2 text-center text-yellow-400 font-semibold">Even/Odd</th>
                    <th className="px-3 py-2 text-center text-yellow-400 font-semibold">Low/High</th>
                    <th className="px-3 py-2 text-center text-yellow-400 font-semibold">Dozen</th>
                    <th className="px-3 py-2 text-center text-yellow-400 font-semibold">Column</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((num, idx) => {
                    const isRed = redNumbers.includes(num);
                    const isGreen = num === 0;
                    const isEven = num !== 0 && num % 2 === 0;
                    const isLow = num >= 1 && num <= 18;
                    const dozen = num === 0 ? '-' : num <= 12 ? '1st' : num <= 24 ? '2nd' : '3rd';
                    const column = num === 0 ? '-' : (num % 3 === 1 ? '1st' : num % 3 === 2 ? '2nd' : '3rd');
                    
                    return (
                      <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold ${
                            isGreen ? 'bg-green-600' : isRed ? 'bg-red-600' : 'bg-gray-900 border-2 border-gray-600'
                          } text-white`}>
                            {num}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            isGreen ? 'bg-green-600/20 text-green-400' :
                            isRed ? 'bg-red-600/20 text-red-400' : 'bg-gray-600/20 text-gray-300'
                          }`}>
                            {isGreen ? 'Green' : isRed ? 'Red' : 'Black'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {num === 0 ? (
                            <span className="text-gray-500">-</span>
                          ) : isEven ? (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-600/20 text-purple-400">Even</span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-600/20 text-orange-400">Odd</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {num === 0 ? (
                            <span className="text-gray-500">-</span>
                          ) : isLow ? (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-600/20 text-blue-400">Low</span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-teal-600/20 text-teal-400">High</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            dozen === '1st' ? 'bg-blue-600/20 text-blue-400' :
                            dozen === '2nd' ? 'bg-purple-600/20 text-purple-400' :
                            dozen === '3rd' ? 'bg-orange-600/20 text-orange-400' :
                            'text-gray-500'
                          }`}>
                            {dozen}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            column === '1st' ? 'bg-cyan-600/20 text-cyan-400' :
                            column === '2nd' ? 'bg-teal-600/20 text-teal-400' :
                            column === '3rd' ? 'bg-lime-600/20 text-lime-400' :
                            'text-gray-500'
                          }`}>
                            {column}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-yellow-900/20 border border-yellow-400/50 rounded-lg p-4">
          <p className="text-sm text-yellow-200">
            <strong>Learning Note:</strong> This simulator uses true random numbers. Over many spins, you'll see the house edge (2.7%) emerge naturally. 
            Notice how your total wagered vs total returned ratio approaches this percentage. This is mathematical reality, not a "pattern" to beat.
          </p>
        </div>
      </div>
    </div>
  );
}