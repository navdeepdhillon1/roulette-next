'use client'
import React, { useState, useRef, useEffect } from 'react'
import { ChevronRight, Minimize2, Maximize2, X, Move, TrendingUp, DollarSign } from 'lucide-react'
import { useCardManager } from '@/app/contexts/CardManagerContext';
import { CardManagerProvider } from '@/app/contexts/CardManagerContext'
import { FloatingAdvisorCard } from './FloatingAdvisorCard'
import { FloatingProbabilityCard } from './FloatingProbabilityCard'
import { Wrench, Target } from 'lucide-react'
// Betting System Helpers
const FIBONACCI_SEQUENCE = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];


function calculateNextBet(system: any, outcome: 'win' | 'loss' | null): number {
  const { id, baseBet, consecutiveWins, consecutiveLosses, sequenceIndex = 0, customRules, sequentialRules } = system;

  // Custom sequential system
  if (id === 'custom-sequential' && sequentialRules) {
    const sequence = sequentialRules.sequence || [1, 2, 4, 8];
    let currentPosition = sequentialRules.currentPosition || 0;

    if (outcome === 'win') {
      switch (sequentialRules.onWin) {
        case 'reset':
          currentPosition = 0;
          break;
        case 'moveBack1':
          currentPosition = Math.max(0, currentPosition - 1);
          break;
        case 'moveBack2':
          currentPosition = Math.max(0, currentPosition - 2);
          break;
        case 'stay':
          // Keep current position
          break;
      }

      // Check for reset after consecutive wins
      if (sequentialRules.resetAfterConsecutiveWins &&
          consecutiveWins >= sequentialRules.resetAfterConsecutiveWins) {
        currentPosition = 0;
      }
    } else if (outcome === 'loss') {
      switch (sequentialRules.onLoss) {
        case 'moveForward1':
          currentPosition = Math.min(sequence.length - 1, currentPosition + 1);
          break;
        case 'moveForward2':
          currentPosition = Math.min(sequence.length - 1, currentPosition + 2);
          break;
        case 'stay':
          // Keep current position
          break;
      }

      // Handle what happens at sequence end
      if (currentPosition >= sequence.length - 1 && sequentialRules.atSequenceEnd === 'reset') {
        currentPosition = 0;
      }
    }

    // Update the position in the system (important for next call)
    system.sequentialRules.currentPosition = currentPosition;

    return baseBet * sequence[currentPosition];
  }

  // Custom outcome-based system
  if (id === 'custom' && customRules) {
    let multiplier = system.currentBet / baseBet;

    if (outcome === 'win') {
      if (customRules.resetAfterWin || customRules.onWin === 'reset') return baseBet;
      if (customRules.onWin === 'double') multiplier *= 2;
      // 'same' = keep current multiplier
    } else if (outcome === 'loss') {
      // FIX: Use >= instead of === to handle 4+ consecutive losses
      // Determine which rule to apply based on consecutive losses
      let action = customRules.onThirdLoss;  // Default to 3rd loss rule for 3+ losses
      if (consecutiveLosses <= 0) action = customRules.onFirstLoss;
      else if (consecutiveLosses === 1) action = customRules.onSecondLoss;
      // else use onThirdLoss for 2+ losses

      if (action === 'reset') {
        return baseBet;
      } else if (action === 'double') {
        multiplier *= 2;
      } else if (action === 'pause') {
        // Return current bet but don't increase (pause effectively stops progression)
        return system.currentBet;
      }
      // 'same' = keep current multiplier
    }

    const nextBet = baseBet * multiplier;
    return Math.min(nextBet, baseBet * customRules.maxMultiplier);
  }
  
  if (id === 'flat') return baseBet;
  
  if (id === 'paroli') {
    if (outcome === 'win' && consecutiveWins < 3) return system.currentBet * 2;
    return baseBet;
  }
  
  if (id === 'dalembert') {
    if (outcome === 'win') return Math.max(baseBet, system.currentBet - baseBet);
    if (outcome === 'loss') return system.currentBet + baseBet;
    return system.currentBet;
  }
  
  if (id === 'reverse-dalembert') {
    if (outcome === 'win') return system.currentBet + baseBet;
    if (outcome === 'loss') return Math.max(baseBet, system.currentBet - baseBet);
    return system.currentBet;
  }
  
  if (id === 'martingale') {
    if (outcome === 'loss') return system.currentBet * 2;
    return baseBet;
  }
  
  if (id === 'fibonacci') {
    if (outcome === 'loss') {
      const nextIndex = Math.min(sequenceIndex + 1, FIBONACCI_SEQUENCE.length - 1);
      return baseBet * FIBONACCI_SEQUENCE[nextIndex];
    } else if (outcome === 'win') {
      const nextIndex = Math.max(0, sequenceIndex - 2);
      return baseBet * FIBONACCI_SEQUENCE[nextIndex];
    }
    return system.currentBet;
  }
  
  return baseBet;
}
// Types
type BetKey = 'red' | 'black' | 'even' | 'odd' | 'low' | 'high' | 
  'dozen1' | 'dozen2' | 'dozen3' | 'col1' | 'col2' | 'col3' |
  'alt1_1' | 'alt1_2' | 'alt2_1' | 'alt2_2' | 'alt3_1' | 'alt3_2' |
  'edge' | 'center' | 'six1' | 'six2' | 'six3' | 'six4' | 'six5' | 'six6' |
  'voisins' | 'orphelins' | 'tiers' | 'jeu_zero' | 'voisin' | 'non_voisin' |
  'nine_1st' | 'nine_2nd' | 'nine_3rd' | 'nine_4th' | 'right_18' | 'left_18' |
  'a' | 'b' | 'aa' | 'bb' | 'aaa' | 'bbb' | 'a6' | 'b6' | 'a9' | 'b9'

interface BetRow {
  id: string
  timestamp: number
  bets: Record<BetKey, number>
  spinNumber: number | null
  results: Record<BetKey, number>
  totalPnL: number
}

interface CardData {
  cardNumber: number
  target: number
  maxBets: number
  currentTotal?: number
  betsUsed?: number
}
// Add this helper component before your main component
interface QuickToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  onPopOut: () => void;
}

const QuickToolCard: React.FC<QuickToolCardProps> = ({ 
  title, 
  description, 
  icon, 
  iconBg, 
  onPopOut 
}) => (
  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-yellow-400/50 transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <button
        onClick={onPopOut}
        className="p-1.5 bg-gray-700 hover:bg-yellow-600 rounded opacity-0 group-hover:opacity-100 transition-all"
        title="Open in window"
      >
        <Maximize2 className="w-4 h-4 text-white" />
      </button>
    </div>
    <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
    <p className="text-gray-400 text-xs">{description}</p>
  </div>
);
// Wrapper with CardManagerProvider
export default function CompactBettingCard(props: any) {
  // If called from BettingAssistant with props
  if (props.card && props.onBack) {
    const cardData = {
      cardNumber: props.card.cardNumber,
      target: props.card.target,
      maxBets: props.card.maxBets,
      currentTotal: props.card.currentTotal || 0,
      betsUsed: props.card.betsUsed || 0
    }

    return (
      <CardManagerProvider>
        <FloatingBettingCard
          card={cardData}
          bettingSystem={props.bettingSystem}
          sessionConfig={props.sessionConfig} 
onPlaceBet={props.onPlaceBet}
          onClose={props.onBack}
          onCardComplete={props.onCardComplete || ((pnl) => {
            console.log('Card complete with P/L:', pnl)
            props.onBack()
          })}
          onNumberAdded={props.onNumberAdded || ((num) => {
            console.log('Number added to tracker:', num)
          })}
        />
        <FloatingCardsPortal />
      </CardManagerProvider>
    )
  }

  // Show demo if no props
  return <CompactBettingCardDemo />
}

export function CompactBettingCardDemo() {
  const [isCardOpen, setIsCardOpen] = useState(true)
  const [currentCard, setCurrentCard] = useState<CardData>({
    cardNumber: 1,
    target: 50,
    maxBets: 15
  })

  const [demoSystem] = useState({
    id: 'martingale',
    name: 'Martingale System',
    description: 'Demo - doubles after loss',
    riskLevel: 'high' as const,
    baseBet: 10,
    currentBet: 10,
    consecutiveWins: 0,
    consecutiveLosses: 0
  })
  const handleCloseCard = () => {
    setIsCardOpen(false)
  }

  const handleCardComplete = (pnl: number) => {
    alert(`🎉 Card #${currentCard.cardNumber} COMPLETE! Target: $${currentCard.target} | Achieved: $${pnl}`)
    setCurrentCard({
      cardNumber: currentCard.cardNumber + 1,
      target: 50,
      maxBets: 15
    })
  }

  const handleNumberAdded = (number: number) => {
    console.log('Number synced to main tracker:', number)
  }

  return (
    <CardManagerProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        {/* Instructions */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-blue-900/40 backdrop-blur rounded-xl border border-blue-400/30 p-4">
            <h2 className="text-xl font-bold text-blue-300 mb-2">📋 Preview Instructions</h2>
            <div className="text-sm text-blue-200 space-y-1">
              <p>✅ <strong>Betting card is now open by default</strong></p>
              <p>🎯 Click <strong>"Place Your Bets"</strong> to expand betting groups</p>
              <p>💰 Place some bets on different groups (Red, Black, Dozens, etc.)</p>
              <p>🎲 Enter a number (0-36) and click "Add & Calculate"</p>
              <p>📊 Then expand <strong>"Betting Performance Matrix"</strong> to see the 4 tabs!</p>
              <p className="text-yellow-300 mt-2">💡 Try switching between tabs to see different group organizations</p>
              <p className="text-cyan-300 mt-2">🆕 <strong>NEW: Click Quick Tools cards to open floating windows!</strong></p>
            </div>
          </div>
        </div>

        {/* Floating Betting Card */}
        {isCardOpen && (
          <FloatingBettingCard
            card={currentCard}
            bettingSystem={demoSystem} 
            onClose={handleCloseCard}
            onCardComplete={handleCardComplete}
            onNumberAdded={handleNumberAdded}
          />
        )}
        
        {/* Floating Cards Portal */}
        <FloatingCardsPortal />
      </div>
    </CardManagerProvider>
  )
}
// Floating Cards Portal
function FloatingCardsPortal() {
  const { openCards, closeCard, minimizeCard, maximizeCard, updatePosition, bringToFront } = useCardManager()
  
  return (
    <>
      {openCards.map((card) => {
        if (card.type === 'advisor') {
          return (
            <FloatingAdvisorCard
              key={card.id}
              card={card}
              onClose={() => closeCard(card.id)}
              onMinimize={() => minimizeCard(card.id)}
              onMaximize={() => maximizeCard(card.id)}
              onPositionChange={(position) => updatePosition(card.id, position)}
              onBringToFront={() => bringToFront(card.id)}
            />
          )
        }
        
        if (card.type === 'probability') {
          return (
            <FloatingProbabilityCard
              key={card.id}
              card={card}
              onClose={() => closeCard(card.id)}
              onMinimize={() => minimizeCard(card.id)}
              onMaximize={() => maximizeCard(card.id)}
              onPositionChange={(position) => updatePosition(card.id, position)}
              onBringToFront={() => bringToFront(card.id)}
            />
          )
        }
        
        return null
      })}
    </>
  )
}

function FloatingBettingCard({ 
  card, 
  bettingSystem,
  sessionConfig,
  onPlaceBet,
  onClose, 
  onCardComplete,
  onNumberAdded,
}: {
  card: CardData
  bettingSystem?: any
  sessionConfig?: any
  onPlaceBet?: (
    betType: string, 
    betAmount: number, 
    outcome: 'win' | 'loss', 
    winAmount: number, 
    numberHit: number,
    bettingMatrix: Record<string, number>,
    groupResults: Record<string, number>
  ) => void
  onClose: () => void
  onCardComplete: (pnl: number) => void
  onNumberAdded: (number: number) => void
}) {
  const [bettingTab, setBettingTab] = useState<'table-common' | 'table-special' | 'wheel-common' | 'wheel-special'>('table-common')

  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 800, 
    y: 0 
  })
  const [size] = useState({ width: 800, height: 600 })
  const [isDragging, setIsDragging] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
 
  // Betting State
  const [inputNumber, setInputNumber] = useState('')
  const [currentBets, setCurrentBets] = useState<Record<BetKey, number>>({} as any)
  const [betHistory, setBetHistory] = useState<BetRow[]>([])
  // Use betting system or default to flat
const [systemState, setSystemState] = useState(bettingSystem || {
  id: 'flat',
  name: 'Flat Betting',
  baseBet: 10,
  currentBet: 10,
  consecutiveWins: 0,
  consecutiveLosses: 0,
  sequenceIndex: 0
})

const baseUnit = systemState.currentBet
  const [useSystemAmount, setUseSystemAmount] = useState(true)
  const [showMatrix, setShowMatrix] = useState(true)
  const [showBettingGroups, setShowBettingGroups] = useState(true)
  const [betOrder, setBetOrder] = useState<Array<{key: BetKey, amount: number}>>([])

  // Group-level progression tracking
  const [groupProgressions, setGroupProgressions] = useState<Record<string, { position: number; consecutiveWins: number; lastOutcome: 'win' | 'loss' | null }>>({
    'red-black': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'even-odd': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'low-high': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'dozens': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'columns': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'six-groups': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'alt1': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'alt2': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'alt3': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'edge-center': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'wheel-special1': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'wheel-special2': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'wheel-jeu-zero': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'wheel-quarters': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'wheel-halves': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'wheel-ab': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'wheel-aabb': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'wheel-aaabbb': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'wheel-a6b6': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'wheel-a9b9': { position: 0, consecutiveWins: 0, lastOutcome: null },
    'uncategorized': { position: 0, consecutiveWins: 0, lastOutcome: null },
  })

  // Initialize from card props (source of truth)
const [cardProgress, setCardProgress] = useState({ 
  betsUsed: card.betsUsed || 0, 
  currentPnL: card.currentTotal || 0 
})

// Sync with props when session updates the card
useEffect(() => {
  setCardProgress({
    betsUsed: card.betsUsed || 0,
    currentPnL: card.currentTotal || 0
  })
}, [card.betsUsed, card.currentTotal])
  const [lastBets, setLastBets] = useState<Record<BetKey, number>>({} as any)
  const [matrixTab, setMatrixTab] = useState<'table-common' | 'table-special' | 'wheel-common' | 'wheel-special'>('table-common')
  const { openCard } = useCardManager()
  const betLabels: Record<BetKey, string> = {
    red: 'Red', black: 'Black', even: 'Even', odd: 'Odd',
    low: 'Low', high: 'High', dozen1: '1st Doz', dozen2: '2nd Doz', dozen3: '3rd Doz',
    col1: 'Col 1', col2: 'Col 2', col3: 'Col 3',
    alt1_1: 'A', alt1_2: 'B', alt2_1: 'AA', alt2_2: 'BB',
    alt3_1: 'AAA', alt3_2: 'BBB', edge: 'Edge', center: 'Center',
    six1: '1-6', six2: '7-12', six3: '13-18', six4: '19-24', six5: '25-30', six6: '31-36',
    voisins: 'Voisins', orphelins: 'Orphelins', tiers: 'Tiers', jeu_zero: 'Jeu Zero',
    voisin: 'Voisin', non_voisin: 'Non-Voisin',
    nine_1st: '1st 9', nine_2nd: '2nd 9', nine_3rd: '3rd 9', nine_4th: '4th 9',
    right_18: 'Right', left_18: 'Left',
    a: 'A', b: 'B', aa: 'AA', bb: 'BB', aaa: 'AAA', bbb: 'BBB',
    a6: 'A6', b6: 'B6', a9: 'A9', b9: 'B9'
  }

  const wheelGroups = {
    voisins: [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25],
    orphelins: [17,34,6,1,20,14,31,9],
    tiers: [27,13,36,11,30,8,23,10,5,24,16,33],
    jeu_zero: [12,35,3,26,0,32,15],
    voisin: [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25],
    non_voisin: [17,34,6,1,20,14,31,9,27,13,36,11,30,8,23,10,5,24,16,33],
    nine_1st: [32,15,19,4,21,2,25,17,34],
    nine_2nd: [6,27,13,36,11,30,8,23,10],
    nine_3rd: [5,24,16,33,1,20,14,31,9],
    nine_4th: [22,18,29,7,28,12,35,3,26],
    right_18: [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10],
    left_18: [5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26],
    a: [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3],
    b: [15,4,2,17,6,13,11,8,10,24,33,20,31,22,29,28,35,26],
    aa: [32,15,21,2,34,6,36,11,23,10,16,33,14,31,18,29,12,35],
    bb: [19,4,25,17,27,13,30,8,5,24,1,20,9,22,7,28,3,26],
    aaa: [32,15,19,25,17,34,36,11,30,5,24,16,14,31,9,7,28,12],
    bbb: [4,21,2,6,27,13,8,23,10,33,1,20,22,18,29,35,3,26],
    a6: [32,15,19,4,21,2,36,11,30,8,23,10,14,31,9,22,18,29],
    b6: [25,17,34,6,27,13,5,24,16,33,1,20,7,28,12,35,3,26],
    a9: [32,15,19,4,21,2,25,17,34,5,24,16,33,1,20,14,31,9],
    b9: [6,27,13,36,11,30,8,23,10,22,18,29,7,28,12,35,3,26]
  }

  const checkGroupWon = (num: number, betKey: BetKey): boolean => {
    const redNums = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
    
    switch(betKey) {
      case 'red': return redNums.includes(num)
      case 'black': return !redNums.includes(num) && num !== 0
      case 'even': return num !== 0 && num % 2 === 0
      case 'odd': return num % 2 === 1
      case 'low': return num >= 1 && num <= 18
      case 'high': return num >= 19 && num <= 36
      case 'dozen1': return num >= 1 && num <= 12
      case 'dozen2': return num >= 13 && num <= 24
      case 'dozen3': return num >= 25 && num <= 36
      case 'col1': return num !== 0 && num % 3 === 1
      case 'col2': return num !== 0 && num % 3 === 2
      case 'col3': return num !== 0 && num % 3 === 0
      case 'six1': return num >= 1 && num <= 6
      case 'six2': return num >= 7 && num <= 12
      case 'six3': return num >= 13 && num <= 18
      case 'six4': return num >= 19 && num <= 24
      case 'six5': return num >= 25 && num <= 30
      case 'six6': return num >= 31 && num <= 36
      case 'alt1_1': return num > 0 && [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num)
      case 'alt1_2': return num > 0 && [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36].includes(num)
      case 'alt2_1': return num > 0 && [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num)
      case 'alt2_2': return num > 0 && [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36].includes(num)
      case 'alt3_1': return num > 0 && [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num)
      case 'alt3_2': return num > 0 && [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36].includes(num)
      case 'edge': return num > 0 && [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36].includes(num)
      case 'center': return num > 0 && [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27].includes(num)
      // Wheel groups
      case 'voisins': return wheelGroups.voisins.includes(num)
      case 'orphelins': return wheelGroups.orphelins.includes(num)
      case 'tiers': return wheelGroups.tiers.includes(num)
      case 'jeu_zero': return wheelGroups.jeu_zero.includes(num)
      case 'voisin': return wheelGroups.voisin.includes(num)
      case 'non_voisin': return wheelGroups.non_voisin.includes(num)
      case 'nine_1st': return wheelGroups.nine_1st.includes(num)
      case 'nine_2nd': return wheelGroups.nine_2nd.includes(num)
      case 'nine_3rd': return wheelGroups.nine_3rd.includes(num)
      case 'nine_4th': return wheelGroups.nine_4th.includes(num)
      case 'right_18': return wheelGroups.right_18.includes(num)
      case 'left_18': return wheelGroups.left_18.includes(num)
      case 'a': return wheelGroups.a.includes(num)
      case 'b': return wheelGroups.b.includes(num)
      case 'aa': return wheelGroups.aa.includes(num)
      case 'bb': return wheelGroups.bb.includes(num)
      case 'aaa': return wheelGroups.aaa.includes(num)
      case 'bbb': return wheelGroups.bbb.includes(num)
      case 'a6': return wheelGroups.a6.includes(num)
      case 'b6': return wheelGroups.b6.includes(num)
      case 'a9': return wheelGroups.a9.includes(num)
      case 'b9': return wheelGroups.b9.includes(num)
      default: return false
    }
  }

  // Helper: Get betting group category for progression tracking
  const getGroupCategory = (betKey: BetKey): string => {
    // Red/Black
    if (['red', 'black'].includes(betKey)) return 'red-black'
    // Even/Odd
    if (['even', 'odd'].includes(betKey)) return 'even-odd'
    // Low/High
    if (['low', 'high'].includes(betKey)) return 'low-high'
    // Dozens
    if (['dozen1', 'dozen2', 'dozen3'].includes(betKey)) return 'dozens'
    // Columns
    if (['col1', 'col2', 'col3'].includes(betKey)) return 'columns'
    // Six Groups
    if (['six1', 'six2', 'six3', 'six4', 'six5', 'six6'].includes(betKey)) return 'six-groups'
    // Alt1 (A/B)
    if (['alt1_1', 'alt1_2'].includes(betKey)) return 'alt1'
    // Alt2 (AA/BB)
    if (['alt2_1', 'alt2_2'].includes(betKey)) return 'alt2'
    // Alt3 (AAA/BBB)
    if (['alt3_1', 'alt3_2'].includes(betKey)) return 'alt3'
    // Edge/Center
    if (['edge', 'center'].includes(betKey)) return 'edge-center'
    // Wheel Special 1: Voisins, Orphelins, Tiers
    if (['voisins', 'orphelins', 'tiers'].includes(betKey)) return 'wheel-special1'
    // Wheel Special 2: Voisin, Non-Voisin
    if (['voisin', 'non_voisin'].includes(betKey)) return 'wheel-special2'
    // Wheel Quarters (9s)
    if (['nine_1st', 'nine_2nd', 'nine_3rd', 'nine_4th'].includes(betKey)) return 'wheel-quarters'
    // Wheel Halves (Right/Left 18)
    if (['right_18', 'left_18'].includes(betKey)) return 'wheel-halves'
    // Wheel A/B
    if (['a', 'b'].includes(betKey)) return 'wheel-ab'
    // Wheel AA/BB
    if (['aa', 'bb'].includes(betKey)) return 'wheel-aabb'
    // Wheel AAA/BBB
    if (['aaa', 'bbb'].includes(betKey)) return 'wheel-aaabbb'
    // Wheel A6/B6
    if (['a6', 'b6'].includes(betKey)) return 'wheel-a6b6'
    // Wheel A9/B9
    if (['a9', 'b9'].includes(betKey)) return 'wheel-a9b9'
    // Jeu Zero (separate)
    if (betKey === 'jeu_zero') return 'wheel-jeu-zero'

    return 'uncategorized'
  }

  // Helper: Get betting sequences for each system
  const getBettingSequence = (systemId: string): number[] => {
    const sequences: Record<string, number[]> = {
      'custom': [1, 1, 2, 2, 4, 4, 8, 8],
      'martingale': [1, 2, 4, 8, 16, 32, 64, 128],
      'dalembert': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      'reverse-dalembert': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      'fibonacci': [1, 1, 2, 3, 5, 8, 13, 21, 34, 55],
      'paroli': [1, 2, 4, 8],
      'flat': [1]
    }
    return sequences[systemId] || sequences['custom']
  }

  // Helper: Get chip value for a specific bet based on group progression
  const getChipValue = (betKey: BetKey): number => {
    const category = getGroupCategory(betKey)
    const tracker = groupProgressions[category]

    if (!tracker) {
      // Fallback to base unit if category not found
      console.log('⚠️ Tracker not found for category:', category)
      return baseUnit
    }

    const sequence = getBettingSequence(systemState.id)
    const multiplier = sequence[tracker.position] || 1

    console.log(`💰 getChipValue(${betKey}):`, {
      category,
      position: tracker.position,
      systemId: systemState.id,
      sequence: sequence.slice(0, 5),
      multiplier,
      baseBet: systemState.baseBet,
      result: systemState.baseBet * multiplier
    })

    return systemState.baseBet * multiplier
  }

  const getGroupPayout = (betKey: BetKey): number => {
    if (['red','black','even','odd','low','high','alt1_1','alt1_2','alt2_1','alt2_2','alt3_1','alt3_2','edge','center'].includes(betKey)) return 1
    if (['dozen1','dozen2','dozen3','col1','col2','col3'].includes(betKey)) return 2
    if (['six1','six2','six3','six4','six5','six6'].includes(betKey)) return 5
    // Wheel groups - all are approximately 1:1 (18 numbers) except smaller groups
    if (['voisin','non_voisin','right_18','left_18','a','b','aa','bb','aaa','bbb','a6','b6','a9','b9'].includes(betKey)) return 1
    if (['voisins'].includes(betKey)) return 0.5 // 17 numbers, approximately 1:1 but adjusted
    if (['tiers'].includes(betKey)) return 2 // 12 numbers, approximately 2:1
    if (['orphelins'].includes(betKey)) return 3.5 // 8 numbers
    if (['jeu_zero'].includes(betKey)) return 4 // 7 numbers
    if (['nine_1st','nine_2nd','nine_3rd','nine_4th'].includes(betKey)) return 3 // 9 numbers
    return 1
  }

  const placeBet = (betKey: BetKey) => {
    const chipValue = getChipValue(betKey)

    setCurrentBets(prev => ({
      ...prev,
      [betKey]: (prev[betKey] || 0) + chipValue
    }))
    setBetOrder(prev => [...prev, { key: betKey, amount: chipValue }])
  }

  const decreaseBet = (betKey: BetKey) => {
    const chipValue = getChipValue(betKey)

    setCurrentBets(prev => {
      const currentAmount = prev[betKey] || 0
      if (currentAmount <= chipValue) {
        const newBets = {...prev}
        delete newBets[betKey]
        return newBets
      }
      return {
        ...prev,
        [betKey]: currentAmount - chipValue
      }
    })
    // Remove last occurrence from bet order
    const lastIndex = betOrder.map(b => b.key).lastIndexOf(betKey)
    if (lastIndex !== -1) {
      setBetOrder(prev => prev.filter((_, i) => i !== lastIndex))
    }
  }

  const clearAllBets = () => {
    setCurrentBets({} as any)
    setBetOrder([])
  }

  const handleAddNumber = () => {
    if (!inputNumber) {
      alert('Please enter a number (0-36) first!')
      return
    }
    
    const num = parseInt(inputNumber)
    if (isNaN(num) || num < 0 || num > 36) {
      alert('Number must be between 0 and 36!')
      return
    }

    onNumberAdded(num)
    
    if (Object.values(currentBets).some(v => v > 0)) {
      let totalPnL = 0
      const results: Record<BetKey, number> = {} as any
      
      Object.entries(currentBets).forEach(([key, amount]) => {
        if (amount > 0) {
          const won = checkGroupWon(num, key as BetKey)
          const payout = getGroupPayout(key as BetKey)
          
          if (won) {
            results[key as BetKey] = amount * payout
            totalPnL += amount * payout
          } else {
            results[key as BetKey] = -amount
            totalPnL -= amount
          }
        }
      })

      // Update group progressions based on results
      setGroupProgressions(prev => {
        const updated = { ...prev }

        console.log('🔄 Updating group progressions for spin:', num)
        console.log('Current bets:', currentBets)

        Object.entries(currentBets).forEach(([key, amount]) => {
          if (amount > 0) {
            const betKey = key as BetKey
            const category = getGroupCategory(betKey)
            const won = checkGroupWon(num, betKey)

            if (!updated[category]) {
              // Initialize if category doesn't exist
              updated[category] = { position: 0, consecutiveWins: 0, lastOutcome: null }
            }

            const tracker = updated[category]
            const sequence = getBettingSequence(systemState.id)
            const oldPosition = tracker.position

            if (won) {
              // Increment consecutive wins
              tracker.consecutiveWins += 1

              // Reset to position 0 if we have 2 consecutive wins
              if (tracker.consecutiveWins >= 2) {
                tracker.position = 0
                tracker.consecutiveWins = 0
              }

              tracker.lastOutcome = 'win'
            } else {
              // Loss: move forward in sequence and reset consecutive wins
              tracker.consecutiveWins = 0
              tracker.position = Math.min(tracker.position + 1, sequence.length - 1)
              tracker.lastOutcome = 'loss'
            }

            console.log(`📊 ${betKey} (${category}): ${won ? 'WIN' : 'LOSS'} | Position: ${oldPosition} → ${tracker.position}`)
          }
        })

        console.log('Updated progressions:', updated)
        return updated
      })

      // Update local state for immediate UI feedback (BEFORE onPlaceBet!)
const newBetsUsed = cardProgress.betsUsed + 1
const newPnL = cardProgress.currentPnL + totalPnL
setCardProgress({ betsUsed: newBetsUsed, currentPnL: newPnL })

// ✅ NEW CODE - Pass complete betting matrix:
if (onPlaceBet) {
  const totalWagered = Object.values(currentBets).reduce((sum, val) => sum + (val || 0), 0)
  
  onPlaceBet(
    `Spin #${newBetsUsed}`,
    totalWagered,
    totalPnL >= 0 ? 'win' : 'loss',
    totalPnL >= 0 ? totalWagered + totalPnL : 0,
    num,
    currentBets,  // ✅ ADD THIS: Complete betting matrix
    results       // ✅ ADD THIS: Results per group
  )
}

      const newRow: BetRow = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        bets: {...currentBets},
        spinNumber: num,
        results,
        totalPnL
      }
      
      setBetHistory([newRow, ...betHistory])
      setLastBets({...currentBets})
      setCurrentBets({} as any)
      setBetOrder([])

      

// Check if card is complete (local check for immediate feedback)
if (newPnL >= card.target) {
  onCardComplete(newPnL)
}
      
      // Update betting system based on NET outcome
      setSystemState((prev: any) => {
  // Determine overall outcome based on total P/L
  const overallOutcome: 'win' | 'loss' = totalPnL > 0 ? 'win' : 'loss'
  
  // If break-even (totalPnL === 0), reset streaks but keep bet same
  if (totalPnL === 0) {
    return {
      ...prev,
      consecutiveWins: 0,
      consecutiveLosses: 0
    }
  }
  
  const nextBet = calculateNextBet(prev, overallOutcome)
  
  let newSequenceIndex = prev.sequenceIndex || 0
  if (prev.id === 'fibonacci') {
    if (overallOutcome === 'loss') {
      newSequenceIndex = Math.min(newSequenceIndex + 1, FIBONACCI_SEQUENCE.length - 1)
    } else {
      newSequenceIndex = Math.max(0, newSequenceIndex - 2)
    }
  }
  return {
    ...prev,
    currentBet: nextBet,
    consecutiveWins: overallOutcome === 'win' ? prev.consecutiveWins + 1 : 0,
    consecutiveLosses: overallOutcome === 'loss' ? prev.consecutiveLosses + 1 : 0,
    sequenceIndex: newSequenceIndex
  }
})    
    }
   
    setInputNumber('')
  }
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
  }
  const cardStyle = isMaximized 
  ? { left: 0, top: 0, width: '100vw', height: '100vh' }
  : isMinimized
  ? { left: position.x, top: position.y, width: 400, height: 60 }
  : { left: position.x, top: position.y, width: '50vw', height: '100vh' } // Uses position but 50% width

  const totalStake = Object.values(currentBets).reduce((sum, val) => sum + (val || 0), 0)
  const activeBets = Object.entries(currentBets).filter(([_, amount]) => amount > 0)

  return (
    <div
      ref={cardRef}
      className="fixed bg-gradient-to-br from-[#0a0e1a] via-[#0f1422] to-[#0a0e1a] text-white rounded-xl shadow-2xl border-2 border-yellow-400/50 overflow-hidden z-50"
      style={cardStyle}
    >
      {/* Title Bar */}
      <div 
        className="bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 p-3 flex items-center justify-between cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Move size={16} className="text-white/80" />
          <span className="text-xl font-bold">🎴 Card #{card.cardNumber}</span>
        </div>
        
        <div className="text-right mr-4">
          <div className={`text-3xl font-bold ${cardProgress.currentPnL >= 0 ? 'text-yellow-300' : 'text-red-300'}`}>
            {cardProgress.currentPnL >= 0 ? '+' : ''}${cardProgress.currentPnL}
          </div>
        </div>
        
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
          >
            <Minimize2 size={18} />
          </button>
          <button
            onClick={toggleMaximize}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="overflow-y-auto p-2 space-y-2 no-drag" style={{ height: 'calc(100% - 68px)' }}>
          
          {/* Enhanced Betting System Display */}
<div className={`rounded-xl p-3 border-2 ${
  !systemState.riskLevel || systemState.riskLevel === 'low' 
    ? 'bg-gradient-to-br from-green-900/50 via-emerald-900/40 to-green-900/50 border-green-600/60' 
    : systemState.riskLevel === 'medium' 
    ? 'bg-gradient-to-br from-yellow-900/50 via-orange-900/40 to-yellow-900/50 border-yellow-600/60' 
    : 'bg-gradient-to-br from-red-900/50 via-rose-900/40 to-red-900/50 border-red-600/60'
}`}>
  <div className="flex justify-between items-center mb-3">
    <div className="flex items-center gap-2">
      <div className={`rounded-lg p-1.5 ${
        !systemState.riskLevel || systemState.riskLevel === 'low' ? 'bg-green-600/30' :
        systemState.riskLevel === 'medium' ? 'bg-yellow-600/30' :
        'bg-red-600/30'
      }`}>
        <TrendingUp className="w-4 h-4 text-white" />
      </div>
      <div>
        <span className="font-bold text-white text-sm">{systemState.name || 'Flat Betting'}</span>
        {systemState.riskLevel && (
          <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded font-bold ${
            systemState.riskLevel === 'low' ? 'bg-green-600' :
            systemState.riskLevel === 'medium' ? 'bg-yellow-600' :
            'bg-red-600'
          }`}>
            {systemState.riskLevel.toUpperCase()}
          </span>
        )}
      </div>
    </div>
    
    <div className="text-right">
      <div className="text-[9px] text-gray-300 font-semibold">Next Bet</div>
      <div className="text-2xl font-bold text-yellow-300">${systemState.currentBet}</div>
    </div>
  </div>
  
  <div className="grid grid-cols-4 gap-2 text-center">
    <div className="bg-black/30 rounded p-1.5">
      <div className="text-[8px] text-gray-400">Base</div>
      <div className="text-sm font-bold text-white">${systemState.baseBet}</div>
    </div>
    <div className="bg-black/30 rounded p-1.5">
      <div className="text-[8px] text-gray-400">Wins</div>
      <div className="text-sm font-bold text-green-400">{systemState.consecutiveWins}</div>
    </div>
    <div className="bg-black/30 rounded p-1.5">
      <div className="text-[8px] text-gray-400">Losses</div>
      <div className="text-sm font-bold text-red-400">{systemState.consecutiveLosses}</div>
    </div>
    <div className="bg-black/30 rounded p-1.5">
      <div className="text-[8px] text-gray-400">Multi</div>
      <div className="text-sm font-bold text-blue-400">
        {(systemState.currentBet / systemState.baseBet).toFixed(1)}x
      </div>
    </div>
  </div>
  
  {/* Warning for high bets */}
  {systemState.currentBet > systemState.baseBet * 4 && (
    <div className="mt-2 bg-red-900/30 border border-red-500/50 rounded p-2 text-xs text-red-200 flex items-center gap-2">
      <span>⚠️</span>
      <span>Bet increased to {(systemState.currentBet / systemState.baseBet).toFixed(1)}x base!</span>
    </div>
  )}
</div>


{/* Quick Tools Section */}
<div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-yellow-400" />
              <h3 className="text-yellow-400 font-bold text-sm">Quick Tools</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <QuickToolCard
                title="Betting Advisor"
                description="Get AI-powered betting recommendations"
                icon={<Target className="w-5 h-5 text-purple-400" />}
                iconBg="bg-purple-600/20"
                onPopOut={() => openCard('advisor')}
              />
              
              <QuickToolCard
                title="Probability Chamber"
                description="Statistical analysis & predictions"
                icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
                iconBg="bg-cyan-600/20"
                onPopOut={() => openCard('probability')}
              />
            </div>
          </div>

          {/* Betting Performance Matrix */}
          <div className="bg-gradient-to-r from-cyan-900/50 via-blue-900/40 to-cyan-900/50 border-2 border-cyan-600/60 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="w-full p-3 flex justify-between items-center hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="bg-cyan-600/30 rounded-lg p-1.5">
                  <DollarSign className="w-4 h-4 text-cyan-300" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-cyan-200 text-xs">Betting Performance Matrix</div>
                  <div className="text-[10px] text-cyan-300/70">Track hit rates across all groups</div>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-cyan-300 transition-transform ${showMatrix ? 'rotate-90' : ''}`} />
            </button>

            {showMatrix && (
              <>
                {/* Tab Navigation */}
                <div className="bg-[#0f1420] border-y border-cyan-700/30 px-2 py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setMatrixTab('table-common')}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        matrixTab === 'table-common'
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-gray-800/50 text-cyan-300/70 hover:bg-gray-700/50'
                      }`}
                    >
                      📊 Table Common
                    </button>
                    <button
                      onClick={() => setMatrixTab('table-special')}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        matrixTab === 'table-special'
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-800/50 text-purple-300/70 hover:bg-gray-700/50'
                      }`}
                    >
                      ⭐ Table Special
                    </button>
                    <button
                      onClick={() => setMatrixTab('wheel-common')}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        matrixTab === 'wheel-common'
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'bg-gray-800/50 text-orange-300/70 hover:bg-gray-700/50'
                      }`}
                    >
                      🎡 Wheel Common
                    </button>
                    <button
                      onClick={() => setMatrixTab('wheel-special')}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        matrixTab === 'wheel-special'
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-gray-800/50 text-emerald-300/70 hover:bg-gray-700/50'
                      }`}
                    >
                      🎯 Wheel Special
                    </button>
                  </div>
                </div>

                {betHistory.length > 0 ? (
                  <div className="overflow-x-auto bg-[#1a2332] max-h-64">
                    {matrixTab === 'table-common' && (
                      <table className="text-[10px] w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead className="sticky top-0">
                          <tr>
                            <th rowSpan={2} className="border border-gray-700 bg-gray-800 text-white p-2">Num</th>
                            <th colSpan={2} className="border border-gray-700 bg-red-800/80 text-red-200 p-2">Colors</th>
                            <th colSpan={2} className="border border-gray-700 bg-blue-800/80 text-blue-200 p-2">Even/Odd</th>
                            <th colSpan={2} className="border border-gray-700 bg-purple-800/80 text-purple-200 p-2">Low/High</th>
                            <th colSpan={3} className="border border-gray-700 bg-orange-800/80 text-orange-200 p-2">Dozens</th>
                            <th colSpan={3} className="border border-gray-700 bg-emerald-800/80 text-emerald-200 p-2">Columns</th>
                            <th rowSpan={2} className="border border-gray-700 bg-gray-800 text-white p-2">P/L</th>
                          </tr>
                          <tr>
                            <th className="border border-gray-700 bg-red-900/60 text-red-300 p-1">R</th>
                            <th className="border border-gray-700 bg-gray-900/60 text-gray-300 p-1">B</th>
                            <th className="border border-gray-700 bg-blue-900/60 text-blue-300 p-1">E</th>
                            <th className="border border-gray-700 bg-orange-900/60 text-orange-300 p-1">O</th>
                            <th className="border border-gray-700 bg-purple-900/60 text-purple-300 p-1">L</th>
                            <th className="border border-gray-700 bg-pink-900/60 text-pink-300 p-1">H</th>
                            <th className="border border-gray-700 bg-orange-900/60 text-orange-300 p-1">D1</th>
                            <th className="border border-gray-700 bg-orange-900/60 text-orange-300 p-1">D2</th>
                            <th className="border border-gray-700 bg-orange-900/60 text-orange-300 p-1">D3</th>
                            <th className="border border-gray-700 bg-emerald-900/60 text-emerald-300 p-1">C1</th>
                            <th className="border border-gray-700 bg-emerald-900/60 text-emerald-300 p-1">C2</th>
                            <th className="border border-gray-700 bg-emerald-900/60 text-emerald-300 p-1">C3</th>
                          </tr>
                        </thead>
                        <tbody>
                          {betHistory.map((row) => {
                            const num = row.spinNumber!
                            const redNums = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
                            const betKeys: BetKey[] = ['red', 'black', 'even', 'odd', 'low', 'high',
                              'dozen1', 'dozen2', 'dozen3', 'col1', 'col2', 'col3']

                            return (
                              <tr key={row.id} className="hover:bg-gray-800/30">
                                <td className="border border-gray-700 text-center font-bold bg-[#1a2332] p-1">
                                  <span className={`inline-block px-1 py-0.5 rounded text-[9px] font-bold ${
                                    num === 0 ? 'bg-green-600' :
                                    redNums.includes(num) ? 'bg-red-600' : 'bg-gray-900'
                                  }`}>
                                    {num}
                                  </span>
                                </td>
                                
                                {betKeys.map((betKey) => {
                                  const hasBet = row.bets[betKey] > 0
                                  const won = checkGroupWon(num, betKey)
                                  const betAmount = row.bets[betKey]
                                  
                                  return (
                                    <td 
                                      key={betKey}
                                      className={`border border-gray-700 text-center p-1 ${
                                        won ? 'bg-green-900/30' : 'bg-gray-900/20'
                                      }`}
                                    >
                                      {hasBet ? (
                                        won ? (
                                          <span className="text-green-400 font-bold text-[9px]">
                                            ${betAmount + (betAmount * getGroupPayout(betKey))}
                                          </span>
                                        ) : (
                                          <span className="text-red-400 font-bold text-[9px]">
                                            -${betAmount}
                                          </span>
                                        )
                                      ) : (
                                        won ? <span className="text-green-400 text-[9px]">✓</span> : ''
                                      )}
                                    </td>
                                  )
                                })}
                                
                                <td className="border border-gray-700 text-center font-bold bg-[#1a2332] p-1">
                                  <span className={row.totalPnL >= 0 ? 'text-green-400 text-[9px]' : 'text-red-400 text-[9px]'}>
                                    {row.totalPnL >= 0 ? '+' : ''}${row.totalPnL}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}

                    {matrixTab === 'table-special' && (
                      <table className="text-[10px] w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead className="sticky top-0">
                          <tr>
                            <th rowSpan={2} className="border border-gray-700 bg-gray-800 text-white p-2">Num</th>
                            <th colSpan={6} className="border border-gray-700 bg-teal-800/80 text-teal-200 p-2">Six Groups (5:1)</th>
                            <th colSpan={2} className="border border-gray-700 bg-indigo-800/80 text-indigo-200 p-2">Alt-1</th>
                            <th colSpan={2} className="border border-gray-700 bg-violet-800/80 text-violet-200 p-2">Alt-2</th>
                            <th colSpan={2} className="border border-gray-700 bg-fuchsia-800/80 text-fuchsia-200 p-2">Alt-3</th>
                            <th colSpan={2} className="border border-gray-700 bg-amber-800/80 text-amber-200 p-2">Edge/Center</th>
                            <th rowSpan={2} className="border border-gray-700 bg-gray-800 text-white p-2">P/L</th>
                          </tr>
                          <tr>
                            <th className="border border-gray-700 bg-teal-900/60 text-teal-300 p-1">S1</th>
                            <th className="border border-gray-700 bg-teal-900/60 text-teal-300 p-1">S2</th>
                            <th className="border border-gray-700 bg-teal-900/60 text-teal-300 p-1">S3</th>
                            <th className="border border-gray-700 bg-teal-900/60 text-teal-300 p-1">S4</th>
                            <th className="border border-gray-700 bg-teal-900/60 text-teal-300 p-1">S5</th>
                            <th className="border border-gray-700 bg-teal-900/60 text-teal-300 p-1">S6</th>
                            <th className="border border-gray-700 bg-indigo-900/60 text-indigo-300 p-1">A</th>
                            <th className="border border-gray-700 bg-indigo-900/60 text-indigo-300 p-1">B</th>
                            <th className="border border-gray-700 bg-violet-900/60 text-violet-300 p-1">AA</th>
                            <th className="border border-gray-700 bg-violet-900/60 text-violet-300 p-1">BB</th>
                            <th className="border border-gray-700 bg-fuchsia-900/60 text-fuchsia-300 p-1">AAA</th>
                            <th className="border border-gray-700 bg-fuchsia-900/60 text-fuchsia-300 p-1">BBB</th>
                            <th className="border border-gray-700 bg-amber-900/60 text-amber-300 p-1">Edg</th>
                            <th className="border border-gray-700 bg-amber-900/60 text-amber-300 p-1">Ctr</th>
                          </tr>
                        </thead>
                        <tbody>
                          {betHistory.map((row) => {
                            const num = row.spinNumber!
                            const redNums = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
                            const betKeys: BetKey[] = ['six1', 'six2', 'six3', 'six4', 'six5', 'six6',
                              'alt1_1', 'alt1_2', 'alt2_1', 'alt2_2', 'alt3_1', 'alt3_2', 'edge', 'center']

                            return (
                              <tr key={row.id} className="hover:bg-gray-800/30">
                                <td className="border border-gray-700 text-center font-bold bg-[#1a2332] p-1">
                                  <span className={`inline-block px-1 py-0.5 rounded text-[9px] font-bold ${
                                    num === 0 ? 'bg-green-600' :
                                    redNums.includes(num) ? 'bg-red-600' : 'bg-gray-900'
                                  }`}>
                                    {num}
                                  </span>
                                </td>
                                
                                {betKeys.map((betKey) => {
                                  const hasBet = row.bets[betKey] > 0
                                  const won = checkGroupWon(num, betKey)
                                  const betAmount = row.bets[betKey]
                                  
                                  return (
                                    <td 
                                      key={betKey}
                                      className={`border border-gray-700 text-center p-1 ${
                                        won ? 'bg-green-900/30' : 'bg-gray-900/20'
                                      }`}
                                    >
                                      {hasBet ? (
                                        won ? (
                                          <span className="text-green-400 font-bold text-[9px]">
                                            ${betAmount + (betAmount * getGroupPayout(betKey))}
                                          </span>
                                        ) : (
                                          <span className="text-red-400 font-bold text-[9px]">
                                            -${betAmount}
                                          </span>
                                        )
                                      ) : (
                                        won ? <span className="text-green-400 text-[9px]">✓</span> : ''
                                      )}
                                    </td>
                                  )
                                })}
                                
                                <td className="border border-gray-700 text-center font-bold bg-[#1a2332] p-1">
                                  <span className={row.totalPnL >= 0 ? 'text-green-400 text-[9px]' : 'text-red-400 text-[9px]'}>
                                    {row.totalPnL >= 0 ? '+' : ''}${row.totalPnL}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}

                    {matrixTab === 'wheel-common' && (
                      <table className="text-[10px] w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead className="sticky top-0">
                          <tr>
                            <th rowSpan={2} className="border border-gray-700 bg-gray-800 text-white p-2">Num</th>
                            <th colSpan={4} className="border border-gray-700 bg-purple-800/80 text-purple-200 p-2">Special Bets 1</th>
                            <th colSpan={2} className="border border-gray-700 bg-indigo-800/80 text-indigo-200 p-2">Special Bets 2</th>
                            <th colSpan={4} className="border border-gray-700 bg-cyan-800/80 text-cyan-200 p-2">9's</th>
                            <th colSpan={2} className="border border-gray-700 bg-green-800/80 text-green-200 p-2">(18's)</th>
                            <th rowSpan={2} className="border border-gray-700 bg-gray-800 text-white p-2">P/L</th>
                          </tr>
                          <tr>
                            <th className="border border-gray-700 bg-purple-900/60 text-purple-300 p-1">Voi</th>
                            <th className="border border-gray-700 bg-purple-900/60 text-purple-300 p-1">Orp</th>
                            <th className="border border-gray-700 bg-purple-900/60 text-purple-300 p-1">Tie</th>
                            <th className="border border-gray-700 bg-purple-900/60 text-purple-300 p-1">Jeu</th>
                            <th className="border border-gray-700 bg-indigo-900/60 text-indigo-300 p-1">Voi</th>
                            <th className="border border-gray-700 bg-indigo-900/60 text-indigo-300 p-1">N-V</th>
                            <th className="border border-gray-700 bg-cyan-900/60 text-cyan-300 p-1">1st</th>
                            <th className="border border-gray-700 bg-cyan-900/60 text-cyan-300 p-1">2nd</th>
                            <th className="border border-gray-700 bg-cyan-900/60 text-cyan-300 p-1">3rd</th>
                            <th className="border border-gray-700 bg-cyan-900/60 text-cyan-300 p-1">4th</th>
                            <th className="border border-gray-700 bg-green-900/60 text-green-300 p-1">R</th>
                            <th className="border border-gray-700 bg-green-900/60 text-green-300 p-1">L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {betHistory.map((row) => {
                            const num = row.spinNumber!
                            const redNums = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
                            const betKeys: BetKey[] = ['voisins', 'orphelins', 'tiers', 'jeu_zero',
                              'voisin', 'non_voisin', 'nine_1st', 'nine_2nd', 'nine_3rd', 'nine_4th',
                              'right_18', 'left_18']

                            return (
                              <tr key={row.id} className="hover:bg-gray-800/30">
                                <td className="border border-gray-700 text-center font-bold bg-[#1a2332] p-1">
                                  <span className={`inline-block px-1 py-0.5 rounded text-[9px] font-bold ${
                                    num === 0 ? 'bg-green-600' :
                                    redNums.includes(num) ? 'bg-red-600' : 'bg-gray-900'
                                  }`}>
                                    {num}
                                  </span>
                                </td>
                                
                                {betKeys.map((betKey) => {
                                  const hasBet = row.bets[betKey] > 0
                                  const won = checkGroupWon(num, betKey)
                                  const betAmount = row.bets[betKey]
                                  
                                  return (
                                    <td 
                                      key={betKey}
                                      className={`border border-gray-700 text-center p-1 ${
                                        won ? 'bg-green-900/30' : 'bg-gray-900/20'
                                      }`}
                                    >
                                      {hasBet ? (
                                        won ? (
                                          <span className="text-green-400 font-bold text-[9px]">
                                            ${betAmount + (betAmount * getGroupPayout(betKey))}
                                          </span>
                                        ) : (
                                          <span className="text-red-400 font-bold text-[9px]">
                                            -${betAmount}
                                          </span>
                                        )
                                      ) : (
                                        won ? <span className="text-green-400 text-[9px]">✓</span> : ''
                                      )}
                                    </td>
                                  )
                                })}
                                
                                <td className="border border-gray-700 text-center font-bold bg-[#1a2332] p-1">
                                  <span className={row.totalPnL >= 0 ? 'text-green-400 text-[9px]' : 'text-red-400 text-[9px]'}>
                                    {row.totalPnL >= 0 ? '+' : ''}${row.totalPnL}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}

                    {matrixTab === 'wheel-special' && (
                      <table className="text-[10px] w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead className="sticky top-0">
                          <tr>
                            <th rowSpan={2} className="border border-gray-700 bg-gray-800 text-white p-2">Num</th>
                            <th colSpan={2} className="border border-gray-700 bg-pink-800/80 text-pink-200 p-2">A/B</th>
                            <th colSpan={2} className="border border-gray-700 bg-rose-800/80 text-rose-200 p-2">AA/BB</th>
                            <th colSpan={2} className="border border-gray-700 bg-fuchsia-800/80 text-fuchsia-200 p-2">AAA/BBB</th>
                            <th colSpan={2} className="border border-gray-700 bg-violet-800/80 text-violet-200 p-2">A6/B6</th>
                            <th colSpan={2} className="border border-gray-700 bg-purple-800/80 text-purple-200 p-2">A9/B9</th>
                            <th rowSpan={2} className="border border-gray-700 bg-gray-800 text-white p-2">P/L</th>
                          </tr>
                          <tr>
                            <th className="border border-gray-700 bg-pink-900/60 text-pink-300 p-1">A</th>
                            <th className="border border-gray-700 bg-pink-900/60 text-pink-300 p-1">B</th>
                            <th className="border border-gray-700 bg-rose-900/60 text-rose-300 p-1">AA</th>
                            <th className="border border-gray-700 bg-rose-900/60 text-rose-300 p-1">BB</th>
                            <th className="border border-gray-700 bg-fuchsia-900/60 text-fuchsia-300 p-1">AAA</th>
                            <th className="border border-gray-700 bg-fuchsia-900/60 text-fuchsia-300 p-1">BBB</th>
                            <th className="border border-gray-700 bg-violet-900/60 text-violet-300 p-1">A6</th>
                            <th className="border border-gray-700 bg-violet-900/60 text-violet-300 p-1">B6</th>
                            <th className="border border-gray-700 bg-purple-900/60 text-purple-300 p-1">A9</th>
                            <th className="border border-gray-700 bg-purple-900/60 text-purple-300 p-1">B9</th>
                          </tr>
                        </thead>
                        <tbody>
                          {betHistory.map((row) => {
                            const num = row.spinNumber!
                            const redNums = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
                            const betKeys: BetKey[] = ['a', 'b', 'aa', 'bb', 'aaa', 'bbb', 'a6', 'b6', 'a9', 'b9']

                            return (
                              <tr key={row.id} className="hover:bg-gray-800/30">
                                <td className="border border-gray-700 text-center font-bold bg-[#1a2332] p-1">
                                  <span className={`inline-block px-1 py-0.5 rounded text-[9px] font-bold ${
                                    num === 0 ? 'bg-green-600' :
                                    redNums.includes(num) ? 'bg-red-600' : 'bg-gray-900'
                                  }`}>
                                    {num}
                                  </span>
                                </td>
                                
                                {betKeys.map((betKey) => {
                                  const hasBet = row.bets[betKey] > 0
                                  const won = checkGroupWon(num, betKey)
                                  const betAmount = row.bets[betKey]
                                  
                                  return (
                                    <td 
                                      key={betKey}
                                      className={`border border-gray-700 text-center p-1 ${
                                        won ? 'bg-green-900/30' : 'bg-gray-900/20'
                                      }`}
                                    >
                                      {hasBet ? (
                                        won ? (
                                          <span className="text-green-400 font-bold text-[9px]">
                                            ${betAmount + (betAmount * getGroupPayout(betKey))}
                                          </span>
                                        ) : (
                                          <span className="text-red-400 font-bold text-[9px]">
                                            -${betAmount}
                                          </span>
                                        )
                                      ) : (
                                        won ? <span className="text-green-400 text-[9px]">✓</span> : ''
                                      )}
                                    </td>
                                  )
                                })}
                                
                                <td className="border border-gray-700 text-center font-bold bg-[#1a2332] p-1">
                                  <span className={row.totalPnL >= 0 ? 'text-green-400 text-[9px]' : 'text-red-400 text-[9px]'}>
                                    {row.totalPnL >= 0 ? '+' : ''}${row.totalPnL}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#1a2332] px-2 py-3 text-center">
                    <p className="text-xs text-gray-400">No bet history yet - place some bets and spin to see the matrix!</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Place Your Bets */}
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-600/40 overflow-hidden">
            <button
              onClick={() => setShowBettingGroups(!showBettingGroups)}
              className="w-full flex items-center justify-between p-2 hover:bg-yellow-900/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h3 className="text-yellow-300 font-bold text-sm">Place Your Bets</h3>
              </div>
              <ChevronRight className={`w-5 h-5 text-yellow-300 transition-transform ${showBettingGroups ? 'rotate-90' : ''}`} />
            </button>

            <div className="bg-blue-900/40 border-t border-blue-600/30 px-3 py-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs flex-1">
                  {activeBets.length > 0 ? (
                    <>
                      {activeBets.map(([key, amount]) => (
                        <span key={key} className="text-blue-200 whitespace-nowrap">
                          {betLabels[key as BetKey]} <span className="text-yellow-300 font-bold">${amount}</span>
                        </span>
                      ))}
                      <span className="text-blue-400 font-bold">
                        • Total: <span className="text-yellow-300">${totalStake}</span>
                      </span>
                    </>
                  ) : (
                    <span className="text-blue-300/60 text-xs">No bets placed</span>
                  )}
                </div>

                <button
                  onClick={clearAllBets}
                  disabled={activeBets.length === 0}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded text-xs font-bold"
                >
                  ✕ Clear
                </button>
              </div>
            </div>
          </div>

          {/* All Betting Groups */}
          {showBettingGroups && (
            <div className="bg-gradient-to-br from-[#1a1f2e] via-[#1e2538] to-[#1a1f2e] border-2 border-cyan-600/50 rounded-xl overflow-hidden">
              {/* Betting Tabs */}
              <div className="bg-[#0f1420] border-b border-cyan-700/30 px-2 py-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setBettingTab('table-common')}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      bettingTab === 'table-common'
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'bg-gray-800/50 text-cyan-300/70 hover:bg-gray-700/50'
                    }`}
                  >
                    📊 Table Common
                  </button>
                  <button
                    onClick={() => setBettingTab('table-special')}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      bettingTab === 'table-special'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-800/50 text-purple-300/70 hover:bg-gray-700/50'
                    }`}
                  >
                    ⭐ Table Special
                  </button>
                  <button
                    onClick={() => setBettingTab('wheel-common')}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      bettingTab === 'wheel-common'
                        ? 'bg-orange-600 text-white shadow-lg'
                        : 'bg-gray-800/50 text-orange-300/70 hover:bg-gray-700/50'
                    }`}
                  >
                    🎡 Wheel Common
                  </button>
                  <button
                    onClick={() => setBettingTab('wheel-special')}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      bettingTab === 'wheel-special'
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-gray-800/50 text-emerald-300/70 hover:bg-gray-700/50'
                    }`}
                  >
                    🎯 Wheel Special
                  </button>
                </div>
              </div>

              <div className="p-3">
                {/* TABLE COMMON TAB */}
                {bettingTab === 'table-common' && (
                  <div className="space-y-1">
                    {/* Colors */}
                    <div className="bg-gray-800/50 rounded border border-red-500/30 p-1.5">
                      <h4 className="text-xs font-bold text-red-400 mb-1">Colors (1:1)</h4>
                      <div className="grid grid-cols-2 gap-1">
                        <button onClick={() => placeBet('red')} className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold relative">
                          <span className="flex flex-col items-center">
                            <span>Red</span>
                            <span className="text-[9px] opacity-70">[${getChipValue('red')}]</span>
                          </span>
                          {currentBets['red'] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets['red']}</span>}
                        </button>
                        <button onClick={() => placeBet('black')} className="bg-gray-900 border border-gray-600 text-white px-2 py-1 rounded text-xs font-bold relative">
                          <span className="flex flex-col items-center">
                            <span>Black</span>
                            <span className="text-[9px] opacity-70">[${getChipValue('black')}]</span>
                          </span>
                          {currentBets['black'] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets['black']}</span>}
                        </button>
                      </div>
                    </div>

                    {/* Even/Odd */}
                    <div className="bg-gray-800/50 rounded border border-blue-500/30 p-1.5">
                      <h4 className="text-xs font-bold text-blue-400 mb-1">Even/Odd (1:1)</h4>
                      <div className="grid grid-cols-2 gap-1">
                        <button onClick={() => placeBet('even')} className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold relative">
                          <span className="flex flex-col items-center">
                            <span>Even</span>
                            <span className="text-[9px] opacity-70">[${getChipValue('even')}]</span>
                          </span>
                          {currentBets['even'] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets['even']}</span>}
                        </button>
                        <button onClick={() => placeBet('odd')} className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold relative">
                          <span className="flex flex-col items-center">
                            <span>Odd</span>
                            <span className="text-[9px] opacity-70">[${getChipValue('odd')}]</span>
                          </span>
                          {currentBets['odd'] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets['odd']}</span>}
                        </button>
                      </div>
                    </div>

                    {/* Low/High */}
                    <div className="bg-gray-800/50 rounded border border-purple-500/30 p-1.5">
                      <h4 className="text-xs font-bold text-purple-400 mb-1">Low/High (1:1)</h4>
                      <div className="grid grid-cols-2 gap-1">
                        <button onClick={() => placeBet('low')} className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold relative">
                          <span className="flex flex-col items-center">
                            <span>Low (1-18)</span>
                            <span className="text-[9px] opacity-70">[${getChipValue('low')}]</span>
                          </span>
                          {currentBets['low'] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets['low']}</span>}
                        </button>
                        <button onClick={() => placeBet('high')} className="bg-pink-600 text-white px-2 py-1 rounded text-xs font-bold relative">
                          <span className="flex flex-col items-center">
                            <span>High (19-36)</span>
                            <span className="text-[9px] opacity-70">[${getChipValue('high')}]</span>
                          </span>
                          {currentBets['high'] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets['high']}</span>}
                        </button>
                      </div>
                    </div>

                    {/* Dozens & Columns */}
                    <div className="grid grid-cols-2 gap-1">
                      <div className="bg-gray-800/50 rounded border border-amber-500/30 p-1.5">
                        <h4 className="text-xs font-bold text-amber-400 mb-1">Dozens (2:1)</h4>
                        <div className="grid grid-cols-3 gap-1">
                          {['dozen1', 'dozen2', 'dozen3'].map((bet, i) => (
                            <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-amber-600 text-white px-1 py-1 rounded text-[9px] font-bold relative">
                              <span className="flex flex-col items-center">
                                <span>{i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}</span>
                                <span className="text-[8px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                              </span>
                              {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[7px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded border border-emerald-500/30 p-1.5">
                        <h4 className="text-xs font-bold text-emerald-400 mb-1">Columns (2:1)</h4>
                        <div className="grid grid-cols-3 gap-1">
                          {['col1', 'col2', 'col3'].map((bet, i) => (
                            <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-emerald-600 text-white px-1 py-1 rounded text-[9px] font-bold relative">
                              <span className="flex flex-col items-center">
                                <span>{i === 0 ? 'C1' : i === 1 ? 'C2' : 'C3'}</span>
                                <span className="text-[8px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                              </span>
                              {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[7px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TABLE SPECIAL TAB */}
                {bettingTab === 'table-special' && (
                  <div className="space-y-2">
                    {/* Six Groups */}
                    <div className="bg-gray-800/50 rounded-lg border border-teal-500/30 p-2">
                      <h4 className="text-xs font-bold text-teal-400 mb-2">Six Groups (5:1)</h4>
                      <div className="grid grid-cols-6 gap-1">
                        {['six1', 'six2', 'six3', 'six4', 'six5', 'six6'].map((bet, i) => (
                          <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-teal-600 text-white px-1 py-1 rounded text-[9px] font-bold relative">
                            <span className="flex flex-col items-center">
                              <span>{i+1}</span>
                              <span className="text-[7px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                            </span>
                            {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[7px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Alt Groups */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-800/50 rounded-lg border border-indigo-500/30 p-2">
                        <h4 className="text-[10px] font-bold text-indigo-400 mb-1.5">Alt-1 (1:1)</h4>
                        <div className="grid grid-cols-2 gap-1">
                          {['alt1_1', 'alt1_2'].map((bet) => (
                            <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-indigo-600 text-white px-1 py-1 rounded text-[9px] font-bold relative">
                              <span className="flex flex-col items-center">
                                <span>{bet === 'alt1_1' ? 'A' : 'B'}</span>
                                <span className="text-[7px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                              </span>
                              {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[7px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg border border-violet-500/30 p-2">
                        <h4 className="text-[10px] font-bold text-violet-400 mb-1.5">Alt-2 (1:1)</h4>
                        <div className="grid grid-cols-2 gap-1">
                          {['alt2_1', 'alt2_2'].map((bet) => (
                            <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-violet-600 text-white px-1 py-1 rounded text-[9px] font-bold relative">
                              <span className="flex flex-col items-center">
                                <span>{bet === 'alt2_1' ? 'AA' : 'BB'}</span>
                                <span className="text-[7px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                              </span>
                              {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[7px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg border border-fuchsia-500/30 p-2">
                        <h4 className="text-[10px] font-bold text-fuchsia-400 mb-1.5">Alt-3 (1:1)</h4>
                        <div className="grid grid-cols-2 gap-1">
                          {['alt3_1', 'alt3_2'].map((bet) => (
                            <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-fuchsia-600 text-white px-1 py-1 rounded text-[9px] font-bold relative">
                              <span className="flex flex-col items-center">
                                <span>{bet === 'alt3_1' ? 'AAA' : 'BBB'}</span>
                                <span className="text-[7px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                              </span>
                              {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[7px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Edge/Center */}
                    <div className="bg-gray-800/50 rounded-lg border border-amber-500/30 p-2">
                      <h4 className="text-xs font-bold text-amber-400 mb-2">Edge/Center (1:1)</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {['edge', 'center'].map((bet) => (
                          <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-amber-600 text-white px-2 py-1.5 rounded text-xs font-bold relative">
                            <span className="flex flex-col items-center">
                              <span>{bet === 'edge' ? 'Edge' : 'Center'}</span>
                              <span className="text-[9px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                            </span>
                            {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* WHEEL COMMON TAB */}
                {bettingTab === 'wheel-common' && (
                  <div className="space-y-2">
                    {/* Special Bets 1 */}
                    <div className="bg-gray-800/50 rounded-lg border border-purple-500/30 p-2">
                      <h4 className="text-xs font-bold text-purple-400 mb-2">Special Bets 1</h4>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { key: 'voisins', label: 'Voisins', sub: '0.5:1' },
                          { key: 'orphelins', label: 'Orphelins', sub: '3.5:1' },
                          { key: 'tiers', label: 'Tiers', sub: '2:1' },
                          { key: 'jeu_zero', label: 'Jeu Zero', sub: '4:1' }
                        ].map((bet) => (
                          <button key={bet.key} onClick={() => placeBet(bet.key as BetKey)} className="bg-purple-600 text-white px-1 py-1.5 rounded text-[9px] font-bold relative">
                            <div>{bet.label}</div>
                            <div className="text-[7px] text-purple-200">{bet.sub}</div>
                            <div className="text-[7px] opacity-70">[${getChipValue(bet.key as BetKey)}]</div>
                            {currentBets[bet.key as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[7px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet.key as BetKey]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Special Bets 2 */}
                    <div className="bg-gray-800/50 rounded-lg border border-indigo-500/30 p-2">
                      <h4 className="text-xs font-bold text-indigo-400 mb-2">Special Bets 2 (1:1)</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { key: 'voisin', label: 'Voisin' },
                          { key: 'non_voisin', label: 'Non-Voisin' }
                        ].map((bet) => (
                          <button key={bet.key} onClick={() => placeBet(bet.key as BetKey)} className="bg-indigo-600 text-white px-2 py-1.5 rounded text-xs font-bold relative">
                            <span className="flex flex-col items-center">
                              <span>{bet.label}</span>
                              <span className="text-[9px] opacity-70">[${getChipValue(bet.key as BetKey)}]</span>
                            </span>
                            {currentBets[bet.key as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet.key as BetKey]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 9's */}
                    <div className="bg-gray-800/50 rounded-lg border border-cyan-500/30 p-2">
                      <h4 className="text-xs font-bold text-cyan-400 mb-2">9's (3:1)</h4>
                      <div className="grid grid-cols-4 gap-1">
                        {['nine_1st', 'nine_2nd', 'nine_3rd', 'nine_4th'].map((bet, i) => (
                          <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-cyan-600 text-white px-1 py-1.5 rounded text-[9px] font-bold relative">
                            <span className="flex flex-col items-center">
                              <span>{i === 0 ? '1st 9' : i === 1 ? '2nd 9' : i === 2 ? '3rd 9' : '4th 9'}</span>
                              <span className="text-[7px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                            </span>
                            {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[7px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 18's */}
                    <div className="bg-gray-800/50 rounded-lg border border-green-500/30 p-2">
                      <h4 className="text-xs font-bold text-green-400 mb-2">(18's) (1:1)</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { key: 'right_18', label: 'Right' },
                          { key: 'left_18', label: 'Left' }
                        ].map((bet) => (
                          <button key={bet.key} onClick={() => placeBet(bet.key as BetKey)} className="bg-green-600 text-white px-2 py-1.5 rounded text-xs font-bold relative">
                            <span className="flex flex-col items-center">
                              <span>{bet.label}</span>
                              <span className="text-[9px] opacity-70">[${getChipValue(bet.key as BetKey)}]</span>
                            </span>
                            {currentBets[bet.key as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet.key as BetKey]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* WHEEL SPECIAL TAB */}
                {bettingTab === 'wheel-special' && (
                  <div className="space-y-2">
                    {/* A/B */}
                    <div className="bg-gray-800/50 rounded-lg border border-pink-500/30 p-2">
                      <h4 className="text-xs font-bold text-pink-400 mb-2">A/B (1:1)</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {['a', 'b'].map((bet) => (
                          <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-pink-600 text-white px-2 py-1.5 rounded text-xs font-bold relative">
                            <span className="flex flex-col items-center">
                              <span>{bet.toUpperCase()}</span>
                              <span className="text-[9px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                            </span>
                            {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AA/BB */}
                    <div className="bg-gray-800/50 rounded-lg border border-rose-500/30 p-2">
                      <h4 className="text-xs font-bold text-rose-400 mb-2">AA/BB (1:1)</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {['aa', 'bb'].map((bet) => (
                          <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-rose-600 text-white px-2 py-1.5 rounded text-xs font-bold relative">
                            <span className="flex flex-col items-center">
                              <span>{bet.toUpperCase()}</span>
                              <span className="text-[9px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                            </span>
                            {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AAA/BBB */}
                    <div className="bg-gray-800/50 rounded-lg border border-fuchsia-500/30 p-2">
                      <h4 className="text-xs font-bold text-fuchsia-400 mb-2">AAA/BBB (1:1)</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {['aaa', 'bbb'].map((bet) => (
                          <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-fuchsia-600 text-white px-2 py-1.5 rounded text-xs font-bold relative">
                            <span className="flex flex-col items-center">
                              <span>{bet.toUpperCase()}</span>
                              <span className="text-[9px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                            </span>
                            {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* A6/B6 */}
                    <div className="bg-gray-800/50 rounded-lg border border-violet-500/30 p-2">
                      <h4 className="text-xs font-bold text-violet-400 mb-2">A6/B6 (1:1)</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {['a6', 'b6'].map((bet) => (
                          <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-violet-600 text-white px-2 py-1.5 rounded text-xs font-bold relative">
                            <span className="flex flex-col items-center">
                              <span>{bet.toUpperCase()}</span>
                              <span className="text-[9px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                            </span>
                            {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* A9/B9 */}
                    <div className="bg-gray-800/50 rounded-lg border border-purple-500/30 p-2">
                      <h4 className="text-xs font-bold text-purple-400 mb-2">A9/B9 (1:1)</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {['a9', 'b9'].map((bet) => (
                          <button key={bet} onClick={() => placeBet(bet as BetKey)} className="bg-purple-600 text-white px-2 py-1.5 rounded text-xs font-bold relative">
                            <span className="flex flex-col items-center">
                              <span>{bet.toUpperCase()}</span>
                              <span className="text-[9px] opacity-70">[${getChipValue(bet as BetKey)}]</span>
                            </span>
                            {currentBets[bet as BetKey] > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[7px] rounded-full px-1 py-0.5 font-bold">{currentBets[bet as BetKey]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enter Number */}
          <div className="bg-gradient-to-br from-green-900/50 via-emerald-900/40 to-green-900/50 border-2 border-green-600/60 rounded-xl p-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 min-w-fit">
                <div className="bg-green-600/30 rounded-lg p-1">
                  <span className="text-base">🎲</span>
                </div>
                <div className="text-xs font-semibold text-green-200">Enter Number</div>
              </div>
              
              <input
                type="text"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddNumber()}
                placeholder="0-36"
                className="flex-1 bg-black/60 border-2 border-green-700/50 rounded-lg px-3 py-2 text-center text-2xl font-bold text-white focus:border-green-500 focus:outline-none max-w-[120px]"
              />
              
              <button
                onClick={handleAddNumber}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all"
              >
                ✓ Add & Calculate
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}