'use client'
/* eslint-disable react-hooks/exhaustive-deps */


import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getNumberProperties, detectAnomalies, NUMBERS } from '@/lib/roulette-logic'
import type { Session, Spin, Anomaly } from '@/lib/types'
import BettingGroupVisuals from './BettingGroupVisuals';

export default function RouletteSystem() {
  const [session, setSession] = useState<Session | null>(null)
  const [spins, setSpins] = useState<Spin[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [inputNumber, setInputNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'anomalies' | 'stats'>('entry')

  useEffect(() => {
    initializeSession()
  }, [])

  useEffect(() => {
    if (session) {
      loadSpins()
      loadAnomalies()
    }
  }, [session])

  const initializeSession = async () => {
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('*')
      .eq('is_active', true)
      .single()

    if (existingSession) {
      setSession(existingSession)
    } else {
      const { data: newSession } = await supabase
        .from('sessions')
        .insert({ is_active: true })
        .select()
        .single()
      
      if (newSession) {
        setSession(newSession)
        await supabase.rpc('set_active_session', { session_uuid: newSession.id })
      }
    }
  }

  const loadSpins = async () => {
    if (!session) return
    
    const { data } = await supabase
      .from('spins')
      .select('*')
      .eq('session_id', session.id)
      .order('spin_number', { ascending: false })
      .limit(100)
    
    if (data) {
      setSpins(data)
      const detected = detectAnomalies(data)
      if (detected.length > 0) {
        saveAnomalies(detected)
      }
    }
  }

  const loadAnomalies = async () => {
    if (!session) return
    
    const { data } = await supabase
      .from('anomalies')
      .select('*')
      .eq('session_id', session.id)
      .eq('resolved', false)
      .order('detected_at', { ascending: false })
    
    if (data) setAnomalies(data)
  }

  const saveAnomalies = async (detectedAnomalies: Anomaly[]) => {
    if (!session) return
    
    for (const anomaly of detectedAnomalies) {
      await supabase
        .from('anomalies')
        .insert({
          ...anomaly,
          session_id: session.id
        })
      
      setAnomalies(prev => [anomaly, ...prev])
    }
  }

  const addNumber = async () => {
    const num = parseInt(inputNumber)
    if (isNaN(num) || num < 0 || num > 36 || !session) return
    
    setLoading(true)
    const properties = getNumberProperties(num)
    const nextSpinNumber = spins.length > 0 ? spins[0].spin_number + 1 : 1
    
    const spinData: Omit<Spin, 'id' | 'created_at'> = {
      ...properties,
      session_id: session.id,
      spin_number: nextSpinNumber
    }
    
    const { data } = await supabase
      .from('spins')
      .insert(spinData)
      .select()
      .single()
    
    if (data) {
      const newSpins = [data, ...spins]
      setSpins(newSpins)
      
      const detected = detectAnomalies(newSpins)
      if (detected.length > 0) {
        saveAnomalies(detected)
      }
      
      setSession(prev => prev ? {
        ...prev,
        total_spins: prev.total_spins + 1
      } : null)
    }
    
    setInputNumber('')
    setLoading(false)
  }

  const resetSession = async () => {
    const { data: newSession } = await supabase
      .from('sessions')
      .insert({ is_active: true })
      .select()
      .single()
    
    if (newSession) {
      await supabase.rpc('set_active_session', { session_uuid: newSession.id })
      setSession(newSession)
      setSpins([])
      setAnomalies([])
    }
  }

  const getStatistics = () => {
    if (spins.length === 0) return null
    
    const stats = {
      reds: spins.filter(s => s.color === 'red').length,
      blacks: spins.filter(s => s.color === 'black').length,
      greens: spins.filter(s => s.color === 'green').length,
      evens: spins.filter(s => s.even_odd === 'even').length,
      odds: spins.filter(s => s.even_odd === 'odd').length,
      lows: spins.filter(s => s.low_high === 'low').length,
      highs: spins.filter(s => s.low_high === 'high').length,
      firstDozen: spins.filter(s => s.dozen === 'first').length,
      secondDozen: spins.filter(s => s.dozen === 'second').length,
      thirdDozen: spins.filter(s => s.dozen === 'third').length,
      col1: spins.filter(s => s.column_num === 1).length,
      col2: spins.filter(s => s.column_num === 2).length,
      col3: spins.filter(s => s.column_num === 3).length,
    }
    
    return stats
  }

  const stats = getStatistics()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
            Advanced Roulette Analysis System
          </h1>
          <p className="text-gray-400 mt-2">Anomaly Detection • Pattern Analysis • Statistical Tracking</p>
        </div>

        {session && (
          <div className="bg-gray-800 rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-6">
              <div>
                <span className="text-gray-400 text-sm">Session ID</span>
                <p className="font-mono text-sm">{session.id.slice(0, 8)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Total Spins</span>
                <p className="text-xl font-bold">{session.total_spins}</p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="text-right">
                <span className="text-gray-400 text-sm">Balance</span>
                <p className="text-2xl font-bold text-green-400">${session.balance.toFixed(2)}</p>
              </div>
              <button
                onClick={resetSession}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                New Session
              </button>
            </div>
          </div>
        )}

        {anomalies.filter(a => a.severity === 'critical').length > 0 && (
          <div className="bg-red-900/50 border-2 border-red-500 rounded-xl p-4 mb-6 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-red-400 font-bold">CRITICAL ANOMALY DETECTED!</h3>
                <p className="text-red-200">
                  {anomalies.filter(a => a.severity === 'critical')[0].description}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(['entry', 'history', 'stats', 'anomalies'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          {activeTab === 'entry' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Enter Winning Number</h2>
              
              <div className="flex gap-4">
                <input
                  type="number"
                  min="0"
                  max="36"
                  value={inputNumber}
                  onChange={(e) => setInputNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNumber()}
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter number (0-36)"
                  disabled={loading}
                />
                <button
                  onClick={addNumber}
                  disabled={loading || !inputNumber}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Adding...' : 'Add Number'}
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-gray-400">Quick Select:</h3>
                <div className="grid grid-cols-12 gap-2">
                  <button
                    onClick={() => setInputNumber('0')}
                    className="col-span-12 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition"
                  >
                    0
                  </button>
                  {[...Array(36)].map((_, i) => {
                    const num = i + 1
                    const color = NUMBERS.RED.includes(num) ? 'bg-red-600 hover:bg-red-700' : 
                                 'bg-gray-700 hover:bg-gray-600'
                    return (
                      <button
                        key={num}
                        onClick={() => setInputNumber(num.toString())}
                        className={`py-3 ${color} rounded-lg font-bold transition`}
                      >
                        {num}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Winning Numbers History</h2>
              
              {spins.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No spins recorded yet</p>
              ) : (
                <>
                  {/* Color Legend */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-600 rounded"></div>
                      <span className="text-sm">Red</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-900 border border-gray-600 rounded"></div>
                      <span className="text-sm">Black</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-600 rounded"></div>
                      <span className="text-sm">Green (0)</span>
                    </div>
                  </div>

                  {/* Comprehensive History Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                    
  

                      <tbody>
                        {spins.map((spin, index) => {
                          const num = spin.number
                          const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num)
                          const isBlack = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35].includes(num)
                          
                          // Calculate all betting groups
                          const alt1 = num === 0 ? '-' : 
                            [1,2,3,7,8,9,13,14,15,19,20,21,25,26,27,31,32,33].includes(num) ? 'A' : 'B'
                          
                          const alt2 = num === 0 ? '-' :
                            [1,2,3,4,5,6,13,14,15,16,17,18,25,26,27,28,29,30].includes(num) ? 'AA' : 'BB'
                          
                          const alt3 = num === 0 ? '-' :
                            [1,2,3,4,5,6,7,8,9,19,20,21,22,23,24,25,26,27].includes(num) ? 'AAA' : 'BBB'
                          
                          const edgeCenter = num === 0 ? '-' :
                            [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27].includes(num) ? 'C' : 'E'
                          
                          const sixGroup = num === 0 ? '-' :
                            num <= 6 ? '1st' :
                            num <= 12 ? '2nd' :
                            num <= 18 ? '3rd' :
                            num <= 24 ? '4th' :
                            num <= 30 ? '5th' : '6th'
                          
                          return (
                            <tr key={spin.id || index} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                              {/* Number with color background */}
                              <td className="p-2 text-center">
                                <div className={`
                                  inline-flex items-center justify-center w-10 h-10 rounded-full font-bold
                                  ${isRed ? 'bg-red-600' : isBlack ? 'bg-gray-900 border border-gray-600' : 'bg-green-600'}
                                `}>
                                  {num}
                                </div>
                              </td>
                              
                              {/* Color */}
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${isRed ? 'bg-red-600/30 text-red-400' :
                                    isBlack ? 'bg-gray-600/30 text-gray-300' :
                                    'bg-green-600/30 text-green-400'}
                                `}>
                                  {isRed ? 'R' : isBlack ? 'B' : 'G'}
                                </span>
                              </td>
                              
                              {/* Even/Odd */}
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${spin.even_odd === 'even' ? 'bg-purple-600/30 text-purple-400' :
                                    spin.even_odd === 'odd' ? 'bg-cyan-600/30 text-cyan-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {spin.even_odd === 'even' ? 'E' : spin.even_odd === 'odd' ? 'O' : '-'}
                                </span>
                              </td>
                              
                              {/* Low/High */}
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${spin.low_high === 'low' ? 'bg-amber-700/30 text-amber-400' :
                                    spin.low_high === 'high' ? 'bg-gray-600/30 text-gray-300' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {spin.low_high === 'low' ? 'L' : spin.low_high === 'high' ? 'H' : '-'}
                                </span>
                              </td>
                              
                              {/* Column */}
                              <td className="p-2 text-center">
                                <span className={`
                                  px-3 py-1 rounded text-xs font-bold
                                  ${spin.column_num === 1 ? 'bg-orange-600/30 text-orange-400' :
                                    spin.column_num === 2 ? 'bg-teal-600/30 text-teal-400' :
                                    spin.column_num === 3 ? 'bg-lime-600/30 text-lime-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {spin.column_num > 0 ? `${spin.column_num}st` : '-'}
                                </span>
                              </td>
                              
                              {/* Dozen */}
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${spin.dozen === 'first' ? 'bg-red-700/30 text-red-400' :
                                    spin.dozen === 'second' ? 'bg-cyan-700/30 text-cyan-400' :
                                    spin.dozen === 'third' ? 'bg-green-700/30 text-green-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {spin.dozen === 'first' ? '1st' : 
                                   spin.dozen === 'second' ? '2nd' : 
                                   spin.dozen === 'third' ? '3rd' : '-'}
                                </span>
                              </td>
                              
                              {/* Alt 1 (Streets A/B) */}
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${alt1 === 'A' ? 'bg-emerald-600/30 text-emerald-400' :
                                    alt1 === 'B' ? 'bg-pink-600/30 text-pink-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {alt1}
                                </span>
                              </td>
                              
                              {/* Alt 2 (Streets AA/BB) */}
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${alt2 === 'AA' ? 'bg-lime-700/30 text-lime-400' :
                                    alt2 === 'BB' ? 'bg-purple-700/30 text-purple-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {alt2}
                                </span>
                              </td>
                              
                              {/* Alt 3 (Streets AAA/BBB) */}
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${alt3 === 'AAA' ? 'bg-blue-600/30 text-blue-400' :
                                    alt3 === 'BBB' ? 'bg-yellow-700/30 text-yellow-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {alt3}
                                </span>
                              </td>
                              
                              {/* Edge/Center */}
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${edgeCenter === 'E' ? 'bg-purple-600/30 text-purple-400' :
                                    edgeCenter === 'C' ? 'bg-orange-600/30 text-orange-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {edgeCenter}
                                </span>
                              </td>
                              
                              {/* Sixes */}
                              <td className="p-2 text-center">
                                <span className={`
                                  px-2 py-1 rounded text-xs font-bold
                                  ${sixGroup === '1st' || sixGroup === '6th' ? 'bg-red-700/30 text-red-400' :
                                    sixGroup === '2nd' || sixGroup === '5th' ? 'bg-blue-700/30 text-blue-400' :
                                    sixGroup === '3rd' || sixGroup === '4th' ? 'bg-green-700/30 text-green-400' :
                                    'bg-gray-600/30 text-gray-400'}
                                `}>
                                  {sixGroup}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

{activeTab === 'stats' && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold mb-4">Statistical Analysis</h2>
    
    {!stats ? (
      <p className="text-gray-400 text-center py-8">No data to analyze yet</p>
    ) : (
      <>
        {/* Hot & Cold Numbers Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hot Numbers */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
              🔥 Hot Numbers
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {[21, 7, 14, 32, 9, 18].map((num) => (
                <div
                  key={num}
                  className="aspect-square flex items-center justify-center rounded bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold text-sm"
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* Cold Numbers */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
              ❄️ Cold Numbers
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {[4, 11, 28, 35, 2, 16].map((num) => (
                <div
                  key={num}
                  className="aspect-square flex items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm"
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* Pattern Alerts */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
              📊 Pattern Alerts
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
                <span>Red Streak</span>
                <span className="text-yellow-400 font-bold">5 in row</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800 rounded">
                <span>No Dozen 3</span>
                <span className="text-purple-400 font-bold">12 spins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Complete Statistical Tracking Table */}
        <div className="bg-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-700 to-green-900 text-white p-4">
            <h3 className="text-xl font-bold">Complete Statistical Analysis & Tracking</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-800">
                <tr>
                  <th rowSpan={2} className="text-left py-1 px-2 font-semibold text-gray-300 border-r border-gray-600">
                    Group
                  </th>
                  <th colSpan={4} className="text-center py-1 px-1 font-semibold text-green-400 border-r border-gray-600">
                    Hit Count
                  </th>
                  <th colSpan={2} className="text-center py-1 px-1 font-semibold text-purple-400 border-r border-gray-600">
                    Absence
                  </th>
                  <th colSpan={2} className="text-center py-1 px-1 font-semibold text-green-400 border-r border-gray-600">
                    Consec
                  </th>
                  <th rowSpan={2} className="text-center py-1 px-1 font-semibold text-blue-400 border-r border-gray-600">
                    Last<br/>Spin
                  </th>
                  <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-yellow-400 border-r border-gray-600">
                    %
                  </th>
                  <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-gray-400 border-r border-gray-600">
                    Exp%
                  </th>
                  <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-cyan-400 border-r border-gray-600">
                    Dev
                  </th>
                  <th rowSpan={2} className="text-center py-1 px-2 font-semibold text-gray-300">
                    Status
                  </th>
                </tr>
                <tr className="border-t border-gray-600">
                  <th className="text-center py-1 px-1 text-gray-400">L9</th>
                  <th className="text-center py-1 px-1 text-gray-400">L18</th>
                  <th className="text-center py-1 px-1 text-gray-400">L27</th>
                  <th className="text-center py-1 px-1 text-gray-400 border-r border-gray-600">L36</th>
                  <th className="text-center py-1 px-1 text-gray-400">Now</th>
                  <th className="text-center py-1 px-1 text-gray-400 border-r border-gray-600">Max</th>
                  <th className="text-center py-1 px-1 text-gray-400">Now</th>
                  <th className="text-center py-1 px-1 text-gray-400 border-r border-gray-600">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {/* Red */}
                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-red-400 border-r border-gray-600">Red</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1">7</td>
                  <td className="text-center py-1 px-1">7</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">7</td>
                  <td className="text-center py-1 px-1 text-yellow-400">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">12</td>
                  <td className="text-center py-1 px-1 text-green-400">2</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">10</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">0</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.reds / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.reds / spins.length > 0.486 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.reds / spins.length * 100) - 48.6).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-orange-900/50 text-orange-400">
                      HOT
                    </span>
                  </td>
                </tr>

                {/* Black */}
                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-gray-300 border-r border-gray-600">Black</td>
                  <td className="text-center py-1 px-1">5</td>
                  <td className="text-center py-1 px-1">8</td>
                  <td className="text-center py-1 px-1">9</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">10</td>
                  <td className="text-center py-1 px-1 text-yellow-400">2</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">8</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">7</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">2</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.blacks / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.blacks / spins.length > 0.486 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.blacks / spins.length * 100) - 48.6).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-900/50 text-blue-400">
                      COLD
                    </span>
                  </td>
                </tr>

                {/* Green */}
                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-green-400 border-r border-gray-600">Green</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1">1</td>
                  <td className="text-center py-1 px-1">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-1 text-orange-400">18</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">42</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">18</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.greens / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">2.7</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.greens / spins.length > 0.027 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.greens / spins.length * 100) - 2.7).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                {/* Even/Odd */}
                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-purple-400 border-r border-gray-600">Even</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1">8</td>
                  <td className="text-center py-1 px-1">11</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">14</td>
                  <td className="text-center py-1 px-1 text-yellow-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">6</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">4</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.evens / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.evens / spins.length > 0.486 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.evens / spins.length * 100) - 48.6).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-900/50 text-blue-400">
                      COLD
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-cyan-400 border-r border-gray-600">Odd</td>
                  <td className="text-center py-1 px-1">5</td>
                  <td className="text-center py-1 px-1">9</td>
                  <td className="text-center py-1 px-1">13</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">15</td>
                  <td className="text-center py-1 px-1 text-yellow-400">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">5</td>
                  <td className="text-center py-1 px-1 text-green-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">5</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">0</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.odds / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.odds / spins.length > 0.486 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.odds / spins.length * 100) - 48.6).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                {/* High/Low */}
                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-amber-400 border-r border-gray-600">1-18</td>
                  <td className="text-center py-1 px-1">3</td>
                  <td className="text-center py-1 px-1">7</td>
                  <td className="text-center py-1 px-1">10</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">12</td>
                  <td className="text-center py-1 px-1 text-yellow-400">3</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">7</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">3</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">3</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.lows / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.lows / spins.length > 0.486 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.lows / spins.length * 100) - 48.6).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-900/50 text-blue-400">
                      COLD
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-gray-300 border-r border-gray-600">19-36</td>
                  <td className="text-center py-1 px-1">6</td>
                  <td className="text-center py-1 px-1">10</td>
                  <td className="text-center py-1 px-1">13</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">15</td>
                  <td className="text-center py-1 px-1 text-yellow-400">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">5</td>
                  <td className="text-center py-1 px-1 text-green-400">3</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">6</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">0</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.highs / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.highs / spins.length > 0.486 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.highs / spins.length * 100) - 48.6).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-orange-900/50 text-orange-400">
                      HOT
                    </span>
                  </td>
                </tr>

                {/* Dozens */}
                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-red-500 border-r border-gray-600">1st Doz</td>
                  <td className="text-center py-1 px-1">3</td>
                  <td className="text-center py-1 px-1">5</td>
                  <td className="text-center py-1 px-1">7</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">8</td>
                  <td className="text-center py-1 px-1 text-yellow-400">2</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">15</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">2</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">2</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.firstDozen / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">32.4</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.firstDozen / spins.length > 0.324 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.firstDozen / spins.length * 100) - 32.4).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-cyan-500 border-r border-gray-600">2nd Doz</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1">6</td>
                  <td className="text-center py-1 px-1">9</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">11</td>
                  <td className="text-center py-1 px-1 text-yellow-400">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">10</td>
                  <td className="text-center py-1 px-1 text-green-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">3</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">0</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.secondDozen / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">32.4</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.secondDozen / spins.length > 0.324 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.secondDozen / spins.length * 100) - 32.4).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-orange-900/50 text-orange-400">
                      HOT
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-green-500 border-r border-gray-600">3rd Doz</td>
                  <td className="text-center py-1 px-1">2</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1">5</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">6</td>
                  <td className="text-center py-1 px-1 text-red-400 font-bold">12</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">18</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">12</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.thirdDozen / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">32.4</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-red-400">
                      {((stats.thirdDozen / spins.length * 100) - 32.4).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-red-900/50 text-red-400">
                      ALERT
                    </span>
                  </td>
                </tr>

                {/* Columns */}
                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-orange-400 border-r border-gray-600">1st Col</td>
                  <td className="text-center py-1 px-1">3</td>
                  <td className="text-center py-1 px-1">5</td>
                  <td className="text-center py-1 px-1">8</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">9</td>
                  <td className="text-center py-1 px-1 text-yellow-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">9</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">2</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.col1 / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">32.4</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.col1 / spins.length > 0.324 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.col1 / spins.length * 100) - 32.4).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-teal-400 border-r border-gray-600">2nd Col</td>
                  <td className="text-center py-1 px-1">3</td>
                  <td className="text-center py-1 px-1">6</td>
                  <td className="text-center py-1 px-1">8</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">10</td>
                  <td className="text-center py-1 px-1 text-yellow-400">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">7</td>
                  <td className="text-center py-1 px-1 text-green-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">3</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">0</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.col2 / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">32.4</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.col2 / spins.length > 0.324 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.col2 / spins.length * 100) - 32.4).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-lime-400 border-r border-gray-600">3rd Col</td>
                  <td className="text-center py-1 px-1">2</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1">5</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">6</td>
                  <td className="text-center py-1 px-1 text-yellow-400">4</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">11</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">4</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">
                    {(stats.col3 / spins.length * 100).toFixed(1)}
                  </td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">32.4</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className={stats.col3 / spins.length > 0.324 ? 'text-green-400' : 'text-red-400'}>
                      {((stats.col3 / spins.length * 100) - 32.4).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-900/50 text-blue-400">
                      COLD
                    </span>
                  </td>
                </tr>

                {/* Alternative Groups */}
                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-indigo-400 border-r border-gray-600">Alt1 A</td>
                  <td className="text-center py-1 px-1">5</td>
                  <td className="text-center py-1 px-1">8</td>
                  <td className="text-center py-1 px-1">11</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">14</td>
                  <td className="text-center py-1 px-1 text-yellow-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">6</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">3</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">48.2</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-red-400">-0.4</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-pink-400 border-r border-gray-600">Alt1 B</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1">9</td>
                  <td className="text-center py-1 px-1">12</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">13</td>
                  <td className="text-center py-1 px-1 text-yellow-400">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">7</td>
                  <td className="text-center py-1 px-1 text-green-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">4</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">0</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">49.1</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-green-400">+0.5</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-lime-500 border-r border-gray-600">Alt2 AA</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1">7</td>
                  <td className="text-center py-1 px-1">10</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">12</td>
                  <td className="text-center py-1 px-1 text-yellow-400">2</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">8</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">2</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">2</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">47.8</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-red-400">-0.8</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-purple-500 border-r border-gray-600">Alt2 BB</td>
                  <td className="text-center py-1 px-1">5</td>
                  <td className="text-center py-1 px-1">10</td>
                  <td className="text-center py-1 px-1">13</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">15</td>
                  <td className="text-center py-1 px-1 text-yellow-400">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">6</td>
                  <td className="text-center py-1 px-1 text-green-400">2</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">5</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">0</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">50.2</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-green-400">+1.6</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-orange-900/50 text-orange-400">
                      HOT
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-blue-400 border-r border-gray-600">Alt3 AAA</td>
                  <td className="text-center py-1 px-1">6</td>
                  <td className="text-center py-1 px-1">9</td>
                  <td className="text-center py-1 px-1">11</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">13</td>
                  <td className="text-center py-1 px-1 text-yellow-400">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">5</td>
                  <td className="text-center py-1 px-1 text-green-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">3</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">0</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">49.5</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-green-400">+0.9</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-yellow-500 border-r border-gray-600">Alt3 BBB</td>
                  <td className="text-center py-1 px-1">3</td>
                  <td className="text-center py-1 px-1">8</td>
                  <td className="text-center py-1 px-1">12</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">14</td>
                  <td className="text-center py-1 px-1 text-yellow-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">6</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">4</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">48.1</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-red-400">-0.5</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                {/* Edge/Center */}
                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-purple-400 border-r border-gray-600">Edge</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1">8</td>
                  <td className="text-center py-1 px-1">11</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">13</td>
                  <td className="text-center py-1 px-1 text-yellow-400">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">7</td>
                  <td className="text-center py-1 px-1 text-green-400">2</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">4</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">0</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">48.9</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-green-400">+0.3</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-orange-500 border-r border-gray-600">Center</td>
                  <td className="text-center py-1 px-1">5</td>
                  <td className="text-center py-1 px-1">9</td>
                  <td className="text-center py-1 px-1">12</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">14</td>
                  <td className="text-center py-1 px-1 text-yellow-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">5</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">3</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">48.3</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">48.6</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-red-400">-0.3</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                {/* Six Groups */}
                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-red-400 border-r border-gray-600">1st Six</td>
                  <td className="text-center py-1 px-1">2</td>
                  <td className="text-center py-1 px-1">3</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">5</td>
                  <td className="text-center py-1 px-1 text-yellow-400">3</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">15</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">3</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">15.2</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">16.2</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-red-400">-1.0</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-blue-500 border-r border-gray-600">2nd Six</td>
                  <td className="text-center py-1 px-1">1</td>
                  <td className="text-center py-1 px-1">2</td>
                  <td className="text-center py-1 px-1">3</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">4</td>
                  <td className="text-center py-1 px-1 text-yellow-400">2</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">12</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">2</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">14.8</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">16.2</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-red-400">-1.4</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-900/50 text-blue-400">
                      COLD
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-green-500 border-r border-gray-600">3rd Six</td>
                  <td className="text-center py-1 px-1">2</td>
                  <td className="text-center py-1 px-1">3</td>
                  <td className="text-center py-1 px-1">5</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">6</td>
                  <td className="text-center py-1 px-1 text-yellow-400">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">10</td>
                  <td className="text-center py-1 px-1 text-green-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">2</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">0</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">17.5</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">16.2</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-green-400">+1.3</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-green-500 border-r border-gray-600">4th Six</td>
                  <td className="text-center py-1 px-1">2</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1">5</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">6</td>
                  <td className="text-center py-1 px-1 text-yellow-400">1</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">11</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">2</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">16.8</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">16.2</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-green-400">+0.6</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                      NORM
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-blue-500 border-r border-gray-600">5th Six</td>
                  <td className="text-center py-1 px-1">1</td>
                  <td className="text-center py-1 px-1">3</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">5</td>
                  <td className="text-center py-1 px-1 text-yellow-400">4</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">14</td>
                  <td className="text-center py-1 px-1">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">1</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">4</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">15.1</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">16.2</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-red-400">-1.1</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-blue-900/50 text-blue-400">
                      COLD
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-600/50 transition-colors">
                  <td className="py-1 px-2 font-medium text-red-400 border-r border-gray-600">6th Six</td>
                  <td className="text-center py-1 px-1">2</td>
                  <td className="text-center py-1 px-1">3</td>
                  <td className="text-center py-1 px-1">4</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">5</td>
                  <td className="text-center py-1 px-1 text-yellow-400">0</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">9</td>
                  <td className="text-center py-1 px-1 text-green-400">2</td>
                  <td className="text-center py-1 px-1 border-r border-gray-600">3</td>
                  <td className="text-center py-1 px-1 text-blue-400 font-bold border-r border-gray-600">0</td>
                  <td className="text-center py-1 px-2 font-semibold border-r border-gray-600">17.2</td>
                  <td className="text-center py-1 px-2 text-gray-400 border-r border-gray-600">16.2</td>
                  <td className="text-center py-1 px-2 border-r border-gray-600">
                    <span className="text-green-400">+1.0</span>
                  </td>
                  <td className="text-center py-1 px-2">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-orange-900/50 text-orange-400">
                      HOT
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-xs text-gray-400">Total Spins</div>
              <div className="text-xl font-bold text-white">{spins.length}</div>
              <div className="text-xs text-gray-500">Current session</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-xs text-gray-400">Max Absence</div>
              <div className="text-xl font-bold text-red-400">18</div>
              <div className="text-xs text-gray-500">Green (0)</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-xs text-gray-400">Critical Alert</div>
              <div className="text-xl font-bold text-orange-400">3rd Doz</div>
              <div className="text-xs text-gray-500">12 spins missing</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="text-xs text-gray-400">Hot Groups</div>
              <div className="text-xl font-bold text-green-400">3</div>
              <div className="text-xs text-gray-500">Above expected</div>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
)}

          {activeTab === 'anomalies' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Anomaly Detection</h2>
              
              {anomalies.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No anomalies detected</p>
                  <p className="text-sm text-gray-500 mt-2">System monitors for statistical impossibilities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {anomalies.map((anomaly, index) => (
                    <div
                      key={anomaly.id || index}
                      className={`
                        p-4 rounded-lg border-2 
                        ${anomaly.severity === 'critical' ? 'border-red-500 bg-red-900/20' :
                          anomaly.severity === 'high' ? 'border-orange-500 bg-orange-900/20' :
                          anomaly.severity === 'medium' ? 'border-yellow-500 bg-yellow-900/20' :
                          'border-blue-500 bg-blue-900/20'}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">
                              {anomaly.anomaly_type.replace('_', ' ').toUpperCase()}
                            </h3>
                            <span className={`
                              px-3 py-1 rounded-full text-xs font-bold uppercase
                              ${anomaly.severity === 'critical' ? 'bg-red-600' :
                                anomaly.severity === 'high' ? 'bg-orange-600' :
                                anomaly.severity === 'medium' ? 'bg-yellow-600' :
                                'bg-blue-600'}
                            `}>
                              {anomaly.severity}
                            </span>
                          </div>
                          <p className="text-gray-300">{anomaly.description}</p>
                          {anomaly.pattern_data && (
                            <div className="mt-2 text-xs text-gray-400">
                              Pattern data: {JSON.stringify(anomaly.pattern_data)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}