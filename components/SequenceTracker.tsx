'use client'
import React from 'react'

interface SequenceTrackerProps {
	history?: number[]
}

export default function SequenceTracker({ history = [] }: SequenceTrackerProps) {
	if (history.length === 0) return null
	return (
		<div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
			<h3 className="text-yellow-400 font-bold mb-2 text-sm">Sequence Tracker</h3>
			<p className="text-xs text-gray-300">
				Last {Math.min(history.length, 20)} spins: {history.slice(0, 20).join(', ')}
			</p>
		</div>
	)
}


