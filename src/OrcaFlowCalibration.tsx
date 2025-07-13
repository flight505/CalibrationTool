import React, { useState, useEffect } from 'react';
import { Calculator, Ruler, AlertCircle, CheckCircle, Download, RotateCcw, Info } from 'lucide-react';

const OrcaFlowCalibration = () => {
  const [nozzleSize, setNozzleSize] = useState(0.4);
  const [currentFlow, setCurrentFlow] = useState(100);
  const [singleWallMeasurements, setSingleWallMeasurements] = useState(['', '', '', '']);
  const [tripleWallMeasurements, setTripleWallMeasurements] = useState(['', '', '', '']);
  const [results, setResults] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const calculateFlowRate = () => {
    // Filter out empty measurements
    const validSingle = singleWallMeasurements.filter(m => m && !isNaN(parseFloat(m))).map(m => parseFloat(m));
    const validTriple = tripleWallMeasurements.filter(m => m && !isNaN(parseFloat(m))).map(m => parseFloat(m));

    if (validSingle.length === 0 && validTriple.length === 0) {
      alert('Please enter at least one measurement');
      return;
    }

    // Calculate averages
    const singleAvg = validSingle.length > 0 
      ? validSingle.reduce((a, b) => a + b, 0) / validSingle.length 
      : null;
    
    const tripleAvg = validTriple.length > 0 
      ? validTriple.reduce((a, b) => a + b, 0) / validTriple.length 
      : null;

    // Calculate flow percentages
    const singleFlowPercent = singleAvg ? (nozzleSize / singleAvg) * 100 : null;
    const tripleFlowPercent = tripleAvg ? ((nozzleSize * 3) / tripleAvg) * 100 : null;

    // Calculate overall average flow percentage
    let avgFlowPercent;
    if (singleFlowPercent && tripleFlowPercent) {
      avgFlowPercent = (singleFlowPercent + tripleFlowPercent) / 2;
    } else {
      avgFlowPercent = singleFlowPercent || tripleFlowPercent;
    }

    // Calculate new flow rate
    const newFlowRate = (currentFlow * avgFlowPercent) / 100;

    setResults({
      singleWallAvg: singleAvg,
      tripleWallAvg: tripleAvg,
      singleFlowPercent,
      tripleFlowPercent,
      avgFlowPercent,
      newFlowRate: newFlowRate.toFixed(2),
      adjustment: ((avgFlowPercent - 100)).toFixed(2)
    });
  };

  const resetCalculator = () => {
    setSingleWallMeasurements(['', '', '', '']);
    setTripleWallMeasurements(['', '', '', '']);
    setResults(null);
  };

  const exportResults = () => {
    if (!results) return;
    
    const data = `Orca Slicer Flow Calibration Results
=====================================
Date: ${new Date().toLocaleString()}
Nozzle Size: ${nozzleSize}mm
Current Flow Rate: ${currentFlow}%

Single Wall Measurements: ${singleWallMeasurements.filter(m => m).join(', ')}mm
Single Wall Average: ${results.singleWallAvg?.toFixed(3) || 'N/A'}mm
Single Wall Flow %: ${results.singleFlowPercent?.toFixed(2) || 'N/A'}%

Triple Wall Measurements: ${tripleWallMeasurements.filter(m => m).join(', ')}mm
Triple Wall Average: ${results.tripleWallAvg?.toFixed(3) || 'N/A'}mm
Triple Wall Flow %: ${results.tripleFlowPercent?.toFixed(2) || 'N/A'}%

Overall Average Flow %: ${results.avgFlowPercent.toFixed(2)}%
Recommended New Flow Rate: ${results.newFlowRate}%
Adjustment: ${results.adjustment > 0 ? '+' : ''}${results.adjustment}%`;

    const blob = new Blob([data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow_calibration_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Calculator className="text-blue-600" size={36} />
          Orca Slicer Flow Calibration Tool
        </h1>
        <p className="text-gray-600 mb-6">Precision flow rate calibration using dual-wall measurement cube</p>

        {showInstructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
                <Info size={24} />
                Calibration Instructions
              </h2>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-blue-700 mb-2">1. Prepare Your Print</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Set line width in Orca Slicer to exactly {nozzleSize}mm</li>
                  <li>• Use 2 perimeters, 0% infill</li>
                  <li>• Set "Wall Generator" to Classic</li>
                  <li>• Disable "Detect thin walls"</li>
                  <li>• Set layer height to 0.2mm</li>
                  <li>• Print the calibration cube STL</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-700 mb-2">2. Measure & Calculate</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Measure the <strong>upper single wall</strong> (0.4mm target)</li>
                  <li>• Measure the <strong>lower triple wall</strong> (1.2mm target)</li>
                  <li>• Take measurements on all 4 sides</li>
                  <li>• Use calipers with 0.01mm precision</li>
                  <li>• Avoid measuring near corners</li>
                  <li>• Enter values below for automatic calculation</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Pro Tip:</strong> The dual-wall design provides better accuracy by testing both thin and thick wall extrusion in a single print. 
                The algorithm averages both measurements for optimal results.
              </p>
            </div>
          </div>
        )}

        {!showInstructions && (
          <button
            onClick={() => setShowInstructions(true)}
            className="text-blue-600 hover:text-blue-800 text-sm mb-4"
          >
            Show Instructions
          </button>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Printer Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nozzle Size (mm)
                </label>
                <select
                  value={nozzleSize}
                  onChange={(e) => setNozzleSize(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0.4">0.4mm (Standard)</option>
                  <option value="0.6">0.6mm</option>
                  <option value="0.8">0.8mm</option>
                  <option value="0.2">0.2mm</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Current Flow Rate (%)
                </label>
                <input
                  type="number"
                  value={currentFlow}
                  onChange={(e) => setCurrentFlow(parseFloat(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Visual Guide</h3>
            <div className="bg-white p-4 rounded border-2 border-gray-300">
              <svg viewBox="0 0 200 200" className="w-full h-32">
                {/* Cube outline */}
                <rect x="20" y="20" width="160" height="160" fill="none" stroke="#374151" strokeWidth="2"/>
                
                {/* Upper single wall section */}
                <rect x="20" y="20" width="160" height="60" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2"/>
                <text x="100" y="55" textAnchor="middle" className="text-sm font-semibold fill-blue-700">
                  Single Wall (0.4mm)
                </text>
                
                {/* Lower triple wall section */}
                <rect x="20" y="80" width="160" height="100" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
                <text x="100" y="135" textAnchor="middle" className="text-sm font-semibold fill-yellow-700">
                  Triple Wall (1.2mm)
                </text>
                
                {/* Measurement indicators */}
                <path d="M 10 50 L 15 50" stroke="#3B82F6" strokeWidth="2"/>
                <path d="M 185 50 L 190 50" stroke="#3B82F6" strokeWidth="2"/>
                <path d="M 10 130 L 15 130" stroke="#F59E0B" strokeWidth="2"/>
                <path d="M 185 130 L 190 130" stroke="#F59E0B" strokeWidth="2"/>
              </svg>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Measure wall thickness at marked locations
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-700 mb-4 flex items-center gap-2">
              <Ruler size={20} />
              Single Wall Measurements ({nozzleSize}mm target)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {singleWallMeasurements.map((value, index) => (
                <div key={index}>
                  <label className="block text-sm text-gray-600 mb-1">Side {index + 1}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => {
                      const newMeasurements = [...singleWallMeasurements];
                      newMeasurements[index] = e.target.value;
                      setSingleWallMeasurements(newMeasurements);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-700 mb-4 flex items-center gap-2">
              <Ruler size={20} />
              Triple Wall Measurements ({(nozzleSize * 3).toFixed(1)}mm target)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {tripleWallMeasurements.map((value, index) => (
                <div key={index}>
                  <label className="block text-sm text-gray-600 mb-1">Side {index + 1}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => {
                      const newMeasurements = [...tripleWallMeasurements];
                      newMeasurements[index] = e.target.value;
                      setTripleWallMeasurements(newMeasurements);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={calculateFlowRate}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <Calculator size={20} />
            Calculate Flow Rate
          </button>
          
          <button
            onClick={resetCalculator}
            className="bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Reset
          </button>
        </div>

        {results && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
              <CheckCircle size={24} />
              Calibration Results
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {results.singleWallAvg && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-gray-600">Single Wall Average</p>
                  <p className="text-2xl font-bold text-gray-800">{results.singleWallAvg.toFixed(3)}mm</p>
                  <p className="text-sm text-gray-500">Flow: {results.singleFlowPercent.toFixed(1)}%</p>
                </div>
              )}
              
              {results.tripleWallAvg && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-gray-600">Triple Wall Average</p>
                  <p className="text-2xl font-bold text-gray-800">{results.tripleWallAvg.toFixed(3)}mm</p>
                  <p className="text-sm text-gray-500">Flow: {results.tripleFlowPercent.toFixed(1)}%</p>
                </div>
              )}
              
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600">Combined Average</p>
                <p className="text-2xl font-bold text-gray-800">{results.avgFlowPercent.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">
                  Adjustment: {results.adjustment > 0 ? '+' : ''}{results.adjustment}%
                </p>
              </div>
            </div>
            
            <div className="bg-green-100 rounded-lg p-4 text-center">
              <p className="text-lg text-green-800 mb-2">
                Set your Flow Rate in Orca Slicer to:
              </p>
              <p className="text-4xl font-bold text-green-900">{results.newFlowRate}%</p>
            </div>
            
            <div className="mt-4 flex justify-center">
              <button
                onClick={exportResults}
                className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download size={20} />
                Export Results
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">How It Works</h4>
          <p className="text-sm text-gray-600 mb-2">
            This tool uses the formula: <code className="bg-white px-2 py-1 rounded">New Flow = Current Flow × (Expected / Measured)</code>
          </p>
          <p className="text-sm text-gray-600">
            The dual-wall cube design provides two independent measurements: single walls test fine extrusion control, 
            while triple walls verify consistency at higher volumes. The algorithm averages both results for optimal accuracy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrcaFlowCalibration;