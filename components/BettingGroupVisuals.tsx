import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BettingGroupProps {
  title: string;
  numbers: number[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const BettingGroupVisuals: React.FC = () => {
  const [activeTab, setActiveTab] = useState('visual');

  // Betting groups configuration
  const bettingGroups: BettingGroupProps[] = [
    {
      title: '1:1 Payouts',
      numbers: Array.from({ length: 18 }, (_, i) => i + 1),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: '2:1 Payouts',
      numbers: Array.from({ length: 12 }, (_, i) => i + 1),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: '5:1 Payouts',
      numbers: Array.from({ length: 6 }, (_, i) => i + 1),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  // Sample data for detailed analysis
  const analysisData = [
    { group: 'Red', count: 48, percentage: 24.5, trend: '+2.3%', hot: true },
    { group: 'Black', count: 45, percentage: 23.0, trend: '-1.2%', hot: false },
    { group: 'Odd', count: 47, percentage: 24.0, trend: '+0.8%', hot: false },
    { group: 'Even', count: 46, percentage: 23.5, trend: '-0.5%', hot: false },
    { group: '1-18', count: 44, percentage: 22.4, trend: '-2.1%', hot: false },
    { group: '19-36', count: 49, percentage: 25.0, trend: '+3.2%', hot: true },
    { group: '1st 12', count: 31, percentage: 15.8, trend: '+1.1%', hot: false },
    { group: '2nd 12', count: 35, percentage: 17.9, trend: '+2.8%', hot: true },
    { group: '3rd 12', count: 30, percentage: 15.3, trend: '-1.7%', hot: false },
    { group: '1st Column', count: 32, percentage: 16.3, trend: '+0.5%', hot: false },
    { group: '2nd Column', count: 33, percentage: 16.8, trend: '+1.2%', hot: false },
    { group: '3rd Column', count: 31, percentage: 15.8, trend: '-0.9%', hot: false },
  ];

  const renderVisualGrid = (group: BettingGroupProps) => {
    const gridCols = group.numbers.length === 18 ? 'grid-cols-6' : 
                     group.numbers.length === 12 ? 'grid-cols-4' : 
                     'grid-cols-3';
    
    return (
      <div className={`grid ${gridCols} gap-1.5`}>
        {group.numbers.map((num) => (
          <div
            key={num}
            className={`${group.bgColor} ${group.borderColor} border rounded-md p-2 text-center font-semibold ${group.color} hover:opacity-80 transition-opacity`}
          >
            {num}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-xl">
      <CardHeader className="bg-gradient-to-r from-green-700 to-green-900 text-white">
        <CardTitle className="text-2xl font-bold">Table Layout Analysis</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="visual" className="text-sm font-medium">Visual Layout</TabsTrigger>
            <TabsTrigger value="analysis" className="text-sm font-medium">Detailed Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visual" className="space-y-6">
            {bettingGroups.map((group, index) => (
              <div key={index} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700">{group.title}</h3>
                {renderVisualGrid(group)}
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistical Breakdown</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Betting Group</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Hits</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Percentage</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Trend</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-800">{item.group}</td>
                        <td className="text-center py-3 px-4 text-gray-700">{item.count}</td>
                        <td className="text-center py-3 px-4">
                          <span className="font-semibold text-gray-700">{item.percentage}%</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`font-medium ${item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {item.trend}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          {item.hot ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              🔥 HOT
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              COLD
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600">Expected Value</div>
                  <div className="text-2xl font-bold text-gray-800">8.33%</div>
                  <div className="text-xs text-gray-500">Per group average</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600">Deviation</div>
                  <div className="text-2xl font-bold text-orange-600">±3.2%</div>
                  <div className="text-xs text-gray-500">From expected</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600">Hot Groups</div>
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-xs text-gray-500">Above threshold</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BettingGroupVisuals;