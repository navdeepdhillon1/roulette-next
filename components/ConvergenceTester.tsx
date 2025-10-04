// ConvergenceTester.tsx
// Testing and validation component for convergence algorithm

import React, { useState, useEffect } from 'react';
// Import the convergence functions - adjust path as needed based on your structure
import { calculateConvergence, getConvergenceStrength, type ConvergenceResult } from '../lib/convergenceEngine';

interface TestCase {
  name: string;
  description: string;
  history: number[];
  expectedBehavior: string;
  passed?: boolean;
  result?: TestResult;
}

interface TestResult {
  predictions: number[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  activePatterns: string[];
  strength: number;
  interpretation: string;
  reasoning: string;
}

interface CustomTestResult extends ConvergenceResult {
  strength?: number;
  interpretation?: string;
}

const ConvergenceTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestCase[]>([]);
  const [customHistory, setCustomHistory] = useState<string>('');
  const [customResult, setCustomResult] = useState<CustomTestResult | null>(null);
  
  // Predefined test cases
  const testCases: TestCase[] = [
    {
      name: 'Red Streak Test',
      description: 'Strong red number streak should trigger convergence',
      history: [1, 3, 5, 7, 9, 12, 14, 16, 18, 1, 3, 5, 7, 9, 12, 14, 16, 18],
      expectedBehavior: 'Should detect red pattern and predict red numbers'
    },
    {
      name: 'Dozen 1 Dominance',
      description: 'First dozen appearing frequently',
      history: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      expectedBehavior: 'Should heavily favor numbers 1-12'
    },
    {
      name: 'Sector Clustering',
      description: 'Voisins sector concentration',
      history: [0, 2, 3, 4, 7, 12, 15, 18, 19, 21, 22, 25, 26, 28, 29, 32, 35, 0, 2, 3],
      expectedBehavior: 'Should identify Voisins sector pattern'
    },
    {
      name: 'Multiple Group Convergence',
      description: 'Numbers appearing in multiple groups',
      history: [1, 1, 1, 13, 13, 13, 25, 25, 25, 2, 14, 26, 3, 15, 27, 1, 13, 25],
      expectedBehavior: 'Should identify column 1 pattern (1,4,7,10,13...)'
    },
    {
      name: 'Chaos Pattern',
      description: 'Random distribution with no clear pattern',
      history: [5, 17, 23, 8, 31, 2, 19, 11, 36, 0, 14, 27, 33, 6, 22, 12, 29, 4, 35, 15],
      expectedBehavior: 'Should show LOW confidence due to high entropy'
    },
    {
      name: 'Six Group B1 Pattern',
      description: 'First six group (1-6) appearing frequently',
      history: [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 17, 23, 1, 2, 3, 4, 5, 6],
      expectedBehavior: 'Should strongly favor numbers 1-6'
    },
    {
      name: 'Cold Number Absence',
      description: 'Certain numbers completely missing',
      history: [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
      expectedBehavior: 'Convergence should focus on hot numbers (1-5), not cold ones'
    },
    {
      name: 'Alternating Pattern',
      description: 'Red/Black alternation',
      history: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21],
      expectedBehavior: 'Should detect alternating pattern with medium confidence'
    }
  ];
  
  // Run all tests
  const runTests = () => {
    const results = testCases.map(testCase => {
      const result = calculateConvergence(testCase.history);
      const strength = getConvergenceStrength(result);
      
      // Basic validation
      let passed = true;
      
      // Check if result has required properties
      if (!result.numbers || result.numbers.length === 0) passed = false;
      if (!result.confidence) passed = false;
      if (!result.reasoning || result.reasoning.length === 0) passed = false;
      
      // Specific test validations
      if (testCase.name === 'Red Streak Test') {
        const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
        const redCount = result.numbers.filter((n: number) => redNumbers.includes(n)).length;
        if (redCount < 3) passed = false; // At least 3 red numbers expected
      }
      
      if (testCase.name === 'Dozen 1 Dominance') {
        const dozen1Count = result.numbers.filter((n: number) => n >= 1 && n <= 12).length;
        if (dozen1Count < 3) passed = false; // At least 3 from dozen 1
      }
      
      if (testCase.name === 'Chaos Pattern') {
        if (result.confidence !== 'LOW') passed = false; // Should be low confidence
      }
      
      if (testCase.name === 'Six Group B1 Pattern') {
        const b1Count = result.numbers.filter((n: number) => n >= 1 && n <= 6).length;
        if (b1Count < 3) passed = false; // At least 3 from B1 group
      }
      
      return {
        ...testCase,
        passed,
        result: {
          predictions: result.numbers,
          confidence: result.confidence,
          activePatterns: result.activePatterns,
          strength: strength.strength,
          interpretation: strength.interpretation,
          reasoning: result.reasoning[0] // First reasoning line
        }
      };
    });
    
    setTestResults(results);
  };
  
  // Test custom history
  const testCustomHistory = () => {
    try {
      const numbers = customHistory
        .split(',')
        .map((n: string) => parseInt(n.trim()))
        .filter((n: number) => !isNaN(n) && n >= 0 && n <= 36);
      
      if (numbers.length > 0) {
        const result = calculateConvergence(numbers);
        const strength = getConvergenceStrength(result);
        setCustomResult({
          ...result,
          strength: strength.strength,
          interpretation: strength.interpretation
        });
      }
    } catch (error) {
      console.error('Error parsing custom history:', error);
    }
  };
  
  // Run tests on mount
  useEffect(() => {
    runTests();
  }, []);
  
  return (
    <div className="space-y-6 p-6 bg-gray-900 text-white rounded-lg">
      <div className="border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold mb-2">🧪 Convergence Algorithm Tester</h2>
        <p className="text-gray-400 text-sm">
          Validate the IDF-weighted convergence algorithm with various test patterns
        </p>
      </div>
      
      {/* Test Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Test Cases</h3>
          <button
            onClick={runTests}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            🔄 Re-run Tests
          </button>
        </div>
        
        <div className="grid gap-4">
          {testResults.map((test, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                test.passed ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {test.passed ? '✅' : '❌'}
                    </span>
                    <h4 className="font-semibold">{test.name}</h4>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{test.description}</p>
                </div>
                <div className="text-right">
                  {test.result && (
                    <>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        test.result.confidence === 'HIGH' ? 'bg-green-600' :
                        test.result.confidence === 'MEDIUM' ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}>
                        {test.result.confidence}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {test.result.strength.toFixed(0)}% strength
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {test.result && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Predictions:</span>
                    <div className="flex gap-1">
                      {test.result.predictions.slice(0, 5).map((num: number, idx: number) => (
                        <span key={idx} className="bg-gray-700 px-2 py-1 rounded text-xs">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    <span className="text-gray-500">Active Patterns:</span> {test.result.activePatterns?.join(', ') || 'None'}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    <span className="text-gray-500">Reasoning:</span> {test.result.reasoning}
                  </div>
                  
                  <div className="text-xs">
                    <span className="text-gray-500">Expected:</span>
                    <span className={test.passed ? 'text-green-400' : 'text-red-400'}>
                      {' '}{test.expectedBehavior}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Custom History Tester */}
      <div className="border-t border-gray-700 pt-4 space-y-4">
        <h3 className="text-lg font-semibold">Custom History Tester</h3>
        <div className="space-y-2">
          <label className="text-sm text-gray-400">
            Enter numbers separated by commas (e.g., 1,2,3,4,5,17,23,32)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customHistory}
              onChange={(e) => setCustomHistory(e.target.value)}
              placeholder="1,2,3,4,5,17,23,32..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <button
              onClick={testCustomHistory}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Test Convergence
            </button>
          </div>
        </div>
        
        {customResult && (
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Custom Test Result</h4>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                customResult.confidence === 'HIGH' ? 'bg-green-600' :
                customResult.confidence === 'MEDIUM' ? 'bg-yellow-600' :
                'bg-red-600'
              }`}>
                {customResult.confidence} CONFIDENCE
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Predicted Numbers:</p>
                <div className="flex gap-1 flex-wrap">
                  {customResult.numbers.map((num: number, idx: number) => (
                    <span key={idx} className="bg-blue-600 px-2 py-1 rounded text-sm font-bold">
                      {num}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Convergence Metrics:</p>
                <div className="text-sm space-y-1">
                  <div>Strength: <span className="text-white font-semibold">{customResult.strength?.toFixed(1)}%</span></div>
                  <div>Interpretation: <span className="text-white">{customResult.interpretation}</span></div>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-1">Active Patterns:</p>
              <p className="text-xs text-white">{customResult.activePatterns?.join(', ') || 'None detected'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-1">Reasoning:</p>
              <ul className="text-xs text-white space-y-1">
                {customResult.reasoning.map((reason: string, idx: number) => (
                  <li key={idx}>• {reason}</li>
                ))}
              </ul>
            </div>
            
            {customResult.scores && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Top 10 Scores:</p>
                <div className="flex gap-2 flex-wrap text-xs">
                  {Array.from(customResult.scores.entries())
                    .sort((a: [number, number], b: [number, number]) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([num, score]: [number, number]) => (
                      <span key={num} className="bg-gray-700 px-2 py-1 rounded">
                        #{num}: {score.toFixed(2)}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Algorithm Details */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-3">📊 Algorithm Details</h3>
        <div className="bg-gray-800 rounded-lg p-4 text-sm space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-blue-400 mb-1">IDF Weighting Formula:</h4>
              <code className="text-xs bg-gray-900 p-2 rounded block">
                IDF = log(37 / groupSize)
              </code>
            </div>
            <div>
              <h4 className="font-semibold text-blue-400 mb-1">Family Weights:</h4>
              <div className="text-xs space-y-1">
                <div>Individual: 1.2</div>
                <div>Six Groups: 1.0</div>
                <div>Wheel Sectors: 0.9</div>
                <div>Dozens/Columns: 0.8</div>
                <div>Binary: 0.6</div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-blue-400 mb-1">Convergence Score:</h4>
            <code className="text-xs bg-gray-900 p-2 rounded block">
              score = Σ(IDF × familyWeight × streakBonus × deviationBonus)
            </code>
          </div>
          
          <div>
            <h4 className="font-semibold text-blue-400 mb-1">De-duplication:</h4>
            <p className="text-xs">
              If a number appears in &gt;3 families: Apply 0.8x penalty to prevent overcounting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvergenceTester;