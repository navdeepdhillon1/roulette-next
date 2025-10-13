import React, { createContext, useContext, useState, ReactNode } from 'react';

export type CardType = 'advisor' | 'probability' | 'betting';

export interface CardPosition {
  x: number;
  y: number;
}

export interface OpenCard {
  id: string;
  type: CardType;
  position: CardPosition;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface CardManagerContextType {
  openCards: OpenCard[];
  openCard: (type: CardType, position?: CardPosition) => void;
  closeCard: (id: string) => void;
  minimizeCard: (id: string) => void;
  maximizeCard: (id: string) => void;
  updatePosition: (id: string, position: CardPosition) => void;
  bringToFront: (id: string) => void;
}

const CardManagerContext = createContext<CardManagerContextType | undefined>(undefined);

export const useCardManager = () => {
  const context = useContext(CardManagerContext);
  if (!context) {
    throw new Error('useCardManager must be used within CardManagerProvider');
  }
  return context;
};

interface CardManagerProviderProps {
  children: ReactNode;
}

export const CardManagerProvider: React.FC<CardManagerProviderProps> = ({ children }) => {
  const [openCards, setOpenCards] = useState<OpenCard[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(1000);

  const openCard = (type: CardType, position?: CardPosition) => {
    // Check if card of this type is already open
    const existingCard = openCards.find(card => card.type === type);
    if (existingCard) {
      // If minimized, restore it
      if (existingCard.isMinimized) {
        minimizeCard(existingCard.id);
      }
      // Bring to front
      bringToFront(existingCard.id);
      return;
    }

    // Create new card
    const defaultPositions: Record<CardType, CardPosition> = {
      advisor: { x: 100, y: 100 },
      probability: { x: 150, y: 150 },
      betting: { x: 200, y: 200 },
    };

    const newZIndex = highestZIndex + 1;
    setHighestZIndex(newZIndex);

    const newCard: OpenCard = {
      id: `${type}-${Date.now()}`,
      type,
      position: position || defaultPositions[type],
      isMinimized: false,
      isMaximized: false,
      zIndex: newZIndex,
    };

    setOpenCards(prev => [...prev, newCard]);
  };

  const closeCard = (id: string) => {
    setOpenCards(prev => prev.filter(card => card.id !== id));
  };

  const minimizeCard = (id: string) => {
    setOpenCards(prev =>
      prev.map(card =>
        card.id === id ? { ...card, isMinimized: !card.isMinimized } : card
      )
    );
  };

  const maximizeCard = (id: string) => {
    setOpenCards(prev =>
      prev.map(card =>
        card.id === id ? { ...card, isMaximized: !card.isMaximized } : card
      )
    );
  };

  const updatePosition = (id: string, position: CardPosition) => {
    setOpenCards(prev =>
      prev.map(card =>
        card.id === id ? { ...card, position } : card
      )
    );
  };

  const bringToFront = (id: string) => {
    const newZIndex = highestZIndex + 1;
    setHighestZIndex(newZIndex);
    setOpenCards(prev =>
      prev.map(card =>
        card.id === id ? { ...card, zIndex: newZIndex } : card
      )
    );
  };

  return (
    <CardManagerContext.Provider
      value={{
        openCards,
        openCard,
        closeCard,
        minimizeCard,
        maximizeCard,
        updatePosition,
        bringToFront,
      }}
    >
      {children}
    </CardManagerContext.Provider>
  );
};