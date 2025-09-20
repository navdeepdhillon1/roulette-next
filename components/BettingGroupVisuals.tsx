//* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */



'use client'

import React, { useState } from 'react'

interface VisualizationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

const VisualizationModal: React.FC<VisualizationModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
          </div>
          {children}
        </div>
      </div>
    )
  }

export const BettingGroupHeaders = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null)

  const TableLayout = ({ highlightNumbers, colorMap }: { highlightNumbers: number[], colorMap?: Record<string, number[]> }) => {
    const isHighlighted = (num: number) => highlightNumbers.includes(num)
    
    const getColor = (num: number) => {
      if (colorMap) {
        for (const [color, numbers] of Object.entries(colorMap)) {
          if (numbers.includes(num)) return color
        }
      }
      return isHighlighted(num) ? 'bg-blue-500' : 'bg-gray-700'
    }
    
    return (
      <div className="bg-gray-900 p-4 rounded-lg min-w-[700px]">
        {/* Zero */}
        <div className="mb-2">
          <div className={`h-12 flex items-center justify-center font-bold text-white border-2 border-green-600 ${getColor(0)}`}>
            0
          </div>
        </div>
        
        {/* Main grid */}
        <div className="grid grid-cols-12 gap-1">
          {[3,6,9,12,15,18,21,24,27,30,33,36].map(n => (
            <div key={n} className={`h-12 flex items-center justify-center font-bold text-white border ${getColor(n)}`}>
              {n}
            </div>
          ))}
          {[2,5,8,11,14,17,20,23,26,29,32,35].map(n => (
            <div key={n} className={`h-12 flex items-center justify-center font-bold text-white border ${getColor(n)}`}>
              {n}
            </div>
          ))}
          {[1,4,7,10,13,16,19,22,25,28,31,34].map(n => (
            <div key={n} className={`h-12 flex items-center justify-center font-bold text-white border ${getColor(n)}`}>
              {n}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const visualizations = {
    'COLOR': (
      <>
        <TableLayout 
          highlightNumbers={[]}
          colorMap={{
            'bg-red-600': [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36],
            'bg-gray-900': [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35],
            'bg-green-600': [0]
          }}
        />
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded"></div>
            <span>Red Numbers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 border border-gray-600 rounded"></div>
            <span>Black Numbers</span>
          </div>
        </div>
      </>
    ),
    
    'E/O': (
      <>
        <TableLayout 
          highlightNumbers={[]}
          colorMap={{
            'bg-purple-600': [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36],
            'bg-cyan-600': [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35],
            'bg-green-600': [0]
          }}
        />
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded"></div>
            <span>Even Numbers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cyan-600 rounded"></div>
            <span>Odd Numbers</span>
          </div>
        </div>
      </>
    ),
    
    'L/H': (
      <>
        <TableLayout 
          highlightNumbers={[]}
          colorMap={{
            'bg-amber-700': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
            'bg-gray-600': [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36],
            'bg-green-600': [0]
          }}
        />
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-700 rounded"></div>
            <span>Low (1-18)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-600 rounded"></div>
            <span>High (19-36)</span>
          </div>
        </div>
      </>
    ),
    
    'COL': (
      <>
        <TableLayout 
          highlightNumbers={[]}
          colorMap={{
            'bg-orange-600': [1,4,7,10,13,16,19,22,25,28,31,34],
            'bg-teal-600': [2,5,8,11,14,17,20,23,26,29,32,35],
            'bg-lime-600': [3,6,9,12,15,18,21,24,27,30,33,36],
            'bg-green-600': [0]
          }}
        />
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-600 rounded"></div>
            <span>Column 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded"></div>
            <span>Column 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-lime-600 rounded"></div>
            <span>Column 3</span>
          </div>
        </div>
      </>
    ),
    
    'DOZ': (
      <>
        <TableLayout 
          highlightNumbers={[]}
          colorMap={{
            'bg-red-700': [1,2,3,4,5,6,7,8,9,10,11,12],
            'bg-cyan-700': [13,14,15,16,17,18,19,20,21,22,23,24],
            'bg-green-700': [25,26,27,28,29,30,31,32,33,34,35,36],
            'bg-green-600': [0]
          }}
        />
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-700 rounded"></div>
            <span>1st Dozen (1-12)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cyan-700 rounded"></div>
            <span>2nd Dozen (13-24)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-700 rounded"></div>
            <span>3rd Dozen (25-36)</span>
          </div>
        </div>
      </>
    ),
    
    'ALT 1': (
      <>
        <TableLayout 
          highlightNumbers={[]}
          colorMap={{
            'bg-emerald-600': [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33],
            'bg-pink-600': [4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36],
            'bg-green-600': [0]
          }}
        />
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 rounded"></div>
            <span>Group A: 1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-pink-600 rounded"></div>
            <span>Group B: 4,5,6,10,11,12,16,17,18,22,23,24,28,29,30,34,35,36</span>
          </div>
        </div>
      </>
    ),
    
    'ALT 2': (
      <>
        <TableLayout 
          highlightNumbers={[]}
          colorMap={{
            'bg-lime-700': [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30],
            'bg-purple-700': [7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36],
            'bg-green-600': [0]
          }}
        />
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-lime-700 rounded"></div>
            <span>Group AA: 1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-700 rounded"></div>
            <span>Group BB: 7,8,9,10,11,12,19,20,21,22,23,24,31,32,33,34,35,36</span>
          </div>
        </div>
      </>
    ),
    
    'ALT 3': (
      <>
        <TableLayout 
          highlightNumbers={[]}
          colorMap={{
            'bg-blue-600': [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27],
            'bg-yellow-700': [10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36],
            'bg-green-600': [0]
          }}
        />
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded"></div>
            <span>Group AAA: 1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-700 rounded"></div>
            <span>Group BBB: 10,11,12,13,14,15,16,17,18,28,29,30,31,32,33,34,35,36</span>
          </div>
        </div>
      </>
    ),
    
    'E/C': (
      <>
        <TableLayout 
          highlightNumbers={[]}
          colorMap={{
            'bg-purple-600': [1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36],
            'bg-orange-600': [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27],
            'bg-green-600': [0]
          }}
        />
        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded"></div>
            <span>Edge: 1,2,3,4,5,6,7,8,9,28,29,30,31,32,33,34,35,36</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-600 rounded"></div>
            <span>Center: 10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27</span>
          </div>
        </div>
      </>
    ),
    
    'SIXES': (
      <>
        <TableLayout 
          highlightNumbers={[]}
          colorMap={{
            'bg-red-800': [1,2,3,4,5,6],
            'bg-blue-800': [7,8,9,10,11,12],
            'bg-green-800': [13,14,15,16,17,18],
            'bg-yellow-800': [19,20,21,22,23,24],
            'bg-purple-800': [25,26,27,28,29,30],
            'bg-orange-800': [31,32,33,34,35,36],
            'bg-green-600': [0]
          }}
        />
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-800 rounded"></div>
            <span>1st Six (1-6)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-800 rounded"></div>
            <span>2nd Six (7-12)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-800 rounded"></div>
            <span>3rd Six (13-18)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-800 rounded"></div>
            <span>4th Six (19-24)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-800 rounded"></div>
            <span>5th Six (25-30)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-800 rounded"></div>
            <span>6th Six (31-36)</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <thead>
        <tr className="border-b-2 border-gray-600">
          <th className="p-2 text-center font-bold bg-gray-700">NUM</th>
          {Object.entries({
            'COLOR': 'Red/Black',
            'E/O': 'Even/Odd',
            'L/H': 'Low/High',
            'COL': 'Column',
            'DOZ': 'Dozen',
            'ALT 1': 'Streets',
            'ALT 2': 'Alt Streets',
            'ALT 3': 'Alt Streets',
            'E/C': 'Edge/Center',
            'SIXES': 'Six Lines'
          }).map(([key, subheader]) => (
            <th 
              key={key}
              className="p-2 text-center bg-gray-700 cursor-pointer hover:bg-gray-600 transition"
              onClick={() => setActiveModal(key)}
            >
              <div className="font-bold">{key}</div>
              <div className="text-xs text-gray-400 mt-1">{subheader}</div>
            </th>
          ))}
        </tr>
      </thead>

      {/* Modals */}
      {Object.entries(visualizations).map(([key, content]) => (
        <VisualizationModal
          key={key}
          isOpen={activeModal === key}
          onClose={() => setActiveModal(null)}
          title={`${key} Visualization`}
        >
          {content}
        </VisualizationModal>
      ))}
    </>
  )
}

// Export the updated history table section for RouletteSystem.tsx
// Replace the existing table header in your history section with:
// <BettingGroupHeaders spins={spins} />
// Instead of the current <thead>...</thead>